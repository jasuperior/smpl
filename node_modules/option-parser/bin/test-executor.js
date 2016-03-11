#!/usr/bin/env node

'use strict';

var display, OptionParser, parser, unparsed;

function pad(number) {
    var p;

    p = [];
    p.length = number + 1;

    return p.join(' ');
}

function displayArray(what, spacesIndent) {
    what.forEach(function (item) {
        display(pad(spacesIndent) + '-', item, spacesIndent);
    });
}

function displayObject(what, spacesIndent) {
    spacesIndent = +spacesIndent || 0;
    Object.keys(what).sort().forEach(function (key) {
        display(pad(spacesIndent) + key + ':', what[key], spacesIndent);
    });
}

display = function (label, value, previousIndent) {
    var nextIndent;

    nextIndent = previousIndent + 4;

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        console.log(label + ' ' + value);
    } else if (Array.isArray(value)) {
        console.log(label);
        displayArray(value, nextIndent);
    } else if (typeof value === 'object') {
        console.log(label);
        displayObject(value, nextIndent);
    } else {
        console.log(typeof value);
    }
};

OptionParser = require('..');
parser = new OptionParser();
parser.programName('test-executor');

parser.addOption('b', 'boolean', 'Boolean flag')
    .action(function () {
        console.log('Boolean');
    });

parser.addOption([
    'h',
    '?'
], 'help', 'This help message')
    .action(parser.helpAction());

parser.addOption('z', 'hidden')
    .action(function () {
        console.log('Hidden option triggered');
    });

parser.addOption(null, 'lowercase', 'Only allows lowercase values')
    .argument('STRING')
    .validation(function (value) {
        if (!value.match(/^[a-z]+$/)) {
            return 'Only lowercase allowed';
        }
    });

parser.addOption([
    'm',
    'M',
    '9'
], [
    'many-ways',
    'multitude'
], 'Option can be used many ways');

parser.addOption('o', 'optional', 'Optional argument')
    .argument('VALUE', false)
    .action(function (value) {
        if (value !== null) {
            console.log('Optional: ' + value);
        } else {
            console.log('Optional parameter, no value');
        }
    });

parser.addOption('r', 'required', 'Required argument')
    .argument('DATA')
    .action(function (value) {
        console.log('Required: ' + value);
    });

parser.addOption('s', null, 'This option should just barely wrap-around-to-the-next-line-but-it-should-chop-this-super-long-word up.');

parser.addOption([
    'w',
    'W'
], 'wrapping-of-long-description', 'This is a very long description of an option.  It ensures that the text will wrap around and around.  By forcing it to be extremely long we can confirm that implementations perform the proper wrapping and line breaks in the right locations.');

try {
    unparsed = parser.parse();
    displayObject({
        getopt: parser.getopt(),
        unparsed: unparsed
    });
} catch (ex) {
    console.log(ex.message);
}

