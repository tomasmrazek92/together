// --- Swipers Start ---
let windowWidth = window.innerWidth;
// Create an object to hold unique counters for each classSelector.
let uniqueIdCounters = {};
let shouldInitializeImmediately = false; // Add this flag at the top of your function

export const createResponsiveSwiper = (
  componentSelector,
  swiperSelector,
  classSelector,
  options,
  mode
) => {
  // Step 2: Fetch elements by their componentSelector; if none, exit the function
  let elements = $(componentSelector);
  if (elements.length === 0) return;

  // Reset the uniqueIdCounters for this classSelector to 0
  uniqueIdCounters[classSelector] = 0;

  // Step 3: Loop through each matched element
  uniqueIdCounters[classSelector] = uniqueIdCounters[classSelector] || 0;
  elements.each(function () {
    // Generate a unique key for this instance based on the classSelector and a counter
    let uniqueKey = `${classSelector}_${uniqueIdCounters[classSelector]}`;

    // Step 4: Add unique classes to swiper container, arrows and pagination for this instance
    addUniqueClassesToElements(this, swiperSelector, uniqueKey, [
      '.swiper-arrow',
      '.swiper-navigation',
    ]);

    // Step 5: Merge default and passed swiper options
    let swiperOptions = getMergedSwiperOptions(options, uniqueKey);

    // Step 6: Initialize or destroy swipers based on media query and passed mode
    manageSwiperInstance(this, swiperSelector, uniqueKey, classSelector, swiperOptions, mode);

    // Increment unique ID counter for the specific classSelector
    uniqueIdCounters[classSelector]++;
  });
};

// Adds unique classes to swiper and control elements
const addUniqueClassesToElements = (context, swiperSelector, uniqueKey, controlSelectors) => {
  controlSelectors.forEach((selector) => {
    $(context).find(selector).addClass(uniqueKey);
  });
  $(context).find(swiperSelector).addClass(uniqueKey);
};

// Merge default and custom swiper options
const getMergedSwiperOptions = (options, uniqueKey) => {
  return Object.assign({}, options, {
    navigation: {
      prevEl: `.swiper-arrow.prev.${uniqueKey}`,
      nextEl: `.swiper-arrow.next.${uniqueKey}`,
    },
    pagination: {
      el: `.swiper-navigation.${uniqueKey}`,
      type: 'bullets',
      bulletActiveClass: 'w-active',
      bulletClass: 'w-slider-dot',
    },
  });
};

// This function manages Swiper instances: initializing or destroying them based on certain conditions
const manageSwiperInstance = (
  context,
  swiperSelector,
  uniqueKey,
  classSelector,
  swiperOptions,
  mode
) => {
  // Initialize the nested object for storing Swiper instances if it doesn't exist
  swipers[classSelector] = swipers[classSelector] || {};
  swipers[classSelector][uniqueKey] = swipers[classSelector][uniqueKey] || {};

  // Fetch the existing Swiper instance information, if it exists
  let existingInstance = swipers[classSelector][uniqueKey];
  let existingSwiper = existingInstance.swiperInstance;

  // Determine under what conditions the Swiper should be initialized for desktop and mobile
  let shouldInitDesktop = mode === 'desktop' && window.matchMedia('(min-width: 992px)').matches;
  let shouldInitMobile =
    mode === 'mobile' && window.matchMedia('(min-width: 0px) and (max-width: 991px)').matches;
  let shouldInitAll = mode === 'all';

  // Destroy function
  const destroySwiper = () => {
    if (existingInstance.observer) {
      existingInstance.observer.disconnect();
      delete existingInstance.observer;
    }
    if (existingSwiper) {
      existingSwiper.destroy(true, true);
      delete swipers[classSelector][uniqueKey];
      console.log('Swiper destroyed for', swiperSelector, 'with uniqueKey', uniqueKey);
    }
  };

  // Reinitialize function
  const reInitObserver = () => {
    // Disconnect any existing observers
    if (existingInstance.observer) {
      existingInstance.observer.disconnect();
    }

    const swiperElement = $(`${swiperSelector}.${uniqueKey}`)[0];
    if (!$(swiperElement).length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && (shouldInitDesktop || shouldInitMobile || shouldInitAll)) {
          if (!existingSwiper) {
            let swiper = new Swiper(`${swiperSelector}.${uniqueKey}`, swiperOptions);
            swipers[classSelector][uniqueKey] = {
              swiperInstance: swiper,
              mode: shouldInitDesktop ? 'desktop' : shouldInitMobile ? 'mobile' : 'all',
              initialized: true,
            };
            observer.disconnect();
            console.log('Swiper initialized for', swiperSelector, 'with uniqueKey', uniqueKey);
          }
        }
      });
    }, {});

    // Store the observer instance
    swipers[classSelector][uniqueKey].observer = observer;

    // Observe the element
    observer.observe(swiperElement);
  };

  // Check the conditions and either destroy or reinitialize
  if (!shouldInitDesktop && mode === 'desktop') destroySwiper();
  else if (!shouldInitMobile && mode === 'mobile') destroySwiper();
  else if (!shouldInitAll && mode === 'all') destroySwiper();
  else if ((shouldInitDesktop || shouldInitMobile || shouldInitAll) && !existingSwiper) {
    reInitObserver();
  }
};

// Function to initialize swipers from an array of instances
export const runSwipers = (swiperInstances) => {
  swiperInstances.forEach((instance) => {
    createResponsiveSwiper(...instance);
  });
};

