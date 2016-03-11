OptionParser Tests
==================

This is a shared library to ensure that the various OptionParser-style programs all consistently parse arguments correctly.


Installation
------------

Add this repository as a submodule to your package.

```bash
git submodule add http://github.com/tests-always-included/option-parser-tests.git test/
```

Next, make a command-line program that will execute your commands.  It must be named `bin/test-executor`.  This is a special program that must handle a specific suite of options.  They are detailed below.


Running Test Suite
------------------

It is as simple as running a single command.  Make sure you start this in your repository's top-level directory.

```bash
tests/run-tests
```


Test Executor Configuration
---------------------------

Each option here must be configured exactly as shown so the tests can properly exercise all of the features.  Short and long options are shown as well as the help text.

Options may have additional actions that need to be performed.  Those are detailed in the descriptions.

The "program name" that is reported by the parser must be "test-executor".


### -b, --boolean: "Boolean flag"

Turns on a boolean.  When enabled this writes the line "Boolean" to the screen.


### -h, -?, --help:  "This help message"

Writes out the help and immediately exits.

Make sure that the program name that the parser reports is "test-executor" instead of detecting the program's name.


### -z, --hidden:

No description for this option.  The option is hidden from the output text.

When enabled, this option writes the line "Hidden option triggered" to the screen.


### --lowercase:  "Only allows lowercase values"

This takes a required argument called "STRING".

When specifying a value that does not contain only lowercase letters, this should report "Only lowercase allowed" and then immediately exit.  Symbols, uppercase, numbers and unicode would all trigger the error message.  Only lowercase letters are allowed.


### -m, -M, -9, --many-ways, --multitude:  "Option can be used many ways"

Tests how the help generation sees this and ensures that options can be specified in a number of ways.


### -o, --optional: "Optional argument"

This parameter takes an optional argument called "VALUE".

When passed a value this writes the line "Optional: xxxx" (where xxxx is the value) to the screen.  Without a value this writes the line "Optional parameter, no value".


### -r, --required:  "Required argument"

This parameter takes a required argument called "DATA".

When used this will write the line "Required: xxxx" (where xxxx is the value) to the screen.


### -s: (SEE TEXT)

The description of this option is extremely long and has a very long word so that it tests out how descriptions can be forced to split in the middle of a word.  The description is below, all on one line.

    This option should just barely
    wrap-around-to-the-next-line-but-it-should-chop-this-super-long-word up.


### -w, -W, --wrapping-of-long-description: (SEE TEXT)

The description of this option is extremely long in order to have it wrap.  It is the following, all on one line:

    This is a very long description of an option.  It ensures that the text
    will wrap around and around.  By forcing it to be extremely long we can
    confirm that implementations perform the proper wrapping and line breaks
    in the right locations.


Test Executor Output
--------------------

The test executor must output the getopt results and the unparsed commands in a YAML format.  It must look like the following.  Indentation is 4 spaces.

```
getopt:
    flagSpecifiedOnce: false
    flagSpecifiedTwice:
        - false
        - false
    parameterSpecifiedTwice:
        - one
        - two
unparsed:
    - --someOption
```

The only exceptions to this would be if `--help` is used or if there are validation errors.

Properties must be alphabetied.
