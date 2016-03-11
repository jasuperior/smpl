/*global beforeEach, describe, expect, it, require, spyOn*/

(function () {
    'use strict';

    var Complexion, complexionJs;

    Complexion = require('complexion');
    complexionJs = require('../');

    describe('initialization', function () {
        it('initializes without errors', function () {
            var complexion, tokenFactory;
            complexion = new Complexion();
            spyOn(complexion, 'setTokenFactory').andCallFake(function (factory) {
                tokenFactory = factory;
            });
            complexionJs(complexion);
            expect(typeof tokenFactory).toBe('function');
        });
    });
    describe('tokenization', function () {
        var tokenize;

        function makeComplexion(options) {
            var complexion;

            complexion = new Complexion();
            complexionJs(complexion, options);

            return complexion;
        }

        beforeEach(function () {
            tokenize = function (str, options) {
                var complexion;

                complexion = makeComplexion(options);

                return complexion.tokenize(str).map(function (token) {
                    return token.type + ':' + token.content;
                });
            };
        });
        describe('BOM', function () {
            it('matches BOM by default', function () {
                expect(tokenize('\ufeff ')).toEqual([
                    'BOM:\ufeff',
                    'WHITESPACE: '
                ]);
            });
            it('only matches BOM when at the beginning', function () {
                expect(tokenize(' \ufeff')).toEqual([
                    'WHITESPACE: ',
                    'UNKNOWN:\ufeff'
                ]);
            });
            it('matching can be disabled', function () {
                expect(tokenize('\ufeff ', {
                    bom: false
                })).toEqual([
                    'UNKNOWN:\ufeff',
                    'WHITESPACE: '
                ]);
            });
        });
        describe('BOOLEAN_LITERAL', function () {
            it('matches "true"', function () {
                expect(tokenize('true')).toEqual([
                    'BOOLEAN_LITERAL:true'
                ]);
            });
            it('matches "false"', function () {
                expect(tokenize('false')).toEqual([
                    'BOOLEAN_LITERAL:false'
                ]);
            });
            it('is case sensitive', function () {
                expect(tokenize('TRUE')).toEqual([
                    'IDENTIFIER_NAME:TRUE'
                ]);
            });
        });
        describe('IDENTIFIER_NAME', function () {
            it('matches a non-keyword', function () {
                expect(tokenize('_elephant2')).toEqual([
                    'IDENTIFIER_NAME:_elephant2'
                ]);
            });
            it('does not match invalid leading characters', function () {
                expect(tokenize('9elephant')).toEqual([
                    'NUMERIC_LITERAL:9',
                    'IDENTIFIER_NAME:elephant'
                ]);
            });
            it('does not think toString is a keyword', function () {
                expect(tokenize('toString')).toEqual([
                    'IDENTIFIER_NAME:toString'
                ]);
            });
            it('flags keywords as keywords', function () {
                expect(tokenize('default')).toEqual([
                    'KEYWORD:default'
                ]);
            });
        });
        describe('IMPLICIT_SEMICOLON', function () {
            it('is added when the flag is set', function () {
                // A more thorough test will be under PUNCTUATOR and
                // LINE_TERMINATOR
                expect(tokenize('i\n++\ni')).toEqual([
                    'IDENTIFIER_NAME:i',
                    'LINE_TERMINATOR:\n',
                    'IMPLICIT_SEMICOLON:',
                    'PUNCTUATOR:++',
                    'LINE_TERMINATOR:\n',
                    'IDENTIFIER_NAME:i'
                ]);
            });
            it('is not added when a semicolon exists', function () {
                expect(tokenize('a++; \n--b')).toEqual([
                    'IDENTIFIER_NAME:a',
                    'PUNCTUATOR:++',
                    'PUNCTUATOR:;',
                    'WHITESPACE: ',
                    'LINE_TERMINATOR:\n',
                    'PUNCTUATOR:--',
                    'IDENTIFIER_NAME:b'
                ]);
            });
        });
        describe('KEYWORD', function () {
            it('remembers a keyword from IDENTIFIER_NAME that is not a boolean', function () {
                expect(tokenize('function')).toEqual([
                    'KEYWORD:function'
                ]);
            });
            it('is case sensitive', function () {
                expect(tokenize('FUNCTION')).toEqual([
                    'IDENTIFIER_NAME:FUNCTION'
                ]);
            });
        });
        describe('LINE_TERMINATOR', function () {
            it('matches DOS newlines', function () {
                expect(tokenize("\r\n")).toEqual([
                    'LINE_TERMINATOR:\r\n'
                ]);
            });
            it('matches Unix newlines', function () {
                expect(tokenize("\n")).toEqual([
                    'LINE_TERMINATOR:\n'
                ]);
            });
            it('matches old Mac newlines', function () {
                expect(tokenize("\r")).toEqual([
                    'LINE_TERMINATOR:\r'
                ]);
            });
            it('matches a newline combination', function () {
                expect(tokenize("\n\r\r\n\r")).toEqual([
                    'LINE_TERMINATOR:\n',
                    'LINE_TERMINATOR:\r',
                    'LINE_TERMINATOR:\r\n',
                    'LINE_TERMINATOR:\r'
                ]);
            });
            it('matches Unicode line separator', function () {
                expect(tokenize("\u2028")).toEqual([
                    'LINE_TERMINATOR:\u2028'
                ]);
            });
            it('matches Unicode paragraph separator', function () {
                expect(tokenize("\u2029")).toEqual([
                    'LINE_TERMINATOR:\u2029'
                ]);
            });
            [
                'break',
                'continue',
                'return',
                'throw'
            ].forEach(function (keyword) {
                it('adds an implied semicolon after ' + keyword, function () {
                    expect(tokenize(keyword + "\n")).toEqual([
                        'KEYWORD:' + keyword,
                        'IMPLICIT_SEMICOLON:',
                        'LINE_TERMINATOR:\n'
                    ]);
                });
            });
        });
        describe('MULTI_LINE_COMMENT', function () {
            it('matches comments', function () {
                expect(tokenize('/**\n *\n **/')).toEqual([
                    'MULTI_LINE_COMMENT:/**\n *\n **/'
                ]);
            });
            it('handles nexted comments correctly', function () {
                expect(tokenize('/* /* */ */')).toEqual([
                    'MULTI_LINE_COMMENT:/* /* */',
                    'WHITESPACE: ',
                    'PUNCTUATOR:*',
                    'PUNCTUATOR:/'
                ]);
            });
            it('is not fooled by a star nor a slash', function () {
                expect(tokenize('/* * / */')).toEqual([
                    'MULTI_LINE_COMMENT:/* * / */'
                ]);
            });
        });
        describe('NULL_LITERAL', function () {
            it('matches "null"', function () {
                expect(tokenize('null')).toEqual([
                    'NULL_LITERAL:null'
                ]);
            });
        });
        describe('NUMERIC_LITERAL', function () {
            [
                '123',
                '123.456',
                '.345',
                '0.345',
                '.2e+5',
                '5E-3',
                '1E3',
                '034',
                '0xf',
                '0xfe',
                '0xfeedbeef70a11'
            ].forEach(function (numberString) {
                it('matches ' + numberString, function () {
                    expect(tokenize(numberString)).toEqual([
                        'NUMERIC_LITERAL:' + numberString
                    ]);
                });
            });
            it('matches tricky numbers', function () {
                expect(tokenize('12.34.56.')).toEqual([
                    'NUMERIC_LITERAL:12.34',
                    'NUMERIC_LITERAL:.56',
                    'PUNCTUATOR:.'
                ]);
            });
            it('requires more than a period', function () {
                expect(tokenize('.')).toEqual([
                    'PUNCTUATOR:.'
                ]);
            });
            it('needs a number after the E for an exponent - 1E', function () {
                expect(tokenize('1E')).toEqual([
                    'NUMERIC_LITERAL:1',
                    'IDENTIFIER_NAME:E'
                ]);
            });
            it('needs a number after the E for an exponent - 1e+', function () {
                expect(tokenize('1e+')).toEqual([
                    'NUMERIC_LITERAL:1',
                    'IDENTIFIER_NAME:e',
                    'PUNCTUATOR:+'
                ]);
            });
            it('does not allow exponents with decimals', function () {
                expect(tokenize('1e+1.2')).toEqual([
                    'NUMERIC_LITERAL:1e+1',
                    'NUMERIC_LITERAL:.2'
                ]);
            });
        });
        describe('PUNCTUATOR', function () {
            it('match a complex string correctly', function () {
                expect(tokenize('[+++++]/===!====')).toEqual([
                    'PUNCTUATOR:[',
                    'PUNCTUATOR:++',
                    'PUNCTUATOR:++',
                    'PUNCTUATOR:+',
                    'PUNCTUATOR:]',
                    'PUNCTUATOR:/=',
                    'PUNCTUATOR:==',
                    'PUNCTUATOR:!==',
                    'PUNCTUATOR:=='
                ]);
            });
            it('adds implicit semicolons', function () {
                expect(tokenize('i\n++')).toEqual([
                    'IDENTIFIER_NAME:i',
                    'LINE_TERMINATOR:\n',
                    'IMPLICIT_SEMICOLON:',
                    'PUNCTUATOR:++'
                ]);
            });
        });
        describe('REGULAR_EXPRESSION_LITERAL', function () {
            describe('based on context', function () {
                it('is allowed after return', function () {
                    expect(tokenize('return/regexp/;')).toEqual([
                        'KEYWORD:return',
                        'REGULAR_EXPRESSION_LITERAL:/regexp/',
                        'PUNCTUATOR:;'
                    ]);
                });
                [
                    '(',
                    ',',
                    '=',
                    '==',
                    '===',
                    '!=',
                    '!==',
                    ';',
                    '{',
                    '['
                ].forEach(function (punctuator) {
                    it('is allowed after ' + punctuator, function () {
                        expect(tokenize('x' + punctuator + '/regexp/;')).toEqual([
                            'IDENTIFIER_NAME:x',
                            'PUNCTUATOR:' + punctuator,
                            'REGULAR_EXPRESSION_LITERAL:/regexp/',
                            'PUNCTUATOR:;'
                        ]);
                    });
                });
                [
                    '}',
                    ')',
                    ']',
                    'x',
                    '77',
                    'this'
                ].forEach(function (before) {
                    it('is not allowed after ' + JSON.stringify(before), function () {
                        expect(tokenize(before + '/regexp/;')[1]).toEqual('PUNCTUATOR:/');
                    });
                });
            });
        });
        describe('SHEBANG', function () {
            it('is allowed by default', function () {
                expect(tokenize('#!/usr/bin/env node\r\ntesting();')[0]).toEqual('SHEBANG:#!/usr/bin/env node');
            });
            it('can be used after a BOM', function () {
                var result;

                result = tokenize('\ufeff#!/usr/bin/env node\r\ntesting();');
                expect(result[0]).toEqual('BOM:\ufeff');
                expect(result[1]).toEqual('SHEBANG:#!/usr/bin/env node');
            });
            it('can be disabled', function () {
                expect(tokenize('#!/usr/bin/env node\r\ntesting();', {
                    shebang: false
                })[0]).toEqual('UNKNOWN:#');
            });
            it('only works as the first character', function () {
                expect(tokenize(' #!/usr/bin/env node\r\ntesting();')[0]).toEqual('WHITESPACE: ');
            });
        });
        describe('SINGLE_LINE_COMMENT', function () {
            it('detects lines with comments', function () {
                expect(tokenize('//comment1\nx(); // comment2\n// comment3')).toEqual([
                    'SINGLE_LINE_COMMENT://comment1',
                    'LINE_TERMINATOR:\n',
                    'IDENTIFIER_NAME:x',
                    'PUNCTUATOR:(',
                    'PUNCTUATOR:)',
                    'PUNCTUATOR:;',
                    'WHITESPACE: ',
                    'SINGLE_LINE_COMMENT:// comment2',
                    'LINE_TERMINATOR:\n',
                    'SINGLE_LINE_COMMENT:// comment3'
                ]);
            });
        });
        describe('STRING_LITERAL', function () {
            [
                '""',  // Empty, double quotes
                "'\\r\\n'",  // Properly escaped newlines in single quotes
                "'\\0'",  // NULL
                "'\\xfF\\u0123\\12\\012\\321'",  // Escaped characters
                "'random string \\a\\b\\c\\d\\e'"  // Letters that do not need escaping
            ].forEach(function (str) {
                it('matches a valid string: ' + JSON.stringify(str), function () {
                    var result;

                    result = tokenize(str + 'xyz');
                    expect(result[0]).toEqual('STRING_LITERAL:' + str);
                });
            });
            [
                '"\n"',  // Must not have a newline
                "'",  // Must be closed
                "\"'",  // Must be properly closed
                "'\\\n'"  // Can not escape a newline character
            ].forEach(function (str) {
                it('does not match an invalid string: ' + JSON.stringify(str), function () {
                    var result;

                    result = tokenize(str + 'xyz');
                    expect(result[0]).toEqual('UNKNOWN:' + str.charAt(0));
                });
            });
        });
        describe('UNKNOWN', function () {
            it('matches odd characters', function () {
                // Start with a hash but not a shebang.
                // Include a quote but no matching quote.
                expect(tokenize('#"')).toEqual([
                    'UNKNOWN:#',
                    'UNKNOWN:"'
                ]);
            });
        });
        describe('WHITESPACE', function () {
            it('matches a single character', function () {
                expect(tokenize(' ')).toEqual([
                    'WHITESPACE: '
                ]);
            });
            it('matches a s series of whitespace characters', function () {
                // tab, vertical tab, form feed, space, non breaking space
                expect(tokenize('\t\x0b\x0c \xa0')).toEqual([
                    'WHITESPACE:\t\x0b\x0c \xa0'
                ]);
            });
        });
        describe('"end" event post-processing', function () {
            describe('converting keywords to identifier names', function () {
                it('converts keywords in objects', function () {
                    // Does not trigger behavior with "default"
                    expect(tokenize('{default toString}')).toEqual([
                        'PUNCTUATOR:{',
                        'KEYWORD:default',
                        'WHITESPACE: ',
                        'IDENTIFIER_NAME:toString',
                        'PUNCTUATOR:}'
                    ]);

                    // Still won't trigger behavior with "default"
                    expect(tokenize('return {default:toString};')).toEqual([
                        'KEYWORD:return',
                        'WHITESPACE: ',
                        'PUNCTUATOR:{',
                        'KEYWORD:default',
                        'PUNCTUATOR::',
                        'IDENTIFIER_NAME:toString',
                        'PUNCTUATOR:}',
                        'PUNCTUATOR:;'
                    ]);
                });
                it('converts keywords as property names', function () {
                    // Does not trigger behavior
                    expect(tokenize('x return default')).toEqual([
                        'IDENTIFIER_NAME:x',
                        'WHITESPACE: ',
                        'KEYWORD:return',
                        'WHITESPACE: ',
                        'KEYWORD:default'
                    ]);

                    // Will trigger behavior
                    expect(tokenize('x.return.default=[]')).toEqual([
                        'IDENTIFIER_NAME:x',
                        'PUNCTUATOR:.',
                        'IDENTIFIER_NAME:return',
                        'PUNCTUATOR:.',
                        'IDENTIFIER_NAME:default',
                        'PUNCTUATOR:=',
                        'PUNCTUATOR:[',
                        'PUNCTUATOR:]'
                    ]);
                });
            });
        });
    });
    describe('ComplexionJsToken', function () {
        var token;

        beforeEach(function () {
            var complexion, tokenFactory;
            complexion = new Complexion();
            spyOn(complexion, 'setTokenFactory').andCallFake(function (factory) {
                tokenFactory = factory;
            });
            complexionJs(complexion);
            token = tokenFactory({
                line: 1,
                col: 1,
                offset: 0,
                type: 'TOKEN',
                content: ''
            });
        });
        describe('isAnyType()', function () {
            it('matches one in the array', function () {
                expect(token.isAnyType([
                    'TOKEN',
                    'A'
                ])).toBe(true);
            });
            it('does not match when it should not', function () {
                expect(token.isAnyType([
                    'A',
                    'B'
                ])).toBe(false);
            });
        });
        describe('isType()', function () {
            it('matches', function () {
                expect(token.isType('TOKEN')).toBe(true);
            });
            it('does not match when it should not', function () {
                expect(token.isType('NotToken')).toBe(false);
            });
        });
        describe('isUnimportant()', function () {
            var dataSet;
            dataSet = {
                BOM: true,
                LINE_TERMINATOR: true,
                MULTI_LINE_COMMENT: true,
                SINGLE_LINE_COMMENT: true,
                WHITESPACE: true,
                IDENTIFIER: false
            };
            Object.keys(dataSet).forEach(function (tokenName) {
                it('is correct for ' + tokenName, function () {
                    token.type = tokenName;
                    expect(token.isUnimportant()).toBe(dataSet[tokenName]);
                });
            });
        });
    });
}());
