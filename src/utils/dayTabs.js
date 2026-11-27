// Splits a CMS list into tabs when it is long enough and its items fall into 2+ groups.
// [data-day-tabs="list"] on the .w-dyn-items, [data-day-tabs="date"] on each item's date text,
// optional [data-day-tabs="wrap"] in the same section to place the tabs.
// Post-event pages group by the Tag component text ([fs-list-field]) first, falling back to dates.
// The Tag's filter-instance prop (CMS Tab label) renders as the fs-list-field value and names the tab.
// Post-event = [data-event-state="post"] on page-wrapper (conditional on the Post-event switch).
// Optional on the list: data-day-tabs-year="show" keeps the year in date tab labels.
export function initDayTabs() {
  const isPostEvent = $('[data-event-state="post"]').length > 0;

  $('[data-day-tabs="list"]').each(function () {
    const $list = $(this);
    const $items = $list.children();
    // Short lists read fine unsplit.
    if ($items.length <= 4) return;
    const keepYear = $list.attr('data-day-tabs-year') === 'show';

    const SEL = { group: '[fs-list-field]', date: '[data-day-tabs="date"]' };
    const keyOf = (item, role) => $(item).find(SEL[role]).first().text().trim();

    const collect = (role) => {
      const keys = [];
      $items.each(function () {
        const key = keyOf(this, role);
        if (key && !keys.includes(key)) keys.push(key);
      });
      return keys;
    };

    let role = null;
    let groups = [];
    if (isPostEvent) {
      groups = collect('group');
      if (groups.length >= 2) role = 'group';
    }
    if (!role) {
      groups = collect('date');
      if (groups.length >= 2) role = 'date';
    }
    if (!role) return;

    $items.each(function () {
      $(this).attr('data-day-tabs-day', keyOf(this, role));
    });

    const labels = {};
    if (role === 'group') {
      $items.each(function () {
        const key = $(this).attr('data-day-tabs-day');
        const text = ($(this).find(SEL.group).first().attr('fs-list-field') || '').trim();
        if (text && !labels[key]) labels[key] = text;
      });
    }
    const label = (key) => {
      if (role === 'group') return labels[key] || key;
      return keepYear ? key : key.replace(/,?\s*\d{4}$/, '');
    };

    // Markup mirrors the /events filter so it inherits its styles and the mobile dropdown.
    const $inner = $('<div class="filter-component_inner" data-mobile-dropdown="list" role="tablist">');
    groups.forEach((key, i) => {
      $('<a href="#" class="tab-item w-inline-block" role="tab">')
        .attr({ 'data-day-tabs-tab': key, 'aria-selected': i === 0 })
        .toggleClass('is-active', i === 0)
        .append($('<div>').text(label(key)))
        .appendTo($inner);
    });
    const $bar = $('<div class="u-mb-24">').append(
      $('<div class="filter-component_block" data-mobile-dropdown="wrapper">').append($inner)
    );
    // Nearest [data-day-tabs="wrap"] sharing an ancestor with the list; else right above the list.
    const $wrap = $list
      .parents()
      .filter((_, el) => $(el).find('[data-day-tabs="wrap"]').length)
      .first()
      .find('[data-day-tabs="wrap"]')
      .first();
    if ($wrap.length) $bar.prependTo($wrap);
    else $bar.insertBefore($list.closest('.w-dyn-list').length ? $list.closest('.w-dyn-list') : $list);

    function show(key) {
      $inner.children().each(function () {
        const active = $(this).attr('data-day-tabs-tab') === key;
        $(this).toggleClass('is-active', active).attr('aria-selected', active);
      });
      $items.each(function () {
        this.style.display = $(this).attr('data-day-tabs-day') === key ? '' : 'none';
      });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }

    $inner.on('click', '[data-day-tabs-tab]', function (e) {
      e.preventDefault();
      show($(this).attr('data-day-tabs-tab'));
    });

    show(groups[0]);
  });
}
