#!/usr/bin/env node

var checkDomains = require('./');
var writeJson = require('write-json');
var log = require('log-utils');
var Store = require('data-store');
var store = new Store('domains-cli');
var auth = store.get('auth');

var argv = require('yargs-parser')(process.argv.slice(2), {
  alias: {
    dest: 'd',
    fast: 'f',
    silent: 's',
    token: 't'
  }
});

if (!auth) {
  auth = {};
}
auth.token = argv.token || auth.token;

if (auth.token) {
  store.set('auth', auth);
} else {
  console.error();
  console.error(log.bold('  please specify authentication details'));
  console.error(log.gray('  authentication tokens can be created for an account at https://dnsimple.com'));
  console.error();
  console.error(log.bold('  --token, -t'));
  console.error();
  process.exit(1);
}

if (argv._.length === 0) {
  console.error();
  console.error('  Enter the domains to search');
  console.error();
  console.error('    $', log.colors.cyan('domains <list of domains>'));
  console.error();
  process.exit();
}

argv.auth = auth;

checkDomains(argv._, argv, function(err, res) {
  if (err) return handleError(err);
  if (argv.dest) {
    writeJson(argv.dest, res, function(err) {
      if (err) return handleError(err);
      end();
    });
  } else {
    end();
  }
});

function handleError(err) {
  console.log(err.stack);
  process.exit(1);
}

function end() {
  process.exit();
}
