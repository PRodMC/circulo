/* TP.keys — mapa de teclas del control remoto (guía §6, §25). */
(function (w) {
  var TP = w.TP = w.TP || {};

  var CODES = {
    LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40,
    OK: 13, BACK: 461, EXIT: 27, CANCEL: 3,
    PLAY: 415, INFO: 457, MENU: 462
  };

  /* Alias solo para probar en escritorio: Backspace = BACK. */
  var DEV_ALIASES = { 8: 'BACK' };

  TP.keys = {
    CODES: CODES,
    normalize: function (event) {
      var code = event.keyCode || event.which;
      for (var name in CODES) {
        if (CODES.hasOwnProperty(name) && CODES[name] === code) return name;
      }
      if (!TP.device.hasRuntime() && DEV_ALIASES[code]) return DEV_ALIASES[code];
      return null;
    }
  };
})(window);
