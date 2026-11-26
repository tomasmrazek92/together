/**
 * Compare models — Together AI
 *
 * One renderer for both surfaces:
 *   /compare               picker + browse rows; ?a=<slug>&b=<slug> renders a comparison (noindex)
 *   /compare/<pair-slug>   CMS template; the page wrapper carries data-a / data-b / data-c slugs
 *
 * Data comes from the hidden lists on /compare-data ([data-cmp-data]), a separate page so /compare
 * keeps its nested-list budget for the browse rows. Both surfaces fetch it once and read the markup.
 *
 * Load via: window.loadPageScript('compare.js')
 */
(function () {
  'use strict';

  const root = document.querySelector('[data-compare]');
  if (!root) return;

  /* ============================== CONFIG ============================== */

  // Model types (Models / Categories slug) offered in the picker and the browse rows.
  const PICKER_TYPES = ['chat', 'code', 'vision'];
  const BENCH_ROWS = [
    'frontiermath',
    'gpqa',
    'hle',
    'scicode',
    'gdpval',
    'terminal',
    'arena',
    'frontiercode',
  ];
  // Closed providers publish no weights, so these rows say so instead of hiding.
  const CLOSED_UNDISCLOSED = ['params', 'active', 'quant'];
  const RELATED_COUNT = 4;
  const DATA_URL = '/compare-data';

  /* ============================== DATA ============================== */

  const attr = (el, name) => (el.getAttribute(name) || '').trim();
  const listValues = (el, name, key) =>
    Array.from(el.querySelectorAll(`[data-cmp-list="${name}"] [data-v]`))
      .map((n) => attr(n, key))
      .filter(Boolean);

  function readModel(el) {
    // One Models list now: the closed flag is a child shown only when "Closed Source" is on.
    const kind = el.querySelector('[data-cmp-closed]') ? 'closed' : 'open';
    const img = (sel) => {
      const i = el.querySelector(sel);
      const src = i && i.getAttribute('src');
      // Webflow renders a placeholder image when the field is empty.
      return src && !/placeholder/i.test(src) ? src : '';
    };
    const bench = {};
    BENCH_ROWS.forEach((k) => {
      bench[k] = attr(el, `data-${k}`);
    });
    return {
      kind,
      // Closed models join the picker only with "Closed - Show In Compare" on.
      inCompare: !!el.querySelector('[data-cmp-compare]'),
      slug: attr(el, 'data-slug'),
      order: parseFloat(attr(el, 'data-order')),
      // Closed models keep Order empty (it hides them from /models), so they sort by this instead.
      compareOrder: parseFloat(attr(el, 'data-compare-order')),
      name: attr(el, 'data-name'),
      provider: attr(el, 'data-provider'),
      type: attr(el, 'data-type'),
      typeSlug: attr(el, 'data-type-slug'),
      endpoint: attr(el, 'data-endpoint'),
      playground: attr(el, 'data-playground'),
      context: attr(el, 'data-context'),
      params: attr(el, 'data-params'),
      active: attr(el, 'data-active'),
      quant: attr(el, 'data-quant'),
      label: attr(el, 'data-label'),
      input: attr(el, 'data-input'),
      output: attr(el, 'data-output'),
      cached: attr(el, 'data-cached'),
      bench,
      logo: img('[data-cmp-logo]') || img('[data-cmp-plogo]'),
      features: new Set(listValues(el, 'features', 'data-s')),
      featureNames: listValues(el, 'features', 'data-v'),
      deploy: listValues(el, 'deploy', 'data-v'),
      tags: new Set(listValues(el, 'tags', 'data-s')),
    };
  }

  function readData(scope) {
    const open = new Map();
    const closed = new Map();
    scope.querySelectorAll('[data-cmp-m]').forEach((el) => {
      const m = readModel(el);
      if (!m.slug) return;
      (m.kind === 'closed' ? closed : open).set(m.slug, m);
    });
    return { open, closed };
  }

  async function loadData() {
    const local = document.querySelector('[data-cmp-data]');
    if (local && local.querySelector('[data-cmp-m]')) return readData(local);
    const res = await fetch(DATA_URL, { credentials: 'same-origin' });
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    return readData(doc);
  }

  /* ============================== HELPERS ============================== */

  const h = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  };
  const priceNum = (v) => {
    const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : null;
  };
  // CMS prices are typed by hand: "$1.40", ".2", "4". Show them all as $x.xx.
  const price = (v) => {
    if (!v) return '';
    const n = priceNum(v);
    return n == null ? v : '$' + n.toFixed(2);
  };
  const modelUrl = (m) => (m.kind === 'open' ? `/models/${m.slug}` : '');
  const isPickable = (m) => (m.kind === 'closed' ? m.inCompare : PICKER_TYPES.includes(m.typeSlug));

  // Dropdown order: 3 open, 2 closed, repeat until the closed run out; leftover open models follow.
  // Open sort by Order, closed by "Closed - Compare Order"; lowest first, empty goes last.
  const lowest = (key) => (x, y) =>
    (Number.isFinite(x[key]) ? x[key] : Infinity) - (Number.isFinite(y[key]) ? y[key] : Infinity);
  const byOrder = lowest('order');
  function interleave(models, openRun = 3, closedRun = 2) {
    const open = models.filter((m) => m.kind === 'open').sort(byOrder);
    const closed = models.filter((m) => m.kind === 'closed').sort(lowest('compareOrder'));
    const out = [];
    while (open.length || closed.length) {
      out.push(...open.splice(0, openRun), ...closed.splice(0, closedRun));
    }
    return out;
  }

  /* ============================== CARD ============================== */

  // The card markup lives in Webflow (Compare – Result, card slot A). Clone it and fill it.
  let cardTpl;
  // Bound fields come back with w-dyn-bind-empty when the CMS value is empty; JS fills them, so unhide.
  const field = (c, k) => {
    const el = c.querySelector(`[data-cmp-f="${k}"]`);
    el?.classList.remove('w-dyn-bind-empty');
    return el;
  };

  // Fill a Webflow-built card (data-cmp-f hooks) with one model. Used by the result slots and Related.
  function fillCard(c, m, { link = true } = {}) {
    c.dataset.cmpKind = m.kind;
    // Hero cards of closed models have no /models page: Webflow combo .models_link.cmp-card.is-closed
    // turns pointer events off. Not inside a Related pair, where the whole pair is the link.
    c.classList.toggle('is-closed', link && m.kind === 'closed');

    const img = c.querySelector('img');
    if (img && m.logo) {
      img.src = m.logo;
      img.removeAttribute('srcset');
      img.alt = '';
    } else img?.remove();

    if (m.label) field(c, 'label').textContent = m.label;
    else field(c, 'label-wrap')?.remove();

    field(c, 'type').textContent = m.type || (m.kind === 'closed' ? 'Closed model' : '');
    field(c, 'name').textContent = m.name;

    const stats = { input: price(m.input), output: price(m.output), context: m.context };
    Object.entries(stats).forEach(([k, v]) => {
      if (v) field(c, k).textContent = v;
      else c.querySelector(`[data-cmp-stat="${k}"]`)?.remove();
    });

    field(c, 'meta').textContent = m.kind === 'open' ? m.deploy.join(' • ') : m.provider;

    const a = field(c, 'link');
    if (link && a && modelUrl(m)) {
      a.href = modelUrl(m);
      a.setAttribute('aria-label', m.name);
    } else a?.remove();
    return c;
  }

  function card(m, opts) {
    cardTpl ||= root.querySelector('[data-cmp-card] [data-cmp-f="card"]')?.cloneNode(true);
    if (!cardTpl) return h('div');
    return fillCard(cardTpl.cloneNode(true), m, opts);
  }

  /* ============================== TABLES ============================== */

  function cellValue(m, row) {
    if (m.kind === 'closed' && CLOSED_UNDISCLOSED.includes(row)) return 'Undisclosed';
    if (BENCH_ROWS.includes(row)) return m.bench[row];
    switch (row) {
      case 'name':
        return m.name;
      case 'provider':
        return m.provider;
      case 'type':
        return m.type;
      case 'context':
        return m.context;
      case 'params':
        return m.params;
      case 'active':
        return m.active;
      case 'quant':
        return m.quant;
      case 'deploy':
        return m.deploy.join(', ');
      case 'features':
        return m.featureNames.join(', ');
      case 'endpoint':
        return m.endpoint;
      case 'input':
        return price(m.input);
      case 'output':
        return price(m.output);
      case 'cached':
        return price(m.cached);
      default:
        return '';
    }
  }

  function fillCell(cell, m, row, value) {
    // Pair template: cells holding a CMS list are already rendered server-side.
    if (cell.querySelector('.w-dyn-list')) return;
    const out = cell.querySelector('.body-s') || cell;
    // Webflow hides a bound element whose CMS field is empty; JS has a value (or "–") for it now.
    out.classList.remove('w-dyn-bind-empty');
    if (!value) {
      out.textContent = '–';
      return;
    }
    if (row === 'endpoint' && modelUrl(m)) {
      out.textContent = '';
      const a = h('a', 'cmp-endpoint', value);
      a.href = modelUrl(m);
      out.append(a);
    } else {
      out.textContent = value;
    }
  }

  function renderTables(a, b) {
    // Visually hidden <thead>: screen readers announce the model per column.
    root.querySelectorAll('[data-cmp-head="a"]').forEach((th) => {
      th.textContent = a.name;
    });
    root.querySelectorAll('[data-cmp-head="b"]').forEach((th) => {
      th.textContent = b.name;
    });
    root.querySelectorAll('[data-cmp-row]').forEach((row) => {
      const key = row.getAttribute('data-cmp-row');
      const va = cellValue(a, key);
      const vb = cellValue(b, key);
      // A row with nothing on either side carries no information.
      if (!va && !vb) {
        row.remove();
        return;
      }
      fillCell(row.querySelector('[data-cmp-cell="a"]'), a, key, va);
      fillCell(row.querySelector('[data-cmp-cell="b"]'), b, key, vb);
    });
    root.querySelectorAll('[data-cmp-group]').forEach((g) => {
      if (!g.querySelector('[data-cmp-row]')) g.remove();
    });
  }

  /* ============================== RESULT VIEW ============================== */

  // Try button → Models "Meta: Playground Link". No link (closed models, most non-serverless) = hidden.
  function setTry(side, m) {
    const slot = root.querySelector(`[data-cmp-try="${side}"]`);
    if (!slot) return;
    const link = slot.querySelector('a');
    if (!m.playground || !link) {
      slot.style.visibility = 'hidden';
      return;
    }
    slot.style.visibility = '';
    link.href = m.playground;
    link.target = '_blank';
    link.rel = 'noopener';
    link.setAttribute('aria-label', `Try ${m.name}`);
  }

  // Pair template: the grid is a native Model Comparisons list; each item holds the pair card built in
  // Webflow ([data-cmp-pair-card="a|b"]), with name/prices bound server-side. JS ranks the items
  // (shared model first, current page out, max RELATED_COUNT) and fills what CMS can't reach: logo,
  // type, deployments.
  function renderRelated(a, b, data, currentSlug) {
    const grid = root.querySelector('[data-cmp-related]');
    if (!grid) return;
    const items = Array.from(grid.querySelectorAll('[data-cmp-pair]')).map((el) => ({
      el,
      slug: attr(el, 'data-slug'),
      name: attr(el, 'data-name'),
      a: attr(el, 'data-a'),
      b: attr(el, 'data-b'),
    }));
    const slugs = [a.slug, b.slug];
    const others = items.filter((p) => p.slug && p.slug !== currentSlug);
    const close = others.filter((p) => slugs.includes(p.a) || slugs.includes(p.b));
    const picked = close.concat(others.filter((p) => !close.includes(p))).slice(0, RELATED_COUNT);
    let shown = 0;
    items.forEach((p) => {
      const ma = data.open.get(p.a) || data.closed.get(p.a);
      const mb = data.open.get(p.b) || data.closed.get(p.b);
      const ca = p.el.querySelector('[data-cmp-pair-card="a"]');
      const cb = p.el.querySelector('[data-cmp-pair-card="b"]');
      if (!picked.includes(p) || !ma || !mb || !ca || !cb) return p.el.remove();
      fillCard(ca, ma, { link: false });
      fillCard(cb, mb, { link: false });
      shown += 1;
      // Hinge colour by position: 1 = base cyan, 2-4 = Webflow combos .cmp-pair_hinge.is-2/3/4.
      if (shown > 1) p.el.querySelector('.cmp-pair_hinge')?.classList.add(`is-${shown}`);
    });
    if (!shown) root.querySelector('[data-cmp-related-section]')?.remove();
  }

  function renderResult(a, b, data, currentSlug) {
    // The template's H1 comes from the CMS Name. On /compare?a=&b= there is no item, so write it here.
    if (!currentSlug) {
      root.querySelectorAll('[data-cmp-title]').forEach((n) => {
        n.textContent = `${a.name} vs ${b.name}`;
      });
    }
    const slotA = root.querySelector('[data-cmp-card="a"]');
    const slotB = root.querySelector('[data-cmp-card="b"]');
    if (slotA) slotA.replaceChildren(card(a));
    if (slotB) slotB.replaceChildren(card(b));
    renderTables(a, b);
    setTry('a', a);
    setTry('b', b);
    renderRelated(a, b, data, currentSlug);
    root.setAttribute('data-cmp-state', 'result');
    root.removeAttribute('data-cmp-loading');
  }

  /* ============================== URL / ORDER ============================== */

  // Together-served model first; two of the same kind go alphabetical. Same rule as the pair slugs.
  function ordered(x, y) {
    if (x.kind !== y.kind) return x.kind === 'open' ? [x, y] : [y, x];
    return x.name.localeCompare(y.name) <= 0 ? [x, y] : [y, x];
  }

  // Pair pages are slugged "<a>-vs-<b>" in ordered() order. A HEAD request says whether one exists
  // (Webflow answers 404 for a missing CMS item), so a picked pair can land on its real page.
  const pairPath = (x, y) => {
    const [a, b] = ordered(x, y);
    return `/compare/${a.slug}-vs-${b.slug}`;
  };
  async function pairExists(path) {
    try {
      const res = await fetch(path, { method: 'HEAD', credentials: 'same-origin' });
      return res.ok;
    } catch (e) {
      return false;
    }
  }
  const queryUrl = (x, y) => {
    const [a, b] = ordered(x, y);
    return `/compare?a=${encodeURIComponent(a.slug)}&b=${encodeURIComponent(b.slug)}`;
  };

  // ?a=&b= without a pair page: a client-only view. Webflow's server canonical points at /compare;
  // noindex keeps these out of the index, so drop the canonical rather than send mixed signals.
  function setHeadForQueryView(a, b) {
    document.title = `${a.name} vs ${b.name}: Pricing, Benchmarks & Specs | Together AI`;
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = h('meta');
      robots.name = 'robots';
      document.head.append(robots);
    }
    robots.content = 'noindex, follow';
    document.querySelector('link[rel="canonical"]')?.remove();
  }

  function addBreadcrumbSchema(name) {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Compare models',
          item: `${location.origin}/compare`,
        },
        { '@type': 'ListItem', position: 2, name, item: location.origin + location.pathname },
      ],
    });
    document.head.append(s);
  }

  /* ============================== PICKER ============================== */

  // tpl = { panel, option } read from the Webflow reference dropdown ([data-cmp-panel]).
  // taken() returns the model chosen in the other picker, which this list hides.
  function picker(box, side, options, onChange, tpl, taken = () => null) {
    const trigger = h('button', 'cmp-select');
    trigger.type = 'button';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    const logo = h('span', 'cmp-select_logo');
    const label = h('span', 'cmp-select_label body-m', '–');
    const chev = h('span', 'cmp-select_chevron');
    chev.innerHTML =
      '<svg viewBox="0 0 20 20" width="100%" fill="none" aria-hidden="true"><path d="m5 7.5 5 5 5-5" stroke="currentColor" stroke-width="1.25"/></svg>';
    trigger.append(logo, label, chev);
    trigger.setAttribute('aria-label', `Model ${side.toUpperCase()}: choose a model`);

    const panel = tpl ? tpl.panel.cloneNode(true) : h('div', 'cmp-select_panel');
    panel.removeAttribute('data-cmp-panel');
    panel.hidden = true;
    const search = h('input', 'cmp-select_search body-s');
    search.type = 'search';
    search.placeholder = 'Search models';
    search.setAttribute('aria-label', 'Search models');
    search.autocomplete = 'off';
    const list = panel.querySelector('[data-cmp-list]') || h('div', 'cmp-select_list');
    list.replaceChildren();
    list.setAttribute('role', 'listbox');
    list.id = `cmp-list-${side}`;
    list.setAttribute('aria-label', `Models for side ${side.toUpperCase()}`);
    // Combobox pattern: focus stays in the search field, arrows move aria-activedescendant.
    search.setAttribute('role', 'combobox');
    search.setAttribute('aria-controls', list.id);
    search.setAttribute('aria-expanded', 'true');
    search.setAttribute('aria-autocomplete', 'list');
    trigger.setAttribute('aria-controls', list.id);
    panel.prepend(search);
    if (!list.parentNode) panel.append(list);
    box.replaceChildren(trigger, panel);

    let value = null;
    let active = -1;
    let shown = [];

    function optionEl(m) {
      const o = tpl ? tpl.option.cloneNode(true) : h('div', 'cmp-select_option');
      o.setAttribute('role', 'option');
      o.id = `cmp-opt-${side}-${m.kind}-${m.slug}`;
      o.dataset.key = `${m.kind}:${m.slug}`;
      const name = o.querySelector('[data-cmp-opt-name]');
      const type = o.querySelector('[data-cmp-opt-type]');
      const img = o.querySelector('img');
      if (name) name.textContent = m.name;
      else o.append(h('span', 'body-l', m.name));
      if (type) type.textContent = m.type || (m.kind === 'closed' ? 'Closed model' : '');
      if (img) {
        if (m.logo) {
          img.src = m.logo;
          img.removeAttribute('srcset');
          img.loading = 'lazy';
        } else img.removeAttribute('src');
      }
      o.addEventListener('mousedown', (e) => {
        e.preventDefault();
        choose(m);
      });
      return o;
    }

    function draw() {
      const q = search.value.trim().toLowerCase();
      list.replaceChildren();
      shown = [];
      const other = taken();
      // While searching: exact name first, then names starting with the query, then the rest
      // (stable, so the dropdown order holds inside each group).
      const rank = (m) => {
        const n = m.name.toLowerCase();
        return n === q ? 0 : n.startsWith(q) ? 1 : 2;
      };
      const hits = interleave(options)
        .filter((m) => m !== other)
        .filter((m) => !q || `${m.name} ${m.provider}`.toLowerCase().includes(q));
      (q ? hits.sort((x, y) => rank(x) - rank(y)) : hits).forEach((m) => {
        list.append(optionEl(m));
        shown.push(m);
      });
      if (!shown.length) list.append(h('div', 'cmp-select_empty body-s', 'No models match'));
      active = shown.length ? 0 : -1;
      highlight();
    }

    function highlight() {
      list.querySelectorAll('[role="option"]').forEach((o, i) => {
        const on = i === active;
        o.classList.toggle('is-active', on);
        o.setAttribute('aria-selected', String(on));
        if (on) {
          o.scrollIntoView({ block: 'nearest' });
          search.setAttribute('aria-activedescendant', o.id);
        }
      });
      if (active < 0) search.removeAttribute('aria-activedescendant');
    }

    function open() {
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      search.value = '';
      draw();
      search.focus();
    }
    function close() {
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }
    function set(m) {
      value = m;
      label.textContent = m ? m.name : '–';
      // The visible "–" means nothing to a screen reader: name the trigger by side and choice.
      trigger.setAttribute(
        'aria-label',
        `Model ${side.toUpperCase()}: ${m ? m.name : 'choose a model'}`
      );
      logo.replaceChildren();
      if (m && m.logo) {
        const img = h('img');
        img.src = m.logo;
        img.alt = '';
        logo.append(img);
      }
      box.classList.toggle('is-filled', !!m);
    }
    function choose(m) {
      set(m);
      close();
      trigger.focus();
      onChange();
    }

    trigger.addEventListener('click', () => (panel.hidden ? open() : close()));
    search.addEventListener('input', draw);
    search.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        active = Math.min(active + 1, shown.length - 1);
        highlight();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        active = Math.max(active - 1, 0);
        highlight();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (shown[active]) choose(shown[active]);
      } else if (e.key === 'Escape') {
        close();
        trigger.focus();
      }
    });
    document.addEventListener('mousedown', (e) => {
      if (!panel.hidden && !box.contains(e.target)) close();
    });

    return { get: () => value, set };
  }

  /* ============================== PICK VIEW ============================== */

  function initPick(data) {
    root.setAttribute('data-cmp-state', 'pick');
    root.removeAttribute('data-cmp-loading');
    // Result rendered in place, then Back: reload so the pick view starts clean.
    window.addEventListener('popstate', () => location.reload());
    const options = [...data.open.values(), ...data.closed.values()].filter(isPickable);
    const pickers = {};

    // Both sides chosen: show the result in place, no button. The URL updates so it can be shared.
    let routing = false;
    async function sync() {
      const a = pickers.a && pickers.a.get();
      const b = pickers.b && pickers.b.get();
      if (!a || !b || a === b || routing) return;
      routing = true;
      const [x, y] = ordered(a, b);
      const path = pairPath(x, y);
      // A curated pair page exists: go there (server-rendered, indexable, has Related).
      if (await pairExists(path)) {
        window.location.assign(path);
        return;
      }
      routing = false;
      history.pushState({ cmp: 1 }, '', queryUrl(x, y));
      setHeadForQueryView(x, y);
      renderResult(x, y, data, '');
      window.scrollTo(0, 0);
    }

    // The Webflow reference dropdown is the template: one panel, first option cloned per model.
    const refPanel = root.querySelector('[data-cmp-panel]');
    let tpl = null;
    if (refPanel) {
      const opt = refPanel.querySelector('[data-cmp-option]');
      refPanel.remove();
      if (opt) {
        tpl = { panel: refPanel.cloneNode(true), option: opt.cloneNode(true) };
        tpl.panel.querySelector('[data-cmp-list]')?.replaceChildren();
      }
    }
    root.querySelectorAll('[data-cmp-picker]').forEach((field) => {
      const side = field.getAttribute('data-cmp-picker');
      const box = field.querySelector('[data-cmp-picker-box]');
      const otherSide = side === 'a' ? 'b' : 'a';
      if (box)
        pickers[side] = picker(box, side, options, sync, tpl, () => pickers[otherSide]?.get());
    });

    // Prefill from ?a= so a model page link can land with one side chosen.
    const qs = new URLSearchParams(location.search);
    const pre = data.open.get(qs.get('a') || '') || data.closed.get(qs.get('a') || '');
    if (pre && pickers.a) pickers.a.set(pre);

    // Browse rows are native CMS lists (Compare - Category / Compare - Order).
    // Each card carries data-cmp-pick = model slug; a click fills the next empty picker.
    root.querySelectorAll('[data-cmp-pick]').forEach((el) => {
      const m = data.open.get(el.getAttribute('data-cmp-pick'));
      if (!m) return;
      el.style.cursor = 'pointer';
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const side = pickers.a && !pickers.a.get() ? 'a' : 'b';
        if (!pickers[side]) return;
        // Already chosen on the other side: same model twice is not a comparison.
        if (pickers[side === 'a' ? 'b' : 'a']?.get() === m) return;
        pickers[side].set(m);
        sync();
        root.querySelector('.cmp-picker')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }

  /* ============================== STYLES ============================== */

  // Only for markup this script creates; page layout lives in Webflow classes.
  function injectStyles() {
    if (document.getElementById('cmp-styles')) return;
    const s = document.createElement('style');
    s.id = 'cmp-styles';
    s.textContent = `
[data-cmp-state="pick"] [data-cmp-view="result"],[data-cmp-state="result"] [data-cmp-view="pick"]{display:none}
.cmp-card .library-models_list{flex-wrap:wrap}
.cmp-card_slot .cmp-card{height:100%}
.cmp-browse_card{all:unset;display:flex;cursor:pointer;width:100%}
.cmp-browse_card:focus-visible{outline:2px solid var(--product--purple-01);outline-offset:2px;border-radius:.5em}
.cmp-endpoint{color:var(--brand--brand-orange);text-decoration:none;word-break:break-all}
.cmp-endpoint:hover{text-decoration:underline}
button.cmp-select{font:inherit;margin:0;appearance:none;-webkit-appearance:none}
.cmp-select:focus-visible{outline:2px solid var(--opacity--blue-40);outline-offset:2px}
.cmp-picker_box.is-filled .cmp-select{color:var(--brand--black)}
.cmp-select_logo{display:flex;flex:none;width:1.25em;height:1.25em}
.cmp-select_logo:empty{display:none}
.cmp-select_logo img{width:100%;height:100%;object-fit:contain}
.cmp-select_panel[hidden]{display:none}
.cmp-select_search{all:unset;box-sizing:border-box;display:block;width:100%;padding:.875em .75em;border-bottom:1px solid var(--shades--black-opacity-8)}
.cmp-select_option.is-active,.cmp-select_option:hover{background:var(--shades--black-opacity-4)}
.cmp-select_empty{padding:1em;opacity:.5}
`;
    document.head.append(s);
  }

  /* ============================== INIT ============================== */

  async function init() {
    injectStyles();
    let data;
    try {
      data = await loadData();
    } catch (e) {
      // Data failed: drop the skeleton so the page shows its server state, not a shimmer forever.
      root.removeAttribute('data-cmp-loading');
      return;
    }

    // Template page: slugs bound on the wrapper.
    const pageA = attr(root, 'data-a');
    if (pageA) {
      const a = data.open.get(pageA);
      const bSlug = attr(root, 'data-b');
      const b = data.open.get(bSlug) || data.closed.get(bSlug);
      if (a && b) {
        renderResult(a, b, data, attr(root, 'data-pair'));
        addBreadcrumbSchema(
          document.querySelector('[data-cmp-title]')?.textContent.trim() || `${a.name} vs ${b.name}`
        );
      }
      return;
    }

    // /compare?a=&b=
    const qs = new URLSearchParams(location.search);
    const find = (s) => (s ? data.open.get(s) || data.closed.get(s) : null);
    const x = find(qs.get('a'));
    const y = find(qs.get('b'));
    if (x && y && x !== y) {
      const [a, b] = ordered(x, y);
      const path = pairPath(a, b);
      if (await pairExists(path)) {
        window.location.replace(path);
        return;
      }
      setHeadForQueryView(a, b);
      renderResult(a, b, data, '');
      return;
    }
    initPick(data);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
