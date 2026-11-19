/* TP.player — reproducción de MP4 progresivo con HTML5 <video>.

   ⚠ Guía §19: la spec de Player de Totalplay sigue TBD. Esto es una SIMULACIÓN
   pensada para navegador (GitHub Pages). No usa MSE/EME/HLS/DASH ni DRM; solo
   <video src="archivo.mp4">. NO está validado en el STB: si ahí falla, la UI
   muestra el error y se puede cerrar. Cuando llegue la spec real, solo se
   reemplaza este módulo; la UI habla con TP.player y nada más. */
(function (w, d) {
  var TP = w.TP = w.TP || {};
  var video = null;
  var listeners = {};

  function emit(name, data) {
    var l = listeners[name] || [];
    for (var i = 0; i < l.length; i++) l[i](data);
  }

  function bind(v) {
    var evs = ['play', 'pause', 'timeupdate', 'waiting', 'playing', 'ended', 'error', 'loadedmetadata'];
    for (var i = 0; i < evs.length; i++) {
      (function (name) { v.addEventListener(name, function () { emit(name); }); })(evs[i]);
    }
  }

  TP.player = {
    available: true,
    simulated: true,

    on: function (name, fn) { (listeners[name] = listeners[name] || []).push(fn); },

    /* Crea el <video> dentro de `container` y empieza a reproducir. */
    open: function (container, src) {
      TP.player.close();
      video = d.createElement('video');
      video.className = 'player-video';
      video.setAttribute('playsinline', '');
      video.preload = 'auto';
      bind(video);
      video.src = src;
      container.appendChild(video);
      TP.player.play();
    },

    play: function () {
      if (!video) return;
      try {
        var p = video.play();
        // Autoplay puede rechazarse (TBD §5.2): quedamos en pausa y el usuario da OK.
        if (p && p['catch']) p['catch'](function () { emit('pause'); });
      } catch (e) { emit('pause'); }
    },
    pause: function () { if (video) video.pause(); },
    toggle: function () { if (!video) return; if (video.paused) TP.player.play(); else video.pause(); },

    seekBy: function (sec) {
      if (!video || !isFinite(video.duration)) return;
      video.currentTime = Math.max(0, Math.min(video.duration - 1, video.currentTime + sec));
      emit('timeupdate');
    },

    state: function () {
      if (!video) return null;
      return {
        paused: video.paused,
        time: video.currentTime || 0,
        duration: isFinite(video.duration) ? video.duration : 0,
        error: video.error ? video.error.code : 0
      };
    },

    /* Libera el recurso: quitar src + load() suelta el decodificador. */
    close: function () {
      if (!video) return;
      try { video.pause(); video.removeAttribute('src'); video.load(); } catch (e) {}
      if (video.parentNode) video.parentNode.removeChild(video);
      video = null;
    },

    isOpen: function () { return !!video; }
  };
})(window, document);
