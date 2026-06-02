(function () {
  'use strict';

  var BOX = '[data-bunny-lightbox-control="open"]';
  var FORM_SELECTOR = '.form-box'; // scroll target (falls back to .hs-form-html)
  var SCROLL_OFFSET = 120; // px breathing room above the form (clears the nav)
  var STORE_KEY = 'gtcVideosUnlocked';

  // HubSpot V4 form id on this page — only this form unlocks the videos.
  var FORM_ID = 'e2235d68-df47-46b7-91fb-632a2321f7b7';

  // Base64'd Bunny Stream HLS playlists, in the DOM order of the boxes.
  var SOURCES = [
    'aHR0cHM6Ly92ei0wNjIyYWYzNC0wOTYuYi1jZG4ubmV0LzE3N2JlZjM5LTkzNGEtNGNlNS04Zjk5LTg0YjY5ZDg3Yzg3ZC9wbGF5bGlzdC5tM3U4',
    'aHR0cHM6Ly92ei0wNjIyYWYzNC0wOTYuYi1jZG4ubmV0LzM1ZmQzODQ1LTdmZWUtNDhhNS1hMWQ4LWY3MzNkNGI4YzA5ZC9wbGF5bGlzdC5tM3U4',
  ];

  function getBoxes() {
    return Array.prototype.slice.call(document.querySelectorAll(BOX));
  }

  function unlock() {
    getBoxes().forEach(function (box, i) {
      var enc = SOURCES[i];
      if (enc) box.setAttribute('data-bunny-lightbox-src', atob(enc));
      box.setAttribute('data-state', 'unlocked');
      document.querySelector(FORM_SELECTOR).style.display = 'none';
    });
  }

  function scrollToForm() {
    var form = document.querySelector(FORM_SELECTOR) || document.querySelector('.hs-form-html');
    if (!form) return;
    // Measure fresh on every click so resizes / layout shifts never land stale.
    var top = form.getBoundingClientRect().top + window.pageYOffset - SCROLL_OFFSET;
    window.scrollTo({ top: top < 0 ? 0 : top, behavior: 'smooth' });
  }

  function init() {
    if (!getBoxes().length) return;

    // Returning visitor (same browser) — restore unlocked state.
    try {
      if (localStorage.getItem(STORE_KEY) === 'true') unlock();
    } catch (e) {}

    // Gate clicks while locked. Capture phase runs before Osmo's document
    // (bubble) click handler, so stopPropagation prevents the lightbox opening.
    document.addEventListener(
      'click',
      function (e) {
        var box = e.target.closest && e.target.closest(BOX);
        if (!box || box.getAttribute('data-state') !== 'locked') return;
        e.preventDefault();
        e.stopPropagation();
        scrollToForm();
      },
      true
    );

    // HubSpot Forms V4 success — native window event.
    window.addEventListener('hs-form-event:on-submission:success', function (e) {
      var submittedId = e.detail && e.detail.formId;
      if (FORM_ID && submittedId && submittedId !== FORM_ID) return;
      unlock();
      try {
        localStorage.setItem(STORE_KEY, 'true');
      } catch (err) {}
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
