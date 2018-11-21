var gulp = require('gulp'),
    concat = require("gulp-concat"),
    $ = require('gulp-load-plugins')(),
    webpackStream = require('webpack-stream'),
    webpack = require('webpack'),
    webpackConfig = require('./webpack.config');

gulp.task('sass', function () {
    return gulp.src(['./src/**/*.scss'])
        .pipe($.plumber({
            errorHandler: $.notify.onError('<%= error.message %>')
        }))
        .pipe($.sourcemaps.init({loadMaps: true}))
        .pipe($.sass({
            errLogToConsole: true,
            outputStyle: 'compressed',
            includePaths: [
                './src/scss'
            ]
        }))
        .pipe($.autoprefixer({browsers: ['last 2 version', '> 5%']}))
        .pipe($.sourcemaps.write('./map'))

        //bundle css files by gulp-concat
        .pipe(concat('block-build.css'))
        .pipe(gulp.dest('./dist'));
});


// Transpile and Compile Sass and Bundle it.
gulp.task('js', function () {
    return webpackStream(webpackConfig, webpack)
        .pipe(gulp.dest('./'));
});


// watch
gulp.task('watch', function () {
    gulp.watch('src/**/*.js', ['js']);
    gulp.watch('src/**/*.scss', ['sass']);
});

// Build
gulp.task('build', ['js', 'sass']);

// Default Tasks
gulp.task('default', ['watch']);