/**
 * JavaScript beautifier
 *
 * The code will call on Complexion to first tokenize the JavaScript and
 * then run through these rules to insert appropriate whitespace.
 *
 * In procedure will be to run through each token.  Whitespace tokens are
 * removed and others will add whitespace again just after each token.  All
 * whitespace is managed by this beautifier.
 */
/*global exports, module, require*/
// fid-umd {"depends":[{"name":"Complexion","commonjs":"complexion"},{"name":"complexionJs","commonjs":"complexion-js"}],"jslint":1,"name":"prettyJs"}
/*global define, YUI*/
(function (n, r, f) {
    "use strict";
    try { module.exports = f(require("complexion"), require("complexion-js")); return; } catch (ignore) {}
    try { exports[n] = f(require("complexion"), require("complexion-js")); return; } catch (ignore) {}
    try { return define.amd && define(n, ["Complexion", "complexionJs"], f); } catch (ignore) {}
    try { return YUI.add(n, function (Y) { Y[n] = f(Y.Complexion, Y.complexionJs); }, "", { requires: ["Complexion", "complexionJs"] }); } catch (ignore) {}
    try { r[n] = f(r.Complexion, r.complexionJs); return; } catch (ignore) {}
    throw new Error("Unable to export " + n);
}("prettyJs", this, function (Complexion, complexionJs) {
    "use strict";
    // fid-umd end

    var keywordContentProcessors, processors, punctuatorContentProcessors, tokenizer;

    /**
     * Allowed options
     *
     * @typedef {Object} prettyJs~options
     * @property {?boolean} bom Always add, remove, or just preserve BOM
     * @property {string} commentSpace Spaces to the left of single comments
     * @property {?string} convertStrings Set to "double", "single" or falsy
     * @property {boolean} elseNewline When enabled, else and catch on new line
     * @property {string} indent What to use for a single indent level
     * @property {boolean} jslint Use jslint-compatible rules
     * @property {string} newline What string to use for newlines
     * @property {boolean} noSpaceAfterIf Remove space in "if ("
     * @property {boolean} noSpaceAfterFor Remove space in "for ("
     * @property {boolean} noSpaceAfterFunction Remove space in "function ("
     * @property {boolean} noSpaceAfterSwitch Remove space in "switch ("
     * @property {?boolean} quoteProperties Wrap object properties in quotes
     */

    /**
     * @typedef {Object} prettyJs~resultBit
     * @property {string} code
     * @property {string} content
     */

    /**
     * This is where the result of all of the hard work will end up
     *
     * @property {Array.<prettyJs~resultBit>} contexts Context and indentation
     * @property {Array.<prettyJs~resultBit>} fragments Formatted output
     * @property {prettyJs~options} options
     */
    function Result(options) {
        this.contexts = [];
        this.fragments = [];
        this.options = options;
    }

    /**
     * Adds a blank line if the previous non-whitespace token is a } or ;
     */
    Result.prototype.addConditionalNewline = function () {
        var prev;

        prev = this.getPreviousNonWhitespace();

        if (!prev) {
            return;
        }

        if (prev.content === ';' || prev.content === '}') {
            this.removeWhitespace();
            this.addNewline();
            this.addNewline();
        }
    };

    /**
     * Sets a context and adds the indentation to the output
     *
     * @param {(string|prettyJs~resultBit)} code
     * @param {string} [indent] defaults to this.options.indent
     */
    Result.prototype.addContext = function (code, indent) {
        if (typeof code !== 'object') {
            if (indent === undefined) {
                indent = this.options.indent;
            }

            this.contexts.push({
                code: code,
                content: indent
            });
        } else {
            this.contexts.push(code);
        }
    };

    /**
     * Adds a chunk of text to the list
     *
     * @param {string} code
     * @param {string} type
     */
    Result.prototype.addFragment = function (code, content) {
        this.fragments.push({
            code: code,
            content: content
        });
    };

    /**
     * Adds a newline to the list
     *
     * Also can strip spaces and indentation so we don't have extra whitespace
     * at the end of lines.
     */
    Result.prototype.addNewline = function () {
        var type;

        type = this.getType();

        while (type === 'INDENT' || type === 'SPACE') {
            this.removeFragment();
            type = this.getType();
        }

        this.addFragment('NEWLINE', this.options.newline);
        this.addFragment('INDENT', this.getIndentation());
    };

    /**
     * Adds a space to the list
     */
    Result.prototype.addSpace = function () {
        return this.addFragment('SPACE', ' ');
    };

    /**
     * Adds a chunk of text to the list based on a token
     *
     * @param {complexionJs~ComplexionJsToken} token
     */
    Result.prototype.addToken = function (token) {
        this.fragments.push({
            code: token.type,
            content: token.content
        });
    };

    /**
     * Returns true if a blank line should be added at the current position
     * before adding a comment
     *
     * @return {boolean}
     */
    Result.prototype.commentShouldHaveNewline = function () {
        var check, last;

        last = this.getPreviousNonWhitespace();

        // No extra newline at the beginning of a file
        if (!last) {
            return false;
        }

        // No extra newline when following an open symbol
        check = last.content;

        if (check === '{' || check === '(' || check === '[') {
            return false;
        }

        // No extra newline after some token types
        check = last.code;

        if (check === 'LINE_COMMENT' || check === 'BOM') {
            return false;
        }

        return true;
    };

    /**
     * Gets the current context, if there is one
     *
     * @return {?string}
     */
    Result.prototype.getContextCode = function () {
        if (!this.contexts.length) {
            return null;
        }

        return this.contexts[this.contexts.length - 1].code;
    };

    /**
     * Returns the last fragment object
     *
     * @return {?prettyJs~resultBit}
     */
    Result.prototype.getFragment = function () {
        if (!this.fragments.length) {
            return null;
        }

        return this.fragments[this.fragments.length - 1];
    };

    /**
     * Returns the current indentation string
     *
     * @return {string}
     */
    Result.prototype.getIndentation = function () {
        var i, str;

        str = '';

        for (i = 0; i < this.contexts.length; i += 1) {
            str += this.contexts[i].content;
        }

        return str;
    };

    /**
     * Returns the last fragment which is not whitespace.
     *
     * @return {?prettyJs~resultBit}
     */
    Result.prototype.getPreviousNonWhitespace = function () {
        var code, i;

        for (i = this.fragments.length - 1; i >= 0; i -= 1) {
            code = this.fragments[i].code;

            if (code !== 'SPACE' && code !== 'INDENT' && code !== 'NEWLINE') {
                return this.fragments[i];
            }
        }

        return null;
    };

    /**
     * Returns the text from the last fragment added
     *
     * Does not call getFragment for speed (saves a function call)
     *
     * @return {?string}
     */
    Result.prototype.getText = function () {
        if (!this.fragments.length) {
            return null;
        }

        return this.fragments[this.fragments.length - 1].content;
    };

    /**
     * Returns the code from the last fragment added
     *
     * Does not call getFragment for speed (saves a function call)
     *
     * @return {?string}
     */
    Result.prototype.getType = function () {
        if (!this.fragments.length) {
            return null;
        }

        return this.fragments[this.fragments.length - 1].code;
    };

    /**
     * Return true if we could be making an array literal
     *
     * Does not call getFragment for speed (saves a function call)
     *
     * @return {boolean}
     */
    Result.prototype.isArrayLiteral = function () {
        var prev;

        prev = this.getPreviousNonWhitespace();

        if (!prev) {
            return true;
        }

        if (prev.code === 'KEYWORD') {
            // Things that allow properties
            if (prev.content === 'this' || prev.content === 'super') {
                // this['some property']
                return false;
            }

            return true;
        }

        if (prev.code === 'IDENTIFIER_NAME') {
            // thing[1]
            return false;
        }

        if (prev.content === ')' || prev.content === ']') {
            // test()[1]
            // multiArray[0][1]
            return false;
        }

        return true;
    };

    /**
     * Return true if we could be doing type conversion at this point
     *
     * @return {boolean}
     */
    Result.prototype.isTypeConversion = function () {
        var prev;

        if (!this.fragments.length) {
            return true;
        }

        prev = this.getPreviousNonWhitespace();

        if (!prev) {
            return true;
        }

        if (prev.code === 'KEYWORD') {
            return true;
        }

        // Most punctuators imply that the next thing done will likely be
        // a type conversion.  The rest seem to imply math.
        if (prev.code !== 'PUNCTUATOR') {
            return false;
        }

        // These are all flags for math
        if (prev.content === ')' || prev.content === '}' || prev.content === ']') {
            return false;
        }

        return true;
    };

    /**
     * Returns true if the last token was a newline.  Skips spaces and
     * indentation.
     *
     * @return {boolean}
     */
    Result.prototype.lastWasNewline = function () {
        var code, i;

        i = this.fragments.length - 1;

        while (i >= 0) {
            code = this.fragments[i].code;

            if (code === 'NEWLINE') {
                return true;
            }

            if (code !== 'SPACE' && code !== 'INDENT') {
                return false;
            }

            i -= 1;
        }

        // Slightly odd.  No content's the same as a newline.
        return true;
    };

    /**
     * Removes a level from the context
     *
     * @return {?prettyJs~resultBit}
     */
    Result.prototype.removeContext = function () {
        var self;

        self = this;

        if (!self.contexts.length) {
            // Force indents to go up when there were no contexts
            self.fragments.forEach(function (fragment) {
                if (fragment.code === 'INDENT') {
                    fragment.content = self.options.indent + fragment.content;
                }
            });

            return null;
        }

        return self.contexts.pop();
    };


    /**
     * Removes a level from the context when the context should end at
     * the end of a statement.  This method will get called when hitting
     * a semicolon, closing brace, and in other situations that would
     * indicate that a statement is complete.  The contexts associated
     * with statement-level constructs would be removed.
     */
    Result.prototype.removeContextForStatement = function () {
        var context;

        context = this.getContextCode();

        while (context === 'IF' || context === 'ELSE' || context === 'FOR' || context === 'TERNARY' || context === 'VAR') {
            this.removeContext();
            context = this.getContextCode();
        }
    };


    /**
     * Removes a fragment from the stack
     *
     * @return {?prettyJs~resultBit}
     */
    Result.prototype.removeFragment = function () {
        if (!this.fragments.length) {
            return null;
        }

        return this.fragments.pop();
    };

    /**
     * Removes whitespace from the end of the fragments
     */
    Result.prototype.removeWhitespace = function () {
        var type;

        type = this.getType();

        while (type === 'NEWLINE' || type === 'SPACE' || type === 'INDENT') {
            this.removeFragment();
            type = this.getType();
        }
    };

    /**
     * Returns the result as a string
     *
     * @return {string}
     */
    Result.prototype.toString = function () {
        var i, str;

        str = '';

        for (i = 0; i < this.fragments.length; i += 1) {
            str += this.fragments[i].content;
        }

        return str;
    };

    /**
     * Convert a quoted string to a different quoting method
     *
     * @param {prettyJs~Result} result
     * @param {string} content String content WITH QUOTES
     * @return {string} Converted string
     */
    function convertString(result, content) {
        var converted, quote;

        if (!result.options.convertStrings) {
            return content;
        }

        if (result.options.convertStrings === 'single') {
            quote = "'";
        } else {
            quote = '"';
        }

        if (content.charAt(0) === quote) {
            return content;
        }

        // Remove quotes
        converted = content.substr(1, content.length - 2);

        /* Unescape all quotes and be careful with properly escaped
         * backslashes, like "\\'"
         */
        /*jslint regexp:true*/
        converted = converted.replace(/\\./g, function (match) {
            /*jslint regexp:false*/
            var c;

            c = match.charAt(1);

            if (c === '"' || c === "'") {
                return c;
            }

            return match;
        });

        // Escape our quotes again
        converted = converted.replace(new RegExp(quote, 'g'), '\\' + quote);

        return quote + converted + quote;
    }

    /**
     * Initialize options with their default values and guarantee that the
     * options variable is an object.
     *
     * @param {*} options
     * @return {prettyJs~options} options
     */
    function initializeOptions(options) {
        var defaults;

        defaults = {
            bom: false,  // Causes problems and unnecessary with UTF-8
            commentSpace: "  ",  // Looks nice before single line comments
            convertStrings: "double",  // Mimics JSON
            elseNewline: false,  // Matches jslint rules
            indent: '    ',  // The eternal spaces vs. tabs debate
            jslint: false,  // Some jslint-specific rules
            newline: "\n",  // Unix-style newlines
            quoteProperties: false,  // Prefer to unquote properties
            trailingNewline: false  // Prefer to remove trailing newline
        };

        if (!options) {
            options = {};
        }

        Object.keys(defaults).forEach(function (key) {
            if (options[key] === undefined) {
                options[key] = defaults[key];
            }
        });

        if (options.convertStrings !== 'single' && options.convertStrings !== 'double') {
            options.convertStrings = false;
        }

        if (options.jslint) {
            options.quoteProperties = false;
        }

        return options;
    }

    /**
     * Token processing function
     *
     * @typedef {Function} prettyJs~processor
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */

    /**
     * Hand off the token processing to another function based on
     * the token's content.
     *
     * @param {Object} rules Map of exact string to processor
     * @param {prettyJs~processor} defaultProcessor
     * @return {prettyJs~processor}
     */
    function processByContent(rules, defaultProcessor) {
        return function (result, token) {
            var fn;

            if (rules.hasOwnProperty(token.content)) {
                fn = rules[token.content];
            } else {
                fn = defaultProcessor;
            }

            return fn(result, token);
        };
    }


    /**
     * Passes off an individual token to a processing function.
     *
     * @param {prettyJs~result}
     * @param {complexionJs~ComplexionJsToken} token
     * @param {number} index
     * @param {Array.<complexionJs~ComplexionJsToken>} tokenList
     */
    function processToken(result, token, index, tokenList) {
        var fn;

        fn = processors[token.type];

        if (!fn) {
            throw new Error('Unhandled token type ' + token.type + ' at line ' + token.line + ' col ' + token.col + ', offset ' + token.offset);
        }

        fn(result, token, index, tokenList);
    }

    /**
     * Byte order mark
     *
     * If the `bom` option is set to `true` or `false` we always remove it.
     * When it's true, the BOM is added immediately by the prettyJs
     * function itself.
     *
     * @param {prettyJs~Result} result
     */
    function tokenBom(result) {
        if (result.options.bom === null || result.options.bom === undefined) {
            result.addFragment("BOM", "\ufeff");
        }
    }

    /**
     * Copy a token to the result.
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenCopy(result, token) {
        result.addToken(token);
    }

    /**
     * Copy a token to the result and add a newline.
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenCopyAndNewline(result, token) {
        result.addToken(token);
        result.addNewline();
    }

    /**
     * Copy a token to the result and add a space.
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenCopyAndSpace(result, token) {
        result.addToken(token);
        result.addSpace();
    }

    /**
     * Switches may have "case" and "default" outdented.
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenKeywordCase(result, token) {
        var context;

        context = result.getContextCode();

        if (context === 'BRACE') {
            // Treat this as an identifier
            return tokenCopyAndSpace(result, token);
        }

        result.removeWhitespace();

        /* Add a blank line between this keyword and the previous
         * content unless it's the first "case" in a switch or
         * there's multiple "case"/"default" rules together.
         */
        if (result.getText() !== '{' && result.getText() !== ':') {
            result.addNewline();
        }

        if (result.options.jslint) {
            context = result.removeContext();
            result.addNewline();
            result.addContext(context);
        } else {
            if (result.getContextCode() !== 'SWITCH_BLOCK') {
                result.removeContext();
            }

            result.addNewline();
            result.addContext(token.content.toUpperCase());
        }

        tokenCopyAndSpace(result, token);
    }

    /**
     * The start of a control flow block
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenKeywordControlFlow(result, token) {
        result.addConditionalNewline();
        tokenCopyAndSpace(result, token);
        result.addContext(token.content.toUpperCase(), '');
    }

    /**
     * "else" and "catch" should be on the same line as a closing }
     * but "else" should be on a new, unindented line when there was no }
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenKeywordElse(result, token) {
        var prev;

        // Remove newlines and indentation
        result.removeWhitespace();

        if (!result.options.elseNewline) {
            prev = result.getFragment();

            if (prev) {
                if (prev.content === '}') {
                    result.addSpace();
                } else {
                    result.addNewline();
                }
            }
        } else {
            // Reducing to just one newline
            result.addNewline();
        }

        tokenCopyAndSpace(result, token);
        result.addContext(token.content.toUpperCase(), '');
    }

    /**
     * These statements should have a newline in front of them if
     * they are the first content on the line
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenKeywordOffsetLine(result, token) {
        result.addConditionalNewline();
        tokenCopyAndSpace(result, token);
    }

    /**
     * The variables declared in `var` should be indented.
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenKeywordVar(result, token) {
        tokenCopyAndSpace(result, token);
        result.addContext('VAR');
    }

    /**
     * Lots of minor changes:
     * - Standardizes newlines
     * - Removes trailing whitespace
     * - Starts all lines with an aligned "*"
     * - Reindents
     * - 2 blank lines before multi-line comments
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenMultiLineComment(result, token) {
        var addNewline, addSpace, str;

        // Standardize newlines into ones I prefer
        str = token.content.replace(/\r?\n|\r/g, "\n");

        // Removing closing comment tag
        str = str.replace(/\*\/$/, '');

        // Remember if there was a newline right before this tag
        addNewline = false;

        if (str.match(/\n[ \t\f]*$/)) {
            addSpace = false;
            addNewline = true;
            str = str.replace(/\n[ \t\f]*$/, '');
        } else {
            // Remember if there was a space right before the end tag
            /*jslint regexp:true*/
            addSpace = str.match(/[^ \t\f\n]([ \t\f]*)$/);
            /*jslint regexp:false*/

            if (addSpace && addSpace[1]) {
                addSpace = addSpace[1];
                str = str.substr(0, str.length - addSpace.length);
            } else {
                addSpace = false;
            }
        }

        // Remove trailing whitespace and whitespace after newlines
        str = str.replace(/[ \t\f]*\n/g, "\n").replace(/\n[ \t\f]*/g, "\n");

        // Force all lines to start with indentation + space + star + space
        str = str.replace(/\n\*/g, "\n");  // Remove stars
        /*jslint regexp:true*/
        str = str.replace(/\n([^ \n])/g, "\n $1");  // Adds a space
        /*jslint regexp:false*/
        str = str.replace(/\n/g, "\n" + result.getIndentation() + " *");  // Add star

        /*jslint regexp:true*/
        str = str.replace(/([^\* ])(\*\/)$/, '$1 $2');
        /*jslint regexp:false*/

        // Convert newlines into ones you prefer
        if (result.options.newline !== "\n") {
            str = str.replace(/\n/g, result.options.newline);
        }

        // Add closing tag back
        if (addNewline) {
            str += "\n" + result.getIndentation() + ' ';
        } else {
            // Add the spacing back
            if (addSpace) {
                str += addSpace;
            }
        }

        str += '*/';

        if (result.commentShouldHaveNewline()) {
            result.removeWhitespace();
            result.addNewline();
            result.addNewline();
            result.addNewline();
        }

        result.addFragment('BLOCK_COMMENT', str);
        result.addNewline();
    }

    /**
     * Handles what happens with close braces
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenPunctuatorBraceClose(result, token) {
        var context, extraNewline;

        // Terminate a statement if one was started
        result.removeContextForStatement();

        // Decrease indentation
        result.removeContext();
        result.removeWhitespace();
        context = result.getContextCode();
        extraNewline = false;

        if (context === 'SWITCH_BLOCK') {
            // The last context could have been from "case" or "default"
            result.removeContext();
            context = result.getContextCode();
        }

        if (context === 'CATCH' || context === 'ELSE' || context === 'FOR' || context === 'FINALLY' || context === 'FUNCTION' || context === 'IF' || context === 'SWITCH') {
            // Done with the function declaration or block of code
            result.removeContext();

            if (result.getContextCode() === 'ELSE') {
                result.removeContext();
            }

            extraNewline = true;
        }

        // If not empty, add a newline
        if (result.getText() !== '{') {
            result.addNewline();
        }

        // Add content, newline
        result.addFragment('PUNCTUATOR', token.content);
        result.addNewline();

        // If this was a function or similar, add another newline
        if (extraNewline) {
            result.addNewline();
        }
    }

    /**
     * Handles what happens after open braces
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenPunctuatorBraceOpen(result, token) {
        var context;

        context = result.getContextCode();

        // Remember some contexts so we can key off them later
        if (context === 'FOR' || context === 'FUNCTION' || context === 'SWITCH' || context === 'IF' || context === 'ELSE') {
            result.addContext(context + '_BLOCK');
        } else {
            result.addContext('BRACE');
        }

        result.addToken(token);
        result.addNewline();
    }

    /**
     * Handles what happens after closing brackets
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenPunctuatorBracketClose(result, token) {
        var lastText, prevContext;

        // Decrease indentation
        prevContext = result.removeContext();
        result.removeWhitespace();
        lastText = result.getText();

        if (prevContext.code !== 'ARRAY_INDEX' && (lastText !== '(' && lastText !== '{' && lastText !== '[')) {
            result.addNewline();
        }

        return tokenCopyAndSpace(result, token);
    }

    /**
     * Handles what happens after open brackets
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenPunctuatorBracketOpen(result, token) {
        if (result.isArrayLiteral()) {
            result.addContext('BRACKET');
            result.addToken(token);
            result.addNewline();
        } else {
            result.removeWhitespace();
            result.addContext('ARRAY_INDEX');
            result.addToken(token);
        }
    }

    /**
     * Handles colons
     *
     * Switches, ternary, object literals
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenPunctuatorColon(result, token) {
        var context, prev;

        /**
         * Returns true if the string passed in can be an identifier without
         * additional quoting
         *
         * @param {string} content
         * @return {boolean}
         */
        function canBeIdentifier(content) {
            var tokenList;

            // Reuse the tokenizer to see if the content is an identifier
            tokenList = tokenizer.tokenize(content);

            if (tokenList.length !== 1 || tokenList[0].type !== 'IDENTIFIER_NAME') {
                return false;
            }

            if (!result.options.jslint) {
                return true;
            }

            if (content.charAt(0) === '_' || content.charAt(-1) === '_') {
                return false;
            }

            return true;
        }

        context = result.getContextCode();

        if (context === 'CATCH') {
            /* This should be a keyword instead
             *
             * { catch: false }
             *
             * Remove the CATCH context
             */
            result.removeContext();
            context = result.getContextCode();
        }

        if (context === 'SWITCH_BLOCK' || context === 'CASE' || context === 'DEFAULT') {
            result.removeWhitespace();
            result.addToken(token);
            result.addNewline();

            return;
        }

        if (context !== 'TERNARY') {
            // Property name as a string or identifier
            result.removeWhitespace();

            if (result.options.quoteProperties === true) {
                // Force quotes
                if (result.getType() === 'IDENTIFIER_NAME' || result.getType() === 'KEYWORD') {
                    prev = result.removeFragment();
                    result.addFragment('STRING', convertString(result, JSON.stringify(prev.content)));
                }
            } else if (result.options.quoteProperties === false) {
                // Remove quotes when possible
                if (result.getType() === 'STRING') {
                    prev = result.getFragment().content;
                    prev = prev.substr(1, prev.length - 2);

                    if (canBeIdentifier(prev)) {
                        result.removeFragment();
                        result.addFragment('IDENTIFIER_NAME', prev);
                    }
                }
            }
        }

        return tokenCopyAndSpace(result, token);
    }

    /**
     * Pre/Post Increment/Decrement (++ and --)
     *
     * No space between the identifier and the punctuator when the
     * specific option is enabled.
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenPunctuatorIncDec(result, token) {
        function isPre() {
            var prev;

            prev = result.getPreviousNonWhitespace();

            if (!prev || prev.code !== 'IDENTIFIER_NAME') {
                return true;
            }

            return false;
        }

        if (!result.options.noSpaceWithIncDec) {
            return tokenCopyAndSpace(result, token);
        }

        if (isPre()) {
            return tokenCopy(result, token);
        }

        result.removeWhitespace();

        return tokenCopyAndSpace(result, token);
    }

    /**
     * Handles commas
     *
     * jslint only increases indentation when there is a comma
     * inside a function's argument list.
     *     test(function () {
     *         oneLevelIndent();
     *     });
     *     test2(true,
     *         function () {
     *             twoLevelIndent();
     *         });
     *
     * In order to attach to the previous token, no whitespace before this one.
     *
     * Add newline if we are not in a var / function's context.
     *
     *     {
     *         a: a,
     *         b: b
     *     }
     *
     *     return a(),
     *         b;
     *
     * No newline sometimes (var / function call)
     *
     *     var a, b;
     *
     *     a(b, c);
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenPunctuatorComma(result, token) {
        var context;

        result.removeWhitespace();
        context = result.getContextCode();

        if (context === 'TERNARY') {
            result.removeContext();
            context = result.getContextCode();
        }

        result.addToken(token);

        if (context === 'FUNCTION_ARGS') {
            /* This is the first comma seen in a function call.  It sets a
             * new context that can be used for indentation on other things
             * for jslint-compatible formatting.
             */
            result.addContext('FUNCTION_ARGS_COMMA', '');
            result.addSpace();
        } else if (context === 'FUNCTION_ARGS_COMMA' || context === 'VAR' || context === 'FOR_CONDITION') {
            /* Only add a space for "var" and "for"
             *
             * var a, b, c;
             *
             * for (a = 1, b = 2; ...
             *
             * x(1, 2)
             */
            result.addSpace();
        } else if (context === 'BRACE' || context === 'BRACKET') {
            /* Add newlines inside arrays and objects
             *
             * x = [
             *     1,
             *     2
             * ];
             *
             * x = {
             *     a: 1,
             *     b: 2
             * };
             */
            result.addNewline();
        } else {
            /* Merging multiple lines onto one, typically from a minifier
             *
             * return a = f(),
             *     a[1] = 123,
             *     a;
             */
            result.addContext('COMMA_OPERATOR');
            result.addNewline();
            result.removeContext('COMMA_OPERATOR');
        }
    }

    /**
     * Handles what happens after closing parenthesis
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenPunctuatorParenthesisClose(result, token) {
        result.removeContextForStatement();

        if (result.getContextCode() === 'FUNCTION_ARGS_COMMA') {
            result.removeContext();
        }

        result.removeContext();
        result.removeWhitespace();

        return tokenCopyAndSpace(result, token);
    }

    /**
     * Handles what happens after open parenthesis
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenPunctuatorParenthesisOpen(result, token) {
        var context, prev;

        prev = result.getPreviousNonWhitespace();

        if (!prev) {
            result.addContext('PAREN', '');
        } else if (prev.code === 'IDENTIFIER_NAME' || prev.content === '}' || prev.content === ')' || prev.content === ']') {
            // someFunction(
            // function something() {}(
            // (function () {})(
            // methods[x](
            result.removeWhitespace();
            result.addContext('FUNCTION_ARGS', '');
        } else if (prev.content === 'function') {
            // function (
            if (result.options.noSpaceAfterFunction) {
                result.removeWhitespace();
            }

            result.addContext('FUNCTION_ARGS', '');
        } else {
            context = result.getContextCode();

            if (context === 'IF') {
                // if (
                if (result.options.noSpaceAfterIf) {
                    result.removeWhitespace();
                }

                result.addContext('IF_CONDITION');
            } else if (context === 'FOR') {
                // for (
                if (result.options.noSpaceAfterFor) {
                    result.removeWhitespace();
                }

                result.addContext('FOR_CONDITION', '');
            } else {
                // This function can only be called for "function",
                // "for", "if" and "switch".  This needs to be "switch".
                if (result.options.noSpaceAfterSwitch) {
                    result.removeWhitespace();
                }

                result.addContext('PAREN', '');
            }
        }

        // No space after open parenthesis
        result.addToken(token);
    }

    /**
     * Handles periods
     *
     * Attach to the content before and after.
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenPunctuatorPeriod(result, token) {
        result.removeWhitespace();
        result.addToken(token);
    }

    /**
     * Plus and Minus
     *
     * No space following the plus or minus if we are doing type conversion.
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenPunctuatorPlusMinus(result, token) {
        var isTypeConversion;

        // Check if this is type conversion before adding the symbol
        isTypeConversion = result.isTypeConversion();
        result.addToken(token);

        if (!isTypeConversion) {
            result.addSpace();
        }
    }

    /**
     * Handles question marks, a ternary operation
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenPunctuatorQuestion(result, token) {
        result.addContext('TERNARY', '');
        result.addToken(token);
        result.addSpace();
    }

    /**
     * Adds a semicolon and newline
     *
     * Do not use the token content here because it may be an implicit
     * semicolon, which does not have content.
     *
     * Extra newlines after a "var" statement and after a "use strict".
     *
     * @param {prettyJs~Result} result
     */
    function tokenSemicolon(result) {
        var oldContext, previousText;

        function needsTwoNewlines() {
            if (oldContext === 'VAR') {
                // var a, b, c;
                return true;
            }

            if (previousText === '"use strict"' || previousText === "'use strict'") {
                // "use strict";
                // 'use strict';
                return true;
            }

            return false;
        }

        oldContext = result.getContextCode();
        result.removeContextForStatement();
        result.removeWhitespace();
        previousText = result.getText();
        result.addFragment('SEMICOLON', ';');  // Do not use token.content here

        if (result.getContextCode() === 'FOR_CONDITION') {
            // for (a = 1;
            // for (a = 1; a < b;
            result.addSpace();
        } else {
            if (needsTwoNewlines()) {
                result.addNewline();
            }

            result.addNewline();
        }
    }

    /**
     * Skips the addition of a token to the result
     */
    function tokenSkip() {
        return undefined;
    }

    /**
     * If the comment had no prior content on the line, then check if the
     * the comment should have a newline.  If so, wipe out the whitespace
     * and add a couple of newlines.  If there was content already on the
     * line, remove whitespace and add the commentSpace before the comment.
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     * @param {number} index
     * @param {Array.<complexionJs~ComplexionJsToken>} tokenList
     */
    function tokenSingleLineComment(result, token, index, tokenList) {
        var str;

        /**
         * Detect if the comment was originally on the same line as
         * some code.
         *
         * @return {boolean}
         */
        function originallyOnSameLine() {
            var check;

            while (index) {
                index -= 1;
                check = tokenList[index].type;

                if (check === 'LINE_TERMINATOR') {
                    return false;
                }

                if (check !== 'WHITESPACE') {
                    /**
                     * Check the content to see if a newline would make sense
                     * in this situation.
                     */
                    check = tokenList[index].content;

                    if (check === '{' || check === '[') {
                        return false;
                    }

                    return true;
                }
            }
        }

        // Remove trailing whitespace
        str = token.content.replace(/ [\t\f]*\n/g, result.options.newline);

        if (originallyOnSameLine() || !result.lastWasNewline()) {
            result.removeWhitespace();
            result.addFragment('COMMENT_WHITESPACE', result.options.commentSpace);
            result.addFragment('STATEMENT_COMMENT', str);
        } else {
            if (result.commentShouldHaveNewline(index, tokenList)) {
                result.removeWhitespace();
                result.addNewline();
                result.addNewline();
            }

            result.addFragment('LINE_COMMENT', str);
        }

        result.addNewline();
    }

    /**
     * Processes a string and may convert the string to single or double
     * quotes.
     *
     * @param {prettyJs~Result} result
     * @param {complexionJs~ComplexionJsToken} token
     */
    function tokenString(result, token) {
        var str;

        str = convertString(result, token.content);
        result.addFragment('STRING', str);
        result.addSpace();
    }

    // Initialize a new tokenizer with the default options
    tokenizer = new Complexion();
    complexionJs(tokenizer);
    keywordContentProcessors = {
        'case': tokenKeywordCase,
        'catch': tokenKeywordElse,
        'default': tokenKeywordCase,
        'else': tokenKeywordElse,
        'finally': tokenKeywordElse,
        'for': tokenKeywordControlFlow,
        'function': tokenKeywordControlFlow,
        'if': tokenKeywordControlFlow,
        'return': tokenKeywordOffsetLine,
        'switch': tokenKeywordControlFlow,
        'throw': tokenKeywordOffsetLine,
        'try': tokenKeywordOffsetLine,
        'var': tokenKeywordVar,
        'while': tokenKeywordOffsetLine
    };
    punctuatorContentProcessors = {
        '{': tokenPunctuatorBraceOpen,
        '}': tokenPunctuatorBraceClose,
        '[': tokenPunctuatorBracketOpen,
        ']': tokenPunctuatorBracketClose,
        '(': tokenPunctuatorParenthesisOpen,
        ')': tokenPunctuatorParenthesisClose,
        '.': tokenPunctuatorPeriod,
        ';': tokenSemicolon,
        ',': tokenPunctuatorComma,
        ':': tokenPunctuatorColon,
        '+': tokenPunctuatorPlusMinus,
        '-': tokenPunctuatorPlusMinus,
        '++': tokenPunctuatorIncDec,
        '--': tokenPunctuatorIncDec,
        '!': tokenCopy,
        '?': tokenPunctuatorQuestion
    };
    processors = {
        BOM: tokenBom,
        BOOLEAN_LITERAL: tokenCopyAndSpace,
        IDENTIFIER_NAME: tokenCopyAndSpace,
        IMPLICIT_SEMICOLON: tokenSemicolon,
        KEYWORD: processByContent(keywordContentProcessors, tokenCopyAndSpace),
        LINE_TERMINATOR: tokenSkip,  // Other rules manage all spaces
        MULTI_LINE_COMMENT: tokenMultiLineComment,
        NULL_LITERAL: tokenCopyAndSpace,
        NUMERIC_LITERAL: tokenCopyAndSpace,
        PUNCTUATOR: processByContent(punctuatorContentProcessors, tokenCopyAndSpace),
        REGULAR_EXPRESSION_LITERAL: tokenCopyAndSpace,
        SHEBANG: tokenCopyAndNewline,
        SINGLE_LINE_COMMENT: tokenSingleLineComment,
        STRING_LITERAL: tokenString,
        WHITESPACE: tokenSkip  // Other rules manage all whitespace
    };

    return function (str, options) {
        var result, tokenList;

        options = initializeOptions(options);
        tokenList = tokenizer.tokenize(str);
        result = new Result(options);

        if (options.bom === true) {
            // See tokenBom for why this always adds a new token
            result.addFragment("BOM", "\ufeff");
        }

        // Set a placeholder for a zero-length indentation
        result.addFragment('INDENT', result.getIndentation());
        tokenList.forEach(function (token, index) {
            processToken(result, token, index, tokenList);
        });
        result.removeWhitespace();

        if (options.trailingNewline === true) {
            result.addNewline();
        }

        return result.toString();
    };

    // fid-umd post
}));
// fid-umd post-end
