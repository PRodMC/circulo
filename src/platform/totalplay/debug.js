/* TP.debug — logging (guía §16). En STB de desarrollo usa sagem.Set("LOG"); fuera, console. */
(function (w) {
  var TP = w.TP = w.TP || {};
  TP.debug = {
    log: function (msg) {
      if (TP.device && TP.device.hasRuntime() && typeof w.sagem.Set === 'function') {
        try { w.sagem.Set('LOG', String(msg)); return; } catch (e) {}
      }
      if (w.console && w.console.log) w.console.log('[circulo]', msg);
    }
  };
})(window);
