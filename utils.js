'use strict';

var utils = require('lazy-cache')(require);
var fn = require;
require = utils;

/**
 * Lazily required module dependencies
 */

require('array-unique');
require('async-array-reduce');
require('data-store', 'Store');
require('extend-shallow', 'extend');
require('log-utils');
require('longest');
require('pad-right');
require('request');
require('write-json');
require('yargs-parser');
require = fn;

/**
 * Expose `utils` modules
 */

module.exports = utils;
