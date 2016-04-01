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
    * [The Compiler](#the-compiler)
    * [Syntax](#syntax)
        * [Pattern Template](#pattern-template)
            * [Pattern Variables](#pattern-variables)
            * [Variable Classes](#variable-classes)
            * [Repeats](#repeats)
            * [Groups](#groups)
            * [Whitespace](#whitespace)
        * [Transform Context](#transform-context)
        * [Pattern Declaration](#pattern-declaration)
            * [Standard Declaration](#standard-declaration)
            * [Named Declaration](#named-declaration)
            * [Alternation](#alternation)
            * ~~Priority~~ (update: roadmap v0.1.x)
        * Class Declaration
        * Capture Declaration
        * Pattern Expression
        * Compile-Time Code Block
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
+ Sweet.js has the right approach using macros, but its limited by forcing you to, well, use macros. All of your patterns are bound to a keyword, which makes more dynamic patterns harder to accomplish easily. Also, all that hygiene stuff makes my head spin.
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
SMPL, amongst other things, have made tremendous effort to simplify the process of compiling/transpiling. Thus we've given you a very simple syntax to construct your own grammars.
### The Compiler
Knowing about the compiler isn't necessary, but it helps you understand whats going on when you are building your patterns. Each pattern is essentially a special tokenized version of regular expression. They can have a name, a priority, and a transform (more about each below) .

Each round of the compile loop, checks each pattern to see if there is a match in the document. the match whose position is closest to the cursor will advance the cursor to its position, then will fire the appropriate transform context. The context is given a result object which contains the matched string, and properties mapping to those found in the [pattern template](#pattern-template).

Patterns must return a string or string-like object. Patterns which do not return a result (false, null, or undefined), will be excluded from all the following cycles, until a match is found for another pattern-- then the excluded pattern will be returned to the compile loop.

Patterns which return a result, will replace its match in the input string, and progress the cursor to after the appearance of the replacement.
### Pattern Template
Every pattern must contain a template, with which it can perform its matches. A Pattern template is surrounded by `{}` curly braces, and utilize [variables](#pattern-variables), [classes](#variable-classes), and repeats to express your desired logic.  Below is the most basic form of a valid pattern:

    {  hello world }

It matches the appearance of the literals "hello" and "world".  
You'll obviously want to do much more than match inputs literally. For more dynamic features, pattern variables are needed.
#### Pattern Variables
The *pattern variable* gives you the ability to store pieces of the match, into properties of the context of the [pattern's transform](#transform-context). It is denoted by a `$` dollar sign followed by a literal. i.e. `$VarName`

A pattern variable must be declared with a [variable class](#variable-classes). variable classes are denoted by a `:` colon and the name of the class. More on that below.

In total, when using a pattern variable, it should look like this.

    { I am $age:num years old }
    //$age is our variable
    //num is our class, which in this case represents a number class.

This will match an input such as `I am 10 years old` where `10` would be stored into our variable `age`
#### Variable Classes
The *variable class*, as stated above, represents a primitive which can be used in your match. There are 9 classes in total.

* `str` a string, denoted using either ` '' ` ` "" ` or ` `` ` characters.
* `num` any positive or negative whole integer. `9` `-90` `187912`
* `flo` a float type integer with an optional decimal point `10.1` `100` `1423.32`
* `lit` an identifier constructed of legal alphanumeric characters and symbols `name` `camelCase` `under_scored` `m1x3d_numb3r`
* `punc`  punctuators that are not also operators `.` `,` `:` `?` `!` `;`
* `op`  math operators `+` `*` `^` `%` `&`
* `delim` delimiters `()` `[]` `{}`
* `sym`  other miscellaneous symbols `#` `$` `~` `@`
* **`bracket`** a special class for matching nested brackets `{...}`

Mix and match these to create powerful and dynamic patterns.
>Repeats can cause some unexpected results and performance costs when dealing with nested structures like brackets. To combat this, we have created a special bracket class that makes some smart decisions based on the context of the pattern it is being placed in. **Always use the bracket class** when trying to match repeating brackets `{...},{...},{...}`

#### Repeats
Variables and Classes must always be paired together, except for when you use a repeat, denoted using a `...` ellipses after your variable. A repeat can mean different things depending on how you use it. The simplest form is to merely attach it after a literal.

    {hello... world}

this will match `hello hello hello hello world`. But that's not very fun. If you want to make something a bit more dynamic with you repeats, initialize it with a variable.

    { hello $adjectives... world }

This will first match `hello` then match anything until it reaches the first appearance of `world`. i.e. `hello beautiful, amazing world`

If you would like to only match a specific class repeatedly, use the aforementioned `$var:class` syntax followed by a repeat.

    { hello $adjs:lit... world }

This will also match `hello beautiful amazing world`.

If you happen to have a repeating pattern which is separated by a delimiter such as a `,` comma, declare you delimiter in parenthesis between your variable and your repeat `$var(,)...`. This works using a bare variable or one initialized with a class.

    { hello $adjs:lit(,)... world }

This will match `hello beautiful, amazing, SIMPLE world `. *Note, the delimiters only match between the literals and there are no leading or trailing commas.*

> ##### Repeats and Encapsulating Delimiters
> When using delimiters which encapsulate values `()` `[]` `{}` , variables, and repeats in conjunction, space can affect the meaning of your pattern. Placing space between the delimiters and the repeat like, `( $match... )` it performs a non greedy match to the first appearance of the closing brace. If there are no spaces `($match...)` performs a greedy match, until the number of open braces matches the number of closing braces.
> ###### Example
> ```javascript
//Given
( a ( b )( c) )
```
> The former pattern would match `(a(b)` while the latter would match the entire object `( a ( b )( c) )`

#### Groups
For instances where you want to match a complex pattern without declaring a separate pattern, *pattern groups* are you companion. They are initialized also using the `$` symbol then proceeded by your pattern enclosed in `()` parenthesis.

    { hello $( $place:lit ) }

Pattern groups act like a variable, meaning you can use it in repeats in much the same fashion.

    { hello $( $place)(,)... }

Results matched from a pattern group get placed inside the `group` variable of your context, and denoted by [a index number 0-n](#transform-context) that represents the order which it appeared in your pattern.
#### Whitespace
It's important to note, that whitespace is not matched literally as it appears in your pattern. Every time there is whitespace detected in your pattern, it is counted as 0 or more spaces.

    { hello world }
    //matches hello world
    //hello             world
    /*
    hello
    world
    */

### Transform Context
When a pattern template has been matched against, the result is applied to the context of your transform function. It can be accessed via the `this` keyword or by simply calling the name of your variables directly within the context. The syntax used within the context of your transform is javascript. Any value you wish to replace with your match, you would return from the context. A transform context is also denoted using the `{}` curly braces.

    pattern { hello world } => {
        //transform context
        return "goodbye planet"
    }

*more on [pattern declarations](#pattern-declaration) later*

Any variables declared in the pattern will be applied to a variable of the same name, minus `$` dollar sign, in the context.

    //patterns.smpl
        pattern { hello $place:lit } => {
            return this.place;
        }
        pattern { hello $place:lit } => {
            return place; //these are functionally equivalent
        }

    //hello-world.js
        hello world //returns world;

All variables called within a group, can be found in the `groups` array by the index it is found in the template.

    pattern { hello $( $place:lit ) } => {
        return groups[0].place
    }

This will execute in the same fashion as the examples above.

Nested [named patterns ](#named-patterns) will nest objects as you'd expect.

    pattern place { $city:lit , $state:lit } => { return null }
    pattern { hello $place:place } => {
        return place.city;
    }


    hello baltimore, md //evaluates to baltimore

as you can see, `city` is a property of `place` as we've defined it.

In addition to giving you an objectified version of your pattern as context variables, you are also given access to a global scope. In the current version, scope maintains state between files in a single call to `compile` from the [CLI](#command-line-tool). The scope contains a set of functions and objects provided to you by the compiler to help you create more dynamic patterns, as well as access to variables defined in [compile time code-blocks](#compile-time-code-blocks). *be aware that in the transform context, although you can get and mutate values already defined on the scope, you do not have the ability to declare new variables on the scope. All variables declared in the transform context are locally defined*

The compiler provides you with the following variables:

* `compiler` gives you access to the raw [compiler object](#compiler) and all of its methods

And the following methods:

* `compile( input:str )` runs a local compile of the provided input. *(meta!!!)*
* `addPattern( template,:str, transform:funct, options:obj)` manually adds a pattern to the compiler.[ *(more in Standard Lib section)* ](#compiler)
* `prepend( input:str )` prepends the provided string, uncompiled, to the top of your compiled document.
* `append( input:str )` appends the provided string, uncompiled, to the bottom of your compiled document.
* `unpend( input:str )` deletes all appended and prepended strings.

### Pattern Declaration
The entry point to developing your compiler is a pattern declaration. It tells the compiler what you would like to match, and how you would to match it by combining [pattern templates](#pattern-template) with [transform contexts](#transform-context).

#### Standard Declaration
The easiest and most basic form of a declaration is a standard one. It is denoted using the `pattern` keyword followed by a template, `=>` operator, then a transform.

    pattern     { hello world }     =>      { return `console.log("hello world")` }
    //keyword  -> template    -> op   ->   transform

The above pattern will read in an instance of *hello world* and replace it with *console.log("hello world")*.  The form of declaring patterns is powerful in that it allows for mutations and conditionals to happen in the body,  and return dynamic results.
```javascript
    pattern {hello $place:lit } => {
        if( place == "world" ) return `hello(${place})`
        else return `greetings("${place.replace("b","B")}")`
    }
    hello world //compiles to hello(world)
    hello baltimore //compiles to greetings("Baltimore")
```


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
