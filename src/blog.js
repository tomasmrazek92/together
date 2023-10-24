import {
  createResponsiveSwiper,
  getSwiperInstance,
  initSwipers,
  progressLine,
} from './utils/globalFunctions';
$(document).ready(function () {
  // Swipers
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
        swipers['blog-hero']['blog-hero_0'].swiperInstance.slideTo(index);
      });
  }, 200);
});
