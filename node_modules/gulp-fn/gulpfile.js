var es = require('event-stream');

var gulp = require('gulp');
var gulpFn = require('./gulp-fn');

gulp.task('count', function() {
	var actual = 0;
	var streams = [];

	streams.push(
		gulp.src('./gulp-fn.js')
		  .pipe(gulpFn(function(){actual++;}));
	);
	streams.push(
		gulp.src('*')
		  .pipe(gulpFn(function(){console.log(actual);}));
	);

	return es.merge.apply(this, streams);
});