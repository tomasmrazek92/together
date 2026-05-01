$(document).ready(function () {
  const articleUrl = window.location.pathname;
  const gatedContentItem = 'gatedContent';
  const gatedContentStorage = JSON.parse(localStorage.getItem(gatedContentItem) || '{}');
  const gateMarker = '{gated-content-start}';
  const gateSection = '.section_blog-gated';
  const gateOverlay = '.blog-article_overlay';
  const gatedContent = '[data-gated="content"]';
  let $gateMarkerElement = $();

  const $gatedContentEl = $(gatedContent);
  const hasGateMarker =
    $gatedContentEl.length && $gatedContentEl.text().includes(gateMarker);
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
      const nav =
        performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
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

  const fuzzyProviders = [
    'gmail',
    'googlemail',
    'yahoo',
    'hotmail',
    'outlook',
    'icloud',
    'proton',
    'protonmail',
    'yandex',
    'tutanota',
    'btinternet',
    'talktalk',
    'ntlworld',
    'btopenworld',
  ];

  const exactDomains = new Set([
    'aol.com',
    'aol.co.uk',
    'msn.com',
    'gmx.com',
    'live.com',
    'me.com',
    'mac.com',
    'zoho.com',
    'inbox.com',
    'mail.com',
    'email.com',
    'comcast.net',
    'verizon.net',
    'att.net',
    'charter.net',
    'cox.net',
    'test.com',
    'example.com',
    'example.org',
    'example.net',
    'domain.com',
    'yourdomain.com',
    'acme.com',
    'gotransverse.com',
    'alldata.com',
  ]);

  const reservedTlds = new Set(['test', 'example', 'invalid', 'localhost']);

  function editDistance(a, b) {
    const m = a.length;
    const n = b.length;
    if (!m || !n) return m + n;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
        }
      }
    }
    return dp[m][n];
  }

  function isBlockedDomain(domain) {
    domain = (domain || '').toLowerCase();
    if (!domain) return false;
    if (reservedTlds.has(domain.split('.').pop())) return true;
    if (exactDomains.has(domain)) return true;
    const firstLabel = domain.split('.')[0];
    return fuzzyProviders.some((p) => editDistance(firstLabel, p) <= 1);
  }

  const emailErrorStyle =
    'color: var(--brand--brand-orange); font-size: 0.875em; font-weight: 500; line-height: 1.2;';

  function isValidEmail(email) {
    return /^[^\s@]{1,}@[^\s@]{2,}\.[^\s@]{2,}$/.test(email);
  }

  function showEmailError($input, message, placeholder) {
    $input.val('').attr('placeholder', placeholder).addClass('error');
    $input.after(`<div class="email-error" style="${emailErrorStyle}">${message}</div>`);
  }

  function validateEmail($input) {
    const email = $input.val();
    $input.siblings('.email-error').remove();

    if (!email) {
      showEmailError($input, 'Please enter your email address', 'Please enter your email address');
      return false;
    }
    if (!isValidEmail(email)) {
      showEmailError(
        $input,
        'Please enter a valid email address',
        'Please enter a valid email address'
      );
      return false;
    }
    if (isBlockedDomain(email.split('@')[1])) {
      showEmailError($input, 'Please use your business email address', 'Please enter a business email');
      return false;
    }

    $input.removeClass('error');
    return true;
  }

  function validateForm($form) {
    let isValid = true;
    $form.find('input[type="email"]').each(function () {
      if (!validateEmail($(this))) isValid = false;
    });
    return isValid;
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

  $(document).on('click', '[data-button-instance="submit-form"]', function (e) {
    e.preventDefault();
    const $btn = $(this);
    if ($btn.data('mirrorActive')) return;

    const $form = $btn.closest('form');
    if (!$form.length) return;
    if (!validateForm($form)) return;
    const $submit = $form.find('input[type="submit"]').first();
    if (!$submit.length) return;

    const input = $submit[0];
    const $btnText = $btn.find('[data-button-text]').length
      ? $btn.find('[data-button-text]')
      : $btn;
    const originalText = $btnText.text();

    $btn.data('mirrorActive', true);
    input.click();

    if (!input.disabled) {
      $btn.data('mirrorActive', false);
      return;
    }

    let poll, safety;
    const cleanup = () => {
      clearInterval(poll);
      clearTimeout(safety);
      watcher.disconnect();
      $btnText.text(originalText);
      $btn.prop('disabled', false);
      $btn.data('mirrorActive', false);
    };

    const watcher = new MutationObserver(() => {
      if (!$form.is(':visible')) cleanup();
    });
    const parent = $form.parent()[0];
    if (parent) watcher.observe(parent, { attributes: true, childList: true, subtree: true });

    poll = setInterval(() => {
      $btnText.text(input.value || originalText);
      $btn.prop('disabled', input.disabled);
      if (!input.disabled) cleanup();
    }, 100);

    safety = setTimeout(cleanup, 30000);
  });

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
      transition:
        'height ' + duration + 'ms ease, opacity ' + (duration - 50) + 'ms ease',
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

      if (gatedContentStorage[articleUrl]) {
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

    $('form').on('submit', function (e) {
      const $form = $(this);

      if (!validateForm($form)) {
        e.preventDefault();
        return false;
      }

      const $successMsg = $form.siblings('.w-form-done')[0];

      const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.attributeName === 'style') {
            const display = window.getComputedStyle($successMsg).display;
            if (display === 'block') {
              gatedContentStorage[articleUrl] = true;
              localStorage.setItem(gatedContentItem, JSON.stringify(gatedContentStorage));
              setTimeout(() => location.reload(), 100);
              observer.disconnect();
            }
          }
        });
      });

      observer.observe($successMsg, { attributes: true });
    });

    $('form').on('input', 'input[type="email"]', function () {
      const $input = $(this);
      $input.siblings('.email-error').remove();
      $input.removeClass('error');
    });
  }, 1500);
});
