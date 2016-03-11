/*jslint nomen:true*/
/*global beforeEach, describe, __dirname, expect, it, jasmine, require*/
/*jslint nomen:false*/
(function () {
    'use strict';

    var basePath, fs, prettyJs;

    /**
     * Adds a scenario file as an expectation
     *
     * Each scenario file is a JSON encoded object with the following
     * properties:
     *
     * input:  The input string
     * output:  The expected output string
     * options:  Options to pass to prettyJs
     *
     * @param {string} directoryEntry
     */
    function addScenario(directoryEntry) {
        var scenarioData;

        if (!directoryEntry.match(/\.json$/)) {
            return;
        }

        scenarioData = require(basePath + directoryEntry);
        it(directoryEntry + ' is formatted correctly', function () {
            expect(prettyJs(scenarioData.input, scenarioData.options)).toEqual(scenarioData.output);
        });
    }

    /*jslint nomen:true*/
    basePath = __dirname + '/fixtures/';
    /*jslint nomen:false*/
    fs = require('fs');
    prettyJs = require('../');

    describe('scenarios', function () {
        var files;

        /*jslint stupid:true*/
        files = fs.readdirSync(basePath);
        /*jslint stupid:false*/
        files.forEach(addScenario);
    });
}());
