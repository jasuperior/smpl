'use strict';

/**
 * Parameter Constructor
 *
 * Usage:
 *
 *     option = new OptionParameter('h', 'help', 'Show this help message');
 *
 * @param {string|Array.<string>} shortOptions Short strings for options
 * @param {string|Array.<string>} longOptions Long version of options
 * @param {string} [message] Short help message
 */
function OptionParameter(shortOptions, longOptions, message) {
    if (!(this instanceof OptionParameter)) {
        return new OptionParameter(shortOptions, longOptions, message);
    }

	this.actionClosure = null;
	this.argumentName = null;
	this.argumentRequired = 'none';
	this.getoptFormat = {};
	this.optionHelp = null;
	this.optionLong = [];
	this.optionShort = [];
	this.validationClosure = null;
	this.valuesParsed = [];

	if (shortOptions) {
		if (Array.isArray(shortOptions)) {
			this.optionShort = shortOptions;
		} else {
			this.optionShort = [ 
                shortOptions
            ];
		}
	}

	if (longOptions) {
		if (Array.isArray(longOptions)) {
			this.optionLong = longOptions;
		} else {
			this.optionLong = [ longOptions ];
		}
	}

	if (message) {
		this.optionHelp = message;
	}
}


/**
 * Specify an action for a parameter
 *
 * @param {Function} runThis
 * @return {this}
 */
OptionParameter.prototype.action = function (runThis) {
	this.validateCallback(runThis);
	this.actionClosure = runThis;

	return this;
};


/**
 * Specify that this parameter takes an argument
 *
 * @param {string} name Argument name for help message
 * @param {boolean} [required=false] If true, argument is required
 * @return {this}
 */
OptionParameter.prototype.argument = function (name, required) {
	this.argumentName = name;

	if (required === undefined || required) {
		this.argumentRequired = 'required';
	} else {
		this.argumentRequired = 'optional';
	}

	return this;
};


/**
 * Returns the number of times this argument was encountered
 *
 * @return {number}
 */
OptionParameter.prototype.count = function () {
	return this.valuesParsed.length;
};


/**
 * When processing command-line arguments, perform the required actions
 * when our parameter is encountered.  Called once for every time the
 * argument is found on the command line.
 *
 * @param {string} option
 * @param {string} [value]
 * @return {this}
 */
OptionParameter.prototype.handleArgument = function (option, value) {
    var getoptValue, result;

	if (value !== null && this.validationClosure) {
		result = this.validationClosure(value);

		if (result) {
			var exception = new Error(result);
			exception.argument = this;
			throw exception;
		}
	}

	if (this.actionClosure) {
		this.actionClosure(value);
	}

	this.valuesParsed.push(value);
	getoptValue = false;

	if (this.argumentRequired !== 'none' && value !== null) {
		getoptValue = value;
	}

	if (this.getoptFormat[option] === undefined) {
		this.getoptFormat[option] = getoptValue;
	} else {
		if (! Array.isArray(this.getoptFormat[option])) {
			this.getoptFormat[option] = [ this.getoptFormat[option] ];
		}

		this.getoptFormat[option].push(getoptValue);
	}

	return this;
};


/**
 * Returns the argument in getopt format
 *
 * @return {Array}
 */
OptionParameter.prototype.getopt = function () {
	return this.getoptFormat;
};


/**
 * Returns the width of the screen when available.
 *
 * @return {number}
 */
OptionParameter.prototype.getWidth = function () {
	if (process.stdout.getWindowSize) {
		return + (process.stdout.getWindowSize()[0]);
	}

	return 80;
};


/**
 * Generates the help message for this option
 *
 * @param {number} [pad] Amount of space on the left side of the description
 * @param {number} [gutter] Amount of padding between options and descriptions
 * @param {number} [width] Screen width when detected earlier
 * @return {string}
 */
