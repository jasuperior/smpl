'use strict';

var OptionParameter;

OptionParameter = require('./option-parameter');


/**
 * Constructor for the parser object.
 */
function OptionParser() {
    if (!(this instanceof OptionParser)) {
        return new OptionParser();
    }

	this.doAutocomplete = false;
	this.doScanAll = true;
	this.parameters = [];
	this.programNameParsed = null;
}


/**
 * Create a new option for the parser
 *
 * @param {string|Array.<string>} shortName "h" for -h on command line
 * @param {string|Array.<string>} longName "help" for --help
 * @param {string} [helpMessage] Description of option for help generation
 * @param {string} [referenceName] Add to object as the given property
 * @return {OptionParameter}
 */
OptionParser.prototype.addOption = function (shortName, longName, helpMessage, referenceName) {
	var op = new OptionParameter(shortName, longName, helpMessage);
	this.parameters.push(op);

	if (referenceName) {
		this[referenceName] = op;
	}

	return op;
};


/**
 * Set the autocomplete option
 *
 * Enables --h for --help, for instance.
 *
 * @param {boolean} bool
 * @return {this}
 */
OptionParser.prototype.autocomplete = function (bool) {
	this.doAutocomplete = !!bool;  // Force bool to be a boolean

	return this;
};


/**
 * Get a named parameter.  The name passed in here must be the same as the
 * reference name that was used with addOption().
 *
 * @param {string} name
 * @return {OptionParameter}
 * @throws {Error} if not found
 */
OptionParser.prototype.get = function (name) {
	if (! name || ! this[name]) {
		throw new Error('No parameter named ' . name);
	}

	return this[name];
};


/**
 * Returns a getopt-style object of parsed parameters
 *
 * @return {Object}
 */
OptionParser.prototype.getopt = function () {
	var out = {};

	this.parameters.forEach(function (p) {
        var getopt;

		getopt = p.getopt();
        Object.keys(getopt).forEach(function (key) {
            out[key] = getopt[key];
        });
	});

	return out;
};


/**
 * Gets one value of a named parameter.  For this to work, you must have
 * given a name in the referenceName parameter for addOption().
 *
 * When the option was specified multiple times, this only returns the last
 * value.
 *
 * @param {string} name
 * @return {string}
 */
OptionParser.prototype.getValue = function (name) {
	return this.get(name).value();
};


/**
 * Generate and return a help message for all options.
 *
 * @return {string}
 */
OptionParser.prototype.help = function () {
	var out = '';

	this.parameters.forEach(function (p) {
		out += p.help();
	});

	return out;
};


/**
 * Create a help action for a given parameter
 *
 * Usage:
 *
 * parser = new OptionParser();
 * parser.addOption('h', 'help', 'Display this help message')
 *     .action(parser.helpAction());
 *
 * @param {string} [cmdline]
 * @return {Function}
 */
OptionParser.prototype.helpAction = function (cmdline) {
	if (! cmdline) {
		cmdline = "[options]";
	}

	var myself = this;
	return function () {
		console.log("Usage:");
		console.log("    " + myself.programName() + " " + cmdline);
		console.log("");
		console.log("Available Options:");
		console.log(myself.help().replace(/\n$/, ''));
		process.exit(0);
	};
};


/**
 * Finds the parameter object for a given long option.
 *
 * @param {string} option
 * @return {OptionParameter}
 */
OptionParser.prototype.matchLongOption = function (option) {
    var i, suggestionCount, suggestionObject;

    // Match a regular argument
    for (i = 0; i < this.parameters.length; i += 1) {
        if (this.parameters[i].matchLongArgument(option)) {
            return this.parameters[i];
        }
    }

    // Autocomplete if possible
    if (this.doAutocomplete) {
        suggestionCount = 0;
        suggestionObject = null;

        this.parameters.forEach(function (p) {
            var hits;
            
            hits = p.matchAutocomplete(option);
            Object.keys(hits).forEach(function (key) {
                suggestionCount += 1;
                suggestionObject = hits[key];
            });
        });

        if (suggestionCount === 1) {
            return suggestionObject;
        }
    }

    // Wildcard if possible
    for (i = 0; i < this.parameters.length; i += 1) {
        if (this.parameters[i].matchWildcard(option)) {
            return this.parameters[i];
        }
    }

    return null;
};


/**
 * Finds the parameter object for a given short option.
 *
 * @param {string} option
 * @return {OptionParameter}
 */
