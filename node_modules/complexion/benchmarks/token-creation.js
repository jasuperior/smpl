/*global module*/

(function () {
    'use strict';

    function test(method) {
        function run(type, content, offset, line, pos) {
            var o;

            o = {
                type: type,
                content: content,
                offset: offset
            };
            method(o, line, pos);
        }

        return function () {
            run('TEST', 'asdfasdfasdfasdfasdfasdfasdfasdf', 231, 333, 333);
            run('ELEPHANT', 'Wandering through the mire and darkness is something I sometimes do.', 123123, 22, 132);
            run('NUMBER', '123', 49284, 3214, 2);
        };
    }

    module.exports = {
        name: "adding to a token object",
        tests: {
            'adding two properties': test(function (token, line, pos) {
                token.line = line;
                token.pos = pos;
                return token;
            }),
            'defining a new object': test(function (token, line, pos) {
                var o;

                o = {
                    type: token.type,
                    content: token.content,
                    offset: token.offset,
                    line: line,
                    pos: pos
                };

                return o;
            })
        }
    };
}());
