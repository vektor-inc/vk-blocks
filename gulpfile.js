var gulp          = require('gulp'),
    $             = require('gulp-load-plugins')(),
    webpackStream = require('webpack-stream'),
    webpack = require('webpack'),
    webpackConfig = require('./webpack.config');

// Transpile and Compile Sass and Bundle it.
gulp.task('webpack', function () {
    return webpackStream(webpackConfig, webpack)
        .pipe(gulp.dest('./'));
});

// watch
gulp.task('watch', function () {
  gulp.watch('src/**/*', ['webpack']);
});

// Build
gulp.task('build', ['webpack']);

// Default Tasks
gulp.task('default', ['watch']);