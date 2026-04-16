export function addNoScrollbarClass() {
  const allElements = document.querySelectorAll('*');

  for (const element of allElements) {
    // Exclude body and html elements
    if (element.tagName.toLowerCase() === 'body' || element.tagName.toLowerCase() === 'html') {
      continue;
    }

    const style = window.getComputedStyle(element);
    if (
      style.overflow === 'auto' ||
      style.overflow === 'scroll' ||
      style.overflowX === 'auto' ||
      style.overflowX === 'scroll' ||
      style.overflowY === 'auto' ||
      style.overflowY === 'scroll'
    ) {
      // Disable Scrollbar
      element.setAttribute('no-scrollbar', 'true');
      // Fix for inner scroll inside swipers
      element.classList.add('swiper-no-swiping');
    }
  }
}
