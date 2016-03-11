/*global beforeEach, describe, expect, it, jasmine, require*/

(function () {
    'use strict';

    var Complexion;

    Complexion = require('../');

    describe('initialization', function () {
        it('constructs with "new" keyword', function () {
            var c;
            c = new Complexion();
            expect(c instanceof Complexion).toBe(true);
        });
        it('constructs without "new" keyword', function () {
            var c, asFunction;

            // Copy to a non-capitalized variable for jslint
            asFunction = Complexion;
            c = asFunction();
            expect(c instanceof Complexion).toBe(true);
        });
    });
    describe('Complexion.prototype.matchAny', function () {
        var matcher;

        beforeEach(function () {
            matcher = Complexion.prototype.matchAny();
        });
        it('returns a character at the beginning', function () {
            expect(matcher('abcd', 0)).toBe('a');
        });
        it('returns a character at the end', function () {
            expect(matcher('abcd', 3)).toBe('d');
        });
        it('returns null if too far forward', function () {
            expect(matcher('abcd', 4)).toBe(null);
        });
    });

    function matchStringTest(methodName, isInsensitive) {
        function addTestToFind(needle) {

            function seeking(result, haystack, offset) {
                describe('finding "' + needle + '" in "' + haystack + '" at ' + offset, function () {
                    var insensitiveHaystack, insensitiveResult, matcher, matcherWithNext, spy;

                    beforeEach(function () {
                        matcher = Complexion.prototype[methodName](needle);
                        spy = jasmine.createSpy('next matcher');
                        matcherWithNext = Complexion.prototype[methodName](needle, spy);
                        insensitiveHaystack = haystack.toUpperCase();

                        if (!isInsensitive || !result) {
                            insensitiveResult = null;
                        } else if (result) {
                            insensitiveResult = result.toUpperCase();
                        }
                    });
                    it('passes the normal test', function () {
                        expect(matcher(haystack, offset, [])).toBe(result);
                    });
                    it('passes the insensitive test', function () {
                        expect(matcher(insensitiveHaystack, offset, [])).toBe(insensitiveResult);
                    });
                    it('chains to the next matcher, which fails', function () {
                        spy.andReturn(null);
                        expect(matcherWithNext(haystack, offset, [])).toBe(null);

                        if (result) {
                            expect(spy).toHaveBeenCalledWith(haystack, offset, []);
                        } else {
                            expect(spy).not.toHaveBeenCalled();
                        }
                    });
                    it('chains to the next matcher, which returns "123"', function () {
                        spy.andReturn("123");

                        if (result) {
                            expect(matcherWithNext(haystack, offset, [])).toBe("123");
                            expect(spy).toHaveBeenCalledWith(haystack, offset, []);
                        } else {
                            expect(matcherWithNext(haystack, offset, [])).toBe(null);
                            expect(spy).not.toHaveBeenCalled();
                        }
                    });
                    it('insensitively chains to the next matcher, which fails', function () {
                        spy.andReturn(null);
                        expect(matcherWithNext(insensitiveHaystack, offset, [])).toBe(null);

                        if (insensitiveResult) {
                            expect(spy).toHaveBeenCalledWith(insensitiveHaystack, offset, []);
                        } else {
                            expect(spy).not.toHaveBeenCalled();
                        }
                    });
                    it('insensitively chains to the next matcher, which returns "123"', function () {
                        spy.andReturn("123");

                        if (insensitiveResult) {
                            expect(matcherWithNext(insensitiveHaystack, offset, [])).toBe("123");
                            expect(spy).toHaveBeenCalledWith(insensitiveHaystack, offset, []);
                        } else {
                            expect(matcherWithNext(insensitiveHaystack, offset, [])).toBe(null);
                            expect(spy).not.toHaveBeenCalled();
                        }
                    });
                });
            }

            seeking(needle, needle + 'asdfasdf', 0);
            seeking(needle, 'asdfasdf' + needle + 'asdfasdf', 8);
            seeking(needle, 'asdfasdf' + needle, 8);
            seeking(null, 'asdfasdf' + needle + 'asdfasdf', 7);
            seeking(null, 'asdfasdf' + needle + 'asdfasdf', 9);
        }

        describe('Complexion.prototype.' + methodName, function () {
            addTestToFind("g");
            addTestToFind("kthx");
        });
    }

    matchStringTest('matchString', false);
    matchStringTest('matchStringInsensitive', true);
    describe('Complexion.prototype.tokenize with no tokens', function () {
        var complexion;

        beforeEach(function () {
            complexion = new Complexion();
        });
        it('returns an empty array from an empty string', function () {
            expect(complexion.tokenize('')).toEqual([]);
        });
        it('throws if there is even a single character to tokenize', function () {
            expect(function () {
                complexion.tokenize('a');
            }).toThrow();
        });
    });
    describe('Complexion.prototype.tokenize with simple tokens', function () {
        var complexion, wsSpy, wsSpyCalls;

        beforeEach(function () {
            wsSpyCalls = [];
            wsSpy = jasmine.createSpy('Whitespace Matcher').andCallFake(function (str, offset, tokenList) {
                var c, l;

                wsSpyCalls.push([
                    str,
                    offset,
                    tokenList.slice()
                ]);
                l = offset;
                c = str.charAt(offset);

                while (c === ' ' || c === '\t' || c === '\r' || c === '\n') {
                    l += 1;
                    c = str.charAt(l);
                }

                if (l - offset === 0) {
                    return null;
                }

                return str.substr(offset, l - offset);
            });
            complexion = new Complexion();
            complexion.defineToken('A', complexion.matchString('a'));
            complexion.defineToken('B', complexion.matchString('b'));
            complexion.defineToken('WS', wsSpy);
        });
        it('returns an empty array from an empty string', function () {
            expect(complexion.tokenize('')).toEqual([]);
            expect(wsSpy).not.toHaveBeenCalled();
        });
        it('tokenizes a string of good tokens', function () {
            expect(complexion.tokenize('aabbabab')).toEqual([
                {
                    line: 1,
                    col: 1,
                    offset: 0,
                    type: 'A',
                    content: 'a'
                },
                {
                    line: 1,
                    col: 2,
                    offset: 1,
                    type: 'A',
                    content: 'a'
                },
                {
                    line: 1,
                    col: 3,
                    offset: 2,
                    type: 'B',
                    content: 'b'
                },
                {
                    line: 1,
                    col: 4,
                    offset: 3,
                    type: 'B',
                    content: 'b'
                },
                {
                    line: 1,
                    col: 5,
                    offset: 4,
                    type: 'A',
                    content: 'a'
                },
                {
                    line: 1,
                    col: 6,
                    offset: 5,
                    type: 'B',
                    content: 'b'
                },
                {
                    line: 1,
                    col: 7,
                    offset: 6,
                    type: 'A',
                    content: 'a'
                },
                {
                    line: 1,
                    col: 8,
                    offset: 7,
                    type: 'B',
                    content: 'b'
                }
            ]);
            expect(wsSpy).not.toHaveBeenCalled();
        });
        it('calculates whitespace correctly', function () {
            expect(complexion.tokenize('a\nb\ra\r\nb\n\ra b\ta')).toEqual([
                {
                    line: 1,
                    col: 1,
                    offset: 0,
                    type: 'A',
                    content: 'a'
                },
                {
                    line: 1,
                    col: 2,
                    offset: 1,
                    type: 'WS',
                    content: '\n'
                },
                {
                    line: 2,
                    col: 1,
                    offset: 2,
                    type: 'B',
                    content: 'b'
                },
                {
                    line: 2,
                    col: 2,
                    offset: 3,
                    type: 'WS',
                    content: '\r'
                },
                {
                    line: 3,
                    col: 1,
                    offset: 4,
                    type: 'A',
                    content: 'a'
                },
                {
                    line: 3,
                    col: 2,
                    offset: 5,
                    type: 'WS',
                    content: '\r\n'
                },
                {
                    line: 4,
                    col: 1,
                    offset: 7,
                    type: 'B',
                    content: 'b'
                },
                {
                    line: 4,
                    col: 2,
                    offset: 8,
                    type: 'WS',
                    content: '\n\r'
                },
                {
                    line: 6,
                    col: 1,
                    offset: 10,
                    type: 'A',
                    content: 'a'
                },
                {
                    line: 6,
                    col: 2,
                    offset: 11,
                    type: 'WS',
                    content: ' '
                },
                {
                    line: 6,
                    col: 3,
                    offset: 12,
                    type: 'B',
                    content: 'b'
                },
                {
                    line: 6,
                    col: 4,
                    offset: 13,
                    type: 'WS',
                    content: '\t'
                },
                {
                    line: 6,
                    col: 5,
                    offset: 14,
                    type: 'A',
                    content: 'a'
                }
            ]);

            /* Test that the WS matcher was called a couple times correctly.
             * It is difficult to test this because the third parameter is
             * an Array which changes.  The spy simply saves a reference to
             * the Array object so we've made the wsSpyCalls array get
             * populated with copies of the data.
             */
            expect(wsSpy.callCount).toBe(6);
            expect(wsSpyCalls[0]).toEqual([
                "a\nb\ra\r\nb\n\ra b\ta",
                1,
                [
                    {
                        line: 1,
                        col: 1,
                        offset: 0,
                        type: 'A',
                        content: 'a'
                    }
                ]
            ]);
            expect(wsSpyCalls[1]).toEqual([
                "a\nb\ra\r\nb\n\ra b\ta",
                3,
                [
                    {
                        line: 1,
                        col: 1,
                        offset: 0,
                        type: 'A',
                        content: 'a'
                    },
                    {
                        line: 1,
                        col: 2,
                        offset: 1,
                        type: 'WS',
                        content: '\n'
                    },
                    {
                        line: 2,
                        col: 1,
                        offset: 2,
                        type: 'B',
                        content: 'b'
                    }
                ]
            ]);
        });
    });
    describe('Adding implicit tokens', function () {
        var implied, complexion;

        beforeEach(function () {
            implied = false;
            complexion = new Complexion();
            complexion.defineToken('IMPLIED', function () {
                if (implied) {
                    implied = false;
                    return '';
                }

                return null;
            });
            complexion.defineToken('A', complexion.matchString('a'));
            complexion.defineToken('B', complexion.matchString('b', function (str, offset) {
                implied = true;
                return str.charAt(offset);
            }));
        });
        it('adds an implied token immediately', function () {
            implied = true;
            expect(complexion.tokenize('a')).toEqual([
                {
                    line: 1,
                    col: 1,
                    offset: 0,
                    type: 'IMPLIED',
                    content: ''
                },
                {
                    line: 1,
                    col: 1,
                    offset: 0,
                    type: 'A',
                    content: 'a'
                }
            ]);
        });
        it('adds an implied token in the middle', function () {
            expect(complexion.tokenize('ba')).toEqual([
                {
                    line: 1,
                    col: 1,
                    offset: 0,
                    type: 'B',
                    content: 'b'
                },
                {
                    line: 1,
                    col: 2,
                    offset: 1,
                    type: 'IMPLIED',
                    content: ''
                },
                {
                    line: 1,
                    col: 2,
                    offset: 1,
                    type: 'A',
                    content: 'a'
                }
            ]);
        });
        it('does not add an implied token at the end', function () {
            expect(complexion.tokenize('b')).toEqual([
                {
                    line: 1,
                    col: 1,
                    offset: 0,
                    type: 'B',
                    content: 'b'
                }
            ]);
        });
    });
    describe('Custom token types', function () {
        it('calls our factory and returns the new "tokens"', function () {
            var complexion, tokenList;

            function factory(tokenData) {
                tokenList.push(tokenData);
                return tokenList.length - 1;
            }

            tokenList = [];
            complexion = new Complexion();
            complexion.setTokenFactory(factory);
            complexion.defineToken('A', complexion.matchString('a'));
            complexion.defineToken('B', complexion.matchString('b'));
            expect(complexion.tokenize('aaba')).toEqual([
                0,
                1,
                2,
                3
            ]);
            expect(tokenList).toEqual([
                {
                    line: 1,
                    col: 1,
                    offset: 0,
                    type: 'A',
                    content: 'a'
                },
                {
                    line: 1,
                    col: 2,
                    offset: 1,
                    type: 'A',
                    content: 'a'
                },
                {
                    line: 1,
                    col: 3,
                    offset: 2,
                    type: 'B',
                    content: 'b'
                },
                {
                    line: 1,
                    col: 4,
                    offset: 3,
                    type: 'A',
                    content: 'a'
                }
            ]);
        });
    });
    describe('events', function () {
        it('emits "start" and "end" with data', function () {
            var complexion, eventsFired;

            complexion = new Complexion();
            eventsFired = [];
            complexion.on('start', function (data) {
                eventsFired.push('start');
                expect(data).toEqual({});
            });
            complexion.on('end', function (data) {
                eventsFired.push('end');
                expect(data).toEqual({
                    tokenList: [
                        {
                            line: 1,
                            col: 1,
                            content: 'a',
                            offset: 0,
                            type: 'A'
                        }
                    ]
                });
            });
            complexion.defineToken('A', complexion.matchString('a'));
            complexion.tokenize('a');
            expect(eventsFired).toEqual([
                'start',
                'end'
            ]);
        });
        it('can remove events with removal function', function () {
            var complexion, eventsFired, removalFunction;

            complexion = new Complexion();
            eventsFired = [];
            removalFunction = complexion.on('start', function () {
                eventsFired.push('start');
            });
            complexion.on('end', function () {
                eventsFired.push('end');
            });
            complexion.defineToken('A', complexion.matchString('a'));
            complexion.tokenize('a');
            removalFunction();
            complexion.tokenize('a');
            expect(eventsFired).toEqual([
                'start',
                'end',
                'end'
            ]);
        });
        it('can remove events with "off"', function () {
            var complexion, eventsFired;

            function logEnd() {
                eventsFired.push('end');
            }

            complexion = new Complexion();
            eventsFired = [];
            complexion.on('start', function () {
                eventsFired.push('start');
            });
            complexion.on('end', logEnd);
            complexion.defineToken('A', complexion.matchString('a'));
            complexion.tokenize('a');
            complexion.off('end', logEnd);
            complexion.tokenize('a');
            expect(eventsFired).toEqual([
                'start',
                'end',
                'start'
            ]);
        });
    });
}());
