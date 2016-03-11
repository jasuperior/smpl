/*global beforeEach, describe, expect, it, jasmine, require*/
(function () {
    'use strict';

    var prettyJs;

    prettyJs = require('../');

    describe('options', function () {
        describe('bom', function () {
            it('adds when "true"', function () {
                expect(prettyJs("return", {
                    bom: true
                })).toEqual("\ufeffreturn");
            });
            it('avoids double adding when "true"', function () {
                expect(prettyJs("\ufeffreturn", {
                    bom: true
                })).toEqual("\ufeffreturn");
            });
            it('removes when false', function () {
                expect(prettyJs("\ufeffreturn", {
                    bom: false
                })).toEqual("return");
            });
            it('does not care if there is no token to remove', function () {
                expect(prettyJs("return", {
                    bom: false
                })).toEqual("return");
            });
            it('keeps marker when null', function () {
                expect(prettyJs("\ufeffreturn", {
                    bom: null
                })).toEqual("\ufeffreturn");
            });
            it('will not add one when null', function () {
                expect(prettyJs("return", {
                    bom: null
                })).toEqual("return");
            });
            it('defaults to "false"', function () {
                expect(prettyJs("\ufeffreturn")).toEqual("return");
            });
        });
        describe('commentSpace', function () {
            it('adds two spaces by default', function () {
                expect(prettyJs("true// comment")).toEqual("true  // comment");
            });
            it('uses commentSpace when defined', function () {
                expect(prettyJs("true// comment", {
                    commentSpace: "\t"
                })).toEqual("true\t// comment");
            });
        });
        describe('convertStrings', function () {
            it('converts to double by default', function () {
                expect(prettyJs("'a' + \"b\"")).toEqual("\"a\" + \"b\"");
            });
            it('converts to double', function () {
                expect(prettyJs("'a' + \"b\"", {
                    convertStrings: "double"
                })).toEqual("\"a\" + \"b\"");
            });
            it('converts to single', function () {
                expect(prettyJs("'a' + \"b\"", {
                    convertStrings: "single"
                })).toEqual("'a' + 'b'");
            });
            it('can leave them alone', function () {
                expect(prettyJs("'a' + \"b\"", {
                    convertStrings: false
                })).toEqual("'a' + \"b\"");
            });
        });
        describe('elseNewline', function () {
            it('adds a newline before else', function () {
                expect(prettyJs("if (1) {} else {}", {
                    elseNewline: true
                })).toEqual("if (1) {}\nelse {}");
            });
            it('can disable the newline', function () {
                expect(prettyJs("if (1) {} else {}", {
                    elseNewline: false
                })).toEqual("if (1) {} else {}");
            });
            it('is disabled by default', function () {
                expect(prettyJs("if (1) {} else {}")).toEqual("if (1) {} else {}");
            });
        });
        describe('indent', function () {
            it('indents with four spaces by default', function () {
                expect(prettyJs("{true}")).toEqual("{\n    true\n}");
            });
            it('can indent with tabs', function () {
                expect(prettyJs("{true}", {
                    indent: "\t"
                })).toEqual("{\n\ttrue\n}");
            });
        });
        describe('jslint', function () {
            [
                {
                    disabled: 'switch (x) {\n    case "x":\n        y()\n}',
                    enabled: 'switch (x) {\ncase "x":\n    y()\n}',
                    input: 'switch(x){case "x": y()}',
                    name: 'indentation of "case"'
                },
                {
                    // This only tests jslint's impact on quoteProperties
                    disabled: '{\n    _xyz: true\n}',
                    enabled: '{\n    "_xyz": true\n}',
                    input: '{"_xyz":true}',
                    name: 'object property name unquoting'
                }
            ].forEach(function (scenario) {
                describe(scenario.name, function () {
                    it('behaves normally when disabled', function () {
                        expect(prettyJs(scenario.input, {
                            jslint: false
                        })).toEqual(scenario.disabled);
                    });
                    it('changes when enabled', function () {
                        expect(prettyJs(scenario.input, {
                            jslint: true
                        })).toEqual(scenario.enabled);
                    });
                    it('is disabled by default', function () {
                        expect(prettyJs(scenario.input)).toEqual(scenario.disabled);
                    });
                });
            });
        });
        describe('newline', function () {
            it("adds \\n by default", function () {
                expect(prettyJs("a();b();")).toEqual("a();\nb();");
            });
            it("can be changed to anything", function () {
                expect(prettyJs("a();b();", {
                    newline: "\r\n"
                })).toEqual("a();\r\nb();");
            });
        });
        describe('noSpaceAfterIf', function () {
            it('adds a space by default', function () {
                expect(prettyJs("if()")).toEqual("if ()");
            });
            it("removes a space", function () {
                expect(prettyJs("if ()", {
                    noSpaceAfterIf: true
                })).toEqual("if()");
            });
        });
        describe('noSpaceAfterFor', function () {
            it('adds a space by default', function () {
                expect(prettyJs("for()")).toEqual("for ()");
            });
            it("removes a space", function () {
                expect(prettyJs("for ()", {
                    noSpaceAfterFor: true
                })).toEqual("for()");
            });
        });
        describe('noSpaceAfterFunction', function () {
            it('adds a space by default', function () {
                expect(prettyJs("function()")).toEqual("function ()");
            });
            it("removes a space", function () {
                expect(prettyJs("function ()", {
                    noSpaceAfterFunction: true
                })).toEqual("function()");
            });
        });
        describe('noSpaceAfterSwitch', function () {
            it('adds a space by default', function () {
                expect(prettyJs("switch()")).toEqual("switch ()");
            });
            it("removes a space", function () {
                expect(prettyJs("switch ()", {
                    noSpaceAfterSwitch: true
                })).toEqual("switch()");
            });
        });
        describe('noSpaceWithIncDec', function () {
            it('adds a space by default', function () {
                expect(prettyJs('a++;--b')).toEqual('a ++;\n-- b');
            });
            it('removes a space', function () {
                expect(prettyJs('a ++;\n-- b', {
                    noSpaceWithIncDec: true
                })).toEqual('a++;\n--b');
            });
        });
        describe('quoteProperties', function () {
            it('can unquote properties', function () {
                expect(prettyJs("{'a':1,\"b\":2}", {
                    quoteProperties: false
                })).toEqual("{\n    a: 1,\n    b: 2\n}");
            });
            it('can single quote all properties', function () {
                expect(prettyJs("{a:1}", {
                    convertStrings: 'single',
                    quoteProperties: true
                })).toEqual("{\n    'a': 1\n}");
            });
            it('can double quote all properties', function () {
                expect(prettyJs("{a:1}", {
                    convertStrings: 'double',
                    quoteProperties: true
                })).toEqual("{\n    \"a\": 1\n}");
            });
            it('can preserve existing quotes', function () {
                expect(prettyJs("{'a':1,\"b\":2}", {
                    /* When convertStrings is enabled, it alters the resulting
                     * quotes around the property names.  Disabling here to
                     * ensure the test does what's expected.
                     */
                    convertStrings: null,
                    quoteProperties: null
                })).toEqual("{\n    'a': 1,\n    \"b\": 2\n}");
            });
            it('will remove by default', function () {
                expect(prettyJs("{'a':1,\"b\":2}", {
                    quoteProperties: false
                })).toEqual("{\n    a: 1,\n    b: 2\n}");
            });
        });
        describe('trailingNewline', function () {
            it('can add trailing newline', function () {
                expect(prettyJs("function () {console.log(\"hello world\");}", {
                    trailingNewline: true
                })).toEqual("function () {\n    console.log(\"hello world\");\n}\n");
            });
            it('can remove trailing newline', function () {
                expect(prettyJs("function () {console.log(\"hello world\");}\n", {
                    trailingNewline: false
                })).toEqual("function () {\n    console.log(\"hello world\");\n}");
            });
            it('will remove by default', function () {
                expect(prettyJs("function () {console.log(\"hello world\");}\n", {
                })).toEqual("function () {\n    console.log(\"hello world\");\n}");
            });
            it('adds newline for single line input', function () {
                expect(prettyJs("true", {
                    trailingNewline: true
                })).toEqual("true\n");
            });
            it('doesn\'t add multiple newlines', function () {
                expect(prettyJs("true\n", {
                    trailingNewline: true
                })).toEqual("true\n");
            });
        });
    });
}());
