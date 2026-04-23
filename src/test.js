window.addEventListener('DOMContentLoaded', function () {
  jQuery(function () {
    // ─── PUBLIC API NAMESPACE ─────────────────────────────────────────────────
    window.Tabs = window.Tabs || {};
    // Registry: maps a wrap DOM element → its switchTab function
    window.Tabs._registry = window.Tabs._registry || new Map();

    /**
     * Externally switch a tab on any tabs instance.
     *
     * @param {Element|string} wrap  - The [data-tabs="wrap"] DOM element, or a
     *                                 CSS selector string to find it.
     * @param {number}         index - Zero-based tab index to activate.
     * @param {object}        [opts]
     * @param {boolean}       [opts.pauseAutoplay=true] - Stop autoplay after switch.
     */
    window.Tabs.switchTab = function (wrap, index, opts) {
      const el = typeof wrap === 'string' ? document.querySelector(wrap) : wrap;
      const fn = window.Tabs._registry.get(el);
      if (!fn) {
        console.warn('[Tabs] No tabs instance found for', wrap);
        return;
      }
      fn(index, opts);
    };
    // ─────────────────────────────────────────────────────────────────────────

    function debounce(fn, delay) {
      let timer;
      return function () {
        clearTimeout(timer);
        timer = setTimeout(fn, delay);
      };
    }

    function getClassDisplay(el) {
      const classes = Array.from(el.classList);
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules || [])) {
            if (rule.selectorText && classes.some((c) => rule.selectorText.includes(`.${c}`))) {
              const display = rule.style.display;
              if (display) return display;
            }
          }
        } catch (e) {}
      }
      return 'block';
    }

    $('[data-tabs="wrap"]').each(function (wrapIndex) {
      const $wrap = $(this);
      const $menuItems = $wrap.find('[data-tabs="menu-item"]');
      const $contents = $wrap.find('[data-tabs="content"]');
      const hasMenu = $menuItems.length > 0;
      const $innerItems = !hasMenu ? $wrap.find('[data-tabs="inner-item"]') : $();

      // -- A11y: ARIA roles and attributes for tabs --
      const $tabItems = hasMenu ? $menuItems : $innerItems;
      const uid = 'tabs-' + wrapIndex;

      // Set tablist role on the parent of tab items
      if ($tabItems.length) {
        $tabItems.first().parent().attr('role', 'tablist');
      }

      $tabItems.each(function (i) {
        const tabId = uid + '-tab-' + i;
        const panelId = uid + '-panel-' + i;
        $(this).attr({
          role: 'tab',
          id: tabId,
          'aria-selected': i === 0 ? 'true' : 'false',
          tabindex: i === 0 ? '0' : '-1',
        });
        if ($contents.eq(i).length) {
          $(this).attr('aria-controls', panelId);
          $contents.eq(i).attr({
            role: 'tabpanel',
            id: panelId,
            'aria-labelledby': tabId,
          });
        }
      });

      // A11y: keyboard navigation for tabs (auto-activate on arrow)
      $tabItems.on('keydown', function (e) {
        const $t = $(this);
        const idx = $tabItems.index($t);
        let newIdx = null;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          newIdx = (idx + 1) % $tabItems.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          newIdx = (idx - 1 + $tabItems.length) % $tabItems.length;
        } else if (e.key === 'Home') {
          e.preventDefault();
          newIdx = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          newIdx = $tabItems.length - 1;
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          $t.trigger('click');
          return;
        }

        if (newIdx !== null) {
          $tabItems.attr('tabindex', '-1');
          $tabItems.eq(newIdx).attr('tabindex', '0').focus();
          // Auto-activate: switch tab content on arrow key
          $tabItems.eq(newIdx).trigger('click');
        }
      });

      // ─── PERSIST: read data-tabs-persist attribute ──────────────────────────
      const persistKey = $wrap.attr('data-tabs-persist');
      // persistKey is either undefined (disabled) or a string used as the
      // localStorage key, e.g. data-tabs-persist="pricing-tabs"
      // ────────────────────────────────────────────────────────────────────────

      const breakpointAttr = $wrap.attr('data-tabs-breakpoint');
      let breakpointMin = null;
      let breakpointMax = null;

      if (breakpointAttr) {
        const parts = breakpointAttr.split(':');
        if (parts[0] === 'min') breakpointMin = parseInt(parts[1]);
        if (parts[0] === 'max') breakpointMax = parseInt(parts[1]);
      }

      function isBreakpointActive() {
        const w = window.innerWidth;
        if (breakpointMin !== null && w < breakpointMin) return false;
        if (breakpointMax !== null && w > breakpointMax) return false;
        return true;
      }

      let autoplayTimer = null;
      let currentIndex = 0;
      let started = false;
      let paused = false;
      let pausedByScroll = false;
      let remainingDuration = null;
      let currentTabDuration = null;
      let progressStartTime = null;
      let tabsEnabled = null;
      const displayMap = new Map();

      $contents.each(function () {
        displayMap.set(this, getClassDisplay(this));
      });

      const stackItemsMap = new Map();
      const stackVisualsMap = new Map();

      $contents.each(function () {
        const $wrapper = $(this);
        const $items = $wrapper.find('.stack-tabs_item');
        const $visuals = $wrapper.find('.stack-tabs_visual [data-tabs="visual-item"]');
        const innerVisuals = $items
          .filter('[data-status="not-active"]')
          .find('.stack-tabs_item-mask');

        if ($visuals.length) {
          $items.each(function (index) {
            const $clone = $visuals.eq(index).clone();
            $(this).find('.stack-tabs_item-visual').append($clone);
          });
        }

        if (innerVisuals.length) {
          gsap.set($items.filter('[data-status="not-active"]').find('.stack-tabs_item-mask'), {
            height: 0,
          });
        }
        if ($visuals.length) {
          gsap.set($visuals, { autoAlpha: 0 });
          gsap.set($visuals.eq(0), { autoAlpha: 1 });
        }

        stackItemsMap.set(this, $items);
        if ($visuals.length) stackVisualsMap.set(this, $visuals);

        // A11y: make stack items focusable and keyboard-activatable
        $items.attr({ tabindex: '0', role: 'button' });
        $items.on('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            $(this).trigger('click');
          }
          // Arrow Up/Down to move between stack items
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const idx = $items.index($(this));
            const next =
              e.key === 'ArrowDown'
                ? (idx + 1) % $items.length
                : (idx - 1 + $items.length) % $items.length;
            $items.eq(next).focus();
          }
        });

        $items.on('click', function () {
          if (!tabsEnabled) return;
          const $clicked = $(this);
          if ($clicked.attr('data-status') === 'active') return;
          paused = true;
          pausedByScroll = false;
          stopAutoplay();
          const clickedIdx = $items.index($clicked);
          // A11y: sync ARIA state for stack items
          $tabItems.attr({ 'aria-selected': 'false', tabindex: '-1' });
          $tabItems.eq(clickedIdx).attr({ 'aria-selected': 'true', tabindex: '0' });
          $items.each(function () {
            if ($(this).attr('data-status') === 'active') closeStackItem($(this));
          });
          openStackItem($clicked, clickedIdx, $visuals);
        });
      });

      function closeStackItem($item) {
        const $mask = $item.find('.stack-tabs_item-mask');
        gsap.to($mask, {
          height: 0,
          duration: 0.4,
          ease: 'power2.inOut',
          onComplete: function () {
            $item.attr('data-status', 'not-active');
          },
        });
      }

      function openStackItem($item, index, $visuals) {
        $item.attr('data-status', 'active');
        const $mask = $item.find('.stack-tabs_item-mask');
        const fullHeight = $mask[0].scrollHeight;
        gsap.fromTo(
          $mask,
          { height: 0 },
          {
            height: fullHeight,
            duration: 0.4,
            ease: 'power2.inOut',
            onComplete: function () {
              gsap.set($mask, { height: 'auto' });
            },
          }
        );
        if ($visuals && $visuals.length) {
          gsap.to($visuals, { autoAlpha: 0, duration: 0.25, ease: 'power2.out' });
          gsap.to($visuals.eq(index), {
            autoAlpha: 1,
            duration: 0.35,
            ease: 'power2.in',
            delay: 0.15,
          });
        }
      }

      function disableTabs() {
        tabsEnabled = false;
        started = false;
        paused = false;
        pausedByScroll = false;
        stopAutoplay(false);
        $wrap.attr('data-tabs-status', 'disabled');

        if (hasMenu) {
          $menuItems.removeClass('is-active');
          $contents.each(function () {
            $(this).css('display', displayMap.get(this));
          });
        } else {
          $innerItems.removeClass('is-active');
          $contents.each(function () {
            const $items = stackItemsMap.get(this);
            const $visuals = stackVisualsMap.get(this);
            if (!$items) return;
            $items.each(function () {
              $(this).attr('data-status', 'active');
              gsap.set($(this).find('.stack-tabs_item-mask'), { height: 'auto' });
            });
            if ($visuals && $visuals.length) {
              gsap.set($visuals, { autoAlpha: 1 });
            }
          });
        }
      }

      function enableTabs() {
        tabsEnabled = true;
        started = false;
        paused = false;
        pausedByScroll = false;
        $wrap.attr('data-tabs-status', 'enabled');

        if (!hasMenu) {
          $contents.each(function () {
            const $items = stackItemsMap.get(this);
            const $visuals = stackVisualsMap.get(this);
            if (!$items) return;
            $items.each(function (i) {
              if (i !== 0) {
                $(this).attr('data-status', 'not-active');
                gsap.set($(this).find('.stack-tabs_item-mask'), { height: 0 });
              } else {
                $(this).attr('data-status', 'active');
                gsap.set($(this).find('.stack-tabs_item-mask'), { height: 'auto' });
              }
            });
            if ($visuals && $visuals.length) {
              gsap.set($visuals, { autoAlpha: 0 });
              gsap.set($visuals.eq(0), { autoAlpha: 1 });
            }
          });
        } else {
          $contents.hide();
          $contents.eq(0).css('display', displayMap.get($contents[0]));
          $menuItems.removeClass('is-active');
          $menuItems.eq(0).addClass('is-active');
        }

        ScrollTrigger.refresh();
      }

      function checkBreakpoint() {
        const active = isBreakpointActive();
        if (active && tabsEnabled !== true) {
          enableTabs();
        } else if (!active && tabsEnabled !== false) {
          disableTabs();
        }
      }

      function getTabDuration($item) {
        const custom = parseFloat($item.attr('data-tabs-duration'));
        return !isNaN(custom) ? custom * 1000 : 6500;
      }

      function getActiveItem() {
        return hasMenu ? $menuItems.eq(currentIndex) : $innerItems.eq(currentIndex);
      }

      function activateTab(index, opts) {
        // ─── PERSIST: save to localStorage if enabled ─────────────────────────
        if (persistKey) {
          try {
            localStorage.setItem(persistKey, index);
          } catch (e) {}
        }
        // ─────────────────────────────────────────────────────────────────────

        currentIndex = index;
        remainingDuration = null;
        progressStartTime = null;

        // A11y: update ARIA and roving tabindex
        $tabItems.attr({ 'aria-selected': 'false', tabindex: '-1' });
        $tabItems.eq(index).attr({ 'aria-selected': 'true', tabindex: '0' });

        if (hasMenu) {
          $menuItems.removeClass('is-active');
          $menuItems.eq(index).addClass('is-active');
          $contents.hide();
          const target = $contents.eq(index)[0];
          $(target).css('display', displayMap.get(target));
        } else {
          $innerItems.removeClass('is-active');
          $innerItems.eq(index).addClass('is-active');

          $contents.each(function () {
            const $items = stackItemsMap.get(this);
            const $visuals = stackVisualsMap.get(this);
            if (!$items) return;
            $items.each(function (i) {
              if (i === index) {
                if ($(this).attr('data-status') !== 'active') {
                  $items.each(function () {
                    if ($(this).attr('data-status') === 'active') closeStackItem($(this));
                  });
                  openStackItem($(this), index, $visuals);
                }
              }
            });
          });
        }

        // ─── EVENT: fire tabs:change on the wrap element ──────────────────────
        $wrap[0].dispatchEvent(
          new CustomEvent('tabs:change', {
            bubbles: true,
            detail: { index, trigger: (opts && opts.trigger) || 'internal' },
          })
        );
        // trigger values: 'internal' (autoplay/click), 'external' (switchTab API)
        // ─────────────────────────────────────────────────────────────────────

        if (!paused) startAutoplay();
      }

      function startAutoplay(resume) {
        stopAutoplay(false);
        const $activeItem = getActiveItem();
        const bar = $activeItem.find('[data-tabs="progress"]')[0];
        if (!bar) return;

        const fullDuration = getTabDuration($activeItem) / 1000;
        currentTabDuration = fullDuration;

        const duration =
          resume && remainingDuration != null ? remainingDuration / 1000 : fullDuration;
        const elapsed = fullDuration - duration;
        const progressStart = elapsed / fullDuration;

        progressStartTime = Date.now();

        gsap.fromTo(
          bar,
          { scaleX: progressStart },
          { scaleX: 1, duration, ease: 'none', transformOrigin: 'left center' }
        );

        autoplayTimer = setTimeout(() => {
          remainingDuration = null;
          activateTab((currentIndex + 1) % (hasMenu ? $menuItems.length : $innerItems.length));
        }, duration * 1000);
      }

      function stopAutoplay(animate = true) {
        clearTimeout(autoplayTimer);
        const $items = hasMenu ? $menuItems : $innerItems;
        const bars = $items.find('[data-tabs="progress"]').toArray();
        gsap.killTweensOf(bars);
        if (animate) {
          gsap.to(bars, { scaleX: 0, duration: 0.3, ease: 'power2.in' });
        } else {
          gsap.set(bars, { scaleX: 0 });
        }
      }

      function pauseForScroll() {
        if (paused || !started) return;
        pausedByScroll = true;
        clearTimeout(autoplayTimer);

        const $activeItem = getActiveItem();
        const bar = $activeItem.find('[data-tabs="progress"]')[0];
        if (bar) gsap.getTweensOf(bar).forEach((t) => t.pause());

        if (progressStartTime != null && currentTabDuration != null) {
          const elapsed = (Date.now() - progressStartTime) / 1000;
          remainingDuration = Math.max(0, currentTabDuration - elapsed) * 1000;
        }

        const $items = hasMenu ? $menuItems : $innerItems;
        gsap.getTweensOf($items.find('[data-tabs="progress"]').toArray()).forEach((t) => t.pause());
      }

      function resumeFromScroll() {
        if (!pausedByScroll) return;
        pausedByScroll = false;
        progressStartTime = Date.now() - (currentTabDuration * 1000 - (remainingDuration || 0));
        startAutoplay(true);
      }

      if (hasMenu) {
        $menuItems.on('click', function () {
          if (!tabsEnabled) return;
          paused = true;
          pausedByScroll = false;
          stopAutoplay();
          activateTab($(this).index());
        });
      }

      $wrap.find('[data-tabs="inner-item"]').on('click', function () {
        if (!tabsEnabled) return;
        paused = true;
        pausedByScroll = false;
        stopAutoplay();
      });

      ScrollTrigger.create({
        trigger: $wrap[0],
        start: 'top 80%',
        onEnter: () => {
          if (!tabsEnabled) return;
          if (!started) {
            started = true;
            paused = false;
            // ─── PERSIST: restore saved tab index on first enter ─────────────
            let startIndex = 0;
            if (persistKey) {
              try {
                const saved = localStorage.getItem(persistKey);
                if (saved !== null) startIndex = parseInt(saved) || 0;
              } catch (e) {}
            }
            // ─────────────────────────────────────────────────────────────────
            activateTab(startIndex);
          } else if (pausedByScroll) {
            resumeFromScroll();
          }
        },
        onEnterBack: () => {
          if (!tabsEnabled) return;
          if (!started) {
            started = true;
            activateTab(currentIndex);
          } else if (pausedByScroll) {
            resumeFromScroll();
          }
        },
        onLeave: () => {
          if (!paused && tabsEnabled) pauseForScroll();
        },
        onLeaveBack: () => {
          if (!paused && tabsEnabled) pauseForScroll();
        },
      });

      // ─── REGISTER this instance in the public API ───────────────────────────
      window.Tabs._registry.set($wrap[0], function (index, opts) {
        if (!tabsEnabled) return;
        paused = true;
        pausedByScroll = false;
        stopAutoplay();
        activateTab(index, { trigger: 'external', ...(opts || {}) });
      });
      // ────────────────────────────────────────────────────────────────────────

      let lastWidth = window.innerWidth;
      $(window).on(
        'resize',
        debounce(function () {
          const newWidth = window.innerWidth;
          if (newWidth === lastWidth) return;
          lastWidth = newWidth;
          checkBreakpoint();
        }, 200)
      );

      checkBreakpoint();
    });
  });
});
