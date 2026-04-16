export function initResponsiveDropdowns() {
  function getActiveContent($target) {
    var $active = $target.find('.is-active').first();
    if (!$active.length) $active = $target.children().first();
    return $active.clone().html();
  }

  function initMobileDropdown($wrapper) {
    var bp = parseInt($wrapper.attr('data-mobile-dropdown-bp')) || 991;
    var $listEl = $wrapper.find('[data-mobile-dropdown="list"]').first();
    var $items = $listEl.length
      ? $listEl.children()
      : $wrapper.children('[data-mobile-dropdown="list"]').length
      ? $wrapper.find('[data-mobile-dropdown="list"]').children()
      : $wrapper.children(':not(.mob-dd-trigger)');
    var isOpen = false;
    var $trigger, $triggerLabel, $arrow;
    var observer;
    var lastWidth = $(window).width();
    var uid = Math.random().toString(36).slice(2);
    $wrapper.data('mobddId', uid);

    // The list target — what we'll collapse. Either the [list] el or the wrapper itself.
    var $collapseTarget = $listEl.length ? $listEl : $wrapper;

    function build() {
      if ($trigger) return;
      if ($wrapper.find('.mob-dd-trigger').length) return;

      $triggerLabel = $('<span class="mob-dd-label">').html(getActiveContent($collapseTarget));
      $arrow = $('<span class="mob-dd-arrow">').html(
        '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8.33203L10 13.332L15 8.33203" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.5"/></svg>'
      );
      $trigger = $('<div class="mob-dd-trigger">').append($triggerLabel).append($arrow);

      // Prepend trigger — list stays exactly where it is
      $trigger.insertBefore($collapseTarget);
      var $ddWrap = $('<div class="mob-dd-wrap">').css({ position: 'relative', width: '100%' });
      $trigger.add($collapseTarget).wrapAll($ddWrap);
      $wrapper.addClass('mob-dd-active');

      // Collapse the list in place
      gsap.set($collapseTarget, { height: 0, opacity: 0, overflow: 'hidden' });

      $trigger.on('click.mobdd', function (e) {
        e.stopPropagation();
        isOpen ? close() : open();
      });

      // Mark the list
      $collapseTarget.addClass('mob-dd-list');

      // Clicking any item closes the dropdown
      $collapseTarget.on('click.mobdd', '> *', function () {
        setTimeout(function () {
          $triggerLabel.html(getActiveContent($collapseTarget));
          close();
        }, 50);
      });

      $(document).on('click.mobdd-' + uid, function (e) {
        if (isOpen && !$wrapper.is(e.target) && $wrapper.has(e.target).length === 0) {
          close();
        }
      });

      observeActive();
    }

    function open() {
      isOpen = true;
      $trigger.addClass('is-open');
      gsap.to($collapseTarget, { height: 'auto', opacity: 1, duration: 0.35, ease: 'power2.out' });
      gsap.to($arrow, { rotation: 180, duration: 0.3, ease: 'power2.out' });
    }

    function close() {
      isOpen = false;
      $trigger.removeClass('is-open');
      gsap.to($collapseTarget, { height: 0, opacity: 0, duration: 0.28, ease: 'power2.in' });
      gsap.to($arrow, { rotation: 0, duration: 0.25, ease: 'power2.in' });
    }

    function destroy() {
      if (!$trigger || !$trigger.closest('.mob-dd-wrap').length) return;
      if (observer) observer.disconnect();

      $trigger.off('click.mobdd').remove();
      $wrapper.find('.mob-dd-wrap').contents().unwrap();
      $wrapper.removeClass('mob-dd-active');
      $collapseTarget.removeClass('mob-dd-active mob-dd-list');
      $(document).off('click.mobdd-' + uid);

      gsap.set($collapseTarget, { clearProps: 'all' });
      $('.mob-dd-wrap').attr('style', '');
      $trigger = null;
      isOpen = false;
    }

    function observeActive() {
      observer = new MutationObserver(function () {
        console.log(getActiveContent($items));
        setTimeout(function () {
          $triggerLabel.html(getActiveContent($collapseTarget));
        }, 300);
      });
      observer.observe($collapseTarget[0], {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true,
      });
    }

    function check() {
      $(window).width() <= bp ? build() : destroy();
    }

    function debounce(fn, wait) {
      var t;
      return function () {
        clearTimeout(t);
        t = setTimeout(fn, wait);
      };
    }

    check();

    $(window).on(
      'resize.mobdd-' + uid,
      debounce(function () {
        var currentWidth = $(window).width();
        if (currentWidth === lastWidth) return;
        lastWidth = currentWidth;
        check();
      }, 150)
    );
  }

  $('[data-mobile-dropdown="wrapper"]').each(function () {
    initMobileDropdown($(this));
  });
}
