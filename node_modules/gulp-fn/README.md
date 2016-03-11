# gulp-fn
A simple function injection plugin for [gulp](http://gulpjs.com/)

It allows to run custom functions in the gulp pipeline without having to deal with the NodeJS event-stream.

## usage
Install npm package

    npm install git://github.com/ThierrySpetebroot/gulp-fn.git

Use it in your NodeJs code

    var gulp    = require('gulp');
    var gulpFn  = require('gulp-fn');

    gulp.task('Hello gulp-fn', function() {
        gulp.src('./gulp-fn.js')
          .pipe(gulpFn(function(file) {
              console.log("Hello " + file.path);
          })
        );
    });

## API
    gulpFn(fn, filter = true) : Transform

- fn, function(file) => void - required - function invoked for each file in the stream.
- filter, boolean - default: true - if true pushes the file in the pipeline automatically (it is not possible to remove or add file to the stream).

