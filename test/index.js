var exec = require('child_process').exec,
    expect = require('expect.js'),
    express = require('express');

var app = express();

app.get('/api/queues/%2F/myqueue.name', function (req, res) {
    res.json({consumers: 3});
});

var server = app.listen(3000);

var command = 'node ' + __dirname + '/../index.js --amqp-host=http://guest:guest@localhost:3000 --amqp-vhost=/ --amqp-queue=myqueue.name';

describe('index.js', function() {
  it('gives OK if enough consumers', function(done) {
    exec(command + ' --consumers-warning-threshold 2 --consumers-critical-threshold 1', function callback(err, stdout, stderr){
      if (err) {
        console.log(stdout, stderr);
        return done(err);
      }
      expect(stdout).to.contain('OK');
      done();
    });
  });
  it('is WARNING if not enough consumers', function(done) {
    exec(command + ' --consumers-warning-threshold 3 --consumers-critical-threshold 2', function callback(err, stdout, stderr){
      expect(err).to.be.ok();
      console.log(stdout);
      expect(stdout).to.contain('WARNING');
      done();
    });
  });
  it('is CRITICAL if not enough consumers', function(done) {
    exec(command + ' --consumers-warning-threshold 4 --consumers-critical-threshold 3', function callback(err, stdout, stderr){
      expect(err).to.be.ok();
      expect(stdout).to.contain('CRITICAL');
      done();
    });
  });
});

// vim: set et sw=2 ts=2 colorcolumn=80:
