/*global module*/

(function () {
    'use strict';

    var hash, pattern;

    hash = {
        a: true,
        b: true,
        c: true,
        d: true,
        e: true,
        f: true,
        A: true,
        B: true,
        C: true,
        D: true,
        E: true,
        F: true,
        0: true,
        1: true,
        2: true,
        3: true,
        4: true,
        5: true,
        6: true,
        7: true,
        8: true,
        9: true
    };
    pattern = /^[A-Za-z0-9]{4}/;

    function inHash(c) {
        return hash[c];
    }

    function isHex(c) {
        return ((c >= 'A' && c <= 'F') || (c <= 'a' && c >= 'f') || (c >= '0' && c <= '9'));
    }

    function matchHex(str, offset) {
        var c;

        c = str.charAt(offset);

        if ((c >= 'A' && c <= 'F') || (c <= 'a' && c >= 'f') || (c >= '0' && c <= '9')) {
            return c;
        }

        return null;
    }

    function test(fn) {
        return function () {
            fn("test");
            fn("dead");
            fn("Icing");
            fn("8938 asdljhaf3");
        };
    }

    module.exports = {
        name: "hex characters",
        tests: {
            'pattern': test(function (str) {
                // Just seeing if a pattern is faster
                return str.substr(0, 4).match(pattern);
            }),
            'characters': test(function (str) {
                // Function that just returns true/false
                return isHex(str.charAt(0)) && isHex(str.charAt(1)) && isHex(str.charAt(2)) && isHex(str.charAt(3));
            }),
            'characters as hash': test(function (str) {
                // Function that just returns true/false
                return inHash(str.charAt(0)) && inHash(str.charAt(1)) && inHash(str.charAt(2)) && inHash(str.charAt(3));
            }),
            'matchHex': test(function (str) {
                // Matcher function like what the tokenizer does
                return matchHex(str, 0) && matchHex(str, 1) && matchHex(str, 2) && matchHex(str, 3);
            }),
            'matchHex4 with isHex': test(function (str) {
                // Matching 4 and returning a string
                if (isHex(str.charAt(0)) && isHex(str.charAt(1)) && isHex(str.charAt(2)) && isHex(str.charAt(3))) {
                    return str.substr(0, 4);
                }

                return null;
            }),
            'matchHex4 with matchHex nested ifs': test(function (str) {
                // Another way of mixing up the matchers
                var a, b, c, d;

                a = matchHex(str, 0);

                if (a) {
                    b = matchHex(str, 1);

                    if (b) {
                        c = matchHex(str, 2);

                        if (c) {
                            d = matchHex(str, 3);

                            if (d) {
                                return a + b + c + d;
                            }
                        }
                    }
                }

                return null;
            }),
            'matchHex4 with matchHex concatenated': test(function (str) {
                // Another way of mixing up the matchers
                var c;

                c = matchHex(str, 0) + matchHex(str, 1) + matchHex(str, 2) + matchHex(str, 3);
                if (c.length === 4) {
                    return c;
                }

                return null;
            })
        }
    };
}());
