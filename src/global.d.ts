// Slides
const categoryMap = {};
const currentSlideEl = $('.current-slide');
let currentSlide;
const totalSlideEl = $('.total-slide');
let totalSlide;
let lastActiveCategory = null;

// Links
const sideList = $('.questions_toc_list');
const sideItems = $('.questions_toc-item');
const categoryItems = $('.questions_list-item');

// Content
const content = $('.questions_block');
const swiper = new Swiper('.questions_inner-slider', {
  slidesPerView: 'auto',
  spaceBetween: 0,
  navigation: {
    nextEl: '.swiper-arrow.faq.next',
    prevEl: '.swiper-arrow.faq.prev',
  },
  on: {
    beforeInit: (swiper) => {
      mapSlides();
    },
    afterInit: (swiper) => {
      trackSlides(swiper);
      updateCategory(0);
      updateToc(0, swiper);
    },
    slideChange: (swiper) => {
      trackSlides(swiper);
      updateToc(swiper.activeIndex);
    },
  },
});

// Slides
function mapSlides() {
  // Iterate over each '.question_list-item'
  $('.questions_inner').each(function () {
    const category = $(this).data('category');

    // Initialize the category array if it doesn't exist
    if (!categoryMap[category]) {
      categoryMap[category] = [];
    }

    // Add the '.questions_inner' items of this category to the array
    $(this).each(function () {
      categoryMap[category].push(this); // 'this' refers to the '.questions_inner' item
    });
  });

  // Get all category keys and sort them (if they are numeric or string)
  const categoryKeys = Object.keys(categoryMap).sort();

  // Iterate over each category except the last one
  for (let i = 0; i < categoryKeys.length - 1; i++) {
    const category = categoryKeys[i];
    const lastItem = categoryMap[category][categoryMap[category].length - 1];

    // Add class to the last item of this category
    $(lastItem).addClass('category-last');
  }
}

function trackSlides(swiper) {
  const activeSlide = $(swiper.slides[swiper.activeIndex]);

  // Iterate through each category to find the active slide
  Object.keys(categoryMap).forEach((category) => {
    // Find the index of the active slide in the current category
    const indexInCategory = categoryMap[category].indexOf(activeSlide[0]) || 0;

    if (indexInCategory !== -1) {
      // Adjust the index for the updateCategory function
      // Assuming category is a string representing a number
      updateCategory(parseInt(category) - 1);

      // Check and update the current slide count based on the category
      if (lastActiveCategory !== category) {
        currentSlide = indexInCategory + 1; // Reset and update currentSlide
        lastActiveCategory = category;
      } else {
        currentSlide = indexInCategory + 1; // Just update currentSlide
      }

      totalSlide = categoryMap[category].length;

      // Format currentSlide and totalSlide as two-digit numbers
      const formattedCurrentSlide = String(currentSlide).padStart(2, '0');
      const formattedTotalSlide = String(totalSlide).padStart(2, '0');
      currentSlideEl.text(formattedCurrentSlide);
      totalSlideEl.text(formattedTotalSlide);
    }
  });
}

function updateCategory(index) {
  const activeClass = 'active';
  const activeLine = $('.questions_active-line');

  // Get the currently active item
  const currentActiveIndex = categoryItems.index($('.questions_list-item.active'));

  // Check if the current active index does not match the passed index
  // Remove the active class from all items and update
  categoryItems.removeClass(activeClass);
  categoryItems.eq(index).addClass(activeClass);

  // Find the newly active item and move the line there
  const newActiveItem = categoryItems.eq(index);
  const leftPosition = newActiveItem.position().left;
  activeLine.css('left', leftPosition + 'px');

  // Update the sidelinks
  sideList.hide();
  sideList.eq(index).show();

  // Update the responsive name
  $('[category-display]').text(newActiveItem.find('[category-name]').text());
  $('[icon-display]').html(newActiveItem.find('[category-icon]').html());
}

function updateToc(index, swiperInstance) {
  console.log(index);
  const parentIndex = sideItems.eq(index).closest('ul').index();
  const activeClass = 'active';

  // Existing code to map slide references
  const slideRef = categoryMap[parentIndex + 1] ? categoryMap[parentIndex + 1][index] : null;
  const slideIndex = slideRef ? $(slideRef).index() : 0;

  if (swiperInstance) {
    swiperInstance.slideTo(slideIndex);
  }

  // Existing code to update active state
  sideItems.removeClass(activeClass);
  sideItems.eq(index).addClass(activeClass);

  // Animate scroll
  const itemOffsetTop = sideItems.eq(index).position().top;
  const tocWrapper = sideItems.eq(index).closest('.questions_toc_wrap');

  tocWrapper.stop().animate(
    {
      scrollTop: tocWrapper.scrollTop() + itemOffsetTop,
    },
    500
  ); // 500 is the duration in milliseconds for the animation
}

// Links
sideItems.on('click', function () {
  updateToc($(this).index(), swiper);
});

categoryItems.on('click', function () {
  // Base
  const index = $(this).index();
  updateCategory(index);

  const slideRef = categoryMap[index + 1][0];
  const slideIndex = $(slideRef).index();

  swiper.slideTo(slideIndex);

  if ($(window).width() <= 992) {
    content.css('display', 'flex');
    setTimeout(() => {
      trackSlides(swiper);
    }, 200);
    disableScroll();
  }
});

// Close
$('#content-close').on('click', function () {
  content.hide();
});

const disableScroll = () => {
  if (!menuOpen) {
    scrollPosition = $(window).scrollTop();
    $('html, body').scrollTop(0).addClass('overflow-hidden');
  } else {
    $('html, body').scrollTop(scrollPosition).removeClass('overflow-hidden');
  }
  menuOpen = !menuOpen;
};
