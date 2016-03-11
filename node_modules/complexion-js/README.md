Complexion - JavaScript
=======================

Extends the [Complexion] tokenizing library so it is able to parse JavaScript into tokens.  Useful if you want to create a JavaScript pretty printer, parser or anything that would need to understand the syntax of JavaScript.

[![NPM][npm-image]][NPM]
[![Build Status][travis-image]][Travis CI]
[![Dependencies][dependencies-image]][Dependencies]
[![Dev Dependencies][devdependencies-image]][Dev Dependencies]


Usage
-----

Install this package and [Complexion] with `npm` or `bower` or maybe just clone the two repositories.  Then, use the library in your JavaScript.  There is UMD markup (via [FidUmd]) that should make this library available under any module system that you prefer to use.

    // NPM
    var Complexion = require('complexion');
    var instance = new Complexion();
    require('complexion-js')(instance);
    var tokenList = instance.tokenize('... JavaScript goes here ...');

    // Browser
    var instance = new Complexion();
    complexionJs(instance);
    var tokenList = instance.tokenize('... JavaScript goes here ...');

Options may be passed as well.

    complexionJs(instance, {
        bom: false,
        shebang: false
    });

Options
-------

* bom (boolean, enabled by default) - Allow searching for the byte order mark in files.
* shebang (boolean, enabled by default) - Allow searching for a shebang at the top of a file.

Token Types
-----------

The following are all of the available tokens that the tokenizer produces.

* `BOM` - UTF8 byte order mark at the very beginning of the file.
* `BOOLEAN_LITERAL` - Either `true` or `false`.
* `IDENTIFIER_NAME` - The names of functions, variables, properties.  This does not include keywords.
* `IMPLICIT_SEMICOLON` - A special token that has no content but indicates that there should have been a semicolon here.  It's necessary for determining context and if something is division or a regular expression.
* `KEYWORD` - Special words that the language reserves and are not allowed as variable names.  Does not include null nor booleans.
* `LINE_TERMINATOR` - Newlines (`\r\n`, `\n` and `\r`).
* `MULTI_LINE_COMMENT` - A comment that uses `/* */`.
* `NULL_LITERAL` - Only matches `null`.
* `NUMERIC_LITERAL` - A number in decimal, octal or hex.  Decimals may have exponents.
* `PUNCTUATOR` - Most symbols including math, array literals, object literals, function calls.
* `REGULAR_EXPRESSION_LITERAL` - Regular expressions can be tricky because they sometimes look like division and have lots of allowed escape sequences.
* `SHEBANG` - Only matches the first line when it starts with `#!` and can be turned off.
* `SINGLE_LINE_COMMENT` - A comment that starts with `//`.
* `STRING_LITERAL` - A single or double quoted string.
* `UNKNOWN` - An unknown character.  If you hit this, you have poorly formed JavaScript.  This is not a full lint test, just the beginning of one.
* `WHITESPACE` - Spaces and tabs.  Not newlines.


Token Objects
-------------

The tokens returned from tokenization will all be instances of a `ComplexionJsToken` class.  They retain the same properties that the original token object has and get additional methods.


### ComplexionJsToken.prototype.isAnyType(tokenTypes)

Returns `true` if the token is any of the types passed in.

    if (token.isAnyType([ 'WHITESPACE', 'LINE_TERMINATOR' ])) {
        // This token does not appear on screens
    }


### ComplexionJsToken.prototype.isAnyType(tokenTypes)

Returns `true` if the token is exactly the type passed in.

    if (token.isType('BOOLEAN_LITERAL')) {
        // token.content === "true" || token.content === "false"
    }


### ComplexionJsToken.prototype.isAnyType(tokenTypes)

Returns `true` when the token could be eliminated entirely from the output.

    // Simple minifier
    tokenList.forEach(function (token) {
        if (!token.isUnimportant()) {
            if (token.isType('IMPLICIT_SEMICOLON')) {
                console.log(';');
            } else {
                console.log(token.content);
            }
        }
    });


Development
-----------

If you want to work on this library, you need to check out the repository and run `npm install` to get the dependencies.

Tests are *always* included.  Make sure tests cover your changes.  To run the current tests, just use `npm test` or `grunt test` (they will run the same test suite).

Make sure the matchers are fast.  This library is tweaked to work on unminified source, so take that into consideration before shuffling the matchers too much.


License
-------

This software is licensed under an [MIT license with an additional non-advertising clause](LICENSE.md).

[Complexion]: https://github.com/tests-always-included/complexion
[Dev Dependencies]: https://david-dm.org/tests-always-included/complexion-js#info=devDependencies
[devdependencies-image]: https://david-dm.org/tests-always-included/complexion-js/dev-status.png
[Dependencies]: https://david-dm.org/tests-always-included/complexion-js
[dependencies-image]: https://david-dm.org/tests-always-included/complexion-js.png
[FidUmd]: https://github.com/fidian/fid-umd/
[NPM]: https://npmjs.org/package/complexion-js
[npm-image]: https://nodei.co/npm/complexion-js.png?downloads=true&stars=true
[travis-image]: https://secure.travis-ci.org/tests-always-included/complexion-js.png
[Travis CI]: http://travis-ci.org/tests-always-included/complexion-js
