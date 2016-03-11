Complexion
==========

A fast and well tested tokenizer or lexer core.  You can use this library as a scanner to inspect a file and generate a list of tokens.

[![NPM][npm-image]][NPM]
[![Build Status][travis-image]][Travis CI]
[![Dependencies][dependencies-image]][Dependencies]
[![Dev Dependencies][devdependencies-image]][Dev Dependencies]


What Does This Do?
------------------

This is the core of a tokenizing library.  It can be used to parse CSS, JavaScript, XML, JSON, English or any other sort of structured data.  It doesn't do it out of the box; you need to write the token matching code first, but there will soon be libraries to assist with that task.

Known projects that use this tokenizer library:

* None yet.  Add yours with a pull request!


Usage
-----

Install the code using `npm`, `bower` or possibly just clone the repository.  Then, use the library in your JavaScript.  There is UMD markup (via [FidUmd]) that should make this library available under any module system that you prefer to use.

Define what the token types are and how to match them.  After this, you are ready to parse things.  Let's take this simple example where I can only parse newlines (CR or LF) and the word "special".

    var Complexion = require('complexion');
    var instance = new Complexion();
    instance.defineToken('CR', instance.matchString('\r'));
    instance.defineToken('LF', instance.matchString('\n'));
    instance.defineToken('SPECIAL', instance.matchStringInsensitive('special'));
    var result = instance.tokenize("special\n\nSpecial\n");
    // result is now an array of 5 token objects.  The tokens, in order are:
    // SPECIAL CR CR SPECIAL CR

If input is encountered which is not handled by any token, the tokenizing code will throw an `Error`.


Matchers
--------

A "matcher" is what is used to see if the upcoming text matches what's expected for a token type.  For instance, here is a matcher for most whitespace and it will match multiple whitespace characters in a row.

    function whitespaceMatcher(str, offset) {
        var c, l;

        l = 0;
        c = str.charAt(offset + l);

        while (c === ' ' || c === '\n' || c === '\r' || c === '\t') {
            l += 1;
            c = str.charAt(offset + l);
        }

        if (l) {
            return str.substr(offset, l);
        }

        return null;
    }

To help simplify the process of tokenization, a few matcher factories are exposed on instances of `Complexion`.

### complexion.prototype.matchAny()

Will match any character.  Useful if you want to make an "UNKNOWN" token so tokenization won't ever throw during parsing.

    instance.defineToken('UNKNOWN', instance.matchAny());

### complexion.prototype.matchString(str, [nextMatcher])

Matches a string.  Care has been taken to ensure this generates as fast of a matching function as is possible.  If you want to use this as a filter or conditionally create tokens that match a string, you can pass in a `nextMatcher` which will only get called if `str` matches first.

    // CSS "!important" - there may be whitespace between the '!' and 'important'
    var matchImportant = instance.matchStringInsensitive('important');

    instance.defineToken('IMPORTANT', instance.matchString('!', function (str, offset) {
        var imp, ws;
        ws = whitespaceMatcher(str, offset + 1) || '';  // Compensate for "!"
        imp = matchImportant(str, offset + 1 + ws.length);

        if (imp !== null) {
            return str.substr(offset, 1 + ws.length + imp.length);
        }

        return null;
    });

### complexion.prototype.matchStringInsensitive(str, [nextMatcher])

Identical to `complexion.prototype.matchString()` except this is the case insensitive version.


Development
-----------

If you want to work on this library, you need to check out the repository and run `npm install` to get the dependencies.

Tests are *always* included.  Make sure tests cover your changes.  To run the current tests, just use `npm test` or `grunt test` (they will run the same test suite).


License
-------

This software is licensed under an [MIT license with an additional non-advertising clause](LICENSE.md).

[Dev Dependencies]: https://david-dm.org/tests-always-included/complexion#info=devDependencies
[devdependencies-image]: https://david-dm.org/tests-always-included/complexion/dev-status.png
[Dependencies]: https://david-dm.org/tests-always-included/complexion
[dependencies-image]: https://david-dm.org/tests-always-included/complexion.png
[FidUmd]: https://github.com/fidian/fid-umd/
[NPM]: https://npmjs.org/package/complexion
[npm-image]: https://nodei.co/npm/complexion.png?downloads=true&stars=true
[travis-image]: https://secure.travis-ci.org/tests-always-included/complexion.png
[Travis CI]: http://travis-ci.org/tests-always-included/complexion
