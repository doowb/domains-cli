'use strict';

var pad = require('pad-right');
var reduce = require('async-array-reduce');
var extend = require('extend-shallow');
var request = require('request');
var unique = require('array-unique');
var longest = require('longest');
var utils = require('log-utils');

var baseUrl = 'https://api.dnsimple.com/v2';

module.exports = checkDomains;

function checkDomains(domains, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }
  var opts = extend({}, options);
  var authOpts = authOptions(opts);

  whoami(authOpts, function(err, id) {
    if (err) return cb(err);
    authOpts.id = id;
    authOpts.tlds = arrayify(opts.tlds).reduce(function(acc, tld) {
      return acc.concat(tld.split(','));
    }, []);

    if (!authOpts.tlds.length) {
      authOpts.tlds = ['com', 'io'];
    }

    var arr = opts.fast ? domains : createDomains(domains);
    var len = longest(arr).length;

    reduce(arr, {}, function(acc, domain, next) {
      checkDomain(domain, authOpts, function(err, available) {
        if (err) return next(err);

        if (opts.silent !== true) {
          logStatus(domain, available, len);
        }
        acc[domain] = available;
        next(null, acc);
      });
    }, cb);
  });
}

function checkDomain(domain, options, cb) {
  var opts = {
    headers: options.headers
  };

  reduce(options.tlds, {}, function(acc, tld, next) {
    // /:account/registrar/domains/:domain/check
    var url = `${baseUrl}/${options.id}/registrar/domains/${domain}.${tld}/check`;
    try {
      request(url, opts, function(err, res, body) {
        if (err) return next(err);
        if (res && res.statusCode > 400) {
          return next(new Error(res.statusMessage));
        }

        try {
          var data = JSON.parse(body);
          if (data.message) {
            return next(new Error(data.message));
          }
          acc[tld] = data.data.available;
          next(null, acc);
        } catch (err) {
          next(err);
        }
      });
    } catch (err) {
      next(err);
    }
  }, cb);
}

function whoami(options, cb) {
  request(`${baseUrl}/whoami`, options, function(err, res, body) {
    if (err) return cb(err);
    if (res.statusCode > 400) {
      return cb(new Error(res.statusMessage));
    }
    try {
      var data = JSON.parse(body).data;
      cb(null, data.account.id);
    } catch(err) {
      cb(err);
    }
  });
}

function logStatus(str, available, len) {
  var gray = utils.colors.gray;
  var domain = pad(str, len, ' ');
  var isAvailable = false;
  var cols = Object.keys(available).map(function(tld) {
    if (available[tld]) isAvailable = true;
    return gray(' | ') + color(tld, available[tld]);
  });
  var rows = [success(domain, isAvailable)].concat(cols);
  console.log(rows.join(''));
}

function color(registry, val) {
  if (val === true) {
    return utils.colors.green(registry) + ' ' + utils.success;
  } else {
    return registry + ' ' + utils.error;
  }
}

function success(domain, val) {
  if (val === true) {
    domain = utils.colors.green(domain);
  }
  return domain;
}

function createDomains(domains) {
  var arr = arrayify(domains)
    .reduce(function(acc, str) {
      acc = acc.concat(combinations(str));
      acc = acc.concat(str.split(/\W/));
      var domain = uncamelcase(str);
      if (domain !== str) {
        acc.push(domain);
      }
      return acc.concat(str);
    }, [])
    .filter(function(str) {
      return !/\s/.test(str);
    })
    .map(function(str) {
      return encodeURIComponent(normalize(str));
    });

  arr.sort();
  return unique(arr.filter(Boolean));
}

function combinations(str) {
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
}

/*
curl  -H 'Authorization: Bearer <token>' \
      -H 'Accept: application/json' \
      https://api.dnsimple.com/v2/whoami
 */
function authOptions(options) {
  return {
    headers: {
      'Authorization': `Bearer ${options.auth.token}`,
      'Accept': 'application/json'
    }
  };
}

function normalize(domain) {
  return domain.toLowerCase().replace(/^\W+|\W+$/g, '');
}

function uncamelcase(domain) {
  if (domain.length === 1) return domain.toLowerCase();
  return domain.replace(/(?!(^|\W))[A-Z]/, function(ch) {
    return '-' + ch.toLowerCase();
  });
}

function arrayify(val) {
  return val ? (Array.isArray(val) ? val : [val]) : [];
}
