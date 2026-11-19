/* TP.network — conectividad (guía §12). Polling en STB; eventos online/offline fuera. */
(function (w) {
  var TP = w.TP = w.TP || {};
  var POLL_MS = 15000;
  var online = true;
  var timer = null;
  var listeners = [];

  function set(value) {
    if (value === online) return;
    online = value;
    for (var i = 0; i < listeners.length; i++) listeners[i](online);
  }

  function poll() {
    var status = TP.network.getEthernetStatus();
    // "No link" = sin cable. "unknown" puede ser Wi-Fi: no lo tratamos como caída.
    set(status !== 'No link');
  }

  TP.network = {
    isOnline: function () { return online; },
    onChange: function (fn) { listeners.push(fn); },
    getEthernetStatus: function () { return TP.device.get('INFO', 'ETHERNET'); },
    ping: function (host) { return TP.device.get('NETWORK', 'PING', host); },

    start: function () {
      if (TP.device.hasRuntime()) {
        poll();
        if (!timer) timer = w.setInterval(poll, POLL_MS);
      } else {
        if (typeof w.navigator.onLine === 'boolean') set(w.navigator.onLine);
        w.addEventListener('online', function () { set(true); });
        w.addEventListener('offline', function () { set(false); });
      }
    },
    pause: function () { if (timer) { w.clearInterval(timer); timer = null; } },
    resume: function () { if (TP.device.hasRuntime()) { poll(); if (!timer) timer = w.setInterval(poll, POLL_MS); } }
  };
})(window);
