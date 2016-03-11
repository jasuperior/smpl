/*global beforeEach, describe, expect, it, require, spyOn*/

(function () {
    'use strict';

    var childProcess, processFiles;

    childProcess = require('child_process');
    processFiles = require('../');

    describe('initialization', function () {
        it('exported a function', function () {
            expect(typeof processFiles).toBe('function');
        });
    });
    describe('bin/test.js', function () {
        function runCmd(echo, args, callback) {
            var cmd;

            cmd = 'bin/test.js';

            if (echo) {
                cmd = 'echo "' + echo + '" | ' + cmd;
            }

            if (args) {
                cmd += ' ' + args;
            }

            childProcess.exec(cmd, function (err, stdout) {
                /*jslint unparam:true*/
                stdout = stdout.trim(/\n/);
                callback(stdout.split('\n'));
            });
        }
        it('can time out', function (done) {
            runCmd(null, null, function (data) {
                expect(data).toEqual([
                    'Took too long'
                ]);
                done();
            });
        });
        it('reads a given file once', function (done) {
            runCmd(null, 'tests/test.txt', function (data) {
                expect(data).toEqual([
                    'Success reading tests/test.txt:  16 bytes',
                    'Done reading files'
                ]);
                done();
            });
        });
        it('reads a given file several times', function (done) {
            runCmd(null, 'tests/test.txt tests/test.txt tests/another.txt', function (data) {
                expect(data).toEqual([
                    'Success reading tests/test.txt:  16 bytes',
                    'Success reading tests/test.txt:  16 bytes',
                    'Success reading tests/another.txt:  22 bytes',
                    'Done reading files'
                ]);
                done();
            });
        });
        it('does not canonicalize paths', function (done) {
            runCmd(null, 'tests/../tests/../tests/test.txt', function (data) {
                expect(data).toEqual([
                    'Success reading tests/../tests/../tests/test.txt:  16 bytes',
                    'Done reading files'
                ]);
                done();
            });
        });
        it('errors for missing files', function (done) {
            runCmd(null, 'tests/missing.txt', function (data) {
                expect(data).toEqual([
                    'Error reading tests/missing.txt:  ENOENT',
                    'Done reading files'
                ]);
                done();
            });
        });
        it('reads from stdin with no files', function (done) {
            runCmd('holy smokes', null, function (data) {
                expect(data).toEqual([
                    'Success reading -:  12 bytes',
                    'Done reading files'
                ]);
                done();
            });
        });
        it('reads from stdin at the right time', function (done) {
            runCmd('stdin here', 'tests/test.txt - tests/another.txt', function (data) {
                expect(data).toEqual([
                    'Success reading tests/test.txt:  16 bytes',
                    'Success reading -:  11 bytes',
                    'Success reading tests/another.txt:  22 bytes',
                    'Done reading files'
                ]);
                done();
            });
        });
        it('reads from stdin only once', function (done) {
            runCmd('words', '- -', function (data) {
                expect(data).toEqual([
                    'Success reading -:  6 bytes',
                    'Error reading -:  ESTDIN',
                    'Done reading files'
                ]);
                done();
            });
        });
    });
}());
