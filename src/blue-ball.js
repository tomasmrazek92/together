// Inject the ball
$('body').append('<div id="follow-bubble"><span class="heading-style-h8">View</span></div>');

// Blue logic
const BLOG_ITEM_SELECTOR = '.list-b.w-dyn-items .w-dyn-item';
const LINE_LEFT_OFFSET = 140;
const BUBBLE_SIZE = 196;
const fromHTML = (html, trim = true) => {
  // Process the HTML string.
  html = trim ? html.trim() : html;
  if (!html) return null;

  // Then set up a new template element.
  const template = document.createElement('template');
  template.innerHTML = html;
  const result = template.content.children;

  // Then return either an HTMLElement or HTMLCollection,
  // based on whether the input HTML had one or more roots.
  if (result.length === 1) return result[0];
  return result;
};

const EDGE_WARP_OFFSET = 170;
const MAX_LINE_RANGE = 64;

const bubbleEl = document.getElementById('follow-bubble');

/* active section state */
let activeBlogSection = null;

/* cursor state */
let scrollPosition = [0, 0];
const setCursorPosition = (e) => {
  if (e.clientX && e.clientY) {
    // keeping mouse position in memory because we don't receive it during scroll
    scrollPosition = [e.clientX, e.clientY];
  }
};

/* line utilites */
const getSvgLinesOfEl = (blogSection) => {
  const svgLineTop = blogSection.querySelector('.blog-item-line-path');
  const svgLineBottom = blogSection.nextElementSibling?.querySelector('.blog-item-line-path');

  return {
    top: svgLineTop,
    bottom: svgLineBottom,
  };
};

const resetSvgLinesOfEl = (blogSection) => {
  if (blogSection) {
    const { top, bottom } = getSvgLinesOfEl(blogSection);
    if (top) {
      top.setAttribute('d', dCurve(32));
    }
    if (bottom) {
      bottom.setAttribute('d', dCurve(32));
    }
  }
};

const getBlogItemMidpoint = (blogItem) => {
  const blogItemRect = blogItem.getBoundingClientRect();
  const blogItemHead = blogItem.querySelector('.list-b_head');
  const blogItemHeadRect = blogItemHead.getBoundingClientRect();
  const lineMidpoint = (blogItemHeadRect.width - LINE_LEFT_OFFSET) / 2;
  return lineMidpoint;
};

const setActiveSection = () => {
  const pointElement = document.elementFromPoint(...scrollPosition);
  if (pointElement) {
    const blogItemElement = pointElement.closest(BLOG_ITEM_SELECTOR);
    if (blogItemElement) {
      if (blogItemElement !== activeBlogSection) {
        resetSvgLinesOfEl(activeBlogSection);
        activeBlogSection = blogItemElement;
      }
    } else {
      resetSvgLinesOfEl(activeBlogSection);
      activeBlogSection = null;
    }
  }

  if (activeBlogSection === null) {
    bubbleEl.style.opacity = 0;
    bubbleEl.style.transform = 'scale(0.8)';
  }
};

const reposition = (e) => {
  if (window.innerWidth < 992) {
    bubbleEl.style.opacity = 0;
    bubbleEl.style.transform = 'scale(0.8)';
    return;
  }

  setCursorPosition(e);
  setActiveSection();

  if (activeBlogSection) {
    const containerRect = activeBlogSection.getBoundingClientRect();

    const cursorPositionWithinContainer = scrollPosition[1] - containerRect.top;

    const cursorPositionRelative = cursorPositionWithinContainer / containerRect.height;

    // top line curving
    const positionRelativeTop =
      Math.min(cursorPositionWithinContainer, EDGE_WARP_OFFSET) / EDGE_WARP_OFFSET;
    const curvePositionTop = Math.round(Math.min(positionRelativeTop, 0.5) * MAX_LINE_RANGE);

    const svgLineTop = activeBlogSection.querySelector('.blog-item-line-path');
    svgLineTop.setAttribute('d', dCurve(curvePositionTop));

    // bottom line curving

    const positionRelativeBottom =
      Math.min(Math.abs(cursorPositionWithinContainer - containerRect.height), EDGE_WARP_OFFSET) /
      EDGE_WARP_OFFSET;

    const curvePositionBottom = Math.round(
      (1 - Math.min(positionRelativeBottom, 0.5)) * MAX_LINE_RANGE
    );

    const svgLineBottom =
      activeBlogSection.nextElementSibling?.querySelector('.blog-item-line-path');
    if (svgLineBottom) {
      svgLineBottom.setAttribute('d', dCurve(curvePositionBottom));
    }

    const extraOffset = (cursorPositionRelative - 0.5) * 30;

    // horizontal position
    const blogItemMidpoint = getBlogItemMidpoint(activeBlogSection);

    document
      .querySelectorAll('.blog-item-line')
      .forEach((item) => (item.style.left = `${blogItemMidpoint + LINE_LEFT_OFFSET}px`));

    bubbleEl.style.left = `${
      containerRect.left + blogItemMidpoint + LINE_LEFT_OFFSET - BUBBLE_SIZE / 2 + 2
    }px`;
    bubbleEl.style.top = `${
      scrollPosition[1] - BUBBLE_SIZE * cursorPositionRelative + extraOffset
    }px`;

    setTimeout(() => {
      bubbleEl.style.opacity = 1;
      bubbleEl.style.transform = 'scale(1)';
    }, 100);
  }
};

/**
 * Initialize
 */

document.addEventListener('mousemove', reposition);
document.addEventListener('scroll', reposition);
document.addEventListener('resize', reposition);

const dCurve = (yPosition) =>
  `M0 32C100 32 125 ${yPosition} 200 ${yPosition}C275 ${yPosition} 300 32 400 32`;

const initializeHoverItems = () => {
  const hoverItems = document.querySelectorAll(BLOG_ITEM_SELECTOR);

  hoverItems.forEach((blogItem) => {
    const svgLine = fromHTML(`
<svg
class="blog-item-line"
width="400"
height="64"
viewBox="0 0 400 64"
fill="var(--light-gray)"
xmlns="http://www.w3.org/2000/svg"
>
<rect width="100%" height="100%" fill="var(--light-gray)"/>
<path
class="blog-item-line-path"
d="M0 32C100 32 100 32 200 32C300 32 300 32 400 32"
stroke="var(--medium-gray)"
/>
  </svg>`);
    blogItem.appendChild(svgLine);
  });
};

// Init
initializeHoverItems();

window.fsAttributes = window.fsAttributes || [];
window.fsAttributes.push([
  'cmsload',
  (listInstances) => {
    console.log('cmsload Successfully loaded!');

    // The callback passes a `listInstances` array with all the `CMSList` instances on the page.
    const [listInstance] = listInstances;

    // The `renderitems` event runs whenever the list renders items after switching pages.
    listInstance.on('renderitems', (renderedItems) => {
      initializeHoverItems();
    });
  },
]);
