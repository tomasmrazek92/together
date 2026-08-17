console.log('Hello');

$(document).ready(function () {
  const articleUrl = window.location.pathname;
  const gatedContentItem = 'gatedContent';
  const gatedContentStorage = JSON.parse(localStorage.getItem(gatedContentItem) || '{}');
  const gateMarker = '{gated-content-start}';
  const gateSection = '.section_blog-gated';
  const gateOverlay = '.blog-article_overlay';
  const gatedContent = '[data-gated="content"]';
  let $gateMarkerElement = $();

  // Sales bypass — share any blog URL with `?ungated` to skip the form.
  // Per-pageview only: nothing is stored, the param has to be on the link.
  const bypassActive = new URLSearchParams(window.location.search).has('ungated');

  // Single source of truth for "this reader may see the full article".
  const isUnlocked = () => bypassActive || gatedContentStorage[articleUrl] === true;

  // Any successful HubSpot form submit on the page unlocks the article.
  // Registered immediately (not inside the 1500ms timeout below) so it can never
  // miss a submission. V4 emits native window events — no callbacks, no DOM
  // scraping for a thank-you node. See webflow-gotchas.md §5.
  window.addEventListener('hs-form-event:on-submission:success', function () {
    gatedContentStorage[articleUrl] = true;
    try {
      localStorage.setItem(gatedContentItem, JSON.stringify(gatedContentStorage));
    } catch (err) {}
    // Reload rather than reveal in place — the scroll-restore + skeleton path
    // below already handles returning the reader to where they were.
    setTimeout(() => location.reload(), 100);
  });

  const $gatedContentEl = $(gatedContent);
  const hasGateMarker = $gatedContentEl.length && $gatedContentEl.text().includes(gateMarker);
  let $gatedSkeleton = $();

  if (hasGateMarker) {
    if (!document.getElementById('gated-skeleton-styles')) {
      $('head').append(
        '<style id="gated-skeleton-styles">' +
          '.gated-skeleton{display:flex;flex-direction:column;gap:0.85em;}' +
          '.gated-skeleton__bar{height:1em;border-radius:4px;background:linear-gradient(90deg,#ececec 0%,#f6f6f6 50%,#ececec 100%);background-size:200% 100%;animation:gatedSkeletonShimmer 1.4s ease-in-out infinite;}' +
          '.gated-skeleton__bar--short{width:62%;}' +
          '.gated-skeleton__gap{height:0.6em;}' +
          '@keyframes gatedSkeletonShimmer{0%{background-position:200% 0;}100%{background-position:-200% 0;}}' +
          '</style>'
      );
    }
    $gatedSkeleton = $(
      '<div class="gated-skeleton" aria-hidden="true">' +
        '<div class="gated-skeleton__bar"></div>' +
        '<div class="gated-skeleton__bar"></div>' +
        '<div class="gated-skeleton__bar"></div>' +
        '<div class="gated-skeleton__bar gated-skeleton__bar--short"></div>' +
        '<div class="gated-skeleton__gap"></div>' +
        '<div class="gated-skeleton__bar"></div>' +
        '<div class="gated-skeleton__bar"></div>' +
        '<div class="gated-skeleton__bar gated-skeleton__bar--short"></div>' +
        '</div>'
    );
    $gatedContentEl.after($gatedSkeleton).hide();
  }

  let pendingScrollY = null;
  const GATED_SCROLL_KEY = 'gatedScrollState';

  if (hasGateMarker) {
    let isReload = false;
    try {
      const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
      isReload = nav
        ? nav.type === 'reload'
        : performance.navigation && performance.navigation.type === 1;
    } catch (e) {}

    const savedRaw = sessionStorage.getItem(GATED_SCROLL_KEY);
    sessionStorage.removeItem(GATED_SCROLL_KEY);
    if (isReload && savedRaw) {
      try {
        const parsed = JSON.parse(savedRaw);
        if (parsed && parsed.url === location.pathname && typeof parsed.y === 'number') {
          if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
          }
          window.scrollTo(0, 0);
          pendingScrollY = parsed.y;
        }
      } catch (e) {}
    }

    window.addEventListener('pagehide', () => {
      try {
        sessionStorage.setItem(
          GATED_SCROLL_KEY,
          JSON.stringify({
            url: location.pathname,
            y: window.scrollY || window.pageYOffset || 0,
          })
        );
      } catch (e) {}
    });
  }

  function initReadTime() {
    $('[fs-readtime-element="time"]').each(function () {
      const $timeElement = $(this);
      const $contentElement = $('[fs-readtime-element="contents"]');
      if (!$contentElement.length) return;
      const wpm = $timeElement.attr('fs-readtime-wpm') || 200;
      const decimals = parseInt($timeElement.attr('fs-readtime-decimals')) || 0;
      const allText = $contentElement
        .find('*')
        .addBack()
        .contents()
        .filter(function () {
          return this.nodeType === 3;
        })
        .text();
      const wordsCount = (allText.match(/[\w\d''-]+/gi) || []).length;
      const readTime = wordsCount / wpm;
      $timeElement.text(!decimals && readTime < 0.5 ? '1' : readTime.toFixed(decimals));
    });
  }

  initReadTime();

  const finalizeScroll = () => {
    if (pendingScrollY !== null && !isNaN(pendingScrollY)) {
      window.scrollTo(0, pendingScrollY);
      pendingScrollY = null;
    }
  };

  const revealGatedContent = () => {
    if (!hasGateMarker) {
      finalizeScroll();
      return;
    }

    $gatedContentEl.css('visibility', 'hidden').show();
    const contentHeight = $gatedContentEl.outerHeight();
    $gatedContentEl.hide().css('visibility', '');

    const duration = 400;

    $gatedSkeleton.css({
      height: $gatedSkeleton.outerHeight(),
      overflow: 'hidden',
      transition: 'height ' + duration + 'ms ease, opacity ' + (duration - 50) + 'ms ease',
    });

    void $gatedSkeleton[0].offsetHeight;

    $gatedSkeleton.css({
      height: contentHeight + 'px',
      opacity: 0,
    });

    setTimeout(() => {
      $gatedContentEl.show();
      $gatedSkeleton.remove();
      finalizeScroll();
    }, duration + 30);
  };

  setTimeout(() => {
    if ($(gatedContent).text().includes(gateMarker)) {
      const $paragraphs = $(gatedContent).find('p');

      for (let i = 0; i < $paragraphs.length; i++) {
        if ($paragraphs[i].textContent.trim() === gateMarker) {
          $gateMarkerElement = $paragraphs.eq(i);
          break;
        }
      }

      if (isUnlocked()) {
        $(gateSection).hide();
        $(gateOverlay).hide();
        $gateMarkerElement[0].textContent = '';
      } else {
        const markerNode = $gateMarkerElement[0];
        const contentNode = $(gatedContent)[0];

        while (markerNode.nextSibling) {
          markerNode.nextSibling.remove();
        }

        let topParent = markerNode.parentNode;
        while (topParent !== contentNode) {
          while (topParent.nextSibling) {
            topParent.nextSibling.remove();
          }
          topParent = topParent.parentNode;
        }

        markerNode.textContent = '';

        $(gateSection).css('display', 'block');
        $(gateOverlay).show();
      }
    }

    revealGatedContent();
  }, 1500);
});
