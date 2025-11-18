$(document).ready(function () {
  const articleUrl = window.location.pathname;
  const gatedContentItem = 'gatedContent';
  const gatedContentStorage = JSON.parse(localStorage.getItem(gatedContentItem) || '{}');
  const gateMarker = '{gated-content-start}';
  const gateSection = '.section_blog-2-gated';
  const gateOverlay = '.blog-2-article_overlay';
  const gatedContent = '[data-gated="content"]';
  let $gateMarkerElement = $();

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

        $(gateSection).show();
        $(gateOverlay).show();
      }
    }

    $('form').on('submit', function (e) {
      const $form = $(this);
      let isValid = true;

      const invalidDomains = [
        'gmail.com',
        'acme.com',
        'gmali.com',
        'hotmail.com',
        'icloud.com',
        'yahoo.com',
        'zoho.com',
        'aol.com',
        'outlook.com',
        'live.com',
        'msn.com',
        'gotransverse.com',
        'alldata.com',
        'me.com',
        'comcast.net',
        'verizon.net',
        'att.net',
        'charter.net',
        'cox.net',
        'inbox.com',
        'mail.com',
        'gmx.com',
        'protonmail.com',
        'tutanota.com',
        'yandex.com',
        'aol.co.uk',
        'btinternet.com',
        'talktalk.net',
        'ntlworld.com',
        'mac.com',
        'googlemail.com',
        'btopenworld.com',
      ];

      function isValidEmail(email) {
        const emailRegex = /^[^\s@]{1,}@[^\s@]{2,}\.[^\s@]{2,}$/;
        return emailRegex.test(email);
      }

      function validateEmail($input) {
        const email = $input.val();
        $input.siblings('.email-error').remove();

        if (!email) return true;

        if (!isValidEmail(email)) {
          $input
            .val('')
            .attr('placeholder', 'Please enter a valid email address')
            .addClass('error');
          $input.after(
            '<div class="email-error" style="color: var(--red); font-size: 14px; font-weight: 500; line-height: 1.2;">Please enter a valid email address</div>'
          );
          return false;
        }

        const domainPart = email.split('@')[1];
        if (invalidDomains.includes(domainPart)) {
          $input.val('').attr('placeholder', 'Please enter a business email').addClass('error');
          $input.after(
            '<div class="email-error" style="color: var(--red); font-size: 14px; font-weight: 500; line-height: 1.2;">Please use your business email address</div>'
          );
          return false;
        }

        $input.removeClass('error');
        return true;
      }

      $form.find('input[type="email"]').each(function () {
        if (!validateEmail($(this))) {
          isValid = false;
        }
      });

      if (!isValid) {
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
