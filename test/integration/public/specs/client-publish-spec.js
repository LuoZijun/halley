'use strict';

var Promise = require('bluebird');
var assert = require('assert');

module.exports = function() {

  describe('publish', function() {

    it('should handle publishes', function(done) {
      var publishOccurred = false;
      var client = this.client;

      client.subscribe('/datetime', function(message) {
          if (!publishOccurred) return;
          done();
        })
        .then(function() {
          publishOccurred = true;
          return client.publish('/channel', { data: 1 });
        })
        .catch(done);

    });

    it('should fail when a publish does not work', function(done) {
      this.timeout(6000);

      return this.client.publish('/devnull', { data: 1 }, { attempts: 1 })
        .then(function() {
          throw new Error('Expected failure');
        }, function() {
          // Swallow the error
        })
        .nodeify(done);

    });

    it('should handle a large number of publish messages', function(done) {
      this.timeout(6000);
      var count = 0;
      var self = this;
      return (function next() {
        count++;
        if (count >= 10) return;

        return self.client.publish('/channel', { data: count })
          .then(function() {
            return next();
          })
      })().nodeify(done);
    });

    it('should handle a parallel publishes', function(done) {
      this.timeout(6000);
      
      var count = 0;
      var self = this;
      return (function next() {
        count++;
        if (count >= 20) return;

        return Promise.all([
            self.client.publish('/channel', { data: count }),
            self.client.publish('/channel', { data: count }),
            self.client.publish('/channel', { data: count }),
          ])
          .then(function() {
            return next();
          });
      })().nodeify(done);
    });

    it('should handle the cancellation of one publish without affecting another', function(done) {
      this.timeout(10000);
      var p1 = this.client.publish('/channel', { data: 1 })
        .then(function() {
          throw new Error('Expected error');
        });

      var p2 = this.client.publish('/channel', { data: 2 });
      p1.cancel();

      return p2.then(function(v) {
          assert(v.successful);
          assert(p1.isCancelled());
          assert(p2.isFulfilled());
        })
        .nodeify(done);

    });


  });

};