# SMPL v0.1.0a
### The easiest and most powerful little compiler, for the transpiling age.
> simplify your code, increase readability, become more productive. This is the first compiler built for the purpose of transpiling first.

![smpl Logo](./smpl.logo.png)

[![NPM](https://nodei.co/npm/smpl.js.png)](https://nodei.co/npm/smpl.js/)

 [Subscribe to our User's Mailing List](https://groups.google.com/forum/#!forum/jasuperior) |  [Subscribe to our Dev Forum](https://groups.google.com/forum/#!forum/smpl-devs)

 SMPL (pronounced "simple") is the compiler for the transpiling age. Using an easy to learn syntax, compile-time scope, and a command line interface, it allows you to build a dynamic and modular transpiler in minutes.

    pattern { hello world } => {
        return `console.log("hello world"); `
    }
    hello world //compiles to console.log("hello world");

SMPL is built around an entirely new paradigm which is inspired by the rise of transpiling. By giving you the ability to create compile-time patterns and code, you are able to turn that confusing source code, into beatiful, idiomatic glory.  

**This is the first stable release. Please keep in mind that a lot has changed since previous versions.**

#### Table of Contents
* [Getting Started](#getting-started)
* [Motivations](#motivations)
* [Goals](#goals)
* API
    * The Compiler
    * Syntax
        * Pattern Template
            * Pattern Variables
            * Variable Classes
            * Whitespace
        * Pattern Declaration
        * Class Declaration
        * Capture Declaration
        * Pattern Expression
        * Compile-Time Code    
    * CLI
    * Standard Lib
        * Compiler
        * Source
* Roadmap
* Contributing

## Getting Started
Simply install the package globally to get the command line tool

    npm install smpl.js -g
    smpl --help

## Motivations
It's in my belief that programming should not be hard. Programming languages, though they praise themselves on their buzzwords like "speed" and "concurrency", generally, one's ability to utilize these features becomes harder the more complex you make your program. And most of this problem is due to the fact that the underlying data model of your program has the ability to grow and change, but your ability to express this complexity remains stagnant. So, because of these limitations, [Programming Language X] Consortium decides they must boost their spec to meet the demands of their developers. And thus the slow cycle of spec releases and builds begins.

It's in my belief that we choose our programming languages based on the one that most closely fits the way we think and model things. It's obvious that the further away the semantics of your chosen language are from your natural thought patterns, the harder it will be to learn and apply.

All that aside, it cant be the job of the programming language to make things exactly to our individual liking. There has to be a way to modularize your libraries to "speak" like you do.

This was the motivation behind me wanting to build SMPL. The goal wasnt to make yet another parser/lexer/compiler. The idea is to create modules for your syntax, and use them to refactor, transpile, lint, or even build an entirely new language, with ease.

 I've used libraries such as [sweet.js](http://www.sweetjs.org) and [peg.js](http://www.pegjs.org) which were great, but fell short of what I was looking for. Mainly:
+ Parsers like peg.js, language.js, or jison require you to build an entirely new programming language from scratch, using a syntax which, in my opinion, is more complicated then regex.
+ Sweet.js has the right approach using macros, but its limited by forcing you to, well, use macros. All of your patterns are bound to a keyword, which makes more dynamic patterns harder to accomplish easily.
+ All of the current options make requiring npm modules to use in your compile a task that takes quite a bit of maneuvering.
+ There is no way in any of these options to store arbitrary information into a compile time scope for  use in other patterns and transformations.

These reasons and more make SMPL a perfect, and most importantly, **easy** solution for you.

## Goals
SMPL doesn't try to be a full on compiler. There are some things that they may, quite frankly, do better.  However, SMPL's goals help outline our approach for the future of this project.
+ Easy Syntax
+ Small Footprint
+ Easy Interface
+ A Package Ecosystem
+ An Open Community
+ **Fun**
Go to our Goals Page in the wiki to learn more about each of these.
## Syntax
---
### The Compiler

### Pattern Template


## Command Line Tool
Once you have constructed your documents, use the command line tool to compile it into your target language.  you start with prompt `smpl`
#### smpl compile [dir]  [options]
compile is your entry point. you can simply use the `smpl compile` command along with input glob to parse your files.

    $  smpl compile ./example/*.example

optionally you can use `c` or `p`

    $  smpl c ./example/*.example

this will simply compile your file into a javascript file in the same directory.  You can also optionally specify different options to alter your results.

#### options
##### --extension ||  -e
You can use the extension's flag to change the file type of your outputs

    $   smpl c ./example/*.example  -e .cpp

will output a c++ files from your .example's
##### --output || -o
Specify an output directory

    $   smpl c ./example/*.example -o ./build

##### --module || -m
Sometimes you may want to separate your patterns from your working documents. If you have done that, you can specify the document with your patterns using the `-m` flag

    $   smpl c ./example/*.example -m patterns.js -o ./build

##### --concat || -c
if you would like your output to be in a single file, use the `-c` flag to join them together.

    $   smpl c ./example/*.example -c example.js -o ./build

##### --watch || -w
If you would like to watch a file or directory, place the `-w` flag in the query.

        $   smpl c ./example/*.example -o ./build -w

##### --debug || -d
`-d` outputs log messages to help you figure out where something may be going wrong.

        $   smpl c ./example/*.example -o ./build -w

#### smpl --help
Use the help flag after any argument to get an overview of all of the arguments you can use.

    $    smpl --help

    Invalid Command. Showing Help:

    Commands:

    help [command...]        Provides help for a given command.
    exit                     Exits application.
    compile [options] <dir>  Parses the files at the given directory (node glob)

## Package Commands
You can optionally add commands to your package.json file. smpl will read your package for the `"smpl"` object, and parse any expressions that you make a key for.

    "name":"my_package",
    ...
    "smpl": {
            "examples": "c ./examples/**/*.smpl"
    }

This will allow you to call commands without the need for the long query strings

    $   smpl examples
    //same as
    $   smpl c ./examples/**/*.smpl

> ## Be Aware
> This is still in Pre-Alpha stage. I literally built this in a couple days, so i wouldn't recommend using it in production just yet. I haven't even written any tests for it yet. So, use at your own risk.

> That being said, contribute to your hearts desire, I am always open to new ideas and ways in which we can improve this library.  Drop any issues, updates, ideas, etc. in the issues of the git repo and I'll try my best to address it in a timely fashion.

## Roadmap for v0.1.0
+ Add Support for SourceMaps
+ ~~Allow for "Group" captures in patterns~~
+ ~~Allow For "Grouped" captures in output expressions~~
+ ~~Allow for "Grouped" Ellipses in patterns~~
+ ~~Allow for "Grouped" Ellipses in output expression~~
+ ~~Add Support for Packaged Commands~~
+ ~~create "Backtrack" Pattern (recursive)~~
+ Make more in depth examples for different specific domains
+  Command Line argument for outputting to terminal
+ Documentation for `required` version of package
+ Condense core file size
