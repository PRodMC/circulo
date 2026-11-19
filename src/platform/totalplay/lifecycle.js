/* TP.lifecycle — standby/wakeup (guía §11, §26) y BACK/MENU de raíz (regla R6). */
(function (w, d) {
  var TP = w.TP = w.TP || {};
  var STANDBY = 0x7000001B;
  var WAKEUP = 0x7000001C;
  var listeners = { standby: [], wakeup: [] };

  function emit(name) {
    TP.debug.log('lifecycle: ' + name);
    for (var i = 0; i < listeners[name].length; i++) {
      try { listeners[name][i](); } catch (e) { TP.debug.log('lifecycle error ' + e); }
    }
  }

  TP.lifecycle = {
    STANDBY: STANDBY,
    WAKEUP: WAKEUP,

    on: function (name, fn) { if (listeners[name]) listeners[name].push(fn); },

    /* Devuelve true si el keydown era un evento de plataforma. */
    handle: function (event) {
      var code = event.keyCode || event.which;
      if (code === STANDBY) { emit('standby'); return true; }
      if (code === WAKEUP) { emit('wakeup'); return true; }
      return false;
    },

    /* R6: BACK en la raíz. La plataforma maneja la salida de forma nativa.
       NO agregar window.close() ni lógica de salida propia hasta que Totalplay
       confirme una API oficial. */
    onRootBack: function (event) {
      if (event && event.preventDefault) event.preventDefault();
    },

    /* R6: MENU. Igual que BACK de raíz: aislado y vacío. */
    onMenu: function (event) {
      if (event && event.preventDefault) event.preventDefault();
    }
  };

  // Fuera del STB, simular standby/wakeup con la visibilidad de la pestaña.
  if (!TP.device.hasRuntime() && typeof d.hidden !== 'undefined') {
    d.addEventListener('visibilitychange', function () { emit(d.hidden ? 'standby' : 'wakeup'); });
  }
})(window, document);