export const initSwipers = (swiperInstances, swipersState) => {
  // Load
  runSwipers(swiperInstances);

  // Resize
  window.addEventListener('resize', function () {
    if (window.innerWidth !== windowWidth) {
      windowWidth = window.innerWidth;
      runSwipers(swiperInstances);
    }
  });
};

// Reusable Functions
export const progressLine = (parent, swiper) => {
  $(parent).each(function () {
    let el = $(this);
    let progressLine = el.find('.progress-line');
    let duration = swiper.params.autoplay.delay;
    let index = swiper.realIndex;
    let navigations = el.find('.navigation').find('.progress-bar');

    let bar = navigations.eq(index);
    let line = bar.find(progressLine);

    progressLine.stop().css('width', '0');
    navigations.removeClass('active');

    bar.addClass('active');

    line.animate({ width: '100%' }, duration);
  });
};

export const getSwiperInstance = (classSelector, uniqueKey, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkInstance = () => {
      if (swipers[classSelector] && swipers[classSelector][uniqueKey]) {
        resolve(swipers[classSelector][uniqueKey].swiperInstance);
      } else {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout after ${timeout}ms. Swiper instance not found.`));
        } else {
          setTimeout(checkInstance, 50);
        }
      }
    };

    checkInstance();
  });
};

// --- Swiper Ends ---

// -- Start Text/Code Fuctions ---
// Wrap Letters
export const wrapLetters = (element) => {
  const processNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // Check if the parent node has the "letter" class
      if (!node.parentNode.classList.contains('letter')) {
        const codeText = node.textContent;
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < codeText.length; i++) {
          const span = document.createElement('span');
          span.className = 'letter';
          span.textContent = codeText[i];
          fragment.appendChild(span);
        }

        node.parentNode.replaceChild(fragment, node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName !== 'BR') {
        const childNodes = Array.from(node.childNodes);
        childNodes.forEach(processNode);
      }
    }
  };

  $(element)
    .contents()
    .each(function () {
      processNode(this);
    });
};

const revealLetters = (elements, letterDelay) => {
  const codeTimeline = gsap.timeline(); // create a single timeline for all elements and letters

  let globalLetterIndex = 0; // initialize a global letter index
  // Iterate over each element passed
  $(elements).each((elementIndex, element) => {
    const letters = $(element).find('.letter').not('.line-numbers-row .code-letter');
    const highlights = $(element).find('.word-highlight');

    // Animate each letter in the current element
    letters.each((letterIndex, letter) => {
      codeTimeline.fromTo(
        letter,
        { visibility: 'hidden' },
        { visibility: 'initial' },
        globalLetterIndex * letterDelay,
        '<'
      );
      globalLetterIndex++; // increment the global letter index
    });
    if (highlights.length) {
      const firstHighlight = highlights[0];
      const currentBgColor = window
        .getComputedStyle(firstHighlight)
        .getPropertyValue('background-color');
      const currentBoxShadow = window
        .getComputedStyle(firstHighlight)
        .getPropertyValue('box-shadow');

      const hexToRGBA = (hex, alpha) => {
        const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      const rgbaToTransparent = (rgba) => {
        const rgbaArray = rgba
          .replace(/^rgba?\(/, '')
          .replace(/\)$/, '')
          .split(',');
        return `rgba(${rgbaArray[0]}, ${rgbaArray[1]}, ${rgbaArray[2]}, 0)`;
      };

      const isHex = (color) => /^#(?:[0-9a-f]{3}){1,2}$/i.test(color);

      const initialBackgroundColor = isHex(currentBgColor)
        ? hexToRGBA(currentBgColor, 0)
        : rgbaToTransparent(currentBgColor);

      const initialBoxShadow = currentBoxShadow.replace(/rgba?\([^)]+\)/g, (match) => {
        return isHex(match) ? hexToRGBA(match, 0) : rgbaToTransparent(match);
      });

      Array.from(highlights).forEach((element) => {
        element.style.backgroundColor = initialBackgroundColor;
        element.style.boxShadow = initialBoxShadow;
      });

      codeTimeline.to(
        highlights,
        {
          backgroundColor: currentBgColor,
          boxShadow: currentBoxShadow,
          duration: 0.35,
        },
        '<'
      );
    }
  });
  return codeTimeline;
};

export const copyToClipboard = (text) => {
  const tempElem = document.createElement('textarea');
  tempElem.value = text;
  document.body.appendChild(tempElem);
  tempElem.select();
  document.execCommand('copy');
  document.body.removeChild(tempElem);
};

// --- Text Animations Start ---
// Letter Animation
export const letterAnimation = (elements, letterType) => {
  let letterDelay;
  letterDelay = letterType || 0.01;
  wrapLetters(elements);
  return revealLetters(elements, letterDelay);
};

// CodeAnimation
export const codeAnimation = (className, duration) => {
  const codeBlock = $(className).find('code');
  const lineNumbers = codeBlock.find('.line-numbers-rows').eq(0).clone();
  let letterDelay;
  letterDelay = duration || 0.01;
  codeBlock.find('.line-numbers-rows').remove();
  wrapLetters(codeBlock);
  codeBlock.prepend(lineNumbers);
  return revealLetters(codeBlock, letterDelay);
};

// --- Text Aniomation Ends ---

// --- Navbar ---
let menuOpen = false;
let scrollPosition;

export const disableScroll = () => {
  if (!menuOpen) {
    scrollPosition = $(window).scrollTop();
    $('html, body').scrollTop(0).addClass('overflow-hidden');
  } else {
    $('html, body').scrollTop(scrollPosition).removeClass('overflow-hidden');
  }
  menuOpen = !menuOpen;
};
