var gulp          = require('gulp'),
    $             = require('gulp-load-plugins')(),
    webpack       = require('webpack-stream'),
    webpackBundle = require('webpack'),
    named         = require('vinyl-named');

// Sass tasks
gulp.task('sass', function () {
  return gulp.src(['./src/scss/**/*.scss'])
    .pipe($.plumber({
      errorHandler: $.notify.onError('<%= error.message %>')
    }))
    .pipe($.sourcemaps.init({loadMaps: true}))
    .pipe($.sass({
      errLogToConsole: true,
      outputStyle    : 'compressed',
      includePaths   : [
        './src/scss'
      ]
    }))
    .pipe($.autoprefixer({browsers: ['last 2 version', '> 5%']}))
    .pipe($.sourcemaps.write('./map'))
    .pipe(gulp.dest('./assets/css'));
});

// Transpile JS
gulp.task('js', function () {
  return gulp.src(['./src/js/**/*.js'])
    .pipe($.plumber({
      errorHandler: $.notify.onError('<%= error.message %>')
    }))
    .pipe(named())
    .pipe(webpack({
      mode: 'production',
      devtool: 'source-map',
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env'],
                plugins: ['@babel/plugin-transform-react-jsx']
              }
            }
          }
        ]
      }
    }, webpackBundle))
    .pipe(gulp.dest('./assets/js'));
});

// watch
gulp.task('watch', function () {
  // Make SASS
  gulp.watch('src/scss/**/*.scss', ['sass']);
  // JS
  gulp.watch(['src/js/**/*.js'], ['js']);
});

// Build
gulp.task('build', ['js', 'sass']);

// Default Tasks
gulp.task('default', ['watch']);