import { initScrollToggle } from './utils/scroll';
import { initNav } from './nav';
import { initCSSMarquee, initAccordionCSS } from './osmo';
import { copyToClipboard } from './utils/copyClipboard';
import { addNoScrollbarClass } from './utils/noScrollbar';
import { initResponsiveDropdowns } from './utils/responsiveDropdowns';
import { initAuthorsTruncate } from './utils/trunscateAuthors';

$(document).ready(function () {
  initScrollToggle();
  initNav();
  initCSSMarquee();
  copyToClipboard();
  addNoScrollbarClass();
  initAccordionCSS();
  initResponsiveDropdowns();
  initAuthorsTruncate();
});
