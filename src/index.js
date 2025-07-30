import {
  codeAnimation,
  copyToClipboard,
  disableScroll,
  initSwipers,
  letterAnimation,
  progressLine,
  wrapLetters,
} from './utils/globalFunctions';

$(document).ready(function () {
  // #region -------------- Global Functions
  function toggleTextContent(el, show = true) {
    $(el).css('opacity', show ? '1' : '0');
  }

  // --- Make the external links open in new tab
  $(document.links)
    .filter(function () {
      return this.hostname !== window.location.hostname;
    })
    .attr('target', '_blank');

  // --- Scroll to the note
  let colorTimeout;
  $('sup').on('click', function () {
    let indexText = $(this).text();

    let targetElement = $('#footer-notes')
      .find(`li`)
      .eq(indexText - 1);

    if (targetElement.length > 0) {
      // scroll
      let topOffset = targetElement.offset().top - $(window).height() / 2;
      $('html, body').animate({ scrollTop: topOffset }, 500);

      // highlight
      targetElement.css('color', 'var(--charcoal)');

      // remove highlight
      clearTimeout(colorTimeout);
      colorTimeout = setTimeout(() => {
        targetElement.removeAttr('style');
      }, 5000);
    }
  });

  // --- Hide Scrollbar
  function addNoScrollbarClass() {
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
        element.classList.add('no-scrollbar');
        // Fix for inner scroll inside swipers
        element.classList.add('swiper-no-swiping');
      }
    }
  }
  addNoScrollbarClass();

  // --- Copy code inside blog articles
  $('.w-richtext .w-embed pre').on('click', function () {
    let codeToCopy = $(this).find('code').text();
    copyToClipboard(codeToCopy);
  });

  // --- Open Modal
  let modal = $('.video_modal');
  let video = modal.find('video');
  $('[open-modal="true"]').on('click', function () {
    modal.fadeIn();
    playModalVideo(video, true);
  });
  $('.video_modal-trigger, .video_close-modal').on('click', () => {
    modal.fadeOut();
    playModalVideo(video, false);
  });

  function playModalVideo(video, state) {
    if (video.length) {
      // Check if the video is already playing
      if (!video.get(0).paused) {
        video.get(0).pause();
        video.get(0).currentTime = 0;
      } else if (state) {
        video.get(0).play();
      }
    }
  }

  /* Logos Carousel
  class CircularArray {
    constructor(array, windowSize, step) {
      this.array = array;
      this.windowSize = windowSize;
      this.step = step;
      this.currentIndex = 0;
    }

    getNextWindow() {
      const result = [];
      for (let i = 0; i < this.windowSize; i++) {
        result.push(this.array[(this.currentIndex + i) % this.array.length]);
      }
      this.currentIndex = (this.currentIndex + this.step) % this.array.length;
      return result;
    }
  }

  class LogoCarousel {
    constructor(options = {}) {
      this.sourceSelector = options.sourceSelector || '#logos-source img';
      this.topSelector = options.topSelector || '.hp-logos_box.top';
      this.bottomSelector = options.bottomSelector || '.hp-logos_box.bottom';
      this.windowSize = options.windowSize || 8;
      this.step = options.step || 4;
      this.duration = options.duration || 0.5;
      this.stagger = options.stagger || 0.1;
      this.delay = options.delay || 3;
      this.repeatDelay = options.repeatDelay || 3;
      this.ease = options.ease || 'power1.Out';

      this.imgArray = [];
      this.circularArray = null;
      this.timeline = null;

      this.init();
    }

    init() {
      if (!$(this.sourceSelector).length) {
        return;
      }

      this.loadImages();
      this.setupCircularArray();
      this.setupTimeline();
    }

    loadImages() {
      $(this.sourceSelector).each((index, img) => {
        this.imgArray.push($(img).attr('src'));
      });
    }

    setupCircularArray() {
      this.circularArray = new CircularArray(this.imgArray, this.windowSize, this.step);
    }

    displayNextWindow() {
      let newArr = this.circularArray.getNextWindow();

      $(this.topSelector).each((index, el) => {
        $(el).css('background-image', `url("${newArr[index]}")`);
      });

      $(this.bottomSelector).each((index, el) => {
        $(el).css('background-image', `url("${newArr[index + 4]}")`);
      });
    }

    setupTimeline() {
      this.timeline = gsap.timeline({
        delay: this.delay,
        onRepeat: () => this.displayNextWindow(),
        repeat: -1,
        repeatDelay: this.repeatDelay,
      });

      this.timeline
        .to(this.topSelector, {
          yPercent: -100,
          duration: this.duration,
          stagger: this.stagger,
          ease: this.ease,
        })
        .to(
          this.bottomSelector,
          {
            yPercent: -100,
            duration: this.duration,
            stagger: this.stagger,
            ease: this.ease,
          },
          0
        );
    }

    play() {
      this.timeline?.play();
    }

    pause() {
      this.timeline?.pause();
    }

    restart() {
      this.timeline?.restart();
    }

    destroy() {
      this.timeline?.kill();
    }
  }

  $(document).ready(() => {
    const logoCarousel = new LogoCarousel({
      windowSize: 8,
      step: 4,
      duration: 0.5,
      stagger: 0.1,
      delay: 3,
      repeatDelay: 3,
    });

    if ($(logoCarousel.sourceSelector).length) {
      logoCarousel.displayNextWindow();
    }
  });
  */

  // #endregion

  // #region -------------- Menu
  $('.navbar_button').on('click', function () {
    disableScroll();
  });

  // --- Dropdown Click
  $('.navbar .tab').on('click', function () {
    if (window.innerWidth <= 991) {
      $('.navbar_button').trigger('tap');
    }
  });

  // Respo Dropdown
  const handleDropdownObserver = () => {
    if (window.innerWidth <= 991) {
      const observer = new MutationObserver(() => {
        const hasOpenDropdown = document.querySelector('.nav_dropdown .dropdown.w--open');
        const navbarMenu = document.querySelector('.navbar_menu');

        if (navbarMenu) {
          if (hasOpenDropdown) {
            navbarMenu.style.overflow = 'hidden';
            navbarMenu.scrollTop = 0;
          } else {
            navbarMenu.style.overflow = '';
          }
        }
      });

      document.querySelectorAll('.nav_dropdown .dropdown').forEach((dropdown) => {
        observer.observe(dropdown, {
          attributes: true,
          attributeFilter: ['class'],
        });
      });

      window.dropdownObserver = observer;
    } else {
      if (window.dropdownObserver) {
        window.dropdownObserver.disconnect();
        window.dropdownObserver = null;
      }
      const navbarMenu = document.querySelector('.navbar_menu');
      if (navbarMenu) {
        navbarMenu.style.overflow = '';
      }
    }
  };

  handleDropdownObserver();
  $(window).on('resize', handleDropdownObserver);

  // --- Menu Color Change
  updateNav();
  $(window).on('scroll', updateNav);

  function updateNav() {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const offset = 10 * rootFontSize;
    const windowTop = $(window).scrollTop();
    const elems = $('.navbar_wrapper');
    let shouldAddClass = false;

    $('.background-color-charcoal').each(function () {
      const elementTop = $(this).offset().top;
      const elementHeight = $(this).height();

      const elementBottom = elementTop + elementHeight;
      if (elementBottom >= windowTop + offset && elementTop <= windowTop + offset) {
        shouldAddClass = true;
        return false;
      }
    });

    if (shouldAddClass && !elems.hasClass('background-color-charcoal')) {
      elems.addClass('background-color-charcoal');
    } else if (!shouldAddClass && elems.hasClass('background-color-charcoal')) {
      elems.removeClass('background-color-charcoal');
    }
  }

  // --- Add Border to Navbar
  $(window).on('scroll load', function () {
    var scroll = $(window).scrollTop();
    var element = $('.navbar');
    var classAdd = 'sticky';
    //console.log(scroll);
    if (scroll >= 100) {
      if (!element.hasClass(classAdd)) {
        //console.log('a');
        element.addClass(classAdd);
      }
    } else {
      //console.log('a');
      element.removeClass(classAdd);
    }
  });

  // -- Sub Nav Scroll
  function scrollToCurrent() {
    var container = $('.sub-navbar_pill');
    var currentElement = container.find('.navbar_link.w--current');

    if (currentElement.length) {
      var containerOffset = container.offset().left;
      var currentElementOffset = currentElement.offset().left;
      var scrollLeftPos = container.scrollLeft() + (currentElementOffset - containerOffset);

      // Animate the scroll position of the container
      container.animate(
        {
          scrollLeft: scrollLeftPos,
        },
        500
      );
    }
  }

  // Setup a mutation observer to watch for changes in the active class
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.attributeName === 'class') {
        var target = $(mutation.target);
        if (target.hasClass('w--current')) {
          scrollToCurrent();
        }
      }
    });
  });

  // Options for the observer (which mutations to observe)
  var config = { attributes: true, childList: false, subtree: false };

  // Select the target nodes to observe
  $('.navbar_link').each(function () {
    observer.observe(this, config);
  });

  // Call initially to ensure the current element is in view on load
  setTimeout(() => {
    scrollToCurrent();
  }, 300);

  // Dropdowns
  $(document).ready(function () {
    // Label Click
    $('.dropdown-inner_respo-label').on('click', function () {
      let dropdown = $(this).closest('.w-dropdown');
      dropdown.trigger('w-close');
    });

    const targetElement = document.querySelector('.nav_dropdown .w-dropdown-toggle');

    if (targetElement) {
      const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.attributeName === 'class') {
            const currentClassState = $(targetElement).hasClass('w--open');

            if (currentClassState) {
              // $('.navbar_menu').css('overflow', 'hidden');
            } else {
              // $('.navbar_menu').css('overflow', 'auto');
            }
          }
        });
      });

      observer.observe(targetElement, { attributes: true });
    }
  });

  // Banner Notification
  $(document).ready(function () {
    const $links = $('.subnav_link');
    let currentIndex = 0;

    function activateLink(index) {
      $links.addClass('inactive').removeClass('active');
      $links.eq(index).removeClass('inactive').addClass('active');

      currentIndex = (currentIndex + 1) % $links.length;

      setTimeout(function () {
        activateLink(currentIndex);
      }, 3000);
    }

    activateLink(currentIndex);
  });

  // #endregion

  // #region -------------- Wrap Output Text
  $('[output-text]').each(function () {
    wrapLetters($(this));
    toggleTextContent($(this));
  });
  // #endregion

  // #region -------------- FAQs
  let faqItem = $('[faq-item]');
  // --- Faq Items
  faqItem.click(function () {
    const $this = $(this);
    const isOpen = $this.hasClass('open');

    // Open this item if it was not open
    if (!isOpen) {
      $this.closest('section').find(faqItem).filter('.open').click().removeClass('open');
      $this.addClass('open');
    } else {
      $this.removeClass('open');
    }
  });

  // --- Show first open by default
  faqItem.each(function () {
    let status = $(this).attr('expand-default');
    if (status === 'true') {
      $(this).trigger('click');
    }
  });
  // #endregion

  // #region -------------- Autoplaying Tabs
  function initAutoplayTabs(items) {
    $(items).each(function () {
      const el = $(this);

      // Elements
      const tabItems = $('.swiper-slide');
      const tabLinks = $('.autotabs_link');
      const content = $('.autotabs_content-item');
      const progressline = $('.progress-line');
      const activeClass = 'is-active';
      const duration = 11000;

      // Variables
      let tabLoops;
      let initializedMap = new Map();
      let shouldAnimate = true;
      let isObserving = false;

      // --- Swiper
      function getTabSwiperInstance() {
        return [
          [
            '.autotabs_wrap',
            '.autotabs_menu',
            'auto-tabs',
            {
              slidesPerView: 'auto',
              spaceBetween: 40,
              on: {
                init: (swiper) => {
                  updateTab($(swiper.el).closest('.autotabs_wrap'), swiper.realIndex);
                },
                beforeTransitionStart: (swiper) => {
                  if (swiper.realIndex === swiper.slides - 1) {
                    swiper.slideTo(0);
                    updateTab($(swiper.el).closest('.autotabs_wrap'), swiper.realIndex);
                  }
                },
                slideChange: (swiper) => {
                  updateTab($(swiper.el).closest('.autotabs_wrap'), swiper.realIndex);
                },
              },
            },
            'mobile',
          ],
        ];
      }

      // Tabs Logic
      function switchTab(parent, currentIndex) {
        // In case
        if (!shouldAnimate) return;

        // Get what index is next tab
        let nextIndex = (currentIndex + 1) % $(parent).find(tabItems).length;

        // Update the tab after the duration to create autoplay
        tabLoops = setTimeout(() => {
          // Update the tab
          updateTab($(parent), nextIndex);

          // Call the same function for looping
          switchTab($(parent), nextIndex);
        }, duration);
      }

      // Tabs Updating
      function updateTab(parent, index, event = null) {
        const skipTriggerProgress = event && event.type === 'click';

        // -- Cleaning part
        resetTabs($(parent));

        // -- Update part
        const tabToActivate = $(parent).find(tabItems).eq(index).find(tabLinks);
        const contentToActive = $(parent).find(content).eq(index);

        // Add active class
        tabToActivate.addClass(activeClass);

        // Play video is exists
        if (contentToActive.find('video').length) {
          let videoElem = contentToActive.find('video').get(0); // Get the native HTMLVideoElement
          // Check for load state
          if (videoElem.readyState >= 3) {
            // Check if it's already loaded
            videoElem.currentTime = 0; // Revert the time to 0
            videoElem.play(); // Play the video
          } else {
            videoElem.addEventListener('loadeddata', function () {
              videoElem.currentTime = 0; // Revert the time to 0
              videoElem.play(); // Play the video
            });
          }
        }

        // Fade in the tab
        contentToActive
          .stop()
          .css('display', 'flex')
          .fadeIn(function () {
            contentToActive.css('opacity', '1');
            // Animate Output
            if (contentToActive.find('.chat-conv_box').length) {
              animateOutput($(parent), index);
            } else if (contentToActive.find('.code-box').length) {
              animateCode($(contentToActive));
            }
          });

        if (!skipTriggerProgress) {
          triggerProgress(tabToActivate);
        }
      }

      // Init tabs
      function initTabs(parent) {
        // In case the tabs are already running
        const element = parent.get(0);
        if (initializedMap.get(element)) return;

        shouldAnimate = true;
        initializedMap.set(element, true);
        const initialIndex = 0;
        updateTab($(parent), initialIndex);
        switchTab($(parent), initialIndex);
      }

      // Animation Logic
      function triggerProgress(el) {
        el.find(progressline).animate({ width: '100%' }, duration);
      }

      // Typing logic
      let outputInstance;
      function animateOutput(parent, index) {
        if (outputInstance) {
          outputInstance.kill(); // Kill previous GSAP animation
        }

        let el = $(parent).find(content).eq(index);
        let inputText = el.find('[input-text]');
        let outputText = el.find('[output-text]');

        inputText.stop().animate({ opacity: 1 }, function () {
          setTimeout(() => {
            outputInstance = letterAnimation(outputText, 2 / outputText.text().length);
          }, 250);
        });
      }

      let codeInstance;
      function animateCode(parent) {
        let codeLength = $(parent).find('code').text().length;
        if (codeInstance) {
          codeInstance.kill(); // Kill previous GSAP animation
        }
        codeInstance = codeAnimation(parent, 2 / codeLength);
      }

      // Killing logic
      function killAll(parent) {
        const element = parent.get(0);
        stopAnimation($(parent));
        initializedMap.set(element, false); // Mark as uninitialized
      }
      function stopAnimation(parent) {
        shouldAnimate = false;
        clearTimeout(tabLoops);
        resetTabs(parent);
        $(parent).find(content).eq(0).show();
      }
      function resetTabs(parent) {
        $(parent).find(tabLinks).filter(`.${activeClass}`).removeClass(activeClass);
        $(parent).find(progressline).stop(true, true).css('width', '0%');
        $(parent).find(content).hide();
        $(parent).find(content).find('.letter').css('visibility', 'hidden');
        toggleTextContent($(parent).find(content).find('[input-text]'), false);
      }

      let currentWidth = $(window).width();
      let prevWidth = null; // Initialize prevWidth to null

      let elementObserverMap = new Map(); // Map to hold element-observer pairs

      function handleInstence(parent) {
        const element = parent.get(0);
        let isInitialized = initializedMap.get(element) || false;

        let currentWidth = $(window).width();

        if (currentWidth !== prevWidth) {
          prevWidth = currentWidth;

          // Always kill for mobile regardless of observer
          if (currentWidth <= 991) {
            if (isInitialized) {
              killAll(parent);
            }
          } else {
            // Initiate observer for desktop to defer initTabs
            initObserverForDesktop(parent);
          }
        }
      }

      function initObserverForDesktop(elements) {
        // Disconnect and remove any existing observers
        elements.each(function () {
          const element = $(this);
          if (elementObserverMap.has(element[0])) {
            elementObserverMap.get(element[0]).disconnect();
            elementObserverMap.delete(element[0]);
          }
        });

        // Initialize new observers
        elements.each(function () {
          const element = $(this);

          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                const element = entry.target;
                let isInitialized = initializedMap.get(element) || false;
                if (entry.isIntersecting) {
                  if (entry.isIntersecting && !isInitialized) {
                    initTabs($(entry.target));
                  }
                  // Disconnect only the observer for this element
                  if (elementObserverMap.has(entry.target)) {
                    elementObserverMap.get(entry.target).disconnect();
                    elementObserverMap.delete(entry.target);
                  }
                }
              });
            },
            {
              root: null,
              rootMargin: '0px',
              threshold: 0.5,
            }
          );

          observer.observe(element[0]);
          elementObserverMap.set(element[0], observer);
        });
      }

      // Initialize
      handleInstence(el); // Assume el is the jQuery object containing the element you want to observe
      initSwipers(getTabSwiperInstance(el));

      // Resize
      $(window).on('resize', () => {
        handleInstence(el);
      });

      // Click event
      el.find(tabItems).on('click', function (event) {
        if ($(window).width() >= 992) {
          stopAnimation(el);
          updateTab(el, $(this).index(), event);
        }
      });
    });
  }

  // --- Run the Autotabs
  initAutoplayTabs($('.autotabs_wrap'));

  // --- Copy Tabs Content
  $('.chat-conv_copy-icon').on('click', function () {
    let tab = $(this).closest('.chat-conv').length
      ? $(this).closest('.chat-conv')
      : $(this).closest('.code-box');

    let textToCopy =
      tab.find('[input-text]').text() ||
      tab.find('[output-text]').text() ||
      tab.find('.code-box_code').text();
    textToCopy && copyToClipboard(textToCopy);
  });
  // #endregion

  // #region -------------- Pill Sections
  $('.pill-header').each(function () {
    let main = gsap.timeline({
      defaults: {
        ease: 'power4.out',
      },
      paused: true,
      scrollTrigger: {
        trigger: $(this),
        start: 'center bottom',
      },
    });
    main.add(typeCallout($(this)));
  });

  function typeCallout(parent) {
    let pills = $(parent).find('.pill-a, .pill-b, .pill-circle, .callout_p');
    let tl = gsap.timeline({
      defaults: {
        ease: 'power4.out',
        duration: 0.4,
      },
    });

    pills.each(function () {
      let element = $(this);
      let elClass = element.attr('class').split(' ')[0];
      let text = element.find('div[class*="text"]');

      if (elClass === 'pill-a' || elClass === 'pill-b') {
        tl.fromTo(element.find('[mask]'), { xPercent: -100 }, { xPercent: 0 }, '>-0.2');
        if (element.attr('direction') === 'vertical') {
          tl.fromTo(text, { yPercent: 150 }, { yPercent: 0 }, '>-0.2');
        } else {
          tl.fromTo(text, { xPercent: -110 }, { xPercent: 0 }, '>-0.2');
        }
      } else if (elClass === 'callout_p') {
        tl.add(letterAnimation(element, 0.02), '>-0.2');
      } else if (elClass === 'pill-circle') {
        tl.fromTo(element, { scale: 0 }, { scale: 1, duration: 0.5 }, '>-0.3');
      }

      tl.add(tl, '-=0.2');
    });

    return tl;
  }
  // #endregion

  // #region -------------- FIlters
  $("input[type='radio'][name='filter']").change(function () {
    const section = $(this).closest('section');

    // Remove 'active' class from all labels in this section
    section.find("[fs-cmsfilter-element='clear']").removeClass('fs-cmsfilter_active');

    // Add 'active' class to the parent label of the checked radio button in this section
    section
      .find("input[type='radio'][name='filter']:checked")
      .closest("[fs-cmsfilter-element='clear']")
      .addClass('fs-cmsfilter_active');
  });

  function toggleDropdown(el) {
    $(el).toggleClass('open');
  }

  // --- Open Click
  $('.filters')
    .find('.button')
    .on('click', function () {
      let filter = $(this).closest('.filters').find('.filters-block');
      toggleDropdown(filter);
    });

  // --- Outside Click
  $(document).on('click', function (e) {
    if (
      $(e.target).closest('.filters').length === 0 ||
      $(e.target).closest('.filters-menu').length >= 1
    ) {
      toggleDropdown($('.filters-block.open'));
    }
  });

  // --- Tab Click
  $('.filters .tab').on('click', function () {
    let text = $(this).text();
    $(this).closest('.filters').find('.button').find('div').eq(0).text(text);
  });
  // #endregion

  // #region -------------- Swipers
  const visitedCookie = document.cookie
    .split(';')
    .find((cookie) => cookie.trim().startsWith('visited='));
  const isFirstVisit = !visitedCookie;

  if (isFirstVisit) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    document.cookie = `visited=true; expires=${expiryDate.toUTCString()}; path=/`;
  } else {
    $('.swiper-slide.hp-slider').first().attr('data-swiper-autoplay', '8000');
  }

  const swiperInstances = [
    // HP Hero
    [
      '.section_hp-hero',
      '.hp-hero_slider',
      'hp-hero',
      {
        slidesPerView: 1,
        spaceBetween: 40,
        effect: 'fade',
        fadeEffect: {
          crossfade: true,
        },
        keyboard: {
          enabled: true,
        },
        loop: true,
        autoplay: {
          delay: 8000,
          disableOnInteraction: false,
          waitForTransition: false,
        },
        pagination: {
          el: `.hp-hero_pagination`,
          type: 'bullets',
          bulletActiveClass: 'is-active',
          bulletClass: 'hp-hero_pagination-dot',
          clickable: true,
        },
        on: {
          init(swiper) {},
          autoplay() {
            const $activeDot = $('.hp-hero_pagination-dot');
            if ($activeDot.length) {
              $activeDot.css('--progress', 0);
            }
          },
          slideChange(swiper) {
            const $currentSwiper = $(swiper.wrapperEl);
            const isInView =
              $currentSwiper.offset().top < $(window).scrollTop() + $(window).height() &&
              $currentSwiper.offset().top + $currentSwiper.height() > $(window).scrollTop();

            if (isInView) {
              let activeSlide = $(swiper.slides).eq(swiper.activeIndex);
              let theme = activeSlide.attr('data-swiper-theme');
              let nav = $('.navbar_wrapper ');

              nav.attr('data-nav-theme', theme);
            }
          },
          autoplayTimeLeft(s, time, progress) {
            const $activeDot = $('.hp-hero_pagination-dot.is-active');
            if ($activeDot.length) {
              $activeDot.css('--progress', 1 - progress);
            }
          },
        },
      },
      'desktop',
    ],
    // Case Study
    [
      '.section_case-quote',
      '.case-quote_slider',
      'case-study',
      {
        slidesPerView: 1,
        spaceBetween: 40,
        effect: 'creative',
        creativeEffect: {
          prev: {
            translate: [0, 0, -400],
          },
          next: {
            translate: ['100%', 0, 0],
          },
        },
        loop: true,
        on: {
          init: (swiper) => {
            let visuals = $('.case-quote_image');
            let activeVisual = visuals.eq(swiper.realIndex);
            if (activeVisual.find('video').length) {
              playCSVideo(activeVisual);
            }
            progressLine($('.section_case-quote'), swiper);
          },
          slideChange: (swiper) => {
            let visuals = $('.case-quote_image');
            let activeVisual = visuals.eq(swiper.realIndex);
            visuals.hide();
            visuals.stop().filter(activeVisual).fadeIn();
            if (activeVisual.find('video').length) {
              playCSVideo(activeVisual);
            }
            progressLine($('.section_case-quote'), swiper);
          },
        },
      },
      'all',
    ],
    // Callouts
    [
      '.section_callout',
      '.callout_box',
      'callout',
      {
        slidesPerView: 1,
        spaceBetween: 40,
        loop: true,
        autoplay: {
          delay: 11000,
          disableOnInteraction: false,
        },
        on: {
          init: function (swiper) {
            // Define all
            $(this.slides).each((index, slide) => {
              console.log(slide);
              slide.gsapTimeline = gsap.timeline({ paused: true });
              slide.gsapTimeline.add(typeCallout($(slide)));
            });
            $(this.slidesEl).css('opacity', '1');

            // Play first
            let slide = $(this.slides).eq(this.activeIndex);
            progressLine($('.callout_wrap'), this);
            slide[0].gsapTimeline.play();
          },
          slideChange: function () {
            // Pause All
            $(this.slides).each((index, slide) => {
              if (slide.gsapTimeline) {
                slide.gsapTimeline.progress(0).pause();
                slide.gsapTimeline.kill();
              }
            });
            // Play current
            let slide = $(this.slides).eq(this.activeIndex);
            slide[0].gsapTimeline.play();
            progressLine($('.callout_wrap'), this);
          },
        },
      },
      'all',
    ],
  ];

  // --- Case Studies
  function playCSVideo(parent) {
    let videoElem = parent.find('video').get(0); // Get the native HTMLVideoElement
    // Check for load state
    if (videoElem.readyState >= 3) {
      // Check if it's already loaded
      videoElem.currentTime = 0; // Revert the time to 0
      videoElem.play(); // Play the video
    } else {
      videoElem.addEventListener('loadeddata', function () {
        videoElem.currentTime = 0; // Revert the time to 0
        videoElem.play(); // Play the video
      });
    }
  }
  $('.case-quote_image').on('click mouseenter', function () {
    let video = $(this).find('video');
    video.attr('controls', true);
  });

  // Load
  initSwipers(swiperInstances);

  let calloutTimeout;

  setTimeout(() => {
    initSwipers(swiperInstances);

    // Hover Case Study
    $('.case-quote_content-box')
      .find('.navigation-box')
      .on('mouseenter', function () {
        let index = $(this).index();
        swipers['case-study']['case-study_0'].swiperInstance.slideToLoop(index);
      });

    // Hover Callout
    $('.callout_wrap')
      .find('.navigation-box')
      .on('mouseenter', function () {
        calloutTimeout = setTimeout(() => {
          let index = $(this).index();
          swipers['callout']['callout_0'].swiperInstance.slideToLoop(index);
        }, 500);
      });
    $('.callout_wrap')
      .find('.navigation-box')
      .on('mouseleave', function () {
        clearTimeout(calloutTimeout);
      });
  }, 200);
  // #endregion
});
