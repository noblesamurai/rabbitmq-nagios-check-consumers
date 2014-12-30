var exec = require('child_process').exec,
    expect = require('expect.js');
describe('index.js', function() {
  it('works', function(done) {
    exec('node ' + __dirname + '/../index.js --amqp-host=http://guest:guest@arthur.noblesamuraicloud.com:15672 --amqp-vhost=/ --amqp-queue=authlabs.response.submit -w 3 -c 3', function callback(err, stdout, stderr){
      if (err) return done(err);
      done();
    });
  });
});

// vim: set et sw=2 ts=2 colorcolumn=80:
