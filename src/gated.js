console.log('console');

const articleUrl = window.location.pathname;
const gatedContentItem = 'gatedContent';
const gatedContentStorage = JSON.parse(localStorage.getItem(gatedContentItem) || '{}');
const gateMarker = '{gated-content-start}';
const gateSection = '.section_blog-2-gated';
const gateOverlay = '.blog-2-article_overlay';
const gatedContent = '[data-gated="content"]';
let $gateMarkerElement = $();

console.log('Article URL:', articleUrl);
console.log('Gated storage:', gatedContentStorage);

if ($(gatedContent).text().includes(gateMarker)) {
  console.log('Gate marker found in content');

  $(gatedContent)
    .find('*')
    .each(function () {
      if ($(this).clone().children().remove().end().text().includes(gateMarker)) {
        $gateMarkerElement = $(this);
        return false;
      }
    });

  if (gatedContentStorage[articleUrl]) {
    console.log('User has access - showing full content');
    $gateMarkerElement.text($gateMarkerElement.text().replace(gateMarker, ''));
    $(gateSection).hide();
    $(gateOverlay).hide();
  } else {
    console.log('User needs to gate - hiding content');

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
  console.log('No gate marker found - content is public');
}

$(`${gateSection} form`).on('submit', function (e) {
  e.preventDefault();
  console.log('Form submitted - unlocking content');

  gatedContentStorage[articleUrl] = true;
  localStorage.setItem(gatedContentItem, JSON.stringify(gatedContentStorage));
  console.log('Access saved to localStorage');

  $(gatedContent).find('*').show();
  $gateMarkerElement.text($gateMarkerElement.text().replace(gateMarker, ''));
  console.log('Content shown');

  $(gateSection).hide();
  console.log('Gate removed');
});
