export function copyToClipboard() {
  const copyToClipboard = (text) => {
    const tempElem = document.createElement('textarea');
    tempElem.value = text;
    document.body.appendChild(tempElem);
    tempElem.select();
    document.execCommand('copy');
    document.body.removeChild(tempElem);
  };

  const getTargetText = ($target) => {
    const $code = $target.find('pre code');
    return $code.length ? $code.text() : $target.text();
  };

  // Attr-driven: [data-copy-wrapper] > [data-copy-trigger] + [data-copy-target]
  $('[data-copy-wrapper]').on('click', function (e) {
    const $wrapper = $(this);
    const $trigger = $wrapper.find('[data-copy-trigger]');

    // If wrapper has its own trigger, only fire on direct click of wrapper
    if ($trigger.length && !$(e.target).closest('[data-copy-trigger]').length && e.target !== this)
      return;

    const $target = $wrapper.find('[data-copy-target]:visible').first();
    if (!$target.length) return;

    copyToClipboard(getTargetText($target));
    $wrapper.addClass('is-copied');
    setTimeout(() => $wrapper.removeClass('is-copied'), 2000);
  });

  // Richtext embeds fallback
  $('.w-richtext .w-embed, [data-rt-embed-type="true"]').on('click', function (e) {
    if (e.target !== this) return;
    const $code = $(this).find('pre code');
    if (!$code.length) return;

    copyToClipboard($code.text());
    $(this).addClass('is-copied');
    setTimeout(() => $(this).removeClass('is-copied'), 2000);
  });
}
