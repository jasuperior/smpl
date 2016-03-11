/*global module*/

(function () {
    'use strict';

    function test(method) {
        return function () {
            method('a');
            method('z');
            method(' ');
        };
    }

    var hash, i, letters;

    hash = {};
    letters = 'abcdefghijklmnopqrstuvwxyz';

    for (i = 0; i < letters.length; i += 1) {
        hash[letters.charAt(0)] = true;
    }

    module.exports = {
        name: "find if a character is in a set",
        tests: {
            'indexOf !== -1': test(function (c) {
                return letters.indexOf(c) !== -1;
            }),
            '~indexOf': test(function (c) {
                /*jslint bitwise:true*/
                return ~letters.indexOf(c);
            }),
            '=== letter': test(function (c) {
                /*jslint bitwise:false*/
                return c === 'a' || c === 'b' || c === 'c' || c === 'd' || c === 'e' || c === 'f' || c === 'g' || c === 'h' || c === 'i' || c === 'j' || c === 'k' || c === 'l' || c === 'm' || c === 'n' || c === 'o' || c === 'p' || c === 'q' || c === 'r' || c === 's' || c === 't' || c === 'u' || c === 'v' || c === 'w' || c === 'x' || c === 'y' || c === 'z';
            }),
            '>= a and <= z': test(function (c) {
                return c >= 'a' && c <= 'z';
            }),
            'hash': test(function (c) {
                return hash[c];
            })
        }
    };
}());
