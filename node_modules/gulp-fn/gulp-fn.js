/*
Gulp-Fn
 */
var PLUGIN_NAME, PluginError, gulpFn, gutil, through;

through = require('through2');

gutil = require('gulp-util');

PluginError = gutil.PluginError;

PLUGIN_NAME = 'gulp-fn';

gulpFn = function(fn, filter) {
  var stream;

  if (!fn) {
    throw new PluginError(PLUGIN_NAME, "Missing fn parameter!");
  }

  if (filter === undefined)
    filter = true; // auto-push flag

  stream = through.obj(function(file, enc, callback) {
    if(filter)
      fn(file);
    else
      fn.call(this, file);

    if(filter)
      this.push(file);

    return callback();
  });
  return stream;
};

module.exports = gulpFn;
