'use strict';

/**
 * Handles the scheduling of a single message
 */
function Faye_Scheduler(message, options) {
  this.message  = message;
  this.options = options;
  this.attempts = 0;
  this.failures = 0;
  this.finished = false;
}

Faye_Scheduler.prototype = {
  getTimeout: function() {
    return this.options.timeout;
  },

  getInterval: function() {
    return this.options.interval;
  },

  isDeliverable: function() {
    if (this.finished) return false;
    var allowedAttempts = this.options.attempts;

    if (!allowedAttempts) return true;

    // Say we have 3 attempts...
    // On the 3rd failure, it's not deliverable
    // On the 3rd attempts, it's deliverable
    return this.attempts <= allowedAttempts && this.failures < allowedAttempts;
  },

  /**
   * Called immediately prior to resending
   */
  send: function() {
    this.attempts++;
  },

  /**
   * Called when an attempt to send has failed
   */
  fail: function() {
    this.failures++;
  },

  /**
   * Called when the message has been sent successfully
   */
  succeed: function() {
    this.finished = true;
  },

  /**
   * Called when the message is aborted
   */
  abort: function() {
    this.finished = true;
  }
};

module.exports = Faye_Scheduler;
