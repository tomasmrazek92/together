export function initCSSMarquee() {
  const marquees = document.querySelectorAll('[data-css-marquee]');

  function isInBreakpoint(marquee) {
    const w = $(window).width();
    const min = marquee.dataset.marqueeMin ? parseInt(marquee.dataset.marqueeMin) : null;
    const max = marquee.dataset.marqueeMax ? parseInt(marquee.dataset.marqueeMax) : null;
    if (min !== null && w < min) return false;
    if (max !== null && w > max) return false;
    return true;
  }

  function hasBreakpoint(marquee) {
    return $(marquee).attr('data-marquee-min') || $(marquee).attr('data-marquee-max');
  }

  function resetMarquee(marquee) {
    $(marquee).find('[data-css-marquee-list][data-clone]').remove();
    $(marquee)
      .find('[data-css-marquee-list]')
      .each(function () {
        $(this).css('animation-name', 'none');
        this.offsetHeight;
        $(this).attr('style', '');
      });
  }

  function setupMarquee(marquee) {
    if ($(marquee).find('[data-css-marquee-list][data-clone]').length) return;
    const pixelsPerSecond = parseInt($(marquee).attr('data-marquee-speed')) || 75;
    const playState = hasBreakpoint(marquee) ? 'paused' : 'running';
    $(marquee)
      .find('[data-css-marquee-list]')
      .each(function () {
        const duration = this.offsetWidth / pixelsPerSecond + 's';
        const clone1 = $(this).clone().attr('data-clone', true);
        const clone2 = $(this).clone().attr('data-clone', true);
        $(this).css({ animationDuration: duration, animationPlayState: playState });
        clone1.css({ animationDuration: duration, animationPlayState: playState });
        clone2.css({ animationDuration: duration, animationPlayState: playState });
        $(marquee).append(clone1, clone2);
      });
  }

  marquees.forEach((marquee) => {
    if (hasBreakpoint(marquee)) {
      if (isInBreakpoint(marquee)) setupMarquee(marquee);
    } else {
      setupMarquee(marquee);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!hasBreakpoint(entry.target)) return;
          if (isInBreakpoint(entry.target)) {
            $(entry.target)
              .find('[data-css-marquee-list]')
              .css('animationPlayState', entry.isIntersecting ? 'running' : 'paused');
          }
        });
      },
      { threshold: 0 }
    );

    observer.observe(marquee);
  });

  let resizeTimer;
  let lastWidth = $(window).width();

  $(window).on('resize', function () {
    const currentWidth = $(window).width();
    if (currentWidth === lastWidth) return;
    lastWidth = currentWidth;

    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      marquees.forEach((marquee) => {
        resetMarquee(marquee);
        if (hasBreakpoint(marquee)) {
          if (isInBreakpoint(marquee)) setupMarquee(marquee);
        } else {
          setupMarquee(marquee);
        }
      });
    }, 150);
  });
}
export function initAccordionCSS() {
  document.querySelectorAll('[data-accordion-css-init]').forEach((accordion) => {
    const closeSiblings = accordion.getAttribute('data-accordion-close-siblings') === 'true';

    accordion.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-accordion-toggle]');
      if (!toggle) return; // Exit if the clicked element is not a toggle

      const singleAccordion = toggle.closest('[data-accordion-status]');
      if (!singleAccordion) return; // Exit if no accordion container is found

      const isActive = singleAccordion.getAttribute('data-accordion-status') === 'active';
      singleAccordion.setAttribute('data-accordion-status', isActive ? 'not-active' : 'active');

      // When [data-accordion-close-siblings="true"]
      if (closeSiblings && !isActive) {
        accordion.querySelectorAll('[data-accordion-status="active"]').forEach((sibling) => {
          if (sibling !== singleAccordion)
            sibling.setAttribute('data-accordion-status', 'not-active');
        });
      }
    });
  });
}
