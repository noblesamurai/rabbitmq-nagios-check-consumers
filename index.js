'use strict';
var util = require('util');
// add a command line parser;
// you can substitute with your own favorite npm module
var getOpt = require('node-getopt')
.create([ [ '', 'consumers-warning-threshold=<STRING>', 'Consumers Warning threshold' ],
          [ '', 'consumers-critical-threshold=<STRING>', 'Consumers Critical threshold' ],
          [ '', 'messages-ready-warning-threshold=<STRING>', 'Messages ready Warning threshold' ],
          [ '', 'messages-ready-critical-threshold=<STRING>', 'Messages ready Critical threshold' ],
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

    for (var optionName in args.options) {
      var threshold = args.options[optionName];
      if (optionName.indexOf('consumers') !== -1 && threshold && body.consumers <= threshold) {
        recordProblem(optionName, threshold, body.consumers);
      }
      if (optionName.indexOf('messages-ready') !== -1 && threshold && body.messages_ready >= threshold) {
        recordProblem(optionName, threshold, body.messages_ready);
      }
    }
  }

  // check messages added earlier and return the most severe set:
  // CRITICAL; otherwise WARNING; otherwise OK
  var messageObj = plugin.checkMessages();
  // output the short name, state, message and perf data
  // exit the program with state as return code
  plugin.nagiosExit(messageObj.state, messageObj.message);
});

function recordProblem(optionName, threshold, value) {
  var message =  optionName + ': ' + threshold + ', actual: ' + value;
  if (optionName.indexOf('critical') !== -1) {
    plugin.addMessage(plugin.states.CRITICAL, message);
  } else {
    plugin.addMessage(plugin.states.WARNING, message);
  }
}

// vim: set et sw=2 ts=2 colorcolumn=80:
