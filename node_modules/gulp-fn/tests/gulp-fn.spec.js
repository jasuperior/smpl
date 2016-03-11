var es = require('event-stream');

var gulp = require('gulp')
var gulpFn = require('./../gulp-fn.js');

describe('gulp-fn', function() {
	it('should count the correct number of files if the passed function is a counter', function() {
		var expected = 1;
		var actual = 0;

		gulp.src('./../gulp-fn.js')
		  .pipe(gulpFn(function(){actual++;}))
		  .pipe(es.wait(function(){
			expect(expected).toBe(actual);
		  }));
	});
	it('should collect the correct number of files if the passed function saves all the file names in the pipe', function() {
		var expected = ['gulp-fn.js'];
		var actual = [];

		gulp.src('./../gulp-fn.js')
		  .pipe(gulpFn(function(file){actual.push(file.path);}))
		  .pipe(es.wait(function(){
			expect(expected).toEqual(actual);
		  }));
	});
});
