/* DURANTE — reacciones y comentarios en vivo sobre el video, compartidos por sala.
   - Al reproducir se abre una sala (código de 4 dígitos + QR).
   - Otra TV entra con «Unirse a una sala» (teclado numérico en pantalla).
   - Un celular/compu escanea el QR (?sala=1234) y llega a la vista compañera,
     donde sí puede escribir comentarios libres (en el STB la entrada de texto es TBD). */
(function (w, d) {
  var Screens = w.Screens = w.Screens || {};
  var Actions = w.Actions = w.Actions || {};
  var esc = UI.esc;

  var COMMENTS = ['¡No puede ser!', 'Jajaja', '¡Qué miedo!', 'Esta parte es la mejor', '¿Quién es ese?', 'Me encanta esta escena'];
  var canType = !TP.device.hasRuntime(); // R5: escribir solo fuera del STB

  var trayOpen = false;
  var simTimer = null;
  var feedItems = [];

  function me() {
    var m = Data.member(Store.user());
    return { name: m.name, uid: m.id };
  }

  function senderAvatar(ev) {
    if (ev.uid) return UI.avatar(ev.uid, 'sm');
    return '<span class="avatar sm" style="background:#43474E">' + esc((ev.name || '?').charAt(0)) + '</span>';
  }

  /* ---------------- URL de la sala y QR ---------------- */

  function baseUrl() {
    var loc = w.location;
    if (/^https?:$/.test(loc.protocol) && !/localhost|127\.0\.0\.1/.test(loc.hostname)) return loc.origin + loc.pathname.replace(/[^\/]*$/, '');
    return (w.ENV && w.ENV.publicUrl) || (loc.origin + loc.pathname.replace(/[^\/]*$/, ''));
  }
  UI.baseUrl = baseUrl;

  UI.qr = function (text, cell) {
    if (typeof w.qrcode !== 'function') return '';
    try {
      var q = w.qrcode(0, 'M');
      q.addData(text);
      q.make();
      return '<div class="qr">' + q.createImgTag(cell || 6, 12) + '</div>';
    } catch (e) { return ''; }
  };

  function roomUrl(code) { return baseUrl() + '?sala=' + code; }

  /* ---------------- Sala ---------------- */

  function openRoom(cid, code) {
    var c = Data.byId(cid);
    var isNew = !code;
    code = code || Realtime.newCode();
    Realtime.join(code, me(), isNew ? { cid: cid, host: Realtime.deviceId, hostName: me().name, ts: new Date().getTime() } : null);
    Realtime.on('event', onEvent);
    Realtime.on('people', renderRoomChip);
    feedItems = [];
    renderRoomChip();
    startSim();
    return code;
  }

  function renderRoomChip() {
    var el = d.getElementById('playerRoom');
    var code = Realtime.code();
    if (!el || !code) return;
    var people = Realtime.people(), others = [];
    for (var i = 0; i < people.length; i++) others.push(people[i].name);
    el.innerHTML = '<span class="room-code">Sala ' + code + '</span><span class="muted">' +
      (people.length > 1 ? people.length + ' pantallas: ' + esc(others.join(', ')) : 'Invita con ▼ → Invitar') + '</span>';
    if (Screens._salaFeed) Screens._salaFeed();
  }

  function onEvent(ev) {
    if (ev.type === 'reaction') floatReaction(ev);
    else if (ev.type === 'comment') pushComment(ev);
    feedItems.unshift(ev);
    if (feedItems.length > 30) feedItems.length = 30;
    if (Screens._salaFeed) Screens._salaFeed();
  }

  /* Reacción que sube por la pantalla (solo transform/opacity, R3). */
  function floatReaction(ev) {
    var box = d.getElementById('playerFloat');
    if (!box || d.getElementById('player').hidden) return;
    var r = Data.reaction(ev.value);
    var el = d.createElement('div');
    el.className = 'float-r';
    el.style.left = (10 + Math.random() * 70) + '%';
    el.innerHTML = '<span class="float-sym">' + (r ? r.sym : '♥') + '</span>' + senderAvatar(ev) + '<span class="float-name">' + esc(ev.mine ? 'Tú' : ev.name) + '</span>';
    box.appendChild(el);
    while (box.children.length > 8) box.removeChild(box.firstChild);
    w.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3600);
  }

  function pushComment(ev) {
    var box = d.getElementById('playerFeed');
    if (!box || d.getElementById('player').hidden) return;
    var el = d.createElement('div');
    el.className = 'feed-c';
    el.innerHTML = senderAvatar(ev) + '<div><div class="feed-name">' + esc(ev.mine ? 'Tú' : ev.name) + '</div>' + esc(ev.value) + '</div>';
    box.appendChild(el);
    while (box.children.length > 4) box.removeChild(box.firstChild);
    w.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 8000);
  }

  /* Amigos simulados: reaccionan de vez en cuando (solo en este equipo). */
  function startSim() {
    stopSim();
    var tick = function () {
      if (!Realtime.code()) return;
      var others = [];
      for (var i = 0; i < Data.members.length; i++) if (Data.members[i].id !== Store.user()) others.push(Data.members[i]);
      var m = others[Math.floor(Math.random() * others.length)];
      var isComment = Math.random() < 0.35;
      onEvent({ id: 'sim' + Math.random(), name: m.name, uid: m.id, type: isComment ? 'comment' : 'reaction',
        value: isComment ? COMMENTS[Math.floor(Math.random() * COMMENTS.length)] : Data.reactions[Math.floor(Math.random() * 4)].id, sim: true });
      simTimer = w.setTimeout(tick, 15000 + Math.random() * 20000);
    };
    simTimer = w.setTimeout(tick, 8000);
  }
  function stopSim() { if (simTimer) { w.clearTimeout(simTimer); simTimer = null; } }

  /* ---------------- Bandeja de reacciones (sobre el video) ---------------- */

  function trayHtml() {
    var s = '<div class="tray-row">';
    for (var i = 0; i < Data.reactions.length; i++) {
      var r = Data.reactions[i];
      s += '<button class="tray-r" data-focusable data-fid="t-r-' + r.id + '" data-action="du-react" data-r="' + r.id + '" title="' + esc(r.label) + '">' + r.sym + '</button>';
    }
    s += '<button class="btn" data-focusable data-fid="t-invite" data-action="du-invite">Invitar</button></div><div class="tray-row">';
    for (var j = 0; j < COMMENTS.length; j++) {
      s += '<button class="btn tray-c" data-focusable data-fid="t-c-' + j + '" data-action="du-comment" data-v="' + esc(COMMENTS[j]) + '">' + esc(COMMENTS[j]) + '</button>';
    }
    s += '</div>';
    if (canType) {
      s += '<div class="tray-row"><input id="trayInput" class="tray-input" data-focusable data-fid="t-input" maxlength="140" placeholder="Escribe un comentario…" autocomplete="off">' +
        '<button class="btn btn-cta" data-focusable data-fid="t-send" data-action="du-send">Enviar</button></div>';
    }
    return s;
  }

  function openTray() {
    var t = d.getElementById('playerTray');
    t.innerHTML = trayHtml();
    t.hidden = false;
    trayOpen = true;
    d.getElementById('playerHints').innerHTML = 'OK enviar · ▲ / BACK cerrar';
    App.FM.setScope(t);
    App.FM.ensure('t-r-love');
  }

  function closeTray() {
    var t = d.getElementById('playerTray');
    if (!t) return;
    t.hidden = true;
    t.innerHTML = '';
    trayOpen = false;
    d.getElementById('playerHints').innerHTML = 'OK pausa · ◀ ▶ 10 s · ▼ reaccionar · BACK salir';
    App.FM.setScope(null);
    App.FM.current = null;
  }

  /* Teclas mientras el reproductor está abierto. Devuelve true si las consumió. */
  function handleKey(k, e) {
    if (!trayOpen) {
      if (k === 'DOWN') { e.preventDefault(); openTray(); return true; }
      return false;
    }
    e.preventDefault();
    var FM = App.FM;
    if (k === 'BACK' || k === 'EXIT' || k === 'CANCEL') { closeTray(); return true; }
    if (k === 'UP') {
      var before = FM.current; FM.move('up');
      if (FM.current === before) closeTray();
      return true;
    }
    if (k === 'DOWN' || k === 'LEFT' || k === 'RIGHT') { FM.move(k.toLowerCase()); return true; }
    if (k === 'OK') { FM.activate(); return true; }
    return true;
  }

  function sendComment(text) {
    text = (text || '').replace(/^\s+|\s+$/g, '');
    if (!text) return;
    Realtime.send('comment', text);
  }

  Actions['du-react'] = function (el) { Realtime.send('reaction', el.getAttribute('data-r')); };
  Actions['du-comment'] = function (el) { sendComment(el.getAttribute('data-v')); closeTray(); };
  Actions['du-send'] = function () {
    var i = d.getElementById('trayInput') || d.getElementById('salaInput');
    if (!i) return;
    sendComment(i.value); i.value = '';
  };
  Actions['du-invite'] = function () {
    var code = Realtime.code();
    TP.player.pause();
    App.openModal('<h2 class="modal-title">Invita a ver juntos</h2>' +
      '<p class="muted">Desde otra TV: «Viendo como» → «Unirse a una sala» y escribe el código. Desde un celular: escanea el QR.</p>' +
      '<div class="invite">' + UI.qr(roomUrl(code), 5) + '<div><div class="eyebrow">Código de sala</div><div class="room-big">' + code + '</div>' +
      '<div class="muted invite-url">' + esc(roomUrl(code)) + '</div></div></div>' +
      '<div class="actions">' + '<button class="btn btn-cta" data-focusable data-fid="inv-close" data-action="close-modal">Listo</button></div>');
  };

  /* ---------------- Unirse con código (TV, D-pad) ---------------- */

  var codeBuf = '';
  function keypadHtml() {
    var s = '<h2 class="modal-title">Unirse a una sala</h2><p class="muted">Escribe el código de 4 dígitos que aparece en la otra pantalla.</p>' +
      '<div class="code-boxes">';
    for (var i = 0; i < 4; i++) s += '<span class="code-box">' + (codeBuf.charAt(i) || '') + '</span>';
    s += '</div><div class="keypad">';
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];
    for (var k = 0; k < keys.length; k++) {
      s += '<button class="btn key' + (keys[k] === '✓' ? ' btn-cta' : '') + '" data-focusable data-fid="kp-' + k + '" data-action="du-key" data-k="' + keys[k] + '">' + keys[k] + '</button>';
    }
    return s + '</div>';
  }
  function refreshKeypad(fid) { d.getElementById('modalBox').innerHTML = keypadHtml(); App.FM.ensure(fid); }

  function tryJoin(code) {
    Realtime.getInfo(code, function (err, info) {
      if (err || !info || !info.cid) { App.toast('No encontramos la sala ' + esc(code)); return; }
      App.closeModal();
      App.openPlayer(info.cid, { room: code, people: [me().name] });
      App.toast('Te uniste a la sala ' + code + ' de ' + esc(info.hostName || ''));
    });
  }

  Actions['du-join-open'] = function () { codeBuf = ''; App.closeModal(); App.openModal(keypadHtml()); };
  Actions['du-key'] = function (el) {
    var k = el.getAttribute('data-k'), fid = el.getAttribute('data-fid');
    if (k === '⌫') codeBuf = codeBuf.slice(0, -1);
    else if (k === '✓') { if (codeBuf.length === 4) tryJoin(codeBuf); return; }
    else if (codeBuf.length < 4) codeBuf += k;
    refreshKeypad(codeBuf.length === 4 ? 'kp-11' : fid);
  };

  /* ---------------- Vista compañera (celular con ?sala=) ---------------- */

  var sala = null; // { code, info }

  Screens.sala = function () {
    if (!sala) return '<div class="empty">Sala no encontrada.</div>';
    var c = Data.byId(sala.info.cid);
    var s = '<section class="sala"><div class="sala-head">' + (c ? '<div class="thumb">' + UI.poster(c) + '</div>' : '') +
      '<div><div class="eyebrow">Sala ' + esc(sala.code) + ' · con ' + esc(sala.info.hostName || 'tu Círculo') + '</div>' +
      '<h1 class="display">' + esc(c ? c.title : '') + '</h1><div class="muted" id="salaPeople"></div></div></div>';
    if (!sala.joined) {
      s += '<h2 class="section-title">¿Quién eres?</h2><div class="options">';
      for (var i = 0; i < Data.members.length; i++) {
        var m = Data.members[i];
        s += '<button class="option" data-focusable data-fid="sj-' + m.id + '" data-action="sala-who" data-uid="' + m.id + '">' + UI.avatar(m.id) + '<span>' + esc(m.name) + '</span></button>';
      }
      return s + '<button class="option" data-focusable data-fid="sj-guest" data-action="sala-who" data-uid=""><span class="sym">+</span><span>Soy invitado</span></button></div></section>';
    }
    s += '<div class="tray-row">';
    for (var j = 0; j < Data.reactions.length; j++) {
      var r = Data.reactions[j];
      s += '<button class="tray-r" data-focusable data-fid="s-r-' + r.id + '" data-action="du-react" data-r="' + r.id + '">' + r.sym + '</button>';
    }
    s += '</div><div class="tray-row"><input id="salaInput" class="tray-input" data-focusable data-fid="s-input" maxlength="140" placeholder="Escribe un comentario…" autocomplete="off">' +
      '<button class="btn btn-cta" data-focusable data-fid="s-send" data-action="du-send">Enviar</button></div>' +
      '<div class="tray-row">';
    for (var k = 0; k < COMMENTS.length; k++) s += '<button class="btn tray-c" data-focusable data-fid="s-c-' + k + '" data-action="du-comment" data-v="' + esc(COMMENTS[k]) + '">' + esc(COMMENTS[k]) + '</button>';
    s += '</div><div class="actions" style="margin:1.5rem 0">' +
      '<button class="btn" data-focusable data-fid="s-watch" data-action="sala-watch">▶ Ver aquí también</button></div>' +
      '<h2 class="section-title">En vivo</h2><div class="rows" id="salaFeed"></div></section>';
    return s;
  };

  Screens._salaFeed = function () {
    var f = d.getElementById('salaFeed'), p = d.getElementById('salaPeople');
    if (p) { var ppl = Realtime.people(), n = []; for (var i = 0; i < ppl.length; i++) n.push(ppl[i].name); p.innerHTML = n.length ? 'Conectados: ' + esc(n.join(', ')) : ''; }
    if (!f) return;
    if (!feedItems.length) { f.innerHTML = '<div class="empty">Aún no hay reacciones. ¡Manda la primera!</div>'; return; }
    var s = '';
    for (var j = 0; j < feedItems.length; j++) {
      var ev = feedItems[j], r = ev.type === 'reaction' ? Data.reaction(ev.value) : null;
      s += '<div class="row">' + senderAvatar(ev) + '<div class="row-body"><strong>' + esc(ev.mine ? 'Tú' : ev.name) + '</strong> ' +
        (r ? r.sym + ' ' + esc(r.label) : esc(ev.value)) + '</div></div>';
    }
    f.innerHTML = s;
  };

  Actions['sala-who'] = function (el) {
    var uid = el.getAttribute('data-uid');
    if (uid) Store.setUser(uid);
    var who = uid ? { name: Data.member(uid).name, uid: uid } : { name: 'Invitado', uid: null };
    Realtime.join(sala.code, who, null);
    Realtime.on('event', onEvent);
    Realtime.on('people', renderRoomChip);
    sala.joined = true;
    feedItems = [];
    App.render('s-r-love', true);
    Screens._salaFeed();
  };
  Actions['sala-watch'] = function () { App.openPlayer(sala.info.cid, { room: sala.code, keepRoom: true }); };

  w.Durante = {
    openRoom: openRoom,
    handleKey: handleKey,
    isTrayOpen: function () { return trayOpen; },
    closeTray: closeTray,
    stop: function (keep) { stopSim(); closeTray(); if (!keep) Realtime.leave(); var f = d.getElementById('playerFloat'), c = d.getElementById('playerFeed'); if (f) f.innerHTML = ''; if (c) c.innerHTML = ''; },
    people: function () { var p = Realtime.people(), n = []; for (var i = 0; i < p.length; i++) n.push(p[i].name); return n; },
    resumeRoom: function () { renderRoomChip(); startSim(); },

    /* Arranque con ?sala=1234 */
    startFromUrl: function (code) {
      Realtime.getInfo(code, function (err, info) {
        if (err || !info || !info.cid) { App.toast('La sala ' + esc(code) + ' ya no existe'); return; }
        sala = { code: code, info: info, joined: false };
        App.go({ name: 'sala' });
      });
    }
  };
})(window, document);
