import { initScrollToggle } from './utils/scroll';
import { initNav } from './nav';
import { initCSSMarquee, initAccordionCSS } from './osmo';
import { copyToClipboard } from './utils/copyClipboard';
import { addNoScrollbarClass } from './utils/noScrollbar';
import { initResponsiveDropdowns } from './utils/responsiveDropdowns';
import { initAuthorsTruncate } from './utils/trunscateAuthors';
import { initDayTabs } from './utils/dayTabs';

$(document).ready(function () {
  initScrollToggle();
  initNav();
  initCSSMarquee();
  copyToClipboard();
  addNoScrollbarClass();
  initAccordionCSS();
  // Before dropdowns: the injected day tabs reuse the mobile dropdown wrapper.
  initDayTabs();
  initResponsiveDropdowns();
  initAuthorsTruncate();
});
