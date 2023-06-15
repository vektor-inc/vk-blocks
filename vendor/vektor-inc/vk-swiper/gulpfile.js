
/*-------------------------------------*/
/*  Copyright
/*-------------------------------------*/
/*  Font
/*-------------------------------------*/
/*  media posts
/*-------------------------------------*/
/*  term color
/*-------------------------------------*/
/*  Font Awesome
/*-------------------------------------*/
/*  vk-mobile-nav
/*-------------------------------------*/
/*  vk-mobile-fix-nav
/*-------------------------------------*/
/*  page-header
/*-------------------------------------*/


var gulp = require('gulp');

/**
 * VK Swiper
 */
gulp.task('copy_swiper', function(done) {
  gulp.src('./node_modules/swiper/swiper-bundle.min.css')
      .pipe(gulp.dest('./src/assets/css/'))
  gulp.src('./node_modules/swiper/swiper-bundle.min.js')
      .pipe(gulp.dest('./src/assets/js/'))
	done();
});
