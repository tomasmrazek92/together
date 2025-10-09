import {
  createResponsiveSwiper,
  getSwiperInstance,
  initSwipers,
  progressLine,
} from './utils/globalFunctions';
$(document).ready(function () {
  // --- Swipers
  let blogHero = '.blog-hero_slider';
  const swiperInstances = [
    [
      blogHero,
      '.blog-hero_wrap',
      'blog-hero',
      {
        loop: true,
        slidesPerView: 1,
        spaceBetween: 40,
        autoplay: {
          delay: 5000,
          disableOnInteraction: false,
        },
        on: {
          beforeInit: () => {
            $(document).ready(function () {
              $('p[authors]').each(function () {
                const text = $(this).text().trim();
                const names = text.split(',').map((name) => name.trim());

                if (names.length > 5) {
                  const displayNames = names.slice(0, 5).join(', ');
                  $(this).text(displayNames + ', et\u00A0al.');
                }
              });
            });
          },
          init: (swiper) => {
            progressLine($('.blog-hero_slider'), swiper);
          },
          slideChange: (swiper) => {
            progressLine($('.blog-hero_slider'), swiper);
          },
        },
      },
      'all',
    ],
  ];
  setTimeout(() => {
    initSwipers(swiperInstances);
    $(blogHero)
      .find('.navigation-box')
      .on('mouseenter', function () {
        let index = $(this).index();
        swipers['blog-hero']['blog-hero_0'].swiperInstance.slideToLoop(index);
      });
  }, 200);
});
