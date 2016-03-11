/*global module*/

(function () {
    'use strict';

    function test(fn) {
        return function () {
            fn('asfasdfksadlkfjasdflkj', 12);
        };
    }

    module.exports = {
        name: "single letter substrings",
        tests: {
            'charAt()': test(function (string, index) {
                return string.charAt(index);
            }),
            'charCodeAt()': test(function (string, index) {
                return string.charCodeAt(index);
            }),
            'substr()': test(function (string, index) {
                return string.substr(index, 1);
            }),
            'array index': test(function (string, index) {
                return string[index];
            })
        }
    };
}());
