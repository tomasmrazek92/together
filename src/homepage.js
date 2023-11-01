import { createResponsiveSwiper, initSwipers, progressLine } from './utils/globalFunctions';

$(document).ready(function () {
  const duration = 5000;

  $('.hp-hero_list').each(function () {
    // Elements
    const parent = $(this);
    const tabItems = parent.find('.list-e_list-item');
    const tabLinks = parent.find('.list-e_item');
    const content = parent.find('.list-e_item-content');
    const lotties = parent.find('.list-e_item-visual-inner');
    const progressline = parent.find('.progress-line');
    const activeClass = 'is-active';

    // Variables
    let heroLoops;
    let heroInit = false;
    let heroAnimate = true;
    let isObserving = false;

    // Tabs Logic
    function switchHero(currentIndex) {
      // In case
      if (!heroAnimate) return;

      // Get what index is next tab
      let nextIndex = (currentIndex + 1) % tabItems.length;

      // Update the tab after the duration to create autoplay
      clearTimeout(heroLoops);
      heroLoops = setTimeout(() => {
        // Update the tab
        updateHero(nextIndex);

        // Call the same function for looping
        switchHero(nextIndex);
      }, duration);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        clearTimeout(heroLoops);
      } else {
        // Resume the loop
        switchHero(1);
      }
    });

    // Tabs Updating
    function updateHero(index, event = null) {
      const skipTriggerProgress = event && event.type === 'click';

      // -- Cleaning part
      resetHero();

      // -- Update part
      const tabToActivate = tabItems.eq(index).find(tabLinks);

      let mask = tabToActivate.find(content).find('.list_mask');

      updateHeading(tabToActivate);
      tabToActivate.addClass(activeClass);
      mask.animate(
        {
          height: mask.get(0).scrollHeight,
        },
        300,
        function () {
          $(this).height('auto');
          playLottie(index);
        }
      );

      if (!skipTriggerProgress) {
        triggerProgress(tabToActivate);
      }
    }

    // Init tabs
    function initHero() {
      // In case the tabs are already running
      if (heroInit) return;

      heroAnimate = true;
      heroInit = true;
      const initialIndex = 0;
      updateHero(initialIndex);
      switchHero(initialIndex);
    }

    // Animation Logic
    function triggerProgress(el) {
      el.find(progressline).animate({ width: '100%' }, duration);
    }
    function playLottie(index) {
      if (!$('body').hasClass('overflow-hidden')) {
        // fix for closing the menu
        lotties.eq(index).addClass('is-playing');
      }
    }
    function updateHeading(el) {
      let text = el.attr('title-text');
      let textEl = $('#title-text');
      gsap.to(textEl, { duration: 1, text: text, ease: 'none' });
    }
    function sliderProgress(index) {
      let bars = parent.find('.navigation').find('.progress-bar');
      bars.find(progressline).stop().css('width', '0%');
      triggerProgress(bars.eq(index));
    }

    // Killing logic
    function killHero() {
      stopHero();
      heroInit = false; // Mark as uninitialized
    }
    function stopHero() {
      heroAnimate = false;
      clearTimeout(heroLoops);
      resetHero();
    }
    function resetHero() {
      tabLinks.filter(`.${activeClass}`).removeClass(activeClass);
      progressline.stop(true, true).css('width', '0%');
      parent.find('.list_mask').animate(
        {
          height: 0,
        },
        300
      );
      if (!$('body').hasClass('overflow-hidden')) {
        parent.find(lotties).filter('is-playing').trigger('click').removeClass('is-playing');
      }
    }

    let currentWidth = $(window).width();
    let prevWidth = null; // Initialize prevWidth to null

    function handleHero() {
      currentWidth = $(window).width(); // Update the current width inside the function

      // Check if width changed
      if (currentWidth !== prevWidth) {
        prevWidth = currentWidth;

        // for Mobile Kill all in case it runs already and init the swiper
        if (currentWidth <= 991) {
          if (heroInit) {
            killHero();
          }
        } else {
          // If its not running already init the Tabs
          if (!heroInit) {
            initHero();
          }
        }
      }
    }

    // Resize
    $(window).on('resize', () => {
      handleHero();
    });

    // Hover Events
    let hoverTimer; // Declare this variable at the beginning of your script or function
    const runTabs = (el) => {
      let index = tabItems.index($(el)); // Get index of hovered item
      updateHero(index, event);
      switchHero(index); // Resume automatic tab switching
    };

    tabItems.on('mouseenter', function (event) {
      if ($(window).width() >= 992) {
        clearTimeout(hoverTimer); // Clear any existing hover timer
        hoverTimer = setTimeout(() => {
          clearTimeout(heroLoops); // Clear the automatic tab switching timer
          runTabs($(this));
        }, 100);
      }
    });

    // Mouseleave event to clear the timer if the user leaves before 200ms
    tabItems.on('mouseleave', function () {
      clearTimeout(hoverTimer);
    });

    // Tab unfocus fix
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        clearTimeout(heroLoops);
      } else {
        // Resume the loop
        runTabs(tabItems.filter('.is-active'));
      }
    });

    // Load
    handleHero(); // It will run now as prevWidth starts as null

    // Swipers
    const swiperInstances = [
      [
        '.section_hp-hero',
        '.hp-hero_list',
        'hero-swiper',
        {
          slidesPerView: 1,
          spaceBetween: 40,
          loop: true,
          autoplay: {
            delay: duration,
            disableOnInteraction: false,
          },
          on: {
            init: (swiper) => {
              updateHero(swiper.realIndex);
              sliderProgress(swiper.realIndex);
            },
            slideChange: (swiper) => {
              updateHero(swiper.realIndex);
              sliderProgress(swiper.realIndex);
            },
          },
        },
        'mobile',
      ],
      [
        '.section_articles',
        '.container-large',
        'articles',
        {
          slidesPerView: 1,
          spaceBetween: 40,
          loop: true,
          autoplay: {
            delay: duration,
            disableOnInteraction: false,
          },
          on: {
            init: (swiper) => {
              progressLine($('.section_articles'), swiper);
            },
            slideChange: (swiper) => {
              progressLine($('.section_articles'), swiper);
            },
          },
        },
        'mobile',
      ],
    ];

    // Load
    initSwipers(swiperInstances);
  });

  // Load Anim
  $('.hp-hero').each(function () {
    let tl = gsap.timeline();
    tl.to($(this).find('.hp-hero_par').find('p'), { opacity: 1, stagger: 0.2 }, '<0.2');
    tl.to($(this).find('.button'), { opacity: 1, stagger: 0.2 }, '<0.2');
  });

  // Prevent unwanted scroll inside model list
  let hoverTimeOut;
  let modelBox = $('.platform-box_inner');
  modelBox.on('mouseenter', function () {
    hoverTimeOut = setTimeout(() => {
      modelBox.css('overflow', 'auto');
    }, 300);
  });

  modelBox.on('mouseleave', function () {
    clearTimeout(hoverTimeOut);
    modelBox.css('overflow', 'hidden');
  });
});
