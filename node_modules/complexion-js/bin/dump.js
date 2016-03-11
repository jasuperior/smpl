#!/usr/bin/env node

var Complexion, complexion, fs;

Complexion = require('complexion');
complexion = new Complexion();
fs = require('fs');
require('..')(complexion);

if (!process.argv[2]) {
    console.error('Usage:');
    console.error('    dump.js filename');
    console.error('filename: the file to parse');
}

fs.readFile(process.argv[2], 'utf-8', function (err, data) {
    var result;

    if (err) {
        throw err;
    }

    result = complexion.tokenize(data.toString());
    result.forEach(function (token) {
        var message;

        message = token.type + ' o:' + token.offset + " l:" + token.line + " c:" + token.col + " ";
        message += JSON.stringify(token.content);
        console.log(message);
    });
});
