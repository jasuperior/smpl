Log Capture Plugin for Gulp [![Build Status](https://travis-ci.org/sloosch/gulp-log-capture.svg?branch=master)](https://travis-ci.org/sloosch/gulp-log-capture) [![Coverage Status](https://coveralls.io/repos/sloosch/gulp-log-capture/badge.png?branch=master)](https://coveralls.io/r/sloosch/gulp-log-capture?branch=master)
=========

capture logs from any other gulp plugin in the pipe.

##Installation

```
npm install gulp-log-capture --save-dev
```

##Example

capturing the call to `console.log` from jshint to create a XML report:

```javascript
logCapture = require('gulp-log-capture');

gulp.task('lint-reports', function() {
	return gulp.src('src/js/*.js')
	.pipe(jshint())
	.pipe(logCapture.start(console, 'log'))
	.pipe(jshint.reporter('jslint_xml'))
	.pipe(logCapture.stop('xml'))
	.pipe(gulp.dest('lint-reports'));
});
```

##API


####logCapture.start(obj, fnName)
To catch every call to `console.log` use `logCapture.start(console, 'log')` can be also used to track any other logging / writing function as long as it can be handled by nodejs `util.format` e.g. `process.stdout.write` can be captured via `logCapture.start(process.stdout, 'write')`.

####logCapture.stop(fileExtension)
stops the capturing and pushes the log files through the pipe with the given file extension. The log file name pattern is `<original filename>-<filename calling obj.fnName>-<fnName>.<fileExtension>` e.g. foo.js-crazy_log_plugin-log.xml


#####Note: Concurrent capturing is not supported! Therefore you should not run the task with others simultaneously.
