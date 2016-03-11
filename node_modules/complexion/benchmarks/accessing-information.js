/**
 * This compares how one can pass the current line and character position
 * around when making tokens.
 */

/*global module*/
(function () {
    'use strict';

    function TestClass(var1, var2) {
        this.var1 = var1;
        this.var2 = var2;
    }

    TestClass.prototype.passData = function (var1, var2) {
        this.passData2(var1, var2);
    };

    TestClass.prototype.passData2 = function (var1, var2) {
        this.passData3(var1, var2);
    };

    TestClass.prototype.passData3 = function (var1, var2) {
        return var1 + var2;
    };

    TestClass.prototype.viaObject = function () {
        this.viaObject2();
    };

    TestClass.prototype.viaObject2 = function () {
        this.viaObject3();
    };

    TestClass.prototype.viaObject3 = function () {
        return this.var1 + this.var2;
    };

    function test(method) {
        function run(var1, var2) {
            var context;

            context = new TestClass(var1, var2);
            context[method](var1, var2);
        }

        return function () {
            run(1, 1);
            run(2, 2);
            run(3, 4);
            run('a', 'b');
            run('c', 'd');
        };
    }

    module.exports = {
        name: "accessing information",
        tests: {
            'passing data': test('passData'),
            'via object': test('viaObject')
        }
    };
}());
