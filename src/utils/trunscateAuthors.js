export function initAuthorsTruncate() {
  $(window).on('load', function () {
    // Get font string from element for canvas measurement
    function getFont($el) {
      var style = window.getComputedStyle($el[0]);
      return style.fontSize + ' ' + style.fontFamily;
    }

    // Measure text width via canvas — zero reflow
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    function measureText(text, font) {
      ctx.font = font;
      return ctx.measureText(text).width;
    }

    function initElement($el) {
      if (!$el.attr('data-original-text')) {
        $el.attr('data-original-text', $el.text());
      }
      if (!$el.attr('data-font')) {
        $el.attr('data-font', getFont($el));
      }
    }

    function truncateEl($el) {
      var $wrapper = $el.closest('[data-authors-wrapper]');
      var maxWidth = $wrapper.length ? $wrapper[0].offsetWidth : $el.parent()[0].offsetWidth;
      var lines = parseInt($el.attr('data-authors-line')) || 1;
      var original = $el.attr('data-original-text');
      var font = $el.attr('data-font');

      var suffixWidth = measureText(' et al.', font);
      var totalMaxWidth = maxWidth * lines - suffixWidth;
      var originalWidth = measureText(original, font);

      // No truncation needed
      if (originalWidth <= totalMaxWidth) {
        $el.text(original);
        return;
      }

      // Binary search purely in memory — no DOM reads in the loop
      var lo = 0;
      var hi = original.length;

      while (lo < hi) {
        var mid = Math.ceil((lo + hi) / 2);
        var w = measureText(original.slice(0, mid), font);
        if (w > totalMaxWidth) {
          hi = mid - 1;
        } else {
          lo = mid;
        }
      }

      var trimmed = original.slice(0, lo).trimEnd();
      var lastComma = trimmed.lastIndexOf(',');
      if (lastComma !== -1) trimmed = trimmed.slice(0, lastComma);

      $el.html(trimmed + ' <em>et al.</em>');
    }

    function truncateAll() {
      $('[data-authors-line]').each(function () {
        truncateEl($(this));
      });
    }

    $('[data-authors-line]').each(function () {
      initElement($(this));
    });

    truncateAll();

    // Width-only resize + debounce
    var lastWidth = $(window).width();
    var resizeTimer;
    $(window).on('resize', function () {
      var currentWidth = $(window).width();
      if (currentWidth === lastWidth) return;
      lastWidth = currentWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(truncateAll, 150);
    });

    // Scoped MutationObserver per section
    var $sections = $('[data-authors-line]')
      .map(function () {
        var $section = $(this).closest('section');
        return $section.length ? $section[0] : $(this).parent()[0];
      })
      .get();

    var targets = $sections.filter(function (el, i) {
      return $sections.indexOf(el) === i;
    });

    targets.forEach(function (target) {
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          $(mutation.addedNodes).each(function () {
            var $node = $(this);
            if ($node.is('[data-authors-line]')) {
              initElement($node);
              truncateEl($node);
            }
            $node.find('[data-authors-line]').each(function () {
              initElement($(this));
              truncateEl($(this));
            });
          });
        });
      });
      observer.observe(target, { childList: true, subtree: true });
    });
  });
}
