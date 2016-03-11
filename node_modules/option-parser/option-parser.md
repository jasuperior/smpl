`OptionParser`
==============

The `OptionParser` object handles keeping track of `OptionParameter` objects and parsing of options.

The class also will set up named options so you can access the `OptionParameter` objects as just properties of the object directly.  Both of these lines are equivalent ways to get a named parameter from the parser.

    parameter = parser.get("testThing");
    parameter = parser.testThing;


`addOption(short, long, helpMessage = null, name = null)`
---------------------------------------------------------

Creates a new `OptionParameter`.  `short`, `long` and `helpMessage` are passed directly to the `OptionParameter` constructor.  `name`, if specified, will assign a name to the object.  Named objects can be retrieved directly as properties on the parser and also via the `get()` method.


`autocomplete(boolean)`
-----------------------

Turn on or off the autocomplete functionality, which lets long options match shorter phrases, like "--long" would match "--longOption".  By default, autocomplete is disabled because it could cause confusion or problems.


`get(name)`
-----------

Return a named parameter.  If no parameter exists with the given name, an `Error` is thrown.


`getopt()`
--------

Return an array or object similar to how PHP's `getopt()` function works.  It does this by calling all of the `OptionParameter` objects that were added and combining their results.


`getValue(name)`
----------------

Gets the value from the named parameter.  The following three lines of code are equivalent.

    value = parser.get('test').value();
    value = parser.test.value();
    value = parser.getValue('test');


`help()`
--------

Builds a help message that describes all of the options that are available.  Returns it as a large string with a trailing newline.  Builds the message by calling `help()` on all of the available `OptionParameter` objects.


`helpAction(commandLine = '[options]')`
---------------------------------------

Builds a very generic help callback that can be used with `OptionParameter->action()`.  The description of parameters that can be passed on the command line can be overridden by providing a different `commandLine` string.


`parse(options = null)`
-----------------------

Parses the options (an Array of strings) passed to the program.  Typically one does not need to pass `options` and `process.argv` will be automatically used.

If `options` is an Array, the program name is not automatically detected and the options are used as-is.


`programName(newName)`
-----------------------

Sets the program name if a new name is passed in.  Returns the current program's name.

When not set, parsing will automatically detect the program name.  This method will then return the detected program name.


`scanAll(boolean)`
------------------

Sets the option scanning behavior.  If `true`, scan for options across the entire command line.  If `false`, stop parsing at the first unknown option.  The default is `true`.
