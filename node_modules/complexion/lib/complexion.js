/**
 * Scan through a string and turn it into tokens.
 *
 * Returns a list of tokens (an array).  Tokens are plain JavaScript objects
 * unless the library is asked to return something different.  If there is
 * input that can not be turned into a token properly, this throws an Error.
 *
 * When using this library, you can define your own class that should be used
 * for tokens.
 *
 *     // Set up my special token object
 *     function MySpecialToken(plainObject) {
 *         this.data = plainObject;
 *     }
 *
 *     // Make the factory
 *     function factory(data) {
 *         return new MySpecialToken(data);
 *     }
 *
 *     // Create a new tokenizer that will return arrays of your token
 *     tokenizer = new Complexion();
 *     tokenizer.setTokenFactory(factory);
 *
 * This library is optimized for speed.  It needs to be as fast as possible
 * so users do not wait while their megabytes of JavaScript (or whatever type
 * of file) is parsed.
 */
/*global exports, module*/
// fid-umd {"jslint":1,"name":"Complexion"}
/*global define, YUI*/
(function (n, r, f) {
    "use strict";
    try { module.exports = f(); return; } catch (ignore) {}
    try { exports[n] = f(); return; } catch (ignore) {}
    try { return define.amd && define(n, [], f); } catch (ignore) {}
    try { return YUI.add(n, function (Y) { Y[n] = f(); }); } catch (ignore) {}
    try { r[n] = f(); return; } catch (ignore) {}
    throw new Error("Unable to export " + n);
}("Complexion", this, function () {
    "use strict";
    // fid-umd end


    /**
     * The tokenizer object.
     */
    function Complexion() {
        if (!(this instanceof Complexion)) {
            return new Complexion();
        }

        this.eventListeners = {
            end: [],
            start: []
        };
        this.tokenFactory = null;
        this.tokenMatchers = [];
        this.tokenTypes = [];
    }

    /**
     * The tokenizer deals with functions that match a set of characters.
     * They all have the same signature and return the same result.
     *
     * @callback Complexion~matcher
     * @param {string} str String being parsed
     * @param {number} offset Byte offset into the string
     * @param {Array.<Object>} tokenList List of matched tokens
     * @return {(null|string)} matched characters
     */


    /**
     * Define a token and add it to the list of possibilities.
     *
     * Order matters when tokens are defined.  When scanning text, the tokens
     * are all tried in order from the first one that's defined through to the
     * last one which was defined.
     *
     * Do not define new tokens while tokenizing!
     *
     * @param {string} type
     * @param {Complexion~matcher} matcher
     */
    Complexion.prototype.defineToken = function (type, matcher) {
        if (typeof matcher !== 'function') {
            throw new Error('Matcher must be a function');
        }

        this.tokenMatchers.push(matcher);
        this.tokenTypes.push(type);
    };


    /**
     * Run an event
     *
     * @param {string} name
     */
    Complexion.prototype.emit = function (name, data) {
        var i;

        if (this.eventListeners[name]) {
            for (i = 0; i < this.eventListeners[name].length; i += 1) {
                this.eventListeners[name][i].call(null, data);
            }
        }
    };


    /**
     * Create a matcher which will match any single character
     *
     * Speeds tests currently show that using String.prototype.charAt is the
     * fastest method of getting a specific character from a string.
     *
     * @return {Complexion~matcher}
     */
    Complexion.prototype.matchAny = function () {
        return function (str, offset) {
            return str.charAt(offset) || null;
        };
    };


    /**
     * Create a matching function which targets a string.
     *
     * If `nextMatcher` is truthy, then call the next matcher to determine
     * what really matches.  This can be used to quickly tell if the first
     * character is something you'd like to investigate with a much more
     * thorough or slow process.
     *
     * Matching a single character is faster than matching a whole string.
     * When matching a single character, use String.prototype.charAt.
     * To compare longer strings, === is faster or is almost the same speed
     * as first testing the first letter and then checking if the two strings
     * are equal.  I prefer shorter code and opt to skip the first letter
     * checking optimization.
     *
     * No context is set when calling the next matcher, as direct calls to
     * functions are faster than using Function.prototype.call().
     *
     * @param {string} strToMatch What to match
     * @param {Complexion~matcher} nextMatcher
     * @return {Complexion~matcher}
     */
    Complexion.prototype.matchString = function (strToMatch, nextMatcher) {
        var matchLength;

        matchLength = strToMatch.length;

        if (matchLength === 1) {
            // Build a single-character matcher
            if (!nextMatcher) {
                // Single character with no following matcher
                return function (str, offset) {
                    /*jslint unparam:true*/
                    if (str.charAt(offset) !== strToMatch) {
                        return null;
                    }

                    return strToMatch;
                };
            }

            // Single character that uses a following matcher
            return function (str, offset, tokenList) {
                if (str.charAt(offset) !== strToMatch) {
                    return null;
                }

                return nextMatcher(str, offset, tokenList);
            };
        }

        if (!nextMatcher) {
            // Multi-character string with no next matcher
            return function (str, offset) {
                var foundString;

                foundString = str.substr(offset, matchLength);

                if (foundString !== strToMatch) {
                    return null;
                }

                return foundString;
            };
        }

        // Multi-character string with another matcher
        return function (str, offset, tokenList) {
            var foundString;

            foundString = str.substr(offset, matchLength);

            if (foundString !== strToMatch) {
                return null;
            }

            return nextMatcher(str, offset, tokenList);
        };
    };


    /**
     * Create a matching function which targets a string case insensitively.
     *
     * For more detail, see `matchString()`.
     *
     * @see Complexion.prototype.matchString
     * @param {string} strToMatch What to match
     * @param {Complexion~matcher} nextMatcher
     * @return {Complexion~matcher}
     */
    Complexion.prototype.matchStringInsensitive = function (strToMatch, nextMatcher) {
        var lower, matchLength, upper;

        matchLength = strToMatch.length;

        if (matchLength === 1) {
            lower = strToMatch.toLowerCase();
            upper = strToMatch.toUpperCase();

            if (!nextMatcher) {
                // Single character, no next matcher
                return function (str, offset) {
                    /*jslint unparam:true*/
                    var c;

                    c = str.charAt(offset);

                    if (c !== lower && c !== upper) {
                        return null;
                    }

                    return c;
                };
            }

            // Single character with a next matcher
            return function (str, offset, tokenList) {
                var c;

                c = str.charAt(offset);

                if (c !== lower && c !== upper) {
                    return null;
                }

                return nextMatcher(str, offset, tokenList);
            };
        }

        lower = strToMatch.toLowerCase();

        if (!nextMatcher) {
            // Multi-character string with no next matcher
            return function (str, offset) {
                var foundString;

                foundString = str.substr(offset, matchLength);

                if (foundString.toLowerCase() !== lower) {
                    return null;
                }

                return foundString;
            };
        }

        // Multi-character string with a next matcher
        return function (str, offset, tokenList) {
            var foundString;

            foundString = str.substr(offset, matchLength);

            if (foundString.toLowerCase() !== lower) {
                return null;
            }

            return nextMatcher(str, offset, tokenList);
        };
    };


    /**
     * Register an event listener
     *
     * @param {string} name
     * @param {Function} callback
     */
    Complexion.prototype.off = function (name, callback) {
        var self;

        self = this;

        if (self.eventListeners[name]) {
            self.eventListeners[name] = self.eventListeners[name].filter(function (val) {
                return val !== callback;
            });
        }
    };

    /**
     * Register an event listener
     *
     * @param {string} name
     * @param {Function} callback
     * @return {Fucntion} Removal function
     */
    Complexion.prototype.on = function (name, callback) {
        var self;

        self = this;

        if (self.eventListeners[name]) {
            self.eventListeners[name].push(callback);
        }

        return function () {
            self.off(name, callback);
        };
    };

    /**
     * A plain JavaScript object representation of a token.
     *
     * The line number increments and the column number resets with every
     * newline DOS, Unix, or old style Macintosh.  Technically, it resets
     * when it encounters CR+LF (together = 1 newline), CR by itself or LF
     * by itself.
     *
     * @typedef {Object} Complexion~token
     * @property {number} line Line number, starts at 1
     * @property {number} col Column number, starts at 1
     * @property {number} offset Number of bytes before this token
     * @property {string} type The registered token type
     * @property {string} content The token's content
     */

    /**
     * Converts a plain JavaScript object version of a token into another
     * object.  Whatever the factory returns is added to the array of token.
     *
     * @callback Complexion~tokenFactory
     * @param {Complexion~token} token
     * @return {*}
     */

    /**
     * Set the token factory function
     *
     * If you want custom token objects returned, you need to pass in the
     * factory here as `tokenFactory`.  See this file's doc block for
     * further information.
     *
     * @param {Complexion~tokenFactory} [tokenFactory] Factory that makes custom token objects
     */
    Complexion.prototype.setTokenFactory = function (tokenFactory) {
        this.tokenFactory = tokenFactory;
    };


    /**
     * Tokenize a string.
     *
     * This is where the real "meat" of the program lives.  There's a lot more
     * code in here than what's normally desirable, but this function is huge
     * only because the program runs faster when there are fewer functions
     * to call and fewer variables to pass around.
     *
     * @param {string} parseStr
     * @return {Array.<Object>} List of tokens
     * @throws Error in case untokenizable data was found
     */
    Complexion.prototype.tokenize = function (parseStr) {
        var i, c, col, cr, lf, line, matchedContent, matchedContentLen, matchers, matchersLen, offset, parseLen, token, tokenFactory, tokenList, types;

        /**
         * Run through the different matchers and stop when the first one
         * matches.  Set `token` to be the new token object that should be
         * added to the list.
         *
         * Does not get any variables passed nor returns any variables in
         * order to save a miniscule amount during execution.
         */
        function getToken() {
            for (i = 0; i < matchersLen; i += 1) {
                matchedContent = matchers[i](parseStr, offset, tokenList);

                if (matchedContent !== null) {
                    // We matched something.  Build a better token object.
                    token = {
                        line: line,
                        col: col,
                        offset: offset,
                        type: types[i],
                        content: matchedContent
                    };

                    if (tokenFactory) {
                        token = tokenFactory(token);
                    }

                    return;
                }
            }

            token = null;
        }

        // Position tracking
        offset = 0;  // Byte offset
        line = 1;  // Line number in file (any CR+LF, CR, LF counts)
        col = 1;  // Column number in file (tabs = 1 character)

        // Shortcuts for faster loops
        parseLen = parseStr.length;
        matchers = this.tokenMatchers;
        matchersLen = matchers.length;
        types = this.tokenTypes;
        tokenFactory = this.tokenFactory;
        cr = String.fromCharCode(0x0d);
        lf = String.fromCharCode(0x0a);

        // The destination list and the current token
        tokenList = [];
        token = null;

        // All set up
        this.emit('start', {});

        while (offset < parseLen) {
            // Get a token
            getToken();

            // If none are found, we throw an Error
            if (token === null) {
                throw new Error('Unable to match, starting at offset ' + offset + ' (line ' + line + ', col ' + col + ')');
            }

            // Add it to the list, save some properties for faster loops
            tokenList.push(token);
            matchedContentLen = matchedContent.length;
            offset += matchedContentLen;

            // Update the current position (line and column)
            for (i = 0; i < matchedContentLen; i += 1) {
                c = matchedContent[i];

                if (c === cr) {
                    // DOS or Unix style
                    if (matchedContent.charAt(i + 1) === lf) {
                        // DOS
                        i += 1;
                    }

                    line += 1;
                    col = 1;
                } else if (c === lf) {
                    // Old Mac
                    line += 1;
                    col = 1;
                } else {
                    // Non-newline character
                    col += 1;
                }
            }
        }

        this.emit('end', {
            tokenList: tokenList
        });

        return tokenList;
    };


    return Complexion;

    // fid-umd post
}));
// fid-umd post-end
