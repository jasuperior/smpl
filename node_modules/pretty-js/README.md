PrettyJS
========

Beautify / pretty print JavaScript and JSON.  Turn really ugly and poorly indented files into masterpieces.

[![NPM][npm-image]][NPM]
[![Build Status][travis-image]][Travis CI]
[![Dependencies][dependencies-image]][Dependencies]
[![Dev Dependencies][devdependencies-image]][Dev Dependencies]


Requirements
------------

You must have an ECMAScript 5 environment.  If you're in a browser or otherwise don't have convenient things like `Array.prototype.forEach` then you can use [es5-shim] to patch in the necessary functions.

This also relies on [Complexion] and [ComplexionJS].  If you plan on using this in a web browser, I strongly suggest you look into [Browserify] or a similar technique to bundle up JavaScript.


Installation
------------

When you want to run `pretty-js` from the command line, use `npm` to install the script globally.

    npm install -g pretty-js

If you'd rather call the library directly, then list "pretty-js" as a dependency in your `package.json` file and let `npm` install it locally.  You can do it easily with `npm`.

    npm install --save-dev pretty-js


Running via Command Line
------------------------

Did you install this script globally?  (`npm install -g pretty-js`)  If so, you now have the boundless power of the JavaScript pretty printer in a convenient command-line interface.

    pretty-js [options] [filename ...]

Here are a few typical ways to run the pretty printer.

    # Beautify ugly.js
    pretty-js ugly.js > pretty.js

    # Format JSON
    pretty-js -j ugly.json > pretty.json

    # Use Windows linefeeds and jslint-compatible rules
    # Overwrites original file with formatted content
    pretty-js --newline CRLF --jslint --in-place source-code.js

    # Rewrite all JavaScript files and display the name of the
    # file being changed
    pretty-js -i -v *.js

There's a lot of options and you can control all of the aspects of the pretty printer.  Use `pretty-js --help` for a lot of information.  Reading from stdin is an option as well, thanks to [processFiles].  All of the following read from stdin and write to stdout.

    cat ugly.js | pretty-js > pretty.js

    cat ugly.js | pretty-js - > pretty.js

    # The "in-place" editing of stdin just writes to stdout
    cat ugly.js | pretty-js -i > pretty.js


Using the API
-------------

I find that code examples are very illustrative.

```js
var code, options, prettyJs;

// Load the library
prettyJs = require('pretty-js');

// Let's format some code quickly with the defaults
code = '// some JavaScript code goes in here';
console.log(prettyJs(code));  // Displays formatted code

// Format code and specify a couple options
options = {
    indent: "\t",  // Switch to tabs for indentation
    newline: "\r\n"  // Windows-style newlines
};
console.log(prettyJs(code, options));
```


Options
-------

All of these options are also available when using the command-line interface.  When there is a difference in the default value, that is explained for each option along with the reasoning behind the difference.


### bom (boolean or null)

Always add, remove, or just preserve the BOM (byte order mark) in a file.  The BOM can cause problems plus JavaScript and JSON files are expected to typically be in UTF-8.

* `true`: Always add a BOM to the file
* `false`: Always remove a BOM from the file
* `null`: Preserve a BOM if one exists

Defaults to false to help remove problems.


### commentSpace (string)

Spaces to the left of single-line comments.

```js
someFunction();  // single-line comment
```

Defaults to `"  "` (two spaces)


### convertStrings ("double", "single", false/null)

Strings can be `'single quoted'` or `"double quoted"`.  For consistency, the pretty printer will change (and properly re-escape) strings to match your preferred style.

Defaults to double so it works better with JSON.


### elseNewline (boolean)

When enabled, put `else` and `catch` on a new line.  When disabled, those keywords will be on the same line as the previous closing brace.

Defaults to false.


### indent (string)

What to use for a single indentation level.

The eternal "spaces vs. tabs" debate comes up a lot.

Defaults to `"    "` (four spaces).


### jslint (boolean)

When truthy this uses jslint-compatible rules.  For instance, this forces `quoteProperties` to be false.  There's some other changes regarding switch blocks and punctuation as well.

Defaults to false.


### newline (string)

This is the string to use for newlines.

* "\n" is for Mac, Unix and Linux
* "\r\n" is for Windows
* "\r" is the old Mac style

Defaults to `"\n"` (Mac/Unix/Linux style).


### noSpaceAfterIf (boolean)

Enabling this option removes the space that would appear in `if (`.

Defaults to false.


### noSpaceAfterFor (boolean)

Enabling this option removes the space that would appear in `for (`.

Defaults to false.


### noSpaceAfterFunction (boolean)

Enabling this option removes the space that would appear in `function (`.  Please note that this is only applied for anonymous functions, not named functions.

Defaults to false.


### noSpaceAfterSwitch (boolean)

Enabling this option removes the space that would appear in `switch (`.

Defaults to false.


### noSpaceWithIncDec (boolean)

Enable this option to remove the space between an identifier and the ++ or --.

Defaults to false.


### quoteProperties (boolean or null)

Wrap object properties in quotes or remove them.

* `true`: Always add quotes around properties
* `false`: Always remove quotes around properties when syntactically possible
* `null`: Keep quoted properties quoted and unquoted properties unquoted

Defaults to false.


### trailingNewline (boolean)

Adds or removes newline at end of file.

* `true`: Always add newline to end of file
* `false`: Always remove newline from end of file

Defaults to false.


Development
-----------

If you want to work on this library, you need to check out the repository and run `npm install` to get the dependencies.

Tests are *always* included.  Make sure tests cover your changes.  To run the current tests, just use `npm test` or `grunt test` (they will run the same test suite).


License
-------

This software is licensed under an [MIT license with an additional non-advertising clause](LICENSE.md).


[Browserify]: http://browserify.org/
[Complexion]: https://github.com/tests-always-included/complexion
[ComplexionJS]: https://github.com/tests-always-included/complexion-js
[Dev Dependencies]: https://david-dm.org/tests-always-included/pretty-js#info=devDependencies
[devdependencies-image]: https://david-dm.org/tests-always-included/pretty-js/dev-status.png
[Dependencies]: https://david-dm.org/tests-always-included/pretty-js
[dependencies-image]: https://david-dm.org/tests-always-included/pretty-js.png
[es5-shim]: https://github.com/es-shims/es5-shim
[NPM]: https://npmjs.org/package/pretty-js
[npm-image]: https://nodei.co/npm/pretty-js.png?downloads=true&stars=true
[processFiles]: https://github.com/tests-always-included/process-files
[travis-image]: https://secure.travis-ci.org/tests-always-included/pretty-js.png
[Travis CI]: http://travis-ci.org/tests-always-included/pretty-js