OptionParser.prototype.matchShortOption = function (option) {
    var i;

    // Match a regular argument
    for (i = 0; i < this.parameters.length; i += 1) {
        if (this.parameters[i].matchShortArgument(option)) {
            return this.parameters[i];
        }
    }

    // Wildcard if possible
    for (i = 0; i < this.parameters.length; i += 1) {
        if (this.parameters[i].matchWildcard()) {
            return this.parameters[i];
        }
    }

    return null;
};


/**
 * Parse an array of options.  When no arguments are passed, the arguments
 * are retrieved from the command line.
 *
 * When no arguments are passed, the program name can be automatically
 * detected.
 *
 * @param {Array.<string>} [options] Arguments to parse
 * @return {Array.<string>} Unparsed options
 * @throws {Error} Invalid OptionParameter argument type
 */
OptionParser.prototype.parse = function (options) {
    var arg, current, found, matches, rest, unparsed, value;

	if (!Array.isArray(options)) {
		options = process.argv.slice(0);

        if (!this.programNameParsed) {
            // First option is "node", second is program name
            this.programNameParsed = options.shift() + ' ' + options.shift();
        } else {
            options.shift();
            options.shift();
        }
	}

	if (!Array.isArray(options)) {
		throw new Error('Unable to parse options - they are not an array');
	}

	unparsed = [];

	while (options.length) {
		current = options[0];
		arg = null;
		found = null;

		if (current === '--') {
			// Designator for the end of arguments
			options.shift();  // Shift off "--"

			return unparsed.concat(options);
		}

		if (current.substr(0, 2) === '--') {
			// Long option
			arg = current.substr(2);
			value = null;
			matches = arg.match(/^([^=]+)=(.*)$/);

			if (matches) {
				arg = matches[1];
				value = matches[2];
			}

            found = this.matchLongOption(arg);

			if (! found) {
                unparsed.push(options.shift());
			} else {
                options.shift();

				switch (found.usesArgument()) {
					case 'none':
						// Must not use '=' syntax
						// Treat it as another parameter if found
						found.handleArgument(arg, null);

						if (value !== null) {
							options.unshift('=' + value);
						}

						break;

					case 'required':
						// Can use '=' syntax or next argument
						if (value === null) {
							if (! options.length) {
								throw new Error('Value needed for --' + arg);
							}

							value = options.shift();
						}

						found.handleArgument(arg, value);
						break;

					default:  // optional
						// Must use '=' syntax if a value is to be specified
						found.handleArgument(arg, value);
						break;
				}
			}
		} else if (current.charAt(0) === '-') {
			// Short option
			arg = current.charAt(1);
			rest = current.substr(2);
            found = this.matchShortOption(arg);

			if (! found) {
				unparsed.push('-' + arg);
				options.shift();

				if (rest.length) {
					options.unshift('-' + rest);
				}
			} else {
				switch (found.usesArgument()) {
					case 'none':
						// Must not use '=' syntax
						found.handleArgument(arg, null);
						options.shift();

						if (rest.length) {
							options.unshift('-' + rest);
						}

						break;

					case 'required':
						// Can use '=' syntax, the rest of the current arg
						// or next argument
						options.shift();

						if (rest.length) {
							if (rest.charAt(0) === '=') {
								rest = rest.substr(1);
							}
						} else {
							if (! options.length) {
								throw new Error('Value needed for -' . arg);
							}

							rest = options.shift();
						}

						found.handleArgument(arg, rest);
						break;

					case 'optional':
						// Must use '=' syntax
						options.shift();

						if (rest.charAt(0) === '=') {
							found.handleArgument(arg, rest.substr(1));
						} else {
							found.handleArgument(arg, null);

							if (rest.length) {
								options.unshift('-' + rest);
							}
						}
						break;

					default:
						throw new Error('Invalid OptionParameter argument type: ' + found.usesArgument());
				}
			}
		} else if (this.doScanAll) {
			unparsed.push(options.shift());
		} else {
			// Stopping at first unknown
			return unparsed.concat(options);
		}
	}

	return unparsed;
};


/**
 * Return the name of the program
 *
 * @return {string}
 */
OptionParser.prototype.programName = function (newName) {
    if (newName !== undefined) {
        this.programNameParsed = newName;
    }

	return this.programNameParsed;
};


/**
 * Set the flag for scanning all options
 *
 * @param {boolean} bool
 * @return {this}
 */
OptionParser.prototype.scanAll = function (bool) {
	this.doScanAll = !!bool;  // Force bool to be a boolean

    return this;
};


module.exports = OptionParser;
