const articleUrl = window.location.pathname;
const gatedContentItem = 'gatedContent';
const gatedContentStorage = JSON.parse(localStorage.getItem(gatedContentItem) || '{}');
const gateMarker = '{gated-content-start}';
const gateSection = '.section_blog-2-gated';
const gateOverlay = '.blog-2-article_overlay';
const gatedContent = '[data-gated="content"]';
let $gateMarkerElement = $();

// Read Time
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

    console.log(allText);

    const wordsCount = (allText.match(/[\w\d''-]+/gi) || []).length;
    const readTime = wordsCount / wpm;

    $timeElement.text(!decimals && readTime < 0.5 ? '1' : readTime.toFixed(decimals));
  });
}
initReadTime();

if ($(gatedContent).text().includes(gateMarker)) {
  $(gatedContent)
    .find('*')
    .each(function () {
      if ($(this).clone().children().remove().end().text().includes(gateMarker)) {
        $gateMarkerElement = $(this);
        return false;
      }
    });

  if (gatedContentStorage[articleUrl]) {
    $gateMarkerElement.text($gateMarkerElement.text().replace(gateMarker, ''));
    $(gateSection).hide();
    $(gateOverlay).hide();
  } else {
    let hideNext = false;
    $(gatedContent)
      .find('*')
      .each(function () {
        if ($(this).is($gateMarkerElement)) {
          hideNext = true;
          $(this).hide();
          return;
        }
        if (hideNext && !$.contains($gateMarkerElement[0], this)) {
          $(this).hide();
        }
      });

    $(gateSection).show();
    $(gateOverlay).show();
  }
} else {
}

$(`${gateSection} form`).on('submit', function (e) {
  e.preventDefault();

  gatedContentStorage[articleUrl] = true;
  localStorage.setItem(gatedContentItem, JSON.stringify(gatedContentStorage));

  $(gatedContent).find('*').show();
  $gateMarkerElement.text($gateMarkerElement.text().replace(gateMarker, ''));

  $(gateSection).hide();
});
