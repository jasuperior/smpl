/**
 * JavaScript matchers for parsing text with Complexion.
 *
 * Usage:
 *
 * var complexion, jsPlugin;
 * complexion = require('complexion');
 * jsPlugin = require('complexion-js');
 * complexion.initialize(jsPlugin());
 */
// fid-umd {"jslint":1,"name":"complexionJs"}
/*global define, exports, module, YUI*/
(function (n, r, f) {
    "use strict";
    try { module.exports = f(); return; } catch (ignore) {}
    try { exports[n] = f(); return; } catch (ignore) {}
    try { return define.amd && define(n, [], f); } catch (ignore) {}
    try { return YUI.add(n, function (Y) { Y[n] = f(); }); } catch (ignore) {}
    try { r[n] = f(); return; } catch (ignore) {}
    throw new Error("Unable to export " + n);
}("complexionJs", this, function () {
    "use strict";
    // fid-umd end

    /**
     * JavaScript token object
     *
     * This intentionally does not include the standard object boilerplate
     * in order to maximize speed.  That means you won't execute this code
     * hundreds of thousands of times:
     *
     *     if (!(this instanceof ComplexionJsToken)) {
     *         return new ComplexionJsToken(token);
     *     }
     *
     * Make sure that you use the 'new' keyword.
     *
     * @class ComplexionJsToken
     * @param {Complexion~token} token
     */
    function ComplexionJsToken(token) {
        this.line = token.line;
        this.col = token.col;
        this.offset = token.offset;
        this.type = token.type;
        this.content = token.content;
    }

    /**
     * Return true if the token's type matches any of the token types passed in.
     *
     * @param {Array.<string>} tokenTypes
     * @return {boolean}
     */
    ComplexionJsToken.prototype.isAnyType = function (tokenTypes) {
        var i, len;

        len = tokenTypes.length;

        for (i = 0; i < len; i += 1) {
            if (this.type === tokenTypes[i]) {
                return true;
            }
        }

        return false;
    };

    /**
     * Returns true if the current token matches the passed in string.
     *
     * @param {string} tokenType
     * @return {boolean}
     */
    ComplexionJsToken.prototype.isType = function (tokenType) {
        return this.type === tokenType;
    };

    /**
     * Returns true if the token should be considered whitespace or any
     * other unimportant token (with regard to parsing and interpretation)
     * by the specification.
     *
     * @return {boolean}
     */
    ComplexionJsToken.prototype.isUnimportant = function () {
        var type;

        type = this.type;

        if (type === 'BOM' || type === 'LINE_TERMINATOR' || type === 'MULTI_LINE_COMMENT' || type === 'SINGLE_LINE_COMMENT' || type === 'WHITESPACE') {
            return true;
        }

        return false;
    };

    /**
     * Returns true if a character is within the range allowed for hexadecimal
     *
     * @param {string} c
     * @return {boolean}
     */
    function isHex(c) {
        return ((c >= '0' && c <= '9') || (c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f'));
    }

    /**
     * Matches a single character that can continue an identifier.
     *
     * This has the same deficiencies as identifierStart() plus more.
     * It should also match the Unicode "Non-spacing mark", "Combining
     * spacing mark", "Decimal number" and "Connector punctuation".
     *
     * @param {string} str
     * @param {number} offset
     */
    function identifierChar(str, offset) {
        var c;

        c = str.charAt(offset);

        // Unicode characters are ZWNJ and ZWJ
        if ((c >= '0' && c <= '9') || c === '$' || (c >= 'A' && c <= 'Z') || c === '_' || (c >= 'a' && c <= 'z') || c === '\u200c' || c === '\u200d') {
            return c;
        }

        // Unicode
        if (c === '\\' && str.charAt(offset + 1) === 'u' && isHex(str.charAt(offset + 2)) && isHex(str.charAt(offset + 3)) && isHex(str.charAt(offset + 4)) && isHex(str.charAt(offset + 5))) {
            return str.substr(offset, 6);
        }

        return null;
    }

    /**
     * Matches a single character that can start an identifier.
     *
     * It should also match any character in the Unicode categories
     * "Uppercase letter", "Lowercase letter", "Titlecase letter",
     * "Modifier letter", "Other letter" or "Letter number"
     *
     * @param {string} str
     * @param {number} offset
     */
    function identifierStart(str, offset) {
        var c;

        c = str.charAt(offset);

        if (c === '$' || (c >= 'A' && c <= 'Z') || c === '_' || (c >= 'a' && c <= 'z')) {
            return c;
        }

        // Unicode
        if (c === '\\' && str.charAt(offset + 1) === 'u' && isHex(str.charAt(offset + 2)) && isHex(str.charAt(offset + 3)) && isHex(str.charAt(offset + 4)) && isHex(str.charAt(offset + 5))) {
            return str.substr(offset, 6);
        }

        return null;
    }

    /**
     * Returns true if a character is a line terminator.
     *
     * Matches LF, CR, LS, PS.
     *
     * @param {string} c
     * @return {boolean}
     */
    function isLineTerminator(c) {
        return c === '\n' || c === '\r' || c === '\u2028' || c === '\u2029';
    }

    /**
     * Returns the last token which is not whitespace
     *
     * @param {Array.<ComplexionJsToken>}
     * @return {ComplexionJsToken|null}
     */
    function lastTokenNonWhitespace(tokenList) {
        var index;

        index = tokenList.length - 1;

        while (index >= 0) {
            if (!tokenList[index].isUnimportant()) {
                return tokenList[index];
            }

            index -= 1;
        }

        return null;
    }

    /**
     * Return true if a regular expression is allowed at this point.
     * At some points the / should be a divide and at others it should
     * be a regular expression.
     *
     * @param {Array.<Object>} tokenList
     * @return {boolean}
     */
    function isRegexpAllowed(tokenList) {
        var token;

        /**
         * Return true if a regular expression is allowed after a
         * particular punctuator.
         *
         * @param {string} content Punctuator's content
         * @return {boolean}
         */
        function isAllowedPunctuator(content) {
            return content === '(' // x(/regexp/)
                || content === '{' // function () {/regexp/.test()}
                || content === '[' // [/regexp/]
                || content === ',' // x(1,/regexp/)
                || content === '+' // RegExp(/x/.source+/y/)
                || content === '?' // x?/regexp/:/regexp/
                || content === ':' // {x:/regexp/}
                || content === ';' // x();/regexp/.test()
                || content === '=' // x=/regexp/
                || content === '==' // x==/regexp/
                || content === '===' // x===/regexp/
                || content === '!' // !/regexp/.match(x)
                || content === '!=' // x!=/regexp/
                || content === '!==' // x!==/regexp/
                || content === '&&' // x&&/regexp/.match(y)
                || content === '||'; // x||/regexp/.match(y)
        }

        token = lastTokenNonWhitespace(tokenList);

        if (token) {
            if (token.isAnyType([
                    'IDENTIFIER_NAME',
                    'NUMERIC_LITERAL'
                ])) {
                return false;
            }

            if (token.isType('KEYWORD')) {
                if (token.content === 'return') {
                    return true;
                }

                return false;
            }

            if (token.isType('PUNCTUATOR')) {
                return isAllowedPunctuator(token.content);
            }
        }

        return true;
    }

    /**
     * Matches the byte order mark
     *
     * Only matches this if it is at the beginning of a file.
     *
     * @param {Complexion} complexion
     * @return {Complexion~matcher}
     */
    function matchBom(complexion) {
        return complexion.matchString("\ufeff", function (str, offset) {
            /*jslint unparam: true*/

            if (offset) {
                return null;
            }

            return "\ufeff";
        });
    }

    /**
     * Matches just "true" or "false"
     *
     * @param {Complexion} complexion
     * @param {Object} state
     * @return {Complexion~matcher}
     */
    function matchBooleanLiteral(complexion, state) {
        /*jslint unparam:true*/
        return function () {
            var content;

            content = state.keywordFromIdentifierName;

            if (content === 'true' || content === 'false') {
                state.keywordFromIdentifierName = null;
                return content;
            }

            return null;
        };
    }

    /**
     * Matches an identifier name
     *
     * The trickier part is that this could match keywords, so we use the
     * state object to be able to pass information to a mostly dummy matcher
     * for keywords.
     *
     * @param {Complexion} complexion
     * @param {Object} state
     * @return {Complexion~matcher}
     */
    function matchIdentifierName(complexion, state) {
        /*jslint unparam:true*/
        var keywordsToAvoid;

        keywordsToAvoid = {
            "break": true,
            "case": true,
            "catch": true,
            "continue": true,
            "debugger": true,
            "default": true,
            "delete": true,
            "do": true,
            "else": true,
            "false": true,  // Boolean literal
            "finally": true,
            "for": true,
            "function": true,
            "if": true,
            "in": true,
            "instanceof": true,
            "new": true,
            "null": true,  // Null literal
            "return": true,
            "switch": true,
            "this": true,
            "throw": true,
            "true": true,  // Boolean literal
            "try": true,
            "typeof": true,
            "var": true,
            "void": true,
            "while": true,
            "with": true,

            // Future reserved words (non-strict mode)
            "class": true,
            "const": true,
            "enum": true,
            "export": true,
            "extends": true,
            "import": true,
            "super": true,

            // Future reserved words (strict mode)
            "implements": true,
            "interface": true,
            "let": true,
            "package": true,
            "private": true,
            "protected": true,
            "public": true,
            "static": true,
            "yield": true
        };

        return function (str, offset) {
            var match, more;

            match = identifierStart(str, offset);

            if (!match) {
                return null;
            }

            more = identifierChar(str, offset + match.length);

            while (more) {
                match += more;
                more = identifierChar(str, offset + match.length);
            }

            if (keywordsToAvoid.hasOwnProperty(match)) {
                state.keywordFromIdentifierName = match;
                return null;
            }

            return match;
        };
    }

    /**
     * Adds an implicit semicolon to the list of tokens.
     *
     * It has no content but indicates that there should be a semicolon here.
     *
     * @param {Complexion} complexion
     * @param {Object} state
     * @return {Complexion~matcher}
     */
    function matchImplicitSemicolon(complexion, state) {
        /*jslint unparam:true*/
        return function () {
            if (state.implicitSemicolonFlag) {
                state.implicitSemicolonFlag = false;
                return '';
            }

            return null;
        };
    }

    /**
     * Matches keywords
     *
     * Detection is done by matchIdentifierName.  This only uses the state
     * information to place a keyword token on the stack.
     *
     * @param {Complexion} complexion
     * @param {Object} state
     * @return {Complexion~matcher}
     */
    function matchKeyword(complexion, state) {
        /*jslint unparam:true*/
        return function () {
            var content;

            content = state.keywordFromIdentifierName;

            if (content && content !== 'true' && content !== 'false' && content !== 'null') {
                state.keywordFromIdentifierName = null;
                return content;
            }

            return null;
        };
    }

    /**
     * Matches a line terminator
     *
     * Instead of matching just a line terminator, we need to peek backwards
     * and check if the line needs an implicit semicolon.  When it does,
     * insert the implicit semicolon instead of the newline at this time.
     *
     * @param {Complexion} complexion
     * @param {Object} state
     * @return {Complexion~matcher}
     */
    function matchLineTerminator(complexion, state) {
        /*jslint unparam:true*/

        /**
         * Returns a line terminator from str.  This could be a \n,
         * \r, or \r\n.
         *
         * @param {string} str
         * @param {number} offset
         * @return {Complexion~matcher}
         */
        function lineTerminator(str, offset) {
            var c;

            c = str.charAt(offset);

            if (c === "\n" || c === "\u2028" || c === "\u2029") {
                return c;
            }

            if (c === "\r") {
                if (str.charAt(offset + 1) === "\n") {
                    return "\r\n";
                }

                return c;
            }

            return null;
        }

        return function (str, offset, tokenList) {
            var content, newline, previousToken;

            newline = lineTerminator(str, offset);

            if (!newline) {
                return null;
            }

            previousToken = lastTokenNonWhitespace(tokenList);

            if (previousToken && previousToken.isType('KEYWORD')) {
                content = previousToken.content;

                if (content === 'break' || content === 'continue' || content === 'return' || content === 'throw') {
                    state.implicitSemicolonFlag = true;
                    return null;
                }
            }

            return newline;
        };
    }

    /**
     * Matches a multi-line comment
     *
     * @return {Complexion~matcher}
     */
    function matchMultiLineComment(complexion) {
        return complexion.matchString('/*', function (str, offset) {
            var c, len;

            len = 2;
            c = str.charAt(offset + len);

            while (c) {
                while (c && c !== '*') {
                    len += 1;
                    c = str.charAt(offset + len);
                }

                if (c === '*') {
                    len += 1;
                    c = str.charAt(offset + len);

                    if (c === '/') {
                        return str.substr(offset, len + 1);
                    }
                }
            }

            return null;
        });
    }

    /**
     * Matches just "null"
     *
     * @param {Complexion} complexion
     * @param {Object} state
     * @return {Complexion~matcher}
     */
    function matchNullLiteral(complexion, state) {
        /*jslint unparam:true*/
        return function () {
            var content;

            content = state.keywordFromIdentifierName;

            if (content === 'null') {
                state.keywordFromIdentifierName = null;
                return content;
            }

            return null;
        };
    }

    /**
     * Matches numeric literals
     *
     * This matches hex and decimal.  Octal is matched because decimal is
     * matched.  It is the responsibility of the consumer to determine if
     * a number is octal.
     *
     * @param {Complexion} complexion Unused
     * @param {Object} state Unused
     * @return {Complexion~matcher}
     */
    function matchNumericLiteral(complexion, state) {
        /*jslint unparam:true*/

        /**
         * Matches a decimal
         *
         * @param {string} str
         * @param {number} offset
         * @return {Complexion~matcher}
         */
        function decimal(str, offset) {
            var c, efound, elen, len, minLen;

            len = 0;
            c = str.charAt(offset);
            minLen = 1;

            while (c >= '0' && c <= '9') {
                len += 1;
                c = str.charAt(offset + len);
            }

            if (c === '.') {
                minLen += 1;
                len += 1;
                c = str.charAt(offset + len);

                while (c >= '0' && c <= '9') {
                    len += 1;
                    c = str.charAt(offset + len);
                }
            }

            if (len < minLen) {
                return null;
            }

            if (c === 'E' || c === 'e') {
                elen = 1;
                efound = false;
                c = str.charAt(offset + len + elen);

                if (c === '+' || c === '-') {
                    elen += 1;
                    c = str.charAt(offset + len + elen);
                }

                while (c >= '0' && c <= '9') {
                    elen += 1;
                    efound = true;
                    c = str.charAt(offset + len + elen);
                }

                if (efound) {
                    return str.substr(offset, len + elen);
                }
            }

            return str.substr(offset, len);
        }

        /**
         * The first character has already been tested and is a zero.
         *
         * @param {string} str
         * @param {number} offset Still pointing at the '0'
         * @return {Complexion~matcher}
         */
        function hex(str, offset) {
            var c, len;

            c = str.charAt(offset + 1);

            if (c !== 'x' && c !== 'X') {
                return null;
            }

            len = 2;
            c = str.charAt(offset + len);

            while (isHex(c)) {
                len += 1;
                c = str.charAt(offset + len);
            }

            if (len >= 3) {
                return str.substr(offset, len);
            }

            return null;
        }

        return function (str, offset) {
            if (str.charAt(offset) === '0') {
                // Hex must start with zero
                return hex(str, offset) || decimal(str, offset);
            }

            return decimal(str, offset);
        };
    }

    /**
     * Matches a punctuator
     *
     * @param {Complexion} complexion
     * @param {Object} state
     * @return {Complexion~matcher}
     */
    function matchPunctuator(complexion, state) {
        /*jslint unparam:true*/

        var hash;

        /**
         * Returns true if the first token encountered before a given index
         * (excluding whitespace) is NOT a semicolon.
         *
         * @param {Array.<Object>} tokenList
         * @param {number} index
         * @return {boolean}
         */
        function isMissingSemicolon(tokenList, index) {
            var token;

            while (index > 0) {
                index -= 1;
                token = tokenList[index];

                if (token.content === ';') {
                    return false;
                }

                if (!token.isUnimportant()) {
                    return true;
                }
            }

            return true;
        }

        /**
         * Returns true if the statement before the punctuator requires an
         * implicit semicolon.
         *
         * @param {Array.<Object>} tokenList
         * @return {boolean}
         */
        function needsImplicitSemicolon(tokenList) {
            var index, token;

            index = tokenList.length - 1;

            while (index >= 0) {
                token = tokenList[index];

                if (token.isType('LINE_TERMINATOR')) {
                    return isMissingSemicolon(tokenList, index);
                }

                if (!token.isUnimportant()) {
                    return false;
                }

                index -= 1;
            }

            return false;
        }

        hash = {
            '^': '^',
            '^=': '^=',
            '~': '~',
            '<<': '<<',
            '<<=': '<<=',
            '<': '<',
            '<=': '<=',
            '=': '=',
            '==': '==',
            '===': '===',
            '>': '>',
            '>=': '>=',
            '>>': '>>',
            '>>=': '>>=',
            '>>>': '>>>',
            '>>>=': '>>>=',
            '|': '|',
            '|=': '|=',
            '||': '||',
            '-': '-',
            '-=': '-=',
            '--': '--',
            '---': '---',
            ',': ',',
            ';': ';',
            ':': ':',
            '!': '!',
            '!=': '!=',
            '!==': '!==',
            '?': '?',
            '/': '/',
            '/=': '/=',
            '.': '.',
            '(': '(',
            ')': ')',
            '[': '[',
            ']': ']',
            '{': '{',
            '}': '}',
            '*': '*',
            '*=': '*=',
            '&': '&',
            '&=': '&=',
            '&&': '&&',
            '%': '%',
            '%=': '%=',
            '+': '+',
            '+=': '+=',
            '++': '++'
        };

        return function (str, offset, tokenList) {
            var c, match, nextChar;

            c = str.charAt(offset);

            // All multi-character punctuators start with a character that
            // can be a punctuator by itself
            if (!hash[c]) {
                return null;
            }

            match = hash[str.substr(offset, 4)] || hash[str.substr(offset, 3)] || hash[str.substr(offset, 2)] || c;

            if (match === '++' || match === '--') {
                // When starting a line, these should act as preincrement
                if (needsImplicitSemicolon(tokenList)) {
                    state.implicitSemicolonFlag = true;

                    return null;
                }
            } else if (match === '/') {
                nextChar = str.charAt(offset + 1);

                // These should be comments
                if (nextChar === '/' || nextChar === '*') {
                    return null;
                }

                // These should be regular expressions
                if (isRegexpAllowed(tokenList)) {
                    return null;
                }
            } else if (match === '/=') {
                if (isRegexpAllowed(tokenList)) {
                    return null;
                }
            }

            return match;
        };
    }

    /**
     * Matches a regular expression.
     *
     * @return {Complexion~matcher}
     */
    function matchRegularExpressionLiteral() {
        /**
         * Matches a non-terminator character or nothing.  Does not match
         * escape sequences.
         *
         * @param {string} str
         * @param {number} offset
         * @return {Complexion~matcher}
         */
        function matchNonTerminator(str, offset) {
            var c;

            c = str.charAt(offset);

            if (c && !isLineTerminator(c)) {
                return c;
            }

            return null;
        }

        /**
         * When encountering a backslash, returns the number of characters in
         * the backslash sequence.  Should almost always return 2, but will
         * not if either the first character is not a backslash nor if there
         * is no second character.
         *
         * @param {string} str
         * @param {number} offset
         * @return {number}
         */
        function matchBackslashSequenceLen(str, offset) {
            var c;

            c = str.charAt(offset);

            if (c !== '\\') {
                return 0;
            }

            c = matchNonTerminator(str, offset + 1);

            if (c) {
                return 2;
            }

            return 0;
        }

        /**
         * Matches a regular expression class expression.  It starts with
         * [ and ends when a matching ] is found.  Handles backslash sequences.
         *
         * @param {string} str
         * @param {number} offset
         * @return {number}
         */
        function matchClassLen(str, offset) {
            var c, len;

            function getChar() {
                var next;

                next = matchNonTerminator(str, offset + len);

                if (next === '\\') {
                    return matchBackslashSequenceLen(str, offset + len);
                }

                if (!next || next === ']') {
                    return 0;
                }

                return 1;
            }

            c = str.charAt(offset);

            if (c !== '[') {
                return 0;
            }

            len = 1;
            c = getChar();

            while (c) {
                len += c;
                c = getChar();
            }

            if (str.charAt(offset + len) !== ']') {
                return 0;
            }

            return len;
        }

        /**
         * Matches just the first character in a regular expression.
         * Identical to matchCharLen() except '*' is also not allowed.
         *
         * @param {string} str
         * @param {number} offset
         * @return {number}
         */
        function matchStartLen(str, offset) {
            var c;

            c = matchNonTerminator(str, offset);

            if (!c) {
                return 0;
            }

            if (c !== '*' && c !== '\\' && c !== '/' && c !== '[') {
                return c.length;
            }

            return matchBackslashSequenceLen(str, offset) || matchClassLen(str, offset);
        }

        /**
         * Matches a single character or a sequence of characters in a
         * regular expression.
         *
         * @param {string} str
         * @param {number} offset
         * @return {number}
         */
        function matchCharLen(str, offset) {
            var c;

            c = matchNonTerminator(str, offset);

            if (!c) {
                return 0;
            }

            if (c !== '\\' && c !== '/' && c !== '[') {
                return c.length;
            }

            return matchBackslashSequenceLen(str, offset) || matchClassLen(str, offset);
        }

        /**
         * Matches the length of the body of the regular expression
         *
         * /body/flags
         *  ^^^^
         *  Just four characters in the above regexp.
         *
         * @param {string} str
         * @param {number} offset
         * @return {number}
         */
        function matchBodyLen(str, offset) {
            var len, more;

            len = matchStartLen(str, offset);

            if (!len) {
                return 0;
            }

            more = matchCharLen(str, offset + len);

            while (more) {
                len += more;
                more = matchCharLen(str, offset + len);
            }

            return len;
        }

        return function (str, offset) {
            var bodyLen, len, identifier;

            if (str.charAt(offset) !== '/') {
                return null;
            }

            bodyLen = matchBodyLen(str, offset + 1);

            if (!bodyLen) {
                return null;
            }

            len = bodyLen + 1;  // +1 for the slash at the beginning

            if (str.charAt(offset + len) !== '/') {
                return null;
            }

            len += 1;
            identifier = identifierChar(str, offset + len);

            while (identifier) {
                len += identifier.length;
                identifier = identifierChar(str, offset + len);
            }

            return str.substr(offset, len);
        };
    }

    /**
     * Matches a shebang (eg. "#!/usr/bin/env node") at the start of a file
     *
     * Not part of JavaScript but interpreters sometimes allow it for
     * shell scripts.
     *
     * @param {Complexion} complexion
     * @return {Complexion~matcher}
     */
    function matchShebang(complexion) {
        return complexion.matchString("#!", function (str, offset, tokenList) {
            var c, s;

            if (offset !== 0 && (tokenList.length !== 1 && !tokenList[0].isType('BOM'))) {
                // Not at the beginning of the file
                return null;
            }

            s = str.substr(offset, 2);
            c = str.charAt(offset + s.length);

            while (c !== "\r" && c !== "\n") {
                s += c;
                c = str.charAt(offset + s.length);
            }

            return s;
        });
    }

    /**
     * Matches a single-line comment
     *
     * @return {Complexion~matcher}
     */
    function matchSingleLineComment(complexion) {
        return complexion.matchString('//', function (str, offset) {
            var c, len;

            len = 2;
            c = str.charAt(offset + len);

            while (c && !isLineTerminator(c)) {
                len += 1;
                c = str.charAt(offset + len);
            }

            return str.substr(offset, len);
        });
    }

    /**
     * Matches a string literal
     *
     * @return {Complexion~matcher}
     */
    function matchStringLiteral() {
        function movePastEscape(str, offset) {
            var c;

            c = str.charAt(offset);

            // You can't escape a line terminator
            if (isLineTerminator(c)) {
                return 0;
            }

            if (c >= '4' && c <= '7') {
                // Octal numbers that can only be two digits
                c = str.charAt(offset + 1);

                if (c >= '0' && c <= '7') {
                    return 2;
                }
            } else if (c >= '0' && c <= '3') {
                // Octal numbers that can be three digits
                c = str.charAt(offset + 1);

                if (c >= '0' && c <= '7') {
                    c = str.charAt(offset + 2);

                    if (c >= '0' && c <= '7') {
                        return 3;
                    }

                    return 2;
                }
            } else if (c === 'x') {
                // Hex
                if (isHex(str.charAt(offset + 1)) && isHex(str.charAt(offset + 2))) {
                    return 3;
                }
            } else if (c === 'u') {
                // Unicode
                if (isHex(str.charAt(offset + 1)) && isHex(str.charAt(offset + 2)) && isHex(str.charAt(offset + 3)) && isHex(str.charAt(offset + 4))) {
                    return 5;
                }
            }

            // We are just escaping a single character
            return 1;
        }

        return function (str, offset) {
            var c, len, quote;

            quote = str.charAt(offset);

            // It must start with single or double quotes
            if (quote !== '"' && quote !== "'") {
                return null;
            }

            len = 1;
            c = str.charAt(offset + len);

            // Strings must not contain CR, LF, LS, nor PS
            while (c && c !== quote && !isLineTerminator(c)) {
                len += 1;

                if (c === "\\") {
                    len += movePastEscape(str, offset + len);
                }

                c = str.charAt(offset + len);
            }

            if (c !== quote) {
                return null;
            }

            return str.substr(offset, len + 1);
        };
    }


    /**
     * Matches any character
     *
     * @param {Complexion} complexion
     * @return {Complexion~matcher}
     */
    function matchUnknown(complexion) {
        return complexion.matchAny();
    }

    /**
     * Matches whitespace
     *
     * Does not match "category Zs" from the spec, which are other Unicode
     * space separators.  They don't happen often, so let me know if this
     * affects you at all.
     *
     * Whitespace typically contains BOM as well, but that only should match
     * at the beginning of the file and has been split into a separate
     * token type.  Same thing for line breaks because there is special
     * rules regarding implicit semicolons and line breaks.
     *
     * @return {Complexion~matcher}
     */
    function matchWhitespace() {
        var formFeed, nonBreakingSpace, space, tab, verticalTab;

        tab = "\t";
        verticalTab = String.fromCharCode(0x0b);
        formFeed = String.fromCharCode(0x0c);
        space = " ";
        nonBreakingSpace = String.fromCharCode(0xa0);

        return function (str, offset) {
            var c, len;

            c = str.charAt(offset);
            len = 0;

            while (c === tab || c === verticalTab || c === formFeed || c === space || c === nonBreakingSpace) {
                len += 1;
                c = str.charAt(offset + len);
            }

            if (len) {
                return str.substr(offset, len);
            }

            return null;
        };
    }

    /**
     * Keywords should be identifiers when immediately after a period
     * punctuator.  Eg:
     *
     * this.default = {  // Identifier
     *     return: function () {}  // Still keyword but used as a property name
     * };
     *
     * @param {Array.<Object>} tokenList List of tokens
     */
    function turnKeywordsIntoIdentifiers(tokenList) {
        var i, maxI;

        function getImportant(increment) {
            var j, type;

            j = i + increment;

            while (tokenList[j]) {
                type = tokenList[j].type;

                if (type !== 'WHITESPACE' && type !== 'LINE_TERMINATOR' && type !== 'SINGLE_LINE_COMMENT' && type !== 'MULTI_LINE_COMMENT') {
                    return tokenList[j];
                }

                j += increment;
            }

            return null;
        }

        function checkAndConvertToIdentifier(token) {
            var previous;

            previous = getImportant(-1);

            if (previous && previous.content === '.') {
                token.type = 'IDENTIFIER_NAME';
            }
        }

        for (i = 0, maxI = tokenList.length; i < maxI; i += 1) {
            if (tokenList[i].type === 'KEYWORD') {
                checkAndConvertToIdentifier(tokenList[i]);
            }
        }

        return tokenList;  // Delete this line
    }

    /**
     * Callback for configuring a Complexion instance
     *
     * @param {Complexion} complexion
     * @param {Object} config
     */
    return function (complexion, config) {
        var state;

        function add(tokenName, matchGenerator) {
            complexion.defineToken(tokenName, matchGenerator(complexion, state));
        }

        function initialize() {
            /* This information is available for matching function so they
             * can gather information for each other.
             */
            state = {
                keywordFromIdentifierName: null,
                implicitSemicolonFlag: false
            };
        }

        // Ensure 'config' is always an object
        config = config || {};

        // Always reinitialize the state before we start tokenizing
        complexion.setTokenFactory(function (tokenData) {
            return new ComplexionJsToken(tokenData);
        });
        complexion.on('start', initialize);
        complexion.on('end', function (data) {
            turnKeywordsIntoIdentifiers(data.tokenList);
        });
        initialize();

        // Order matters for defining tokens
        add('NUMERIC_LITERAL', matchNumericLiteral);  // Before punctuator
        add('PUNCTUATOR', matchPunctuator);  // Before regexp
        add('IDENTIFIER_NAME', matchIdentifierName);  // Can set keywordFromIdentifierName
        add('WHITESPACE', matchWhitespace);
        add('LINE_TERMINATOR', matchLineTerminator);  // Can set implicitSemicolonFlag
        add('KEYWORD', matchKeyword);  // Uses keywordFromIdentifierName
        add('STRING_LITERAL', matchStringLiteral);
        add('SINGLE_LINE_COMMENT', matchSingleLineComment);
        add('BOOLEAN_LITERAL', matchBooleanLiteral);  // Uses keywordFromIdentifierName
        add('NULL_LITERAL', matchNullLiteral);  // Uses keywordFromIdentifierName
        add('REGULAR_EXPRESSION_LITERAL', matchRegularExpressionLiteral);
        add('MULTI_LINE_COMMENT', matchMultiLineComment);

        add('IMPLICIT_SEMICOLON', matchImplicitSemicolon);  // Uses implicitSemicolonFlag

        if (config.shebang === undefined || config.shebang) {
            add('SHEBANG', matchShebang);
        }

        if (config.bom === undefined || config.bom) {
            add('BOM', matchBom);
        }

        add('UNKNOWN', matchUnknown);
    };

    // fid-umd post
}));
// fid-umd post-end
