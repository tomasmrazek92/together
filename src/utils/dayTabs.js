// Splits a CMS list into per-day tabs when its items span more than one date.
// [data-day-tabs="list"] on the .w-dyn-items, [data-day-tabs="date"] on each item's date text,
// optional [data-day-tabs="wrap"] in the same section to place the tabs.
// Optional on the list: data-day-tabs-year="show" keeps the year in the tab label.
export function initDayTabs() {
  $('[data-day-tabs="list"]').each(function () {
    const $list = $(this);
    const $items = $list.children();
    // Short lists read fine unsplit.
    if ($items.length <= 4) return;
    const keepYear = $list.attr('data-day-tabs-year') === 'show';

    const days = [];
    $items.each(function () {
      const date = $(this).find('[data-day-tabs="date"]').first().text().trim();
      $(this).attr('data-day-tabs-day', date);
      if (date && !days.includes(date)) days.push(date);
    });
    if (days.length < 2) return;

    // Markup mirrors the /events filter so it inherits its styles and the mobile dropdown.
    const $inner = $('<div class="filter-component_inner" data-mobile-dropdown="list" role="tablist">');
    days.forEach((day, i) => {
      const label = keepYear ? day : day.replace(/,?\s*\d{4}$/, '');
      $('<a href="#" class="tab-item w-inline-block" role="tab">')
        .attr({ 'data-day-tabs-tab': day, 'aria-selected': i === 0 })
        .toggleClass('is-active', i === 0)
        .append($('<div>').text(label))
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

    function show(day) {
      $inner.children().each(function () {
        const active = $(this).attr('data-day-tabs-tab') === day;
        $(this).toggleClass('is-active', active).attr('aria-selected', active);
      });
      $items.each(function () {
        this.style.display = $(this).attr('data-day-tabs-day') === day ? '' : 'none';
      });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }

    $inner.on('click', '[data-day-tabs-tab]', function (e) {
      e.preventDefault();
      show($(this).attr('data-day-tabs-tab'));
    });

    show(days[0]);
  });
}
