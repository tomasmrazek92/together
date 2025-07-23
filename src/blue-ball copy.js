$(document).ready(function () {
  const config = {
    timeline: '.hp-precision_timeline-wrap',
    container: '.container-large',
    columns: '.hp-precision_col',
    trigger: '.hp-precision_trigger',
    gradientPaths: '.hp-precision_timeline-wrap svg path[stroke*="var"]',
    timelineTexts: '.hp-precision_timeline-text',
  };

  let mainTimeline = null;
  let textTimelines = [];
  let scrollTriggers = [];
  let textPathElements = [];

  function killAllAnimations() {
    if (mainTimeline) {
      mainTimeline.kill();
      mainTimeline = null;
    }

    textTimelines.forEach((tl) => tl.kill());
    textTimelines = [];

    scrollTriggers.forEach((st) => st.kill());
    scrollTriggers = [];

    $(config.timeline).find('.timeline-path-text').remove();
    $(config.timelineTexts).css('opacity', '');

    gsap.set(config.timeline, { clearProps: 'all' });
    gsap.set(config.gradientPaths, { clearProps: 'all' });

    textPathElements = [];
    columnStates = [];
  }

  function calculateTimelinePosition() {
    const $timeline = $(config.timeline);
    const $container = $(config.container);
    const $cols = $(config.columns);
    if (!$timeline.length || !$container.length || !$cols.length) return 0;
    const containerRight = $container[0].getBoundingClientRect().right;
    const lastColRight = $cols.last()[0].getBoundingClientRect().right;
    return containerRight - lastColRight;
  }

  function setupPathAnimation() {
    const gradientPaths = $(config.gradientPaths);
    gradientPaths.each(function () {
      const pathLength = this.getTotalLength();
      gsap.set(this, {
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength,
        opacity: 1,
      });
    });
    return gradientPaths;
  }

  function setupTextPathAnimation() {
    const $svg = $(config.timeline).find('svg');

    $(config.timelineTexts).each(function (index) {
      const $text = $(this);
      const textContent = $text.text().toUpperCase();
      const pathId = `line-${index + 1}`;
      const textPathId = `textPath-${index + 1}`;

      const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textElement.setAttribute('class', 'timeline-path-text');
      textElement.setAttribute('font-size', '1.3em');
      textElement.setAttribute('font-family', 'TT Norms Pro Mono, Impact, sans-serif');
      textElement.setAttribute('fill', getComputedStyle($text[0]).color);
      textElement.setAttribute('font-weight', '500');
      textElement.setAttribute('letter-spacing', '.05em');
      textElement.setAttribute('text-transform', 'uppercase');
      textElement.setAttribute('text-anchor', 'end');

      const textPath = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
      textPath.setAttribute('href', `#${pathId}`);
      textPath.setAttribute('id', textPathId);
      textPath.setAttribute('startOffset', '0%');
      textPath.textContent = textContent;

      textElement.appendChild(textPath);
      $svg[0].appendChild(textElement);

      $text.css('opacity', '0');

      const pathElement = document.querySelector(`#${pathId}`);
      if (pathElement) {
        const textBBox = textElement.getBBox();
        const individualPathLength = pathElement.getTotalLength();
        const elementWidth = textBBox.width;
        const numberOfLetters = textPath.textContent.length;
        const startOffsetPercent =
          (elementWidth / individualPathLength) * (100 * (numberOfLetters * 1.1));

        gsap.set(textElement, { y: '-1.5em' });
        gsap.set(textPath, { attr: { startOffset: `${startOffsetPercent}%` } });

        textPathElements.push({
          textElement: textElement,
          textPath: textPath,
          textPathId: textPathId,
          startOffset: startOffsetPercent,
          endOffset: 100,
        });
      }
    });
  }

  let columnStates = [];

  function checkColumnVisibility() {
    const $cols = $(config.columns);

    $cols.each(function (index) {
      const rect = this.getBoundingClientRect();
      const colNumber = index + 1;
      const colWidth = rect.width;
      const windowWidth = window.innerWidth;
      const isStartingToDisappear = rect.left <= 0;
      const is40PercentHidden = rect.left <= -(colWidth * 0.4);
      const isAppearingFromRight = rect.left <= windowWidth && rect.right > windowWidth;
      const isInMiddleOfView = rect.left <= windowWidth / 2;
      const leftSideInMiddle = rect.left <= windowWidth / 2;
      const rightSideInMiddle = rect.right <= windowWidth / 2;

      if (!columnStates[index]) {
        columnStates[index] = {
          startedDisappearing: false,
          is40PercentHidden: false,
          appearingFromRight: false,
          inMiddleOfView: false,
          leftSideInMiddle: false,
          rightSideInMiddle: false,
        };
      }

      if (isStartingToDisappear && !columnStates[index].startedDisappearing) {
        columnStates[index].startedDisappearing = true;
      }

      if (is40PercentHidden && !columnStates[index].is40PercentHidden) {
        columnStates[index].is40PercentHidden = true;
      }

      if (isAppearingFromRight && !columnStates[index].appearingFromRight) {
        columnStates[index].appearingFromRight = true;
      }

      if (leftSideInMiddle && !columnStates[index].leftSideInMiddle) {
        columnStates[index].leftSideInMiddle = true;
      }

      if (rightSideInMiddle && !columnStates[index].rightSideInMiddle) {
        columnStates[index].rightSideInMiddle = true;
      }
    });
  }

  function getBreakpoint() {
    const width = window.innerWidth;
    if (width >= 1440) return 'large-desktop';
    if (width >= 1280) return 'desktop';
    if (width >= 768) return 'tablet';
    return 'mobile';
  }

  function getTextTriggerConditions(index, breakpoint) {
    const checkColumn = (colIndex, state) =>
      columnStates[colIndex] && columnStates[colIndex][state];

    const conditions = {
      'large-desktop': {
        0: () => checkColumn(1, 'startedDisappearing'),
        1: () => checkColumn(1, 'startedDisappearing'),
        2: () => checkColumn(1, 'is40PercentHidden'),
        3: () => checkColumn(1, 'startedDisappearing'),
        4: () => checkColumn(3, 'leftSideInMiddle'),
        5: () => checkColumn(3, 'leftSideInMiddle'),
      },
      desktop: {
        0: () => checkColumn(1, 'startedDisappearing'),
        1: () => checkColumn(1, 'startedDisappearing'),
        2: () => checkColumn(1, 'is40PercentHidden'),
        3: () => checkColumn(1, 'startedDisappearing'),
        4: () => checkColumn(3, 'leftSideInMiddle'),
        5: () => checkColumn(3, 'leftSideInMiddle'),
      },
      tablet: {
        0: () => checkColumn(1, 'startedDisappearing'),
        1: () => checkColumn(1, 'startedDisappearing'),
        2: () => checkColumn(1, 'is40PercentHidden'),
        3: () => checkColumn(1, 'startedDisappearing'),
        4: () => checkColumn(2, 'leftSideInMiddle'),
        5: () => checkColumn(3, 'leftSideInMiddle'),
      },
      mobile: {
        0: () => checkColumn(1, 'startedDisappearing'),
        1: () => checkColumn(1, 'startedDisappearing'),
        2: () => checkColumn(1, 'is40PercentHidden'),
        3: () => checkColumn(1, 'startedDisappearing'),
        4: () => checkColumn(2, 'leftSideInMiddle'),
        5: () => checkColumn(3, 'leftSideInMiddle'),
      },
    };

    return conditions[breakpoint] && conditions[breakpoint][index]
      ? conditions[breakpoint][index]
      : () => false;
  }

  function getTextEndConditions(index, breakpoint) {
    const checkColumn = (colIndex, state) =>
      columnStates[colIndex] && columnStates[colIndex][state];

    const endConditions = {
      'large-desktop': {
        4: () => checkColumn(3, 'rightSideInMiddle'),
      },
      desktop: {
        4: () => checkColumn(3, 'rightSideInMiddle'),
      },
      tablet: {
        4: () => checkColumn(2, 'rightSideInMiddle'),
      },
      mobile: {
        4: () => checkColumn(2, 'rightSideInMiddle'),
      },
    };

    return endConditions[breakpoint] && endConditions[breakpoint][index]
      ? endConditions[breakpoint][index]
      : () => false;
  }

  function createTextAnimations() {
    checkColumnVisibility();

    const mainST = mainTimeline.scrollTrigger;
    const initialProgress = mainST ? mainST.progress : 0;

    textPathElements.forEach((textPathElement, index) => {
      let hasStarted = false;
      let hasEnded = false;
      let startProgress = 0;
      let endProgress = 1;
      let textAnimation = null;
      let isAnimationCreated = false;

      const currentBreakpoint = getBreakpoint();
      const triggerCondition = getTextTriggerConditions(index, currentBreakpoint);
      const endCondition = getTextEndConditions(index, currentBreakpoint);

      const shouldStartInitially = triggerCondition();
      const shouldEndInitially = endCondition();

      const targetElement = document.querySelector(`#${textPathElement.textPathId}`);
      if (targetElement) {
        textAnimation = gsap.fromTo(
          `#${textPathElement.textPathId}`,
          {
            attr: { startOffset: `${textPathElement.startOffset}%` },
          },
          {
            attr: { startOffset: `${textPathElement.endOffset}%` },
            ease: 'none',
            paused: true,
            immediateRender: false,
          }
        );

        isAnimationCreated = true;

        const currentBreakpoint = getBreakpoint();
        const triggerCondition = getTextTriggerConditions(index, currentBreakpoint);
        const endCondition = getTextEndConditions(index, currentBreakpoint);

        const shouldStartInitially = triggerCondition();
        const shouldEndInitially = endCondition();

        if (shouldStartInitially) {
          hasStarted = true;
          startProgress = 0;

          if (shouldEndInitially) {
            hasEnded = true;
            endProgress = initialProgress;
            textAnimation.progress(1);
          } else {
            const relativeProgress = Math.min(1, Math.max(0, initialProgress / 1));
            textAnimation.progress(relativeProgress);
          }
        } else {
          // 🟢 Always set progress to match current scroll position even if not triggered yet
          const relativeProgress = Math.min(
            1,
            Math.max(0, (initialProgress - startProgress) / (endProgress - startProgress || 1))
          );
          textAnimation.progress(relativeProgress);
        }
      }

      const textTl = gsap.timeline({
        scrollTrigger: {
          trigger: config.trigger,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => {
            const currentBreakpoint = getBreakpoint();

            if (!hasStarted) {
              const triggerCondition = getTextTriggerConditions(index, currentBreakpoint);
              const shouldStart = triggerCondition();

              if (shouldStart) {
                hasStarted = true;
                startProgress = self.progress;
              }
            }

            if (hasStarted && !hasEnded) {
              const endCondition = getTextEndConditions(index, currentBreakpoint);
              const shouldEnd = endCondition();

              if (shouldEnd) {
                hasEnded = true;
                endProgress = self.progress;
              }
            }

            if (hasStarted && textAnimation && isAnimationCreated) {
              const totalDuration = hasEnded ? endProgress - startProgress : 1 - startProgress;
              let relativeProgress = 0;

              if (totalDuration > 0) {
                relativeProgress = Math.min(
                  1,
                  Math.max(0, (self.progress - startProgress) / totalDuration)
                );
              } else if (hasEnded) {
                relativeProgress = 1;
              }

              textAnimation.progress(relativeProgress);
            }
          },
        },
      });

      scrollTriggers.push(textTl.scrollTrigger);
      textTimelines.push(textTl);
    });
  }

  function initAnimation() {
    const moveX = calculateTimelinePosition();
    const gradientPaths = setupPathAnimation();
    setupTextPathAnimation();

    mainTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: config.trigger,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: checkColumnVisibility,
        onRefresh: () => checkColumnVisibility(),
      },
    });

    scrollTriggers.push(mainTimeline.scrollTrigger);

    mainTimeline
      .to(config.timeline, { x: moveX, ease: 'none' }, 0)
      .to(gradientPaths, { strokeDashoffset: 0, ease: 'none' }, 0);

    ScrollTrigger.refresh();

    createTextAnimations();
  }

  function restartAnimation() {
    killAllAnimations();

    setTimeout(() => {
      initAnimation();
    }, 100);
  }

  let resizeTimeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      restartAnimation();
    }, 250);
  }

  initAnimation();

  $(window).on('resize', handleResize);
});
