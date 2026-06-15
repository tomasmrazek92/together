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

// Provider dropdown — searchable + collapsible
// Layers on top of Finsweet List without fighting it:
//   • Finsweet owns availability — it sets inline `display:none` on empty-facet
//     providers, and re-renders/reorders the whole facet list when ANOTHER
//     filter changes the available set. We re-init on those structural changes
//     and only ever ADD hiding (a class with !important) — never force-show —
//     so a Finsweet-hidden provider stays hidden even if it matches.
//   • Selection state (the checkmark) is driven by the real checkbox `:checked`.
//   • Reset clears selected providers by clicking each checked box so Finsweet
//     (and Webflow's checkbox) register the change the same as a user click.
$(function () {
  var KEEP = 10; // first N stay as the curated "top providers", untouched
  var HIDE_CLASS = 'is-provider-hidden'; // our own hide — display:none !important
  var MARK_CLASS = 'is-provider-match'; // highlight wrapper around the matched run

  // Scope to the provider dropdown (the one that has the search input).
  var $list = $('.models_sort-dropdown-list')
    .filter(function () {
      return $(this).find('.models_sort-dropdown-input').length > 0;
    })
    .first();
  if (!$list.length) return;

  var $input = $list.find('.models_sort-dropdown-input').first();
  var $close = $list.find('.model_sort-close').first();
  var $action = $list.find('.models_sort-action').first();
  var $actionText = $action.find('.btn-text').first();
  var $cmsList = $list.find('.models_sort-dropdown-cms-list').first();
  if (!$cmsList.length) return;

  var expanded = false; // persists across Finsweet re-inits
  var items = []; // rebuilt by cacheAndSort() from the live DOM
  var overflow = [];
  var structuralObserver, displayObserver, setupTimer, renderTimer, $empty;

  injectStyles();

  // ── helpers ──────────────────────────────────────────────────────────
  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Read the provider name from fs-list-value (clean — never carries our
  // highlight markup), falling back to the visible label text.
  function providerName(el) {
    var input = el.querySelector('input[fs-list-value]');
    var name = input ? input.getAttribute('fs-list-value') : '';
    return (name || $(el).find('.models_sort-dropdown-text').first().text() || '').trim();
  }

  function setHighlight(el, term) {
    var $text = $(el).find('.models_sort-dropdown-text').first();
    if (!term) {
      $text.text(el._provText);
      return;
    }
    var re = new RegExp('(' + escapeRegex(term) + ')', 'ig');
    $text.html(el._provText.replace(re, '<span class="' + MARK_CLASS + '">$1</span>'));
  }

  function isSelected(el) {
    var cb = el.querySelector('input[type="checkbox"]');
    return !!(cb && cb.checked);
  }

  function hasSelected() {
    return items.some(isSelected);
  }

  function renderAction(searching, overflowCount) {
    // Reset wins whenever anything is selected — so you can always clear a
    // selection, even after the search is cleared and the item collapses away.
    if (hasSelected()) {
      $actionText.text('Reset');
      $action.removeClass('is-action-hidden').attr('data-mode', 'reset');
      return;
    }
    if (!searching && !expanded && overflowCount > 0) {
      $actionText.text('Show ' + overflowCount + ' more provider' + (overflowCount === 1 ? '' : 's'));
      $action.removeClass('is-action-hidden').attr('data-mode', 'expand');
      return;
    }
    $action.addClass('is-action-hidden').attr('data-mode', '');
  }

  function render() {
    var term = ($input.val() || '').trim().toLowerCase();
    var searching = term.length > 0;
    var availIndex = 0; // running position among Finsweet-available items (DOM order)
    var visibleCount = 0; // items actually on screen after collapse/search

    items.forEach(function (el) {
      var selected = isSelected(el);
      var fsHidden = el.style.display === 'none'; // Finsweet empty-facet — not available

      // Collapse counts only AVAILABLE providers: the first KEEP available stay
      // visible, the rest are the overflow. So if only 3 are available they all
      // show and there's nothing to "Show more".
      var isOverflow = false;
      if (!fsHidden) {
        isOverflow = availIndex >= KEEP;
        availIndex++;
      }

      // Selected items stay visible regardless of collapse/search.
      var hideByCollapse = !expanded && !searching && isOverflow && !selected;
      var hideBySearch = searching && el._provKey.indexOf(term) === -1 && !selected;
      var hidden = hideByCollapse || hideBySearch;
      $(el).toggleClass(HIDE_CLASS, hidden);
      if (!fsHidden && !hidden) visibleCount++;
      setHighlight(el, searching ? term : '');
    });

    $list.toggleClass('has-query', searching); // drives the close (X) visibility
    if ($empty) $empty.toggle(visibleCount === 0); // empty state when nothing shows
    renderAction(searching, Math.max(0, availIndex - KEEP));
  }

  // (Re)build the cached model from the CURRENT DOM and re-sort the overflow.
  // Idempotent — safe to run on every Finsweet re-render.
  function cacheAndSort() {
    items = $cmsList.children('.w-dyn-item').toArray();
    items.forEach(function (el) {
      el._provText = providerName(el);
      el._provKey = el._provText.toLowerCase();
    });
    // Top KEEP keep their curated order; the remainder is sorted A→Z. (Which
    // items actually show is decided dynamically in render() by availability.)
    overflow = items.slice(KEEP);
    overflow
      .slice()
      .sort(function (a, b) {
        return a._provKey.localeCompare(b._provKey);
      })
      .forEach(function (el) {
        $cmsList.append(el);
      });
  }

  // Full re-init. Disconnect observers first so our own DOM edits (the overflow
  // re-append + highlight innerHTML) never retrigger the observers → no loop.
  function setup() {
    disconnectObservers();
    cacheAndSort();
    render();
    connectObservers();
  }

  function connectObservers() {
    // Structural — Finsweet adds/removes/reorders the facet items when another
    // filter changes the available set. childList WITHOUT subtree, so our own
    // highlight innerHTML (on descendant text nodes) is not seen → no loop.
    structuralObserver.observe($cmsList[0], { childList: true });
    // Display — Finsweet toggles inline display:none on empty facets (async on
    // load + on filter changes). style-only, so our class toggles aren't seen.
    displayObserver.observe($cmsList[0], { attributes: true, attributeFilter: ['style'], subtree: true });
  }

  function disconnectObservers() {
    structuralObserver.disconnect();
    displayObserver.disconnect();
  }

  structuralObserver = new MutationObserver(function () {
    clearTimeout(setupTimer);
    clearTimeout(renderTimer); // a structural setup() supersedes a pending render
    setupTimer = setTimeout(setup, 80);
  });
  displayObserver = new MutationObserver(function () {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(render, 80);
  });

  // Reset = clear selected providers. Click each checked box so Finsweet +
  // Webflow process the toggle-off exactly as a user would (don't pre-uncheck —
  // that would just toggle it back on).
  function resetSelected() {
    $cmsList.find('input[type="checkbox"]').each(function () {
      if (this.checked) this.click();
    });
  }

  // ── events (bound once; targets are stable / delegated) ────────────────
  $input.on('input', render);

  $close.on('click', function () {
    $input.val('');
    render();
    $input.trigger('focus');
  });

  $action.on('click', function () {
    var mode = $action.attr('data-mode');
    if (mode === 'reset') resetSelected();
    else if (mode === 'expand') {
      expanded = true;
      render();
    }
  });

  // Re-render on (de)select so Reset stays available and selected items stay
  // visible even when collapsed. Delegated → survives Finsweet replacing nodes.
  $cmsList.on('change', 'input[type="checkbox"]', render);

  // When the MAIN filter (category tabs) changes, clear the provider selection —
  // a provider picked for one category may not apply to the next. Tied to the
  // category change event (not Finsweet's list rebuild), so selecting a provider
  // — which also rebuilds the list — never wipes its own selection. Run once now
  // (boxes still present this tick) and once after Finsweet rebuilds, to clear
  // any selection that survived the rebuild. resetSelected only clicks checked
  // boxes, so the second pass is a safe no-op when nothing's left.
  $(document).on('change', 'input[fs-list-field="category"]', function () {
    resetSelected();
    setTimeout(resetSelected, 150);
  });

  // Empty state — shown when nothing is visible (search miss, or a category
  // with no providers). Reuses an existing .models_sort-empty if the design has
  // one, else creates a default. Lives OUTSIDE the cms list so toggling it never
  // trips the structural/display observers.
  $empty = $list.find('.models_sort-empty').first();
  if (!$empty.length) {
    $empty = $('<div class="models_sort-empty">No providers found</div>');
    $cmsList.closest('.w-dyn-list').after($empty);
  }
  $empty.hide();

  setup(); // initial build + attach observers

  function injectStyles() {
    if (document.getElementById('provider-search-styles')) return;
    var css =
      '.' + HIDE_CLASS + '{display:none !important;}' +
      // close (X) only while there's a query
      '.models_sort-dropdown-list .model_sort-close{display:none;}' +
      '.models_sort-dropdown-list.has-query .model_sort-close{display:flex;}' +
      // checkmark appears only when the item's checkbox is checked
      '.models_sort-dropdown-item .u-mr-auto{opacity:0;}' +
      '.models_sort-dropdown-item input:checked ~ .u-mr-auto{opacity:1;}' +
      // matched run + clickable action
      '.' + MARK_CLASS + '{font-weight:700;color:var(--shades--black-opacity-40);}' +
      '.models_sort-action{cursor:pointer;}' +
      '.models_sort-action.is-action-hidden{display:none !important;}' +
      // empty state (only styled if we created the default; restyle in Webflow)
      '.models_sort-empty{padding:10px 14px;font-size:12.5px;color:var(--shades--black-opacity-40);}';
    $('head').append('<style id="provider-search-styles">' + css + '</style>');
  }
});