OptionParameter.prototype.help = function (pad, gutter, width) {
    var buffer, help, options;

    function doDefault(input, defaultValue) {
		if (input === undefined || +input < 0) {
			return defaultValue;
		}

		return input;
	}

	pad = doDefault(pad, 16);
	gutter = doDefault(gutter, 2);
	width = doDefault(width, this.getWidth() - gutter);
	options = [];
	buffer = '';

	if (this.optionHelp === null) {
		return '';
	}

	this.optionShort.forEach(function (item) {
		options.push('-' + item);
	});
	this.optionLong.forEach(function (item) {
		options.push('--' + item);
	});

	buffer = options.join(', ');

	if (this.argumentRequired === 'required') {
		buffer += ' ' + this.argumentName;
	} else if (this.argumentRequired === 'optional') {
		buffer += '[=' + this.argumentName + ']';
	}

	help = this.wrap(this.padding(pad) + this.optionHelp, pad, width);

	if (buffer.length > pad - gutter) {
		help = this.wrap(buffer, 0, width) + help;
	} else {
		help = buffer + help.substr(buffer.length);
	}

	return help;
};


/**
 * Add support for autocomplete of long options
 *
 * @param {string} arg
 * @return {Object}
 */
OptionParameter.prototype.matchAutocomplete = function (arg) {
	var hits;
    
    hits = {};
	this.optionLong.forEach(function (o) {
		if (o.substr(0, arg.length) === arg) {
			hits[o] = this;
		}
	});

	return hits;
};


/**
 * Determine if a long argument matches this parameter
 *
 * @param {string} arg
 * @return {boolean}
 */
OptionParameter.prototype.matchLongArgument = function (arg) {
	return this.optionLong.some(function (item) {
		return item === arg;
	});
};


/**
 * Determine if a short argument matches this parameter
 *
 * @param {string} arg
 * @return {boolean}
 */
OptionParameter.prototype.matchShortArgument = function (arg) {
	return this.optionShort.some(function (item) {
		return item === arg;
	});
};


/**
 * Determine if this parameter matches a wildcard
 *
 * @return {boolean}
 */
OptionParameter.prototype.matchWildcard = function () {
	return this.optionShort.some(function (item) {
		return item === '*' || item === '-';
	});
};


/**
 * Generate a string of spaces of a given length.
 *
 * @param {number} length Number of spaces
 * @return {string}
 */
OptionParameter.prototype.padding = function (length) {
    var a;

    a = [];
    a.length = length + 1;
    
    return a.join(' ');
};


/**
 * Return truthy if the parameter requires an argument.
 *
 * @return {boolean}
 */
OptionParameter.prototype.usesArgument = function () {
	return this.argumentRequired;
};


/**
 * Verify that a value is a callable function
 *
 * @param {Function} runThis
 * @return {boolean}
 */
OptionParameter.prototype.validateCallback = function (runThis) {
	if (typeof runThis === 'function') {
		return;
	}

	throw new Error('Invalid closure specified');
};


/**
 * Add a validation function
 *
 * @param {Function} runThis Function to run when validating arguments
 * @return {this}
 */
OptionParameter.prototype.validation = function (runThis) {
	this.validateCallback(runThis);
	this.validationClosure = runThis;

	return this;
};


/**
 * Get just the last value that was specified on the command line.
 *
 * @return {string}
 */
OptionParameter.prototype.value = function () {
	var ret;
    
    ret = this.values();

	if (Array.isArray(ret)) {
		ret = ret.pop();
	}

	return ret;
};


/**
 * Get all of the values that were specified on the command line.
 *
 * @return {Array.<string>}
 */
OptionParameter.prototype.values = function () {
	if (this.argumentName === null) {
		return this.count();
	}

	return this.valuesParsed;
};


/**
 * Wrap text to fit within boundaries
 *
 * @param {string} str
 * @param {number} pad
 * @param {number} width
 * @return {string}
 */
OptionParameter.prototype.wrap = function (str, pad, width) {
    var line, lines, newlineMatch, spacePos, spaces;

    lines = [];
	str = str.replace(/[ \t\r\n]*$/, '');
	spaces = this.padding(pad);

	while (str.length) {
		newlineMatch = str.match(/\r?\n|\r/);

		if (newlineMatch && newlineMatch.index <= width) {
			lines.push(str.substr(0, newlineMatch.index - 1));
			str = str.substr(newlineMatch.index + newlineMatch[0].length);
		} else {
			line = str.substr(0, width);
			spacePos = line.lastIndexOf(' ');

			if (spacePos > width * 0.8) {
				line = line.substr(0, spacePos + 1);
			}

			str = str.substr(line.length);
			lines.push(line.replace(/[ \t\r\n]*$/, ''));
		}

		if (str.length) {
			str = spaces + str;
		}
	}

	return lines.join("\n") + "\n";
};


module.exports = OptionParameter;
