#!/usr/bin/env node

var Complexion, complexion, fs, iterations;

Complexion = require('complexion');
complexion = new Complexion();
fs = require('fs');
require('..')(complexion);

if (!process.argv[2]) {
    console.error('Usage:');
    console.error('    timer.js filename [iterations]');
    console.error('filename: the file to parse');
    console.error('iterations: the number of iterations, default is 1');
}

iterations = (+process.argv[3]) || 1;
iterations = Math.max(iterations, 1);

fs.readFile(process.argv[2], 'utf-8', function (err, data) {
    var end, loops, start;

    function getTime() {
        var hrTime;

        hrTime = process.hrtime();
        return hrTime[0] + hrTime[1] / 1e9;
    }

    if (err) {
        throw err;
    }

    start = getTime();

    for (loops = 0; loops < iterations; loops += 1) {
        complexion.tokenize(data.toString());
    }

    end = getTime();
    console.log(end - start);
});
