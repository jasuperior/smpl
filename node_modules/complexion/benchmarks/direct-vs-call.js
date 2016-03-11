/*global module*/
(function () {
    'use strict';

    function myCallback() {
        return undefined;
    }

    module.exports = {
        name: "calling a function",
        tests: {
            'direct': function () {
                myCallback();
            },
            'call': function () {
                myCallback.call();
            }
        }
    };
}());
