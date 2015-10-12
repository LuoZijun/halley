'use strict';

var Faye           = require('../../faye');
var Faye_Transport = require('../transport');
var Faye_URI       = require('../../util/uri');
var Faye_Event     = require('../../util/browser/event');
var inherits       = require('inherits');
var extend         = require('../../util/extend');

var WindowXMLHttpRequest = window.XMLHttpRequest;

function Faye_Transport_XHR(dispatcher, endpoint) {
  Faye_Transport_XHR.super_.call(this, dispatcher, endpoint);
}
inherits(Faye_Transport_XHR, Faye_Transport);

extend(Faye_Transport_XHR.prototype, {
  encode: function(messages) {
    return Faye.toJSON(messages);
  },

  request: function(messages) {
    var href = this.endpoint.href,
        xhr  = new WindowXMLHttpRequest(),
        self = this;

    xhr.open('POST', href, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Pragma', 'no-cache');
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

    var headers = this._dispatcher.headers;
    for (var key in headers) {
      if (!headers.hasOwnProperty(key)) continue;
      xhr.setRequestHeader(key, headers[key]);
    }

    var abort = function() { xhr.abort(); };
    if (Faye.ENV.onbeforeunload !== undefined) Faye_Event.on(Faye.ENV, 'beforeunload', abort);

    xhr.onreadystatechange = function() {
      if (!xhr || xhr.readyState !== 4) return;

      var replies    = null,
          status     = xhr.status,
          text       = xhr.responseText,
          successful = (status >= 200 && status < 300) || status === 304 || status === 1223;

      if (Faye.ENV.onbeforeunload !== undefined) Faye_Event.detach(Faye.ENV, 'beforeunload', abort);
      xhr.onreadystatechange = function() {};
      xhr = null;

      if (!successful) return self._handleError(messages);

      try {
        replies = JSON.parse(text);
      } catch (e) {}

      if (replies)
        self._receive(replies);
      else
        self._handleError(messages);
    };

    xhr.send(this.encode(messages));
    return xhr;
  }
});

/* Statics */
extend(Faye_Transport_XHR, {
  isUsable: function(dispatcher, endpoint, callback, context) {
    callback.call(context, Faye_URI.isSameOrigin(endpoint));
  }
});

Faye_Transport.register('long-polling', Faye_Transport_XHR);

module.exports = Faye_Transport_XHR;