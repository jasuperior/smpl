/*global module*/

(function () {
    'use strict';

    var testData;

    function test(method) {
        return function () {
            testData.forEach(function (dataSet) {
                return method(dataSet[0], dataSet[1], dataSet[2]);
            });
        };
    }

    function AAA() {
        this.type = AAA;
        this.typeStr = 'AAA';
    }

    function BBB() {
        this.type = BBB;
        this.typeStr = 'BBB';
    }

    testData = [
        [
            new AAA(),
            BBB,
            'BBB'
        ],
        [
            new BBB(),
            AAA,
            'AAA'
        ],
        [
            new AAA(),
            AAA,
            'AAA'
        ]
    ];
    testData[0][3] = testData[1][0]; // Mismatch
    testData[1][3] = testData[0][0]; // Mismatch
    testData[2][3] = testData[2][0]; // Match
    module.exports = {
        name: "comparing token types",
        tests: {
            'instanceof': test(function (obj, desiredType) {
                return obj instanceof desiredType;
            }),
            'object property': test(function (obj, desiredType) {
                return obj.type === desiredType;
            }),
            'string property': test(function (obj, desiredType, string) {
                /*jslint unparam:true*/
                return obj.typeStr === string;
            })
        }
    };
}());
