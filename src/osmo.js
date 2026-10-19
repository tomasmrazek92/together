export function initCSSMarquee() {
  const marquees = Array.from(document.querySelectorAll('[data-css-marquee]'));

  // [data-marquee-split="992"]: at or below that width, the second half of the items
  // moves into a reversed sibling row, so one CMS list renders as two rows
  const splits = marquees
    .filter((marquee) => marquee.hasAttribute('data-marquee-split'))
    .map((marquee) => {
      const list = marquee.querySelector('[data-css-marquee-list]');
      const row = marquee.cloneNode(false);
      row.removeAttribute('data-marquee-split');
      row.setAttribute('data-marquee-split-row', '');
      row.setAttribute('data-marquee-direction', 'reverse');
      row.appendChild(list.cloneNode(false));
      marquees.push(row);
      return { marquee, list, row, items: Array.from(list.children) };
    });

  function applySplit() {
    const w = $(window).width();
    splits.forEach(({ marquee, list, row, items }) => {
      const shouldSplit = w <= parseInt(marquee.dataset.marqueeSplit);
      if (shouldSplit === row.isConnected) return;
      marquee.toggleAttribute('data-marquee-split-active', shouldSplit);
      const moved = items.slice(Math.ceil(items.length / 2));
      if (shouldSplit) {
        row.querySelector('[data-css-marquee-list]').append(...moved);
        marquee.after(row);
      } else {
        list.append(...moved);
        row.remove();
      }
    });
  }

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
    if (!marquee.isConnected) return;
    if ($(marquee).find('[data-css-marquee-list][data-clone]').length) return;
    const direction = marquee.dataset.marqueeDirection === 'reverse' ? 'reverse' : 'normal';
    // Split rows are half-length lists: one clone per row is enough for the loop
    const copies = marquee.matches('[data-marquee-split-active], [data-marquee-split-row]') ? 1 : 2;
    const pixelsPerSecond = parseInt($(marquee).attr('data-marquee-speed')) || 75;
    const playState = hasBreakpoint(marquee) ? 'paused' : 'running';
    $(marquee)
      .find('[data-css-marquee-list]')
      .each(function () {
        const duration = this.offsetWidth / pixelsPerSecond + 's';
        const css = { animationDuration: duration, animationPlayState: playState, animationDirection: direction };
        $(this).css(css);
        for (let i = 0; i < copies; i++) {
          $(marquee).append($(this).clone().attr('data-clone', true).css(css));
        }
      });
  }

  applySplit();

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
      marquees.forEach(resetMarquee);
      applySplit();
      marquees.forEach((marquee) => {
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
