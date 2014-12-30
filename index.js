'use strict';
var util = require('util');
// add a command line parser;
// you can substitute with your own favorite npm module
var getOpt = require('node-getopt')
.create([ [ '', 'consumers-warning-threshold=<STRING>', 'Warning threshold' ],
          [ '', 'consumers-critical-threshold=<STRING>', 'Critical threshold' ],
          [ '', 'amqp-host=<STRING>', 'The AMQP host URL - include credentials' ],
          [ '', 'amqp-vhost=<STRING>', 'AMQP vhost' ],
          [ '', 'amqp-queue=<STRING>', 'Name of the queue to monitor' ],
          [ 'h', 'help', 'display this help' ] ])
.bindHelp();
getOpt.setHelp('Usage: node amqp-consumers.js [Options]\nOptions:\n[[OPTIONS]]');
var args = getOpt.parseSystem();
// validate mandatory arguments
if (args.options.length <  5) {
    console.log('missing arguments');
    getOpt.showHelp();
    process.exit(3);
}

var Plugin = require('nagios-plugin');
// create a new plugin object with optional initialization parameters
var plugin = new Plugin({
    // shortName is used in output
    shortName : 'amqp_consumers'
});

var request = require('request-json');
var amqpHost = args.options['amqp-host'];
var vHost = encodeURIComponent(args.options['amqp-vhost']);
var queue = encodeURIComponent(args.options['amqp-queue']);

// Base URL of API
var client = request.newClient(amqpHost + '/api/');

// Request queue info
client.get('queues/' + vHost + '/' + queue, function(err, res, body) {

  if (err || res.statusCode !== 200) {
    console.log(err || res);
    plugin.addMessage(plugin.states.UNKNOWN, 'Could not query the API');
  } else {
    var message = body.consumers + ' consumers';

    // Default
    plugin.addMessage(plugin.states.OK, message);

    // Add warning message if relevant
    if (body.consumers <= args.options['consumers-warning-threshold']) {
      plugin.addMessage(plugin.states.WARNING, message);
    }

    // Add critical message if relevant
    if (body.consumers <= args.options['consumers-critical-threshold']) {
      plugin.addMessage(plugin.states.CRITICAL, message);
    }
  }

  // check messages added earlier and return the most severe set:
  // CRITICAL; otherwise WARNING; otherwise OK
  var messageObj = plugin.checkMessages();
  // output the short name, state, message and perf data
  // exit the program with state as return code
  plugin.nagiosExit(messageObj.state, messageObj.message);
});

// vim: set et sw=2 ts=2 colorcolumn=80:
