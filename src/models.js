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
  var $items = $('.models-marquee_item');
  var batchSize = 10;
  var delay = 300;

  function processItem($item) {
    var href = $item.find('a').attr('href');
    var $label = $item.find('[data-label]');

    if (href) {
      return $.ajax({
        url: href,
        method: 'GET',
      })
        .then(function (html) {
          var $page = $(html);
          var count = $page.find('[data-model-reference]').length;
          var hasProviderPage = $page.find('[data-provider-page]').length > 0;

          if (count > 0) $label.text(count + ' models');

          if (!hasProviderPage) {
            $item.closest('.w-dyn-item').css('pointer-events', 'none');
            $item.find('a').remove();
          }
        })
        .catch(function () {});
    }
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

  var itemsArray = $items.toArray();
  runBatch(itemsArray, 0);
});
