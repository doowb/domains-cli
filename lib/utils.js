'use strict';

var utils = require('lazy-cache')(require);
var fn = require;
require = utils;

/**
 * Lazily required module dependencies
 */

require('array-unique', 'unique');
require('async-array-reduce', 'reduce');
require('data-store', 'Store');
require('dnsimple');
require('extend-shallow', 'extend');
require('log-utils', 'log');
require('longest');
require('pad-right', 'pad');
require('write-json', 'write');
require('yargs-parser', 'yargs');
require = fn;

utils.arrayify = function(val) {
  return val ? (Array.isArray(val) ? val : [val]) : [];
};

utils.color = function(registry, val) {
  if (val === true) {
    return utils.log.colors.green(registry) + ' ' + utils.log.success;
  } else {
    return registry + ' ' + utils.log.error;
  }
};

utils.createDomains = function(domains) {
  var arr = utils.arrayify(domains)
    .reduce(function(acc, str) {
      acc = acc.concat(utils.combinations(str));
      acc = acc.concat(str.split(/\W/));
      var domain = utils.uncamelcase(str);
      if (domain !== str) {
        acc.push(domain);
      }
      return acc.concat(str);
    }, [])
    .filter(function(str) {
      return !/\s/.test(str);
    })
    .map(function(str) {
      return encodeURIComponent(utils.normalize(str));
    });

  arr.sort();
  return utils.unique(arr.filter(Boolean));
};

utils.success = function(domain, val) {
  if (val === true) {
    domain = utils.log.colors.green(domain);
  }
  return domain;
};

utils.logStatus = function(str, available, len) {
  var gray = utils.log.colors.gray;
  var domain = utils.pad(str, len, ' ');
  var isAvailable = false;
  var cols = Object.keys(available).map(function(tld) {
    if (available[tld]) isAvailable = true;
    return gray(' | ') + utils.color(tld, available[tld]);
  });
  var rows = [utils.success(domain, isAvailable)].concat(cols);
  console.log(rows.join(''));
};

utils.checkDomain = function(dnsimple, account, tlds, opts) {
  return function(acc, domain, next) {
    var checkTld = utils.checkTld(dnsimple, account, domain);
    utils.reduce(tlds, {}, checkTld, function(err, available) {
      if (err) return next(err);

      if (opts.silent !== true) {
        utils.logStatus(domain, available, opts.len);
      }

      acc[domain] = available;
      next(null, acc);
    });
  };
};

utils.checkTld = function(dnsimple, account, domain) {
  return function(acc, tld, next) {
    dnsimple.registrar.checkDomain(account.id, `${domain}.${tld}`)
      .then(function(response) {
        acc[tld] = response.data.available;
        next(null, acc);
      })
      .catch(next);
  };
};

utils.combinations = function(str) {
  var arr = str.split(/\W+/);
  var len = arr.length;
  var res = [];
  var idx = -1;

  while (++idx < len) {
    for (var j = 0; j <= idx; j++) {
      res.push(arr.slice(j, len - idx + j).join('-'));
    }
  }
  return res;
};

utils.normalize = function(domain) {
  return domain.toLowerCase().replace(/^\W+|\W+$/g, '');
};

utils.uncamelcase = function(domain) {
  if (domain.length === 1) return domain.toLowerCase();
  return domain.replace(/(?!(^|\W))[A-Z]/, function(ch) {
    return '-' + ch.toLowerCase();
  });
};

/**
 * Expose `utils` modules
 */

module.exports = utils;
