/*global module*/

(function () {
    'use strict';

    function test(fn) {
        return function () {
            fn("abcdabcd", "abcdabcd", 'a');
        };
    }

    module.exports = {
        name: "string comparison",
        tests: {
            'full string': test(function (a, b) {
                return a === b;
            }),
            'first letter shortcut': test(function (a, b, firstLetter) {
                if (firstLetter !== a.charAt(0)) {
                    return;
                }

                return a === b;
            })
        }
    };
}());
