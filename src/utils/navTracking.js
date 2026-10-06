/*
 * Nav dropdown open tracking -> Amplitude (www.together.ai, desktop mega menu)
 * Schema v2. Bundled here, called from initNav() after navDropdowns() sets aria-expanded.
 *
 * Observes the a11y state DivBlockers' nav.js (tomasmrazek92/together@2.3.5)
 * already maintains: [data-dropdown-trigger="<key>"][aria-expanded="true|false"].
 * No class names, no dependency on the nav code's internals.
 *
 * Events:
 *   nav_menu_viewed   one per panel view (dwell >= MIN_DWELL_MS, or ended in a click)
 *   nav_menu_episode  one per open episode (first open -> close / click / page exit)
 *
 * Safe by construction: no-op if window.amplitude is absent (Termly autoBlock
 * pre-consent), every entry point wrapped in try/catch, never throws.
 */
export function initNavTracking() {
  try {
    if (window.__tgNavTrack) return; // idempotent if pasted twice
    window.__tgNavTrack = true;
    // nav.js binds hover handlers only when $(window).width() (= clientWidth) >= 991 at load.
    if (document.documentElement.clientWidth < 991) return;
    // Touch-first devices (iPad etc.): tap emulates hover; not the desktop behaviour we measure.
    if (window.matchMedia && matchMedia('(hover: none)').matches) return;
    // Panels are display:none below the 992px CSS breakpoint (window resized after load).
    var desktopMQ = window.matchMedia ? matchMedia('(min-width: 992px)') : null;

    var TRIGGER = '[data-dropdown-trigger]';
    var PANEL = '[data-dropdown-target]';
    var MIN_DWELL_MS = 300;   // client floor: shorter views are fly-overs, not sent
    var QUALIFY_MS = 500;     // analysis default, baked into `qualified` (raw dwell also sent)
    var SEND_VIEW_EVENTS = true; // false = episode events only (~halves volume)

    var view = null, ep = null, lastKeyAt = -1e9, dirty = false, beaconOn = false,
        restoreTimer = 0, lastNav = null;

    var now = function () { return window.performance && performance.now ? performance.now() : Date.now(); };
    var uid = function () { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); };

    function send(name, props, flush) {
      try {
        var a = window.amplitude;
        if (!a || typeof a.track !== 'function') return;
        props.page_path = location.pathname;
        props.viewport_width = window.innerWidth;
        props.schema_v = 2;
        a.track(name, props);
        dirty = true;
        if (flush) flushOnExit(a);
      } catch (e) { /* never break the page */ }
    }

    // Live SDK is analytics-browser 2.42.4: its fetch transport sets no `keepalive`, so a
    // plain flush() races the unload. sendBeacon survives it (Amplitude's documented
    // exit pattern). Only called when the page is about to go away.
    function flushOnExit(a) {
      try {
        a = a || window.amplitude;
        if (!a) return;
        if (typeof a.setTransport === 'function') { a.setTransport('beacon'); beaconOn = true; }
        if (typeof a.flush === 'function') a.flush();
        dirty = false;
        // Navigation cancelled (Alt-click download, beforeunload "Stay"): hand the SDK back its
        // default transport. Timers don't run after unload, so this only fires if the page lives.
        clearTimeout(restoreTimer); // one pending restore, 3 s after the LAST exit flush
        restoreTimer = setTimeout(restoreTransport, 3000);
      } catch (e) {}
    }

    // init() passes no `transport`, so 2.42.4's default is fetch. Only undo our own switch.
    function restoreTransport() {
      try {
        var a = window.amplitude;
        if (beaconOn && a && typeof a.setTransport === 'function') a.setTransport('fetch');
        beaconOn = false;
      } catch (e) {}
    }

    function cleanHref(a) {
      try {
        var u = new URL(a.href, location.href);
        if (u.protocol !== 'https:' && u.protocol !== 'http:') return u.protocol; // mailto:/tel: never leak the address
        return u.host === location.host ? u.pathname : u.host + u.pathname; // no query/hash/userinfo
      } catch (e) { return ''; }
    }

    function openKey() {
      if (desktopMQ && !desktopMQ.matches) return null; // resized to mobile layout: panels invisible
      var el = document.querySelector(TRIGGER + '[aria-expanded="true"]');
      return el ? el.getAttribute('data-dropdown-trigger') : null;
    }

    function emitView(v, outcome, flush) {
      if (v.sent) return;
      var dwell = Math.round(now() - v.t0);
      var clicked = outcome === 'click';
      if (!clicked && dwell < MIN_DWELL_MS) return; // fly-over: drop, not in episode
      v.sent = true;
      if (ep.menus.indexOf(v.menu) < 0) ep.menus.push(v.menu);
      if (dwell > ep.maxDwell) ep.maxDwell = dwell;
      if (!SEND_VIEW_EVENTS) return;
      send('nav_menu_viewed', {
        menu: v.menu,
        dwell_ms: dwell,
        outcome: outcome,                 // click | switch | close | exit
        qualified: clicked || dwell >= QUALIFY_MS,
        clicked_label: v.label || null,
        clicked_href: v.href || null,
        heading_clicked: v.headingClicked,
        view_seq: v.seq,
        episode_id: ep.id,
        input: ep.input,
        adopted: !!ep.adopted            // episode began with a click in an already-open panel
      }, flush);
    }

    function endEpisode(reason, flush) {
      if (!ep) return;
      var e = ep;
      ep = null;
      if (e.sent || !e.menus.length) return; // only fly-overs: nothing to report
      e.sent = true;
      send('nav_menu_episode', {
        episode_id: e.id,
        outcome: e.click ? 'click' : 'none',
        end_reason: reason,               // click | close | exit
        qualified: !!e.click || e.maxDwell >= QUALIFY_MS,
        menus_viewed: e.menus,
        menus_viewed_count: e.menus.length,
        first_menu: e.menus[0],
        clicked_menu: e.click ? e.click.menu : null,
        clicked_label: e.click ? e.click.label : null,
        clicked_href: e.click ? e.click.href : null,
        max_dwell_ms: e.maxDwell,
        duration_ms: Math.round(now() - e.t0),
        input: e.input,
        adopted: !!e.adopted
      }, flush);
    }

    function sync() {
      try {
        var k = openKey();
        if (k === (view ? view.menu : null)) return; // redundant setAttribute calls
        if (view) { emitView(view, k ? 'switch' : 'close'); view = null; }
        if (!k) { endEpisode('close'); return; }
        if (!ep) ep = newEp();
        view = { menu: k, t0: now(), seq: ++ep.seq, sent: false, headingClicked: false };
      } catch (e) {}
    }

    function newEp() {
      return { id: uid(), t0: now(), menus: [], maxDwell: 0, seq: 0, click: null, sent: false,
               input: now() - lastKeyAt < 300 ? 'keyboard' : 'pointer' };
    }

    // A panel already open when we (re)attach (initial load, bfcache restore) was not opened
    // by this visitor's pointer: mark it as sent so it never becomes a phantom qualified view.
    function adoptCurrent() {
      var k = openKey();
      ep = null;
      lastNav = null; // fresh context (tab return, bfcache, resize): no double-click window
      view = k ? { menu: k, t0: now(), seq: 0, sent: true, headingClicked: false } : null;
    }

    function endAll(reason) {
      if (view) { if (ep) emitView(view, reason); view = null; }
      endEpisode(reason);
    }

    function onClick(e) {
      try {
        // auxclick also fires for the right button (context menu): only middle-click counts.
        if (e.type === 'auxclick' ? e.button !== 1 : e.button !== 0) return;
        var t = e.target && e.target.closest ? e.target : null;
        if (!t || !view) return;
        var link = t.closest(PANEL + ' a[href]');
        if (!link) {
          var trig = t.closest(TRIGGER);
          if (trig && trig.getAttribute('data-dropdown-trigger') === view.menu) view.headingClicked = true;
          return;
        }
        var panel = link.closest(PANEL);
        var info = {
          menu: panel ? panel.getAttribute('data-dropdown-target') : view.menu,
          // first rendered line = item title (innerText keeps the title/description line break)
          label: (link.getAttribute('aria-label') || link.innerText || link.textContent || '')
            .split('\n')[0].replace(/\s+/g, ' ').trim().slice(0, 100),
          href: cleanHref(link)
        };
        // Click in a panel we adopted (tab return, bfcache, cancelled navigation): the visitor
        // is using it now, so record the click. Dwell counts from adoption, not from the open.
        if (!ep) {
          // Double-click / impatient re-click on the link that just started a navigation: counted.
          if (lastNav && lastNav.href === info.href && now() - lastNav.at < 5000) return;
          ep = newEp();
          ep.t0 = view.t0; ep.adopted = true; // duration_ms >= max_dwell_ms; analysis can exclude
          view = { menu: view.menu, t0: view.t0, seq: ++ep.seq, sent: false, headingClicked: view.headingClicked };
        }
        var newTab = e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1 || link.target === '_blank';
        if (!ep.click) ep.click = info;
        view.label = info.label; view.href = info.href;
        emitView(view, 'click', false);
        if (!newTab) {
          endEpisode('click', true); // same-tab navigation is imminent: one beacon flush
          lastNav = { href: info.href, at: now() };
          view.t0 = lastNav.at; // if the navigation is cancelled, a next click's dwell starts here
        }
      } catch (err) {}
    }

    function init() {
      try {
        var triggers = document.querySelectorAll(TRIGGER);
        if (!triggers.length || !window.MutationObserver) return; // nav changed: silent no-op
        var mo = new MutationObserver(sync);
        for (var i = 0; i < triggers.length; i++) {
          mo.observe(triggers[i], { attributes: true, attributeFilter: ['aria-expanded'] });
        }
        document.addEventListener('click', onClick, true);
        document.addEventListener('auxclick', onClick, true);
        document.addEventListener('keydown', function (e) {
          try {
            if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest(TRIGGER)) lastKeyAt = now();
          } catch (err) {}
        }, true);
        // Tab/app switch: end the view so dwell_ms never includes hidden time.
        document.addEventListener('visibilitychange', function () {
          try {
            if (document.visibilityState === 'hidden') { endAll('exit'); adoptCurrent(); }
            else if (!ep) adoptCurrent(); // back: re-stamp an open panel so a later click's dwell excludes hidden time
          } catch (err) {}
        });
        // Resized across the 992px CSS breakpoint mid-view: panels vanish without an aria change.
        if (desktopMQ) {
          var onMQ = function () {
            try { if (desktopMQ.matches) { if (!ep) adoptCurrent(); } else { endAll('close'); view = null; } } catch (err) {}
          };
          if (desktopMQ.addEventListener) desktopMQ.addEventListener('change', onMQ);
          else if (desktopMQ.addListener) desktopMQ.addListener(onMQ); // Safari < 14
        }
        window.addEventListener('pagehide', function () {
          try { endAll('exit'); if (dirty) flushOnExit(); } catch (err) {} // only touch the SDK if we queued events
        });
        window.addEventListener('pageshow', function (e) {
          try {
            if (!e.persisted) return; // bfcache restore: panel may still be open from the click that left
            restoreTransport(); // undo exit transport
            adoptCurrent();
          } catch (err) {}
        });
        adoptCurrent();
      } catch (e) {}
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  } catch (e) {}
}
