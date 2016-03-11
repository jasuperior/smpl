/*global beforeEach, describe, expect, it, jasmine, require*/
(function () {
    'use strict';

    var prettyJs;

    prettyJs = require('../');

    describe('prettyJs', function () {
        describe('BOM', function () {
            it('only works at the beginning', function () {
                expect(function () {
                    prettyJs(" \ufeff");
                }).toThrow('Unhandled token type UNKNOWN at line 1 col 2, offset 1');
            });
        });
        describe('case/default', function () {
            it('groups multiple cases together', function () {
                expect(prettyJs("switch (x) { case 1: case 2: default: case 3: y(); break; }")).toEqual("switch (x) {\n    case 1:\n    case 2:\n    default:\n    case 3:\n        y();\n        break;\n}");
            });
        });
        describe('for/function/if/switch', function () {
            it('adds a newline before for', function () {
                expect(prettyJs('x(); for(y=0;y<9;y++){x()}')).toEqual('x();\n\nfor (y = 0; y < 9; y ++) {\n    x()\n}');
            });
            it('adds a newline before function', function () {
                expect(prettyJs('x();function y(){}')).toEqual('x();\n\nfunction y() {}');
            });
            it('adds a newline before if', function () {
                expect(prettyJs('x();if(1)y();')).toEqual('x();\n\nif (1) y();');
            });
            it('adds a newline before switch', function () {
                expect(prettyJs('x();switch(y){}')).toEqual('x();\n\nswitch (y) {}');
            });
        });
        describe('else/catch', function () {
            it('puts else on the same line as the closing brace', function () {
                expect(prettyJs('if (x) { y(); } else if (z) { a(); } else { b(); }')).toEqual("if (x) {\n    y();\n} else if (z) {\n    a();\n} else {\n    b();\n}");
            });
            it('puts catch on the same line as the closing brace', function () {
                expect(prettyJs('try{x();}catch(e){y();}')).toEqual('try {\n    x();\n} catch (e) {\n    y();\n}');
            });
            it('puts else on its own line when not after a block', function () {
                expect(prettyJs('if(x)y();else z()')).toEqual('if (x) y();\nelse z()');
            });
        });
        describe('keyword handling', function () {
            it('treats keywords as properties', function () {
                expect(prettyJs('x.default().return().toString()')).toEqual('x.default().return().toString()');
            });
            it('builds objects with keywords as properties', function () {
                expect(prettyJs('{case:1,catch:1,default:1,toString:1}')).toEqual('{\n    case: 1,\n    catch: 1,\n    default: 1,\n    toString: 1\n}');
            });
            it('still works with switches', function () {
                expect(prettyJs('switch(x){case:1,default:1}')).toEqual('switch (x) {\n    case:\n        1,\n\n    default:\n        1\n}');
            });
        });
        describe('return/throw/try/while', function () {
            it('adds a newline before return', function () {
                expect(prettyJs('x();return y;')).toEqual('x();\n\nreturn y;');
            });
            it('adds a newline before throw', function () {
                expect(prettyJs('x();throw y;')).toEqual('x();\n\nthrow y;');
            });
            it('adds a newline before try', function () {
                expect(prettyJs('x();try {y()} catch (e) {}')).toEqual('x();\n\ntry {\n    y()\n} catch (e) {}');
            });
            it('adds a newline before while', function () {
                expect(prettyJs('x(); while (1){x()}')).toEqual('x();\n\nwhile (1) {\n    x()\n}');
            });
        });
        describe('var', function () {
            it('moves variables to be on the same line', function () {
                expect(prettyJs('var x,y\n,z,\na,\nb=true,\nc()')).toEqual('var x, y, z, a, b = true, c()');
            });
            it('indents correctly when a newline is forced', function () {
                expect(prettyJs('var x, // comment\ny;')).toEqual('var x,  // comment\n    y;');
            });
            it('increases the indent level', function () {
                expect(prettyJs('var f = function () {return true};f();')).toEqual('var f = function () {\n        return true\n    };\n\nf();');
            });
        });
        describe('multi-line comments', function () {
            it('standardizes newlines, adds stars, reindents', function () {
                expect(prettyJs('/*\na\n\rb\r\nc\nd*/')).toEqual('/*\n * a\n *\n * b\n * c\n * d*/');
            });
            it('keeps doc block closing **/ together', function () {
                expect(prettyJs('/** doc block **/')).toEqual('/** doc block **/');
            });
            it('handles comments already formatted correctly', function () {
                var correct;

                correct = "/* a\n * b c d\n */";
                expect(prettyJs(correct)).toEqual(correct);
            });
            it('preserves spacing (no spaces)', function () {
                var correct;

                correct = "/*global console*/";
                expect(prettyJs(correct)).toEqual(correct);
            });
            it('preserves spacing (with spaces)', function () {
                var correct;

                correct = "/* global console */";
                expect(prettyJs(correct)).toEqual(correct);
            });
        });
        describe('braces and brackets', function () {
            it('puts empty braces together', function () {
                expect(prettyJs('x({}, {y:true})')).toEqual('x({}, {\n    y: true\n})');
            });
            it('adds a newline after an if statement', function () {
                expect(prettyJs('if (1) {x();}x()')).toEqual('if (1) {\n    x();\n}\n\nx()');
            });
            it('adds a newline after a function', function () {
                expect(prettyJs('function x() {}\n\nx()')).toEqual('function x() {}\n\nx()');
            });
            it('adds newlines in array literals', function () {
                expect(prettyJs('[1]')).toEqual('[\n    1\n]');
            });
            it('removes newlines in empty array literals', function () {
                expect(prettyJs('[]')).toEqual('[]');
            });
            it('does not add newlines for array indexes', function () {
                expect(prettyJs('x[1]')).toEqual('x[1]');
            });
        });
        describe('colons', function () {
            it('ends the line in switches', function () {
                expect(prettyJs('switch(true){case 1:default:case 2:x()}')).toEqual('switch (true) {\n    case 1:\n    default:\n    case 2:\n        x()\n}');
            });
            it('does not end the line for ternary', function () {
                expect(prettyJs('return a?b:c;')).toEqual('return a ? b : c;');
            });
        });
        describe('commas', function () {
            it('does not indent a function by itself', function () {
                expect(prettyJs('a(function () {return 1;})')).toEqual('a(function () {\n    return 1;\n})');
            });
            it('will indent a function correctly for jslint when after a comma', function () {
                expect(prettyJs('a(b,function () {return 1;})')).toEqual('a(b, function () {\n    return 1;\n})');
            });
            it('fixes the context in ternarys', function () {
                expect(prettyJs('function () {return a([x],b?c:[d],[e]);}')).toEqual('function () {\n    return a([\n        x\n    ], b ? c : [\n        d\n    ], [\n        e\n    ]);\n}');
            });
        });
        describe('exclamation points!', function () {
            it('does not have any space afterwards!', function () {
                expect(prettyJs('a!b')).toEqual('a !b');
            });
        });
        describe('parenthesis', function () {
            it('indents functions and function calls', function () {
                expect(prettyJs('x = function(){return 7;};x();(function () {return 8;}());(x)();method[x]();')).toEqual('x = function () {\n    return 7;\n};\nx();\n(function () {\n    return 8;\n}());\n(x)();\nmethod[x]();');
            });
            it('sets context for "if"', function () {
                expect(prettyJs('if(x=y?z:true)x()')).toEqual('if (x = y ? z : true) x()');
            });
            it('sets context for "for"', function () {
                expect(prettyJs('for(i=1,j=x;i=(2+j<4);i=j?3:m(4,5)){}')).toEqual('for (i = 1, j = x; i = (2 + j < 4); i = j ? 3 : m(4, 5)) {}');
            });
        });
        describe('period', function () {
            it('removes whitespace before the period', function () {
                expect(prettyJs('x()\n    .then()')).toEqual('x().then()');
            });
        });
        describe('plus and minus', function () {
            describe('when NOT type conversion', function () {
                [
                    'x ',
                    'x[1] ',
                    'x() ',
                    '{}\n'
                ].forEach(function (inputPrefix) {
                    it('adds a space: ' + JSON.stringify(inputPrefix), function () {
                        expect(prettyJs(inputPrefix + '- y')).toEqual(inputPrefix + '- y');
                    });
                });
            });
            describe('with type conversion', function () {
                [
                    '',
                    'x = ',
                    'this ',
                    '.'
                ].forEach(function (inputPrefix) {
                    it('does not add a space: ' + JSON.stringify(inputPrefix), function () {
                        expect(prettyJs(inputPrefix + '- y')).toEqual(inputPrefix + '-y');
                    });
                });
            });
        });
        describe('question', function () {
            it('sets up the context for ternary', function () {
                expect(prettyJs('a?b:c')).toEqual('a ? b : c');
            });
        });
        describe('semicolons', function () {
            it('adds implicit semicolons', function () {
                expect(prettyJs('x\n++y')).toEqual('x;\n++ y');
            });
            it('adds two newlines after "var" line', function () {
                expect(prettyJs('var a;a=1')).toEqual('var a;\n\na = 1');
            });
            it('adds two newlines after "use strict"', function () {
                expect(prettyJs('"use strict";x()', {
                    convertStrings: false
                })).toEqual('"use strict";\n\nx()');
            });
            it('adds two newlines after \'use strict\'', function () {
                expect(prettyJs('\'use strict\';x()', {
                    convertStrings: false
                })).toEqual('\'use strict\';\n\nx()');
            });
            it('fixes context for logic blocks without a block', function () {
                expect(prettyJs('if (true) x(); y()')).toEqual('if (true) x();\ny()');
            });
        });
        describe('single-line comments', function () {
            it('does not add a newline if when starting with a comment', function () {
                expect(prettyJs('// comment')).toEqual('// comment');
            });
            it('pads and preserves same-line comments', function () {
                expect(prettyJs('var x, //comment blah\ny;')).toEqual('var x,  //comment blah\n    y;');
            });
            it('adds an extra newline after semicolons', function () {
                expect(prettyJs('var x;\n// comment')).toEqual('var x;\n\n// comment');
            });
            it('keeps comments on the same line when found that way', function () {
                expect(prettyJs('var x;// comment')).toEqual('var x;  // comment');
            });
            it('adds newlines before comments to clean up structure ({)', function () {
                expect(prettyJs('if(1){// comment')).toEqual('if (1) {\n    // comment');
            });
            it('adds newlines before comments to clean up structure ([)', function () {
                expect(prettyJs('x=[//stuff')).toEqual('x = [\n    //stuff');
            });
            it('adds newlines before comments to clean up structure ({)', function () {
                expect(prettyJs('if(1){// comment')).toEqual('if (1) {\n    // comment');
            });
            it('only has the one newline when starting blocks', function () {
                expect(prettyJs('{//one\n}//two')).toEqual('{\n    //one\n}  //two');
            });
            it('only has one newline between single-line comments', function () {
                expect(prettyJs('//one\n//two')).toEqual('//one\n//two');
            });
            it('adds a blank line between whole-line comment and one that shares a line', function () {
                expect(prettyJs('x() // one\n//two')).toEqual('x()  // one\n\n//two');
            });
        });
        describe('strings', function () {
            it('converts to double quotes with escaping', function () {
                expect(prettyJs('\'\\\\\\\'"\\\'"\\\'"\\\'\'', {
                    convertStrings: "double"
                })).toEqual('"\\\\\'\\"\'\\"\'\\"\'"');
            });
            it('converts to double quotes with escaping', function () {
                /*global console*/
                expect(prettyJs("\"\\\\\\\"'\\\"'\\\"'\\\"\"", {
                    convertStrings: "single"
                })).toEqual("'\\\\\"\\'\"\\'\"\\'\"'");
            });
        });
    });
}());
