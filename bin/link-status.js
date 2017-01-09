#! /usr/bin/env node
'use strict';
var handleShellResponse = require('../lib/handle-shell-response');
var shellExec = require('child_process').exec;

shellExec('find ./node_modules/ -maxdepth 2 -type l -ls', _handleShellResponse);

function _handleShellResponse (error, response) {
  var shouldDisplaySource = process.argv[2] === '-s';
  var opts = {
    error: error,
    console: console,
    getAndReplaceSource: _getAndReplaceSource,
    shouldDisplaySource: shouldDisplaySource
  };

  handleShellResponse(response, opts);
}

function _getAndReplaceSource (input, callback) {
  var sourceMatcher = /-> \.\.\/(\.\.\/.+)/;
  var privateSourceMatcher = /-> \.\.\/\.\.\/(\.\.\/.+)/;

  var sourceMatch = input.match(sourceMatcher);
  var privateSourceMatch = input.match(privateSourceMatcher);

  var source = sourceMatch && sourceMatch.length && sourceMatch[1];
  var privateSource = privateSourceMatch && privateSourceMatch.length && privateSourceMatch[1];

  if (!source && !privateSource) {
    return callback(input);
  }

  shellExec('readlink ' + source, function (error, response) {
    if (error || !response) {
      shellExec('readlink ' + privateSource, function (errorTwo, responseTwo) {
        if (errorTwo || !responseTwo) {
          return callback(input);
        }

        return callback(input.replace('../../' + privateSource, responseTwo.replace('\n', '')));
      });

      return;
    }

    return callback(input.replace('../' + source, response.replace('\n', '')));
  });
}

