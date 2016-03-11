/*global module*/
(function () {
    'use strict';

    function test(method) {
        var values;

        function addValue(str) {
            values.push(str[method](0));
        }

        values = [];
        addValue('a');
        addValue('b');
        addValue('m');
        addValue('m');
        addValue('T');
        addValue('T');
        addValue(' ');
        addValue('*');

        return function () {
            var i, successCount;

            successCount = 0;

            for (i = 0; i < values.length; i += 2) {
                if (values[i] === values[i + 1]) {
                    successCount += 1;
                }
            }

            return successCount;
        };
    }

    module.exports = {
        name: "comparison of values",
        tests: {
            'char comparison': test('charAt'),
            'int comparison': test('charCodeAt')
        }
    };
}());
