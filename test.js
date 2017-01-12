'use strict';

require('mocha');
var assert = require('assert');
var checkDomains = require('./');

describe('domains-cli', function() {
  it('should export a function', function() {
    assert.equal(typeof checkDomains, 'function');
  });

  it.skip('should return a list of domains and their availability', function(cb) {
    var domains = ['example', 'examples'];
    var options = {
      baseUrl: 'https://api.sandbox.dnsimple.com',
      auth: {token: ''}
    };

    checkDomains(domains, options, function(err, results) {
      if (err) return cb(err);
      console.log(results);
      cb();
    });
  });
});
