processFiles
============

This library helps you process files, especially for command-line programs.  It accepts a filename or an `Array` of filenames and will read the files sequentially.  When the content loads for a file, your callback will be called.  Has built-in support for reading from stdin, both when passed no files to load and when passed "-", per many Unix/Linux commands.

[![NPM][npm-image]][NPM]
[![Build Status][travis-image]][Travis CI]
[![Dependencies][dependencies-image]][Dependencies]
[![Dev Dependencies][devdependencies-image]][Dev Dependencies]


Usage
-----

Use `npm` to install this package.

```bash
npm install --save process-files
```

Next you need a bit of JavaScript.  Let's say you want to just load up two files and display them to the screen.

```js
var processFiles = require('process-files');

processFiles([
    'file1.txt',
    'file2.txt'
], function (err, data, filename) {
    // Check for errors
    if (err) {
        // When errors are passed, `data` and `filename` are undefined.
        console.error('Error reading ' + err.filename, err.toString());
    }

    console.log('Contents of ' + filename);
    console.log(data);
});
```


Examples
--------

This library is geared for use in a program that uses the command line.  When a filename of `-` is specified there, typically programs use stdin, such as `cat - > test.txt` would take all input and write it to `test.txt`.

```js
processFiles('-', function (err, data) {
    if (err) {
        console.error('Error', err.toString());
    } else {
        console.log(data)
    }
});
```

When passed an empty list of files or when passed the file `-`, standard input is automatically read.

```
processFiles(function (err, data, filename) {
    // Even though no files were listed, this reads from stdin.
    console.log(data);
    // The file is always '-' when reading from stdin
    console.log('Filename: ' + filename);  // "Filename: -"
});
```

Need to work with data asynchronously?  Not a problem.  You have two choices.

```js
// "done" callback
processFiles(arrayOfFiles, function (err, data, filename, done) {
    // Make text more 1337 for those h4ck3rs.
    data = data.replace(/e/ig, '3');
    data = data.replace(/l/ig, '1');
    data = data.replace(/a/ig, '4');
    data = data.replace(/t/ig, '7');
    fs.writeFile(filename, data, done);
});

// Promises
processFiles(arrayOfFiles, function (err, data, filename) {
    var promise, resolver;

    promise = new Promise(function (resolve) {
        setTimeout(resolve, 30000);  // 30 second delay
    });

    return promise;
});
```

That's all fine and good, but how do I know that I am done with the list of files?  How about another callback?

```js
processFiles(arrayOfFiles, function (err, data, filename) {
    // This is where you would process files
}, function () {
    console.log('All done processing files');
});
```

You can also specify options.

```js
processFiles(arrayOfFiles, {
    encoding: 'utf8'
}, function (err, data, filename) {
    // Process file content here
});
```


processFiles([files], [options], callback, [completionCallback])
----------------------------------------------------------------

The library only exports this one function.  Parameters are detailed below.


### files

This can be a single string filename, an array of filenames, or omitted.  When omitted or an empty array is passed, stdin is read instead.

If there is a file of "-", then stdin is read instead for that one file.


### options

Options object.

* `encoding` - Specify the type of file encoding for input files.  Defaults to `"utf8"`.


### callback(err, data, filename, [done])

Callback to execute when the file's content is loaded.

When a fourth parameter is specified, then `processFiles` will wait until the `done` callback is called.

When fewer than four parameters are specified, the callback may return a promise.  File loading will be suspended until the promise is resolved or rejected.  If anything other than a promise is returned or if there was no returned value, processing will continue immediately.


### completionCallback()

No data is passed to the completion callback.  It is executed when `processFiles` is done processing all files.


Development
-----------

If you want to work on this library, you need to check out the repository and run `npm install` to get the dependencies.

Tests are *always* included.  Make sure tests cover your changes.  To run the current tests, just use `npm test` or `grunt test` (they will run the same test suite).


License
-------

This software is licensed under an [MIT license with an additional non-advertising clause](LICENSE.md).

[Dev Dependencies]: https://david-dm.org/tests-always-included/process-files#info=devDependencies
[devdependencies-image]: https://david-dm.org/tests-always-included/process-files/dev-status.png
[Dependencies]: https://david-dm.org/tests-always-included/process-files
[dependencies-image]: https://david-dm.org/tests-always-included/process-files.png
[NPM]: https://npmjs.org/package/process-files
[npm-image]: https://nodei.co/npm/process-files.png?downloads=true&stars=true
[travis-image]: https://secure.travis-ci.org/tests-always-included/process-files.png
[Travis CI]: http://travis-ci.org/tests-always-included/process-files
