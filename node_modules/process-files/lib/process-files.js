/**
 * Read a list of files, in order.  When each file is ready, call the callback.
 *
 * Does not run the files in parallel in order to prevent problems where many
 * extremely large files are listed.
 *
 * Supports callbacks, completion callbacks, asynchronous callbacks (both with
 * a "done" callback and with promises).
 * Usage:
 *
 *     processFiles = require('process-files');
 *
 *     processFiles([
 *         'some-file.txt',
 *         'another-file.txt'
 *     ], function (err, data, filename) {
 *         if (err) {
 *             console.error('Error!');
 *             console.error(err.toString());
 *
 *             return;
 *         }
 *
 *         console.log(filename + ' contents:', data);
 *     });
 *
 *
 * The intent of this library is to ease development of command-line programs.
 * Typically a list of files is passed as arguments.  You can find all
 * files and then pass them to processFiles to load the files and trust that
 * your callback will be fired.
 *
 * To support Unix/Linux shortcuts, a filename of '-' means to read from
 * standard input (stdin).  This is handled for you.
 */
/*global module, process, require*/
(function () {
    'use strict';

    var fs, Readable;

    fs = require('fs');
    Readable = require('stream').Readable;

    /**
     * Read from stream until it is done.  When done, call the callback and
     * pass it the data.
     *
     * @param {ReadableStream} stream
     * @param {string} encoding
     * @param {Function} callback callback(err, data)
     */
    function drainStream(stream, encoding, callback) {
        var data;

        data = '';

        if (Readable) {
            // v0.10.x - Streams2
            stream.setEncoding(encoding);
            stream.on('readable', function () {
                var chunk;

                chunk = stream.read();

                while (chunk !== null) {
                    data += chunk;
                    chunk = stream.read();
                }
            });
        } else {
            // v0.8, v0.6, v0.4? - Streams
            stream.on('data', function (chunk) {
                data += chunk.toString(encoding);
            });
            stream.resume();
        }

        stream.on('end', function () {
            callback(null, data);

            // Release memory in case it was a large file
            data = undefined;
        });
        stream.on('error', callback);
    }


    /**
     * Open a file and send its contents and the filename to the callback.
     *
     * If `-` is passed as a filename, read from stdin instead.
     *
     * @param {string} filename
     * @param {Object} options
     * @param {Function} callback callback(err, data, filename)
     */
    function readFile(filename, options, callback) {
        var alreadyReadStdinError;

        /**
         * When the drain is complete, call back to the original callback.
         * This adds the filename back to the list of arguments.
         *
         * @param {?Error} err
         * @param {string} data
         */
        function drainComplete(err, data) {
            if (err) {
                err.filename = filename;
                callback(err);
            } else {
                callback(null, data, filename);
            }
        }

        if (filename === '-') {
            if (process.stdin.readable) {
                drainStream(process.stdin, options.encoding, drainComplete);
            } else {
                alreadyReadStdinError = new Error('Already read stdin');
                alreadyReadStdinError.code = 'ESTDIN';
                drainComplete(alreadyReadStdinError);
            }

            return;
        }

        drainStream(fs.createReadStream(filename, {
            encoding: options.encoding
        }), options.encoding, drainComplete);
    }

    /**
     * For each file in the list, read its data and call the callback.  The
     * callback is passed the data and the filename.
     *
     * When no files are passed, this reads from stdin.
     *
     * @param {Array.<string>} files
     * @param {Object} options
     * @param {Function} callback
     * @param {?Function} [completionCallback]
     */
    function readFileList(files, options, callback, completionCallback) {
        /**
         * After reading a file's contents, deliver it to the callback.
         *
         * If the callback accepts a "done" parameter or returns a
         * promise, make sure to wait until the async processing is done.
         *
         * After the callback is finished, call nextFile() to load the
         * next file in the list.
         *
         * @param {?Error} err
         * @param {string} data File's contents
         * @param {string} filename File that was just loaded
         */
        function whenDone(err, data, filename) {
            var result;

            /**
             * Start the processing of the next file.
             */
            function nextFile() {
                files.shift();

                if (files.length) {
                    readFile(files[0], options, whenDone);
                } else if (completionCallback) {
                    completionCallback();
                }
            }

            if (callback.length === 4) {
                // Handle a "done" parameter for async callbacks
                callback(err, data, filename, nextFile);
            } else {
                result = callback(err, data, filename);

                if (result && typeof result === 'object' && typeof result.then === 'function') {
                    // Load the next file after promise resolution/error
                    result.then(nextFile, nextFile);
                } else {
                    // Load the next file immediately
                    nextFile();
                }
            }
        }

        readFile(files[0], options, whenDone);
    }

    /**
     * Argument sanitizer for readFileList.
     *
     * @param {Array.<string>|string} [files]
     * @param {Object} [options]
     * @param {Function} callback callback(err, data, filename, doneFn)
     * @param {Function} [completionCallback] completionCallback()
     * @throws Error Invalid parameters - no callback specified
     */
    function processFiles() {
        var argc, files, callback, completionCallback, options;

        argc = 0;
        files = [];
        options = {};
        completionCallback = null;

        if (typeof arguments[argc] === 'string' || Array.isArray(arguments[argc])) {
            files = [].concat(arguments[argc]);
            argc += 1;
        }

        if (typeof arguments[argc] === 'object') {
            options = arguments[argc];
            options += 1;
        }

        if (typeof arguments[argc] !== 'function') {
            throw new Error('Must specify callback function');
        }

        callback = arguments[argc];
        argc += 1;

        if (typeof arguments[argc] === 'function') {
            completionCallback = arguments[argc];
        }

        if (files.length === 0) {
            files.push('-');
        }

        if (!options.encoding) {
            options.encoding = 'utf8';
        }

        readFileList(files, options, callback, completionCallback);
    }

    module.exports = processFiles;
}());
