#!/usr/bin/env node

var processFiles;

processFiles = require('../');
setTimeout(function () {
    console.log('Took too long');
    process.exit();
}, 500);
processFiles(process.argv.slice(2), function (err, data, filename) {
    if (err) {
        console.log('Error reading ' + err.filename + ':  ' + err.code);
    } else {
        console.log('Success reading ' + filename + ':  ' + data.length + ' bytes');
    }
}, function () {
    console.log('Done reading files');
    process.exit();
});
