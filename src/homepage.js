import { createResponsiveSwiper, initSwipers, progressLine } from './utils/globalFunctions';

$(document).ready(function () {
  // #region Hero
  const duration = 5000;

  // Swipers
  const swiperInstances = [
    [
      '.section_articles',
      '.container-large-tkc',
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
});
