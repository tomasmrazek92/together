import { createResponsiveSwiper, initSwipers, progressLine } from './utils/globalFunctions';

$(document).ready(function () {
  // #region Hero
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
    // Define a flag to check if it's the first call
    let isFirstCall = true;

    function updateHeading(el) {
      let newText = el.attr('title-text');
      let textEl = $('#title-text');
      let currentText = textEl.text();
      let maintainText = '.we'; // The part of the text to maintain during backspace
      let removablePartIndex = currentText.indexOf(maintainText) + maintainText.length;
      let removablePart = currentText.slice(removablePartIndex); // The part of the text to animate the removal
      let typingSpeed = 0.1; // Duration for typing each character
      let backspaceSpeed = 0.07; // Duration for backspacing each character

      if (isFirstCall) {
        // Instantly set the text and update the flag
        gsap.to(textEl, {
          duration: (newText.length - maintainText.length) * typingSpeed,
          text: newText,
          ease: 'none',
        });
        isFirstCall = false;
      } else if (newText !== currentText) {
        let backspaceAnimation = gsap.timeline();

        // Backspace effect, excluding the maintainText
        backspaceAnimation
          .to(textEl, {
            duration: removablePart.length * backspaceSpeed,
            text: maintainText,
            ease: 'none',
            onUpdate: function () {
              // Calculate the number of characters to show based on the animation's progress
              let charToShow =
                maintainText.length + Math.ceil(removablePart.length * (1 - this.progress()));
              textEl.text(currentText.substr(0, charToShow));
            },
          })
          .to(textEl, {
            duration: (newText.length - maintainText.length) * typingSpeed,
            text: newText,
            ease: 'none',
          });
      }
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
      if ($(window).width() >= 992 && !$(this).find(tabLinks).hasClass('is-active')) {
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

  // #endregion

  // #region Logos

  function loopImages(parentSelector, imgSelector) {
    const $parent = $(parentSelector);
    const $topBoxes = $parent.find('.top');
    const $bottomBoxes = $parent.find('.bottom');

    const $images = $(imgSelector).find('img');
    const imageUrls = $images
      .map(function () {
        return $(this).attr('src');
      })
      .get();

    let currentBatchIndex = 0;

    function updateImages() {
      for (let i = 0; i < 4; i++) {
        $parent
          .parent()
          .find('.top')
          .eq(i)
          .css('background-image', `url(${imageUrls[currentBatchIndex * 8 + i]})`);
        $parent
          .parent()
          .find('.bottom')
          .eq(i)
          .css('background-image', `url(${imageUrls[currentBatchIndex * 8 + 4 + i]})`);
      }
    }
    function copyDown() {
      for (let i = 0; i < 4; i++) {
        const topLogo = $topBoxes.eq(i).clone();
        topLogo.removeClass('top');
        topLogo.addClass('addBottom');
        topLogo.css('top', '200%');
        $parent.append(topLogo);
      }
    }

    function animateTransition() {
      const tl = gsap.timeline({
        delay: $parent.index() * 0.1,
        repeat: -1,
        repeatDelay: 2,
      });

      // Animate the transition
      tl.to($parent, { y: '-100%', ease: 'power2.inOut', duration: 0.7, stagger: 0.1 });
      tl.to($parent, { y: '-200%', ease: 'power2.inOut', duration: 0.7, stagger: 0.1 }, '+=2');
    }

    // Initialize images and start animation
    updateImages();
    copyDown();
    setTimeout(animateTransition, 3000); // Start with an initial delay
  }

  $(document).ready(function () {
    $('.hp-logos_item').each(function () {
      loopImages($(this), '#logos-source');
    });
  });

  // #endregion
});
