/*global module*/

(function () {
    'use strict';

    function test(method) {
        return function () {
            method('asdfasdfasdfasdfasdfasdfasdfasdf');
            method('Wandering through the mire and darkness is something I sometimes do.');
            method('123');
        };
    }

    module.exports = {
        name: "walking the length of a string",
        tests: {
            'using a variable': test(function (string) {
                var i, j, len;

                j = 0;
                len = string.length;

                for (i = 0; i < len; i += 1) {
                    j += 1;
                }

                return j;
            }),
            'using a property': test(function (string) {
                var i, j;

                j = 0;

                for (i = 0; i < string.length; i += 1) {
                    j += 1;
                }

                return j;
            })
        }
    };
}());
