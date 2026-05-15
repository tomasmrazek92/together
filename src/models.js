// All Filters Check
$(document).ready(function () {
  $(document).on('click', '.tab-item, .models_sort-dropdown-item', function () {
    const $this = $(this);
    const $form = $this.closest('form');

    if ($this.is('[fs-list-element="clear"]')) {
      setTimeout(function () {
        $this.addClass('is-active');
      }, 50);
    } else {
      $form.find('[fs-list-element="clear"]').removeClass('is-active');
    }
  });
});

// Providers Count
(function () {
  const toggle = document.querySelector('[data-active-providers]');
  const dropdown = toggle?.closest('.w-dropdown');
  if (!dropdown || !toggle) return;

  function updateLabel() {
    const items = dropdown.querySelectorAll('.models_sort-dropdown-item');
    if (!items.length) return;

    const firstItem = items[0];
    const otherItems = Array.from(items).slice(1);
    const activeCount = otherItems.filter(function (item) {
      return item.classList.contains('is-active');
    }).length;

    if (activeCount === 0 || firstItem.classList.contains('is-active')) {
      toggle.textContent = 'All providers';
    } else {
      toggle.textContent = activeCount + (activeCount === 1 ? ' provider' : ' providers');
    }
  }

  var observer = new MutationObserver(updateLabel);

  dropdown.querySelectorAll('.models_sort-dropdown-item').forEach(function (item) {
    observer.observe(item, { attributes: true, attributeFilter: ['class'] });
  });

  updateLabel();
})();

// Models Providers
$(function () {
  var batchSize = 10;
  var delay = 300;
  var cache = {}; // href -> { count, hasProviderPage }
  var seen = new WeakSet(); // items we've already handled

  function applyResult($item, result) {
    if (result.count > 0) {
      $item.find('[data-label]').text(result.count + ' models').css('opacity', 1);
    }
    if (!result.hasProviderPage) {
      $item.closest('.w-dyn-item').css('pointer-events', 'none');
      $item.find('a').remove();
    }
  }

  function processItem($item) {
    var el = $item[0];
    if (!el || seen.has(el)) return;
    seen.add(el);

    var href = $item.find('a').attr('href');
    if (!href) return;

    if (cache[href]) {
      applyResult($item, cache[href]);
      return;
    }

    return $.ajax({ url: href, method: 'GET' })
      .then(function (html) {
        var $page = $(html);
        cache[href] = {
          count: $page.find('[data-model-reference]').length,
          // [data-provider-page] sits on .page-wrapper (a body child), which is a
          // root in the parsed collection — .find() searches descendants only,
          // so check both the roots (.filter) and their descendants (.find).
          hasProviderPage:
            $page.filter('[data-provider-page]').length +
              $page.find('[data-provider-page]').length >
            0,
        };
        applyResult($item, cache[href]);
      })
      .catch(function () {});
  }

  function runBatch(items, index) {
    if (index >= items.length) return;

    var batch = items.slice(index, index + batchSize);
    var promises = batch.map(function (el) {
      return processItem($(el));
    });

    $.when.apply($, promises).always(function () {
      setTimeout(function () {
        runBatch(items, index + batchSize);
      }, delay);
    });
  }

  // Initial pass — whatever's in the DOM right now (originals, plus any clones already created).
  runBatch($('.models-marquee_item').toArray(), 0);

  // Catch clones the marquee library creates later (on init, on resize, etc.).
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        var items =
          node.matches && node.matches('.models-marquee_item')
            ? [node]
            : node.querySelectorAll
            ? Array.from(node.querySelectorAll('.models-marquee_item'))
            : [];
        items.forEach(function (el) {
          processItem($(el));
        });
      });
    });
  });

  document.querySelectorAll('.models-marquee').forEach(function (el) {
    observer.observe(el, { childList: true, subtree: true });
  });
});
