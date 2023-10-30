import {
  disableScroll,
  initSwipers,
  letterAnimation,
  progressLine,
  wrapLetters,
} from './utils/globalFunctions';

$(document).ready(function () {
  // -------------- Global Functions
  function toggleTextContent(el, show = true) {
    $(el).css('opacity', show ? '1' : '0');
  }

  // Make the external links open in new tab
  jQuery(document.links)
    .filter(function () {
      return this.hostname != window.location.hostname;
    })
    .attr('target', '_blank');

  // -------------- Menu
  $('.navbar_button').on('click', function () {
    disableScroll();
  });

  // Menu Color Change
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

      if (windowTop <= elementTop + elementHeight - offset && windowTop >= elementTop - offset) {
        shouldAddClass = true;
        return false; // break out of each loop
      }
    });

    if (shouldAddClass && !elems.hasClass('background-color-charcoal')) {
      elems.addClass('background-color-charcoal');
    } else if (!shouldAddClass && elems.hasClass('background-color-charcoal')) {
      elems.removeClass('background-color-charcoal');
    }
  }

  // -------------- Wrap Output Text
  $('[output-text]').each(function () {
    wrapLetters($(this));
    toggleTextContent($(this));
  });

  // -------------- FAQs
  let faqItem = $('[faq-item]');

  // Faq Items
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

  // -------------- Autoplaying Tabs
  function initAutoplayTabs(items) {
    $(items).each(function () {
      const el = $(this);

      // Elements
      const tabItems = $('.swiper-slide');
      const tabLinks = $('.autotabs_link');
      const content = $('.autotabs_content-item');
      const progressline = $('.progress-line');
      const activeClass = 'is-active';
      const duration = 5000;

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
              autoplay: {
                delay: duration,
                disableOnInteraction: false,
              },
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
        tabToActivate.addClass(activeClass);
        contentToActive.stop().fadeIn(function () {
          if (contentToActive.find('.chat-conv_box').length) {
            animateOutput($(parent), index);
          } else if (contentToActive.find('.code-box').length) {
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
      function animateOutput(parent, index) {
        let el = $(parent).find(content).eq(index);
        let inputText = el.find('[input-text]');
        let outputText = el.find('[output-text]');
        inputText.stop().animate({ opacity: 1 }, function () {
          setTimeout(() => {
            letterAnimation(outputText);
          }, 250);
        });
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

  // Run the Autotabs
  initAutoplayTabs($('.autotabs_wrap'));

  //  -------------- Pill Sections
  $('.pill-header,.callout').each(function () {
    let pills = $(this).find('.pill-a, .pill-b, .pill-circle, .callout_p');

    let main = gsap.timeline({
      scrollTrigger: {
        trigger: $(this),
        start: 'center bottom', // when the top of the trigger hits the top of the viewport
      },
    });

    pills.each(function () {
      let tl = gsap.timeline();

      let element = $(this);
      let elClass = element.attr('class').split(' ')[0];
      let text = element.find('div[class*="text"]');

      if (elClass === 'pill-a' || elClass === 'pill-b') {
        tl.fromTo(element.find('[mask]'), { xPercent: -100 }, { xPercent: 0, duration: 0.5 });
        if (element.attr('direction') === 'vertical') {
          tl.fromTo(text, { yPercent: 150 }, { yPercent: 0, duration: 0.5 });
        } else {
          tl.fromTo(text, { xPercent: -110 }, { xPercent: 0, duration: 0.5 }, '<0.2');
        }
      } else if (elClass === 'callout_p') {
        tl.add(letterAnimation(element, 0.03));
      } else if (elClass === 'pill-circle') {
        tl.fromTo(element, { scale: 0 }, { scale: 1 });
      }

      main.add(tl, '-=0.2');
    });
  });

  //  -------------- FIlters
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

  // Open Click
  $('.filters')
    .find('.button')
    .on('click', function () {
      let filter = $(this).closest('.filters').find('.filters-block');
      toggleDropdown(filter);
    });

  // Outside Click
  $(document).on('click', function (e) {
    if (
      $(e.target).closest('.filters').length === 0 ||
      $(e.target).closest('.filters-menu').length >= 1
    ) {
      toggleDropdown($('.filters-block.open'));
    }
  });

  // Tab Click
  $('.filters .tab').on('click', function () {
    let text = $(this).text();
    $(this).closest('.filters').find('.button').find('div').eq(0).text(text);
  });

  //  -------------- Case Study
  // Swipers
  const swiperInstances = [
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
        autoplay: {
          delay: 8000,
          disableOnInteraction: false,
        },
        on: {
          init: (swiper) => {
            progressLine($('.section_case-quote'), swiper);
          },
          slideChange: (swiper) => {
            let visuals = $('.case-quote_image');
            progressLine($('.section_case-quote'), swiper);
            visuals.hide();
            visuals.stop().eq(swiper.realIndex).fadeIn();
          },
        },
      },
      'all',
    ],
  ];

  // Load
  initSwipers(swiperInstances);

  setTimeout(() => {
    initSwipers(swiperInstances);
    $('.case-quote_content-box')
      .find('.navigation-box')
      .on('mouseenter', function () {
        let index = $(this).index();
        console.log(index);
        swipers['case-study']['case-study_0'].swiperInstance.slideToLoop(index);
      });
  }, 200);
});
