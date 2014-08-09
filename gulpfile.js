'use strict';

var gulp           = require('gulp'),
    jshint         = require('gulp-jshint'),
    browserify     = require('gulp-browserify'),
    uglify         = require('gulp-uglify'),
    sass           = require('gulp-sass'),
    rename         = require('gulp-rename'),
    ngAnnotate     = require('gulp-ng-annotate'),
    refresh        = require('gulp-livereload'),
    lrserver       = require('tiny-lr')(),
    morgan         = require('morgan'),
    express        = require('express'),
    livereload     = require('connect-livereload'),
    livereloadport = 35729,
    serverport     = 3000;

/************************************************
  Web Server
 ***********************************************/

var server = express();
// log all requests to the console
server.use(morgan('dev'));
// Add live reload
server.use(livereload({port: livereloadport}));
server.use(express.static('./build'));
// Server index.html for all routes to leave routing up to Angular
server.all('/*', function(req, res) {
    res.sendfile('index.html', { root: 'build' });
});

/************************************************
  Gulp Tasks
 ***********************************************/

// JSHint task
gulp.task('lint', function() {
  gulp.src('./app/js/**/*.js')
  .pipe(jshint())
  .pipe(jshint.reporter('default'));
});

// Browserify task
gulp.task('browserify', function() {
  // Single point of entry (make sure not to src ALL your files, browserify will figure it out for you)
  gulp.src(['app/js/main.js'])
  .pipe(ngAnnotate())
  .pipe(browserify({
    insertGlobals: true,
    debug: true
  }))
  .pipe(uglify())
  .pipe(rename({suffix: '.min'}))
  .pipe(gulp.dest('build/js'))
  .pipe(refresh(lrserver));
});

// Styles task
gulp.task('styles', function() {
  gulp.src('app/styles/main.scss')
  // The onerror handler prevents Gulp from crashing when you make a mistake in your SASS
  .pipe(sass({style: 'compressed', onError: function(e) { console.log(e); } }))
  .pipe(rename({suffix: '.min'}))
  .pipe(gulp.dest('build/css/'))
  .pipe(refresh(lrserver));
});

// Views task
gulp.task('views', function() {
  // Get our index.html
  gulp.src('app/index.html')
  // And put it in the dist folder
  .pipe(gulp.dest('build/'));

  // Any other view files from app/views
  gulp.src('./app/views/**/*')
  // Will be put in the dist/views folder
  .pipe(gulp.dest('build/views/'))
  .pipe(refresh(lrserver));
});

gulp.task('watch', function() {
  // Watch our scripts
  gulp.watch(['app/js/**/*.js'],[
    'lint',
    'browserify'
  ]);
  // Watch our styles
  gulp.watch(['app/styles/**/*.scss'], [
    'styles'
  ]);
  // Watch our views
  gulp.watch(['app/index.html', 'app/views/**/*.html'], [
    'views'
  ]);
});

// Dev task
gulp.task('dev', function() {
  // Start webserver
  server.listen(serverport);
  // Start live reload
  lrserver.listen(livereloadport);
  // Run the watch task to keep tabs on changes
  gulp.start('watch');
});