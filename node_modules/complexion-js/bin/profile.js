#!/usr/bin/env node

var Complexion, complexion, EasyTable, fs;

EasyTable = require('easy-table');
Complexion = require('complexion');
fs = require('fs');
complexion = new Complexion();
require('complexion-time-map')(complexion);
require('..')(complexion);

if (!process.argv[2]) {
    console.error('Usage:');
    console.error('    profile.js filename');
    console.error('filename: the file to parse');
}

fs.readFile(process.argv[2], 'utf-8', function (err, data) {
    var last, start, table, tokenList;

    if (err) {
        throw err;
    }

    start = new Date();
    tokenList = complexion.tokenize(data.toString());
    console.log(tokenList.length + ' tokens in ' + ((new Date()) - start) + ' ms');
    last = null;
    table = new EasyTable();

    if (tokenList.some(function (token) {
        return token.type === 'UNKNOWN';
    })) {
        console.log('UNKNOWN TOKEN FOUND! - Bad parsing rules or invalid JavaScript');
    }

    complexion.timeMap.profiles.map(function (profile) {
        var stats;

        stats = {
            token: profile.name,
            ms: profile.elapsed.toFixed(2),
            avg: profile.average.toFixed(4),
            calls: profile.calls,
            matches: profile.calls
        };

        if (last) {
            last.matches -= stats.calls;
        }

        last = stats;

        return stats;
    }).map(function (stats) {
        Object.keys(stats).forEach(function (key) {
            table.cell(key, stats[key]);
        });
        table.newRow();
    });
    console.log(table.toString());
});
