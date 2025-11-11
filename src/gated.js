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

if ($(gatedContent).text().includes(gateMarker)) {
  $(gatedContent)
    .find('p')
    .each(function () {
      if ($(this).text().trim() === gateMarker) {
        $gateMarkerElement = $(this);
        return false;
      }
    });

  if (gatedContentStorage[articleUrl]) {
    $gateMarkerElement.text('');
    $(gateSection).hide();
    $(gateOverlay).hide();
  } else {
    let $parent = $gateMarkerElement;
    while ($parent.parent()[0] !== $(gatedContent)[0]) {
      $parent = $parent.parent();
    }
    $parent.nextAll().remove();
    $parent.remove();
    $(gateSection).show();
    $(gateOverlay).show();
  }
}

$(`${gateSection} form`).on('submit', function () {
  gatedContentStorage[articleUrl] = true;
  localStorage.setItem(gatedContentItem, JSON.stringify(gatedContentStorage));
  setTimeout(() => location.reload(), 100);
});
