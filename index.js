'use strict';

var utils = require('./lib/utils');

module.exports = function(domains, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }
  var opts = utils.extend({
    baseUrl: 'https://api.dnsimple.com/v2',
    tlds: ['com', 'io']
  }, options);

  var tlds = utils.arrayify(opts.tlds)
    .reduce(function(acc, tld) {
      return acc.concat(tld.split(','));
    }, []);

  var dnsimple = utils.dnsimple({
    baseUrl: opts.baseUrl,
    accessToken: opts.auth.token
  });

  domains = opts.fast ? domains : utils.createDomains(domains);
  opts.len = utils.longest(domains).length;

  dnsimple.identity.whoami()
    .then(function(response) {
      var account = response.data.account;
      var checkDomain = utils.checkDomain(dnsimple, account, tlds, opts);
      utils.reduce(domains, {}, checkDomain, cb);
    })
    .catch(cb);
}
