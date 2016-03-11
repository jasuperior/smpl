#!/usr/bin/node

'use strict';

var OP = require('../');
var parser = new OP.OptionParser();
var requiredValue = null;

/* Method 1 for handling options - use a callback */
parser.addOption('h', 'help', 'Show a help message')
	.action(parser.helpAction());  // We provide a quick help action

parser.addOption('r', 'required', 'Specify a required option')
	.argument('OPTION')
	.action(function (v) {
		// Can handle callbacks
		requiredValue = v;
		console.log("Required value:  " + v);
	});

/* Method 2 for handling options - save a reference to the object */
var optional = parser.addOption('o', 'optional', 'Add an optional value')
	.argument('VALUE', false);  // Parse these by hand later

/* Method 3 for handling options - name the option */
parser.addOption('f', 'flag', 'Turn on some flag', 'flag');

parser.addOption('d', 'debug', null, 'debug');  // Hidden option

try {
	var unparsed = parser.parse();

	/* Second part of "Method 2" */
	optional.values().forEach(function (value) {
		console.log("Optional value:  " + JSON.stringify(value));
	});

	/* Second part of "Method 3" */
	console.log("Times the --flag was specified:  " + parser.flag.count().toString());
	console.log("Times the hidden --debug option was used:  " + parser.debug.count().toString());
	console.log("");

	/* Add some diagnostic information */
	console.log("getopt:");
	console.log(parser.getopt());
	console.log("");
	console.log("Unparsed:");
	console.log(unparsed);
} catch (e) {
	console.log('Exception caught:');
	console.log(e);
	throw e;
}

