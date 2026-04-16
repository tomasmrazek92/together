function navDropdowns() {
  var $triggers = $('[data-dropdown-trigger]');
  var $dropdowns = $('[data-dropdown-target]');
  var $navDropdowns = $('.nav-dropdowns');
  var $plainNavItems = $('[data-nav-item]:not([data-dropdown-trigger])'); // plain items
  var activeKey = null;
  var isOpen = false;

  gsap.set($navDropdowns, { opacity: 0 });

  function getTargetX($trigger, $target) {
    var emSize = parseFloat(getComputedStyle($navDropdowns[0]).fontSize);
    var offset = 1.5 * emSize;
    var triggerLeft = $trigger[0].getBoundingClientRect().left;
    var parentLeft = $navDropdowns[0].parentElement.getBoundingClientRect().left;
    var targetX = triggerLeft - parentLeft - offset;
    var dropdownWidth = $target[0].getBoundingClientRect().width;
    var viewportWidth = window.innerWidth;
    var parentLeftAbs = parentLeft;
    var minX = offset;
    var maxX = viewportWidth - parentLeftAbs - dropdownWidth - offset;
    return Math.min(Math.max(targetX, minX), maxX);
  }

  function openDropdown(key, $trigger) {
    if (activeKey === key) return;
    activeKey = key;

    var $target = $('[data-dropdown-target="' + key + '"]');
    var targetX = getTargetX($trigger, $target);

    $triggers.removeClass('is-active');
    $trigger.addClass('is-active');

    if (!isOpen) {
      isOpen = true;
      // Hide all panels BEFORE making container visible
      $dropdowns.removeClass('is-active');
      $target.addClass('is-active');
      gsap.set($navDropdowns, { x: targetX, opacity: 0 });
      $navDropdowns.addClass('is-active');
      gsap.to($navDropdowns, { opacity: 1, duration: 0.25, ease: 'power2.out' });
    } else {
      // Swap panels only after a brief delay so opacity tween stays clean
      gsap.to($navDropdowns, {
        x: targetX,
        duration: 0.2,
        ease: 'power2.out',
        onStart: function () {
          $dropdowns.removeClass('is-active');
          $target.addClass('is-active');
        },
      });
    }
  }

  function closeAll() {
    if (!isOpen) return;
    activeKey = null;
    isOpen = false;
    gsap.killTweensOf($navDropdowns);
    gsap.to($navDropdowns, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: function () {
        $dropdowns.removeClass('is-active');
        $navDropdowns.removeClass('is-active');
        $triggers.removeClass('is-active');
      },
    });
  }

  if ($(window).width() >= 991) {
    $triggers.on('mouseenter', function () {
      var key = $(this).data('dropdown-trigger');
      openDropdown(key, $(this));
    });

    // Plain nav items (no dropdown) close the menu
    $plainNavItems.on('mouseenter', function () {
      closeAll();
    });

    $('.nav-box').on('mouseleave', function () {
      closeAll();
    });
  }
}

function responsiveNav() {
  // nav-menu.js
  const NavMenu = (() => {
    const BREAKPOINT = 992;

    let $nav, $trigger, $menu;
    let isOpen = false;
    let isAnimating = false;
    let tl = null;

    const isMobile = () => window.innerWidth < BREAKPOINT;
    const getItems = () => $menu.find('.nav-links > li, .nav-menu-cta');

    const clearGsapStyles = () => {
      gsap.set([$menu[0], ...getItems()], { clearProps: 'all' });
    };

    const buildTimeline = () => {
      if (tl) tl.kill();

      tl = gsap.timeline({
        paused: true,
        defaults: { ease: 'power3.inOut' },
        onStart: () => {
          isAnimating = true;
        },
        onComplete: () => {
          isAnimating = false;
        },
        onReverseComplete: () => {
          isAnimating = false;
          gsap.set($menu[0], { display: 'none' });
        },
      });

      tl.set($menu[0], { display: 'flex' })
        .from($menu[0], { duration: 0.4, opacity: 0, y: -8 })
        .from(getItems(), { duration: 0.35, opacity: 0, y: 10, stagger: 0.05 }, '-=0.2');
    };

    const open = () => {
      isOpen = true;
      $nav.attr('data-nav-status', 'open');
      tl.play();
    };

    const close = () => {
      isOpen = false;
      $nav.attr('data-nav-status', 'closed');
      tl.reverse();
    };

    const reset = () => {
      isOpen = false;
      isAnimating = false;
      $nav.removeAttr('data-nav-status');
      if (tl) {
        tl.kill();
        tl = null;
      }
      clearGsapStyles();
    };

    const init = () => {
      $nav = $('nav.nav');
      $trigger = $('[data-nav-menu="trigger"]');
      $menu = $('.nav-menu');

      if (!$trigger.length || !$menu.length) return;

      // Only build timeline if we start on mobile
      if (isMobile()) buildTimeline();

      $trigger.on('click', () => {
        if (!isMobile()) return;
        if (isAnimating) return;
        // Lazily build timeline if it was never created (e.g. resized to mobile)
        if (!tl) buildTimeline();
        isOpen ? close() : open();
      });

      let prevWidth = window.innerWidth;
      $(window).on('resize', () => {
        const currentWidth = window.innerWidth;
        if (currentWidth === prevWidth) return;
        prevWidth = currentWidth;
        if (currentWidth >= BREAKPOINT) reset();
      });
    };

    return { init };
  })();

  NavMenu.init();
}

export function initNav() {
  navDropdowns();
  responsiveNav();
}
