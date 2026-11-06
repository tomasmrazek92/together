var scrollPosition = 0;
var isScrollDisabled = false;

// Idempotent, so the mobile nav can call them from open/close without tracking the lock itself.
export function disableScroll() {
  if (isScrollDisabled) return;
  var $body = $(document.body);
  var oldWidth = $body.innerWidth();
  scrollPosition = window.pageYOffset;
  $body.css({
    overflow: 'hidden',
    position: 'fixed',
    top: `-${scrollPosition}px`,
    width: oldWidth,
  });
  isScrollDisabled = true;
}

export function enableScroll() {
  if (!isScrollDisabled) return;
  $(document.body).css({
    overflow: '',
    position: '',
    top: '',
    width: '',
  });
  $(window).scrollTop(scrollPosition);
  isScrollDisabled = false;
}

export function initScrollToggle() {
  function toggleScroll() {
    if (isScrollDisabled) {
      enableScroll();
    } else {
      disableScroll();
    }
  }

  // Click Event
  // The mobile nav hamburger locks through nav.js (open/close), so Escape and ignored clicks stay in sync.
  $('[data-scroll="toggle"]').not('[data-nav-menu="trigger"]').on('click', toggleScroll);

  // Run on resize
  const breakpoints = [991, 767, 479];
  let lastWidth = window.innerWidth;

  function handleBreakpoint(breakpoint) {
    if (isScrollDisabled) {
      enableScroll();
    }
  }

  // Function to check breakpoints on window resize
  function checkBreakpoints() {
    const currentWidth = window.innerWidth;

    breakpoints.forEach((breakpoint) => {
      if (
        (lastWidth <= breakpoint && currentWidth > breakpoint) ||
        (lastWidth >= breakpoint && currentWidth < breakpoint)
      ) {
        handleBreakpoint(breakpoint);
      }
    });

    // Update lastWidth for the next call
    lastWidth = currentWidth;
  }

  // Event listener for window resize
  window.addEventListener('resize', checkBreakpoints);
}
