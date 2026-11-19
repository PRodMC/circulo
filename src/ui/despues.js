/* DESPUÉS — cierre al terminar (o salir) del contenido:
   quiénes lo vieron + compartir por WhatsApp con portada (vista previa del enlace).
   En la TV no hay WhatsApp: se muestra un QR que abre WhatsApp en el celular. */
(function (w, d) {
  var Screens = w.Screens = w.Screens || {};
  var Actions = w.Actions = w.Actions || {};
  var esc = UI.esc;

  var NOTES = [
    '¡Tienes que verla!',
    'Nos la pasamos increíble.',
    'No te la puedes perder.'
  ];

  var last = null; // { cid, people: [nombres], note }

  function namesText(list) {
    if (!list.length) return '';
    if (list.length === 1) return list[0];
    return list.slice(0, -1).join(', ') + ' y ' + list[list.length - 1];
  }

  function shareUrl(cid) { return UI.baseUrl() + 'v/' + cid + '.html'; }

  function message() {
    var c = Data.byId(last.cid);
    return '🎬 Vimos «' + c.title + '» en Círculo\n' + NOTES[last.note] + '\n' +
      'La vimos: ' + namesText(last.people) + '\n' + shareUrl(last.cid);
  }

  function waUrl() { return 'https://wa.me/?text=' + encodeURIComponent(message()); }

  Screens.despues = function () {
    if (!last) return '<div class="empty">Nada por aquí.</div>';
    var c = Data.byId(last.cid);
    var s = '<section class="despues"><div class="despues-poster">' + UI.poster(c) + '</div><div class="despues-body">' +
      '<div class="eyebrow">Fin de la función</div><h1 class="display">' + esc(c.title) + '</h1>' +
      '<p class="muted">La vieron</p><div class="chips">';
    for (var i = 0; i < last.people.length; i++) {
      var m = null;
      for (var j = 0; j < Data.members.length; j++) if (Data.members[j].name === last.people[i]) m = Data.members[j];
      s += '<span class="chip">' + (m ? UI.avatar(m.id, 'sm') : '<span class="avatar sm" style="background:#43474E">' + esc(last.people[i].charAt(0)) + '</span>') + esc(last.people[i]) + '</span>';
    }
    s += '</div><h2 class="section-title" style="margin-top:2rem">¿Qué le decimos?</h2><div class="actions">';
    for (var k = 0; k < NOTES.length; k++) {
      s += '<button class="btn' + (k === last.note ? ' is-on' : '') + '" data-focusable data-fid="de-n-' + k + '" data-action="de-note" data-n="' + k + '">' + esc(NOTES[k]) + '</button>';
    }
    s += '</div><div class="actions" style="margin-top:2rem">' +
      '<button class="btn btn-cta" data-focusable data-fid="de-share" data-action="de-share">Compartir por WhatsApp</button>' +
      '<button class="btn" data-focusable data-fid="de-home" data-action="tab" data-screen="home">Volver al inicio</button></div></div></section>';
    return s;
  };

  Actions['de-note'] = function (el) { last.note = Number(el.getAttribute('data-n')); App.render(el.getAttribute('data-fid'), true); };

  Actions['de-share'] = function () {
    var c = Data.byId(last.cid);
    var url = waUrl();
    var direct = !TP.device.hasRuntime()
      ? '<a class="btn btn-cta" data-focusable data-fid="de-wa" href="' + esc(url) + '" target="_blank" rel="noopener" data-external="1">Abrir WhatsApp aquí</a>' : '';
    App.openModal('<h2 class="modal-title">Compartir «' + esc(c.title) + '»</h2>' +
      '<p class="muted">Escanea con tu celular: se abre WhatsApp con el mensaje listo y la portada.</p>' +
      '<div class="invite">' + UI.qr(url, 4) + '<div class="wa-preview">' + esc(message()).replace(/\n/g, '<br>') + '</div></div>' +
      '<div class="actions">' + direct +
      '<button class="btn" data-focusable data-fid="de-close" data-action="close-modal">Listo</button></div>');
  };

  w.Despues = {
    show: function (cid, people) {
      var list = [], seen = {};
      for (var i = 0; i < people.length; i++) if (people[i] && !seen[people[i]]) { seen[people[i]] = 1; list.push(people[i]); }
      last = { cid: cid, people: list, note: 0 };
      App.go({ name: 'despues' });
    }
  };
})(window, document);
