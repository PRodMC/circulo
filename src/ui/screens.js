/* UI — plantillas de pantallas y modales. No toca sagem.* ni teclas:
   solo genera HTML con [data-focusable] + data-action para que App despache. */
(function (w) {
  var UI = w.UI = {};

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  UI.esc = esc;

  function attrs(o) {
    var s = '';
    for (var k in o) if (o.hasOwnProperty(k) && o[k] !== undefined && o[k] !== null) s += ' data-' + k + '="' + esc(o[k]) + '"';
    return s;
  }

  function btn(label, fid, data, cls) {
    return '<button class="btn ' + (cls || '') + '" data-focusable data-fid="' + esc(fid) + '"' + attrs(data) + '>' + label + '</button>';
  }

  UI.avatar = function (uid, size) {
    var m = Data.member(uid);
    return '<span class="avatar ' + (size || '') + '" style="background:' + m.color + '" title="' + esc(m.name) + '">' + esc(m.name.charAt(0)) + '</span>';
  };

  function avatars(uids) {
    var s = '<span class="avatars">';
    for (var i = 0; i < uids.length && i < 5; i++) s += UI.avatar(uids[i], 'sm');
    return s + '</span>';
  }

  function poster(c, badge) {
    return '<div class="poster" style="background:' + c.colors[0] + ';background:linear-gradient(160deg,' + c.colors[0] + ',' + c.colors[1] + ')">' +
      '<div class="poster-in">' + (badge ? '<span class="badge">' + esc(badge) + '</span>' : '') +
      '<div class="poster-name">' + esc(c.title) + '</div><div class="poster-genre">' + esc(c.genre) + '</div></div></div>';
  }

  function card(c, fid, badge) {
    var votes = Store.voters(c.id).length;
    return '<button class="card" data-focusable data-fid="' + esc(fid) + '" data-action="open" data-cid="' + c.id + '">' +
      poster(c, badge) +
      '<div class="card-title">' + esc(c.title) + '</div>' +
      '<div class="card-meta">' + (Store.inList(c.id) ? '<span>● En la lista</span>' : '<span>' + esc(c.year) + '</span>') +
      (votes ? '<span>· ' + votes + (votes === 1 ? ' voto' : ' votos') + '</span>' : '') + '</div></button>';
  }

  function rail(id, title, items, sub) {
    if (!items.length) return '';
    var s = '<section class="section"><h2 class="section-title">' + esc(title) + '</h2>' +
      (sub ? '<p class="section-sub">' + esc(sub) + '</p>' : '') + '<div class="rail">';
    for (var i = 0; i < items.length; i++) s += card(items[i].c, id + '-' + items[i].c.id, items[i].badge);
    return s + '</div></section>';
  }

  UI.timeAgo = function (ts) {
    var m = Math.round((new Date().getTime() - ts) / 60000);
    if (m < 1) return 'ahora';
    if (m < 60) return 'hace ' + m + ' min';
    var h = Math.round(m / 60);
    if (h < 24) return 'hace ' + h + ' h';
    var d = Math.round(h / 24);
    return 'hace ' + d + (d === 1 ? ' día' : ' días');
  };

  UI.activityText = function (a, me) {
    var c = Data.byId(a.cid), t = c ? '«' + esc(c.title) + '»' : 'un título';
    var who = a.uid === me ? 'Tú' : esc(Data.member(a.uid).name);
    switch (a.type) {
      case 'add': return who + ' agregó ' + t + ' a la lista';
      case 'remove': return who + ' quitó ' + t + ' de la lista';
      case 'vote': return who + ' votó por ' + t;
      case 'react':
        var r = Data.reaction(a.r);
        return who + ' reaccionó ' + (r ? '«' + r.sym + ' ' + esc(r.label) + '»' : '') + ' a ' + t;
      case 'rec':
        return who + (a.to === me ? ' te recomendó ' : ' le recomendó ') + t + (a.to === me ? '' : ' a ' + esc(Data.member(a.to).name));
    }
    return who;
  };

  /* ---------------- Pantallas ---------------- */

  UI.home = function () {
    var me = Store.user();
    var ranked = Store.rankedList();
    var top = ranked.length ? Data.byId(ranked[0].cid) : Data.content[0];
    var topVotes = Store.voters(top.id);
    var html = '';

    html += '<section class="hero">' + '<div class="poster-col" style="width:18rem;flex:0 0 auto">' + poster(top) + '</div>' +
      '<div class="hero-body"><div class="eyebrow">Lo más votado de tu Círculo</div>' +
      '<h1 class="display">' + esc(top.title) + '</h1>' +
      '<div class="meta">' + esc(top.genre) + ' · ' + esc(top.year) + ' · ' + esc(top.dur) + '</div>' +
      '<p class="desc">' + esc(top.desc) + '</p>' +
      '<div class="actions">' +
      btn('Ver detalle', 'hero-open', { action: 'open', cid: top.id }, 'btn-cta') +
      btn((Store.hasVoted(top.id, me) ? '✓ Votaste' : '▲ Votar') + ' · ' + topVotes.length, 'hero-vote', { action: 'vote', cid: top.id }, Store.hasVoted(top.id, me) ? 'is-on' : '') +
      '</div></div></section>';

    var recs = Store.recsFor(me), recItems = [];
    for (var i = 0; i < recs.length; i++) recItems.push({ c: Data.byId(recs[i].cid), badge: 'De ' + Data.member(recs[i].from).name });
    html += rail('rec', 'Te recomendaron', recItems, 'Lo que tu Círculo cree que te va a gustar');

    var listItems = [];
    for (var j = 0; j < ranked.length; j++) {
      var n = Store.voters(ranked[j].cid).length;
      listItems.push({ c: Data.byId(ranked[j].cid), badge: n ? n + (n === 1 ? ' voto' : ' votos') : null });
    }
    html += rail('list', 'Lista del Círculo', listItems, 'Lo que el grupo quiere ver, ordenado por votos');

    for (var k = 0; k < Data.categories.length; k++) {
      var cat = Data.categories[k], items = Data.inCategory(cat.id), arr = [];
      for (var x = 0; x < items.length; x++) arr.push({ c: items[x] });
      html += rail('cat-' + cat.id, cat.title, arr);
    }
    return html;
  };

  UI.detail = function (cid) {
    var c = Data.byId(cid);
    if (!c) return '<div class="empty">Contenido no encontrado.</div>';
    var me = Store.user();
    var entry = Store.inList(cid);
    var voters = Store.voters(cid);
    var voted = Store.hasVoted(cid, me);
    var reacts = Store.reactionsFor(cid);

    var html = '<div class="detail"><div class="poster-col">' + poster(c) + '</div><div class="detail-body">' +
      '<div class="eyebrow">' + esc(c.genre) + '</div>' +
      '<h1 class="display">' + esc(c.title) + '</h1>' +
      '<div class="meta">' + esc(c.year) + ' · ' + esc(c.dur) + '</div>' +
      '<p class="desc">' + esc(c.desc) + '</p>' +
      '<div class="actions">' +
      btn('▶ Reproducir', 'd-play', { action: 'play', cid: cid }, 'btn-cta') +
      btn(entry ? '✓ En la lista' : '+ Agregar a la lista', 'd-list', { action: 'toggle-list', cid: cid }, entry ? 'is-on' : '') +
      btn((voted ? '✓ Votaste' : '▲ Votar') + ' · ' + voters.length, 'd-vote', { action: 'vote', cid: cid }, voted ? 'is-on' : '') +
      btn('♥ Reaccionar', 'd-react', { action: 'react-open', cid: cid }) +
      btn('➜ Recomendar', 'd-rec', { action: 'rec-open', cid: cid }) +
      '</div>';

    html += '<div class="panel"><h2 class="section-title">Lo que dice tu Círculo</h2>';
    var lines = [];
    if (entry) lines.push('<div class="chips"><span class="chip">' + UI.avatar(entry.by, 'sm') + (entry.by === me ? 'Tú lo agregaste' : 'Agregado por ' + esc(Data.member(entry.by).name)) + ' · ' + UI.timeAgo(entry.ts) + '</span></div>');
    if (voters.length) lines.push('<div class="chips"><span class="chip">' + avatars(voters) + ' ' + voters.length + (voters.length === 1 ? ' voto' : ' votos') + '</span></div>');
    if (reacts.length) {
      var s = '<div class="chips">';
      for (var i = 0; i < reacts.length; i++) {
        var r = Data.reaction(reacts[i].r);
        s += '<span class="chip">' + UI.avatar(reacts[i].uid, 'sm') + (r ? r.sym + ' ' + esc(r.label) : '') + '</span>';
      }
      lines.push(s + '</div>');
    }
    html += lines.length ? lines.join('<div style="height:1rem"></div>') : '<p class="muted">Nadie ha opinado todavía. Sé la primera persona.</p>';
    html += '</div></div></div>';

    var more = Data.inCategory(c.cat), arr = [];
    for (var k = 0; k < more.length; k++) if (more[k].id !== cid) arr.push({ c: more[k] });
    html += '<div style="height:2.5rem"></div>' + rail('more', 'Más como esto', arr);
    return html;
  };

  UI.list = function () {
    var me = Store.user();
    var ranked = Store.rankedList();
    var html = '<section class="section"><h1 class="section-title">Lista del Círculo</h1>' +
      '<p class="section-sub">Todos pueden agregar y votar. Lo más votado sube.</p>';
    if (!ranked.length) {
      return html + '<div class="empty">La lista está vacía. Abre un título y elige «Agregar a la lista».</div>' +
        '<div class="actions" style="margin-top:1.5rem">' + btn('Explorar catálogo', 'empty-home', { action: 'tab', screen: 'home' }, 'btn-cta') + '</div></section>';
    }
    html += '<div class="rows">';
    for (var i = 0; i < ranked.length; i++) {
      var e = ranked[i], c = Data.byId(e.cid), v = Store.voters(e.cid), voted = Store.hasVoted(e.cid, me);
      html += '<div class="row"><div class="rank">' + (i + 1) + '</div><div class="thumb">' + poster(c) + '</div>' +
        '<div class="row-body"><div class="row-title">' + esc(c.title) + '</div>' +
        '<div class="meta">' + (e.by === me ? 'La agregaste tú' : 'Agregada por ' + esc(Data.member(e.by).name)) + ' · ' + UI.timeAgo(e.ts) + '</div>' +
        '<div class="meta" style="margin-top:.5rem">' + avatars(v) + ' ' + v.length + (v.length === 1 ? ' voto' : ' votos') + '</div></div>' +
        '<div class="actions">' +
        btn(voted ? '✓ Votaste' : '▲ Votar', 'l-vote-' + e.cid, { action: 'vote', cid: e.cid }, voted ? 'is-on' : '') +
        btn('Ver', 'l-open-' + e.cid, { action: 'open', cid: e.cid }) +
        '</div></div>';
    }
    return html + '</div></section>';
  };

  UI.activity = function () {
    var me = Store.user(), st = Store.state();
    var html = '<section class="section"><h1 class="section-title">Tu Círculo</h1><div class="members">';
    for (var i = 0; i < Data.members.length; i++) {
      var m = Data.members[i];
      html += '<div class="member' + (m.id === me ? ' me' : '') + '">' + UI.avatar(m.id) + esc(m.name) + (m.id === me ? ' <span class="muted">(tú)</span>' : '') + '</div>';
    }
    html += '</div></section><section class="section"><h2 class="section-title">Actividad reciente</h2>';
    if (!st.activity.length) return html + '<div class="empty">Sin actividad todavía.</div></section>';
    html += '<div class="rows">';
    for (var j = 0; j < st.activity.length && j < 30; j++) {
      var a = st.activity[j];
      html += '<button class="row" data-focusable data-fid="a-' + j + '-' + a.ts + '" data-action="open" data-cid="' + a.cid + '">' +
        UI.avatar(a.uid) + '<div class="row-body">' + UI.activityText(a, me) + '</div><span class="when">' + UI.timeAgo(a.ts) + '</span></button>';
    }
    return html + '</div></section>';
  };

  /* ---------------- Modales ---------------- */

  function option(fid, sym, label, data, extra) {
    return '<button class="option" data-focusable data-fid="' + esc(fid) + '"' + attrs(data) + '>' + sym + '<span>' + label + '</span>' + (extra || '') + '</button>';
  }

  UI.modalProfile = function () {
    var me = Store.user();
    var s = '<h2 class="modal-title">¿Quién está viendo?</h2><p class="muted">Cambia de miembro para probar la colaboración desde otro perfil.</p><div class="options">';
    for (var i = 0; i < Data.members.length; i++) {
      var m = Data.members[i];
      s += option('p-' + m.id, UI.avatar(m.id), esc(m.name), { action: 'set-user', uid: m.id }, m.id === me ? '<span class="muted" style="margin-left:auto">✓ Actual</span>' : '');
    }
    s += '</div><div class="options">' +
      option('p-sim', '<span class="sym">↻</span>', 'Simular actividad de otro miembro', { action: 'simulate' }) +
      option('p-reset', '<span class="sym">⟲</span>', 'Restablecer demo', { action: 'reset' }) +
      '</div>';
    return s;
  };

  UI.modalReact = function (cid) {
    var c = Data.byId(cid);
    var s = '<h2 class="modal-title">Reacciona a «' + esc(c.title) + '»</h2><p class="muted">Tu Círculo verá tu reacción.</p><div class="options">';
    for (var i = 0; i < Data.reactions.length; i++) {
      var r = Data.reactions[i];
      s += option('r-' + r.id, '<span class="sym">' + r.sym + '</span>', esc(r.label), { action: 'react', cid: cid, r: r.id });
    }
    return s + '</div>';
  };

  UI.modalRecommend = function (cid) {
    var c = Data.byId(cid), me = Store.user();
    var s = '<h2 class="modal-title">Recomendar «' + esc(c.title) + '»</h2><p class="muted">Le aparecerá en «Te recomendaron».</p><div class="options">';
    for (var i = 0; i < Data.members.length; i++) {
      var m = Data.members[i];
      if (m.id === me) continue;
      s += option('rec-' + m.id, UI.avatar(m.id), esc(m.name), { action: 'recommend', cid: cid, to: m.id });
    }
    return s + '</div>';
  };

  UI.modalPlay = function (cid) {
    var c = Data.byId(cid);
    return '<h2 class="modal-title">' + esc(c.title) + '</h2>' +
      '<div class="player-stub">Simulación: aquí iría la reproducción.<br><small>' + esc(TP.player.reason) + '</small></div>' +
      '<div class="actions">' + btn('Cerrar', 'play-close', { action: 'close-modal' }, 'btn-cta') + '</div>';
  };

  UI.profileButton = function () {
    var m = Data.member(Store.user());
    return UI.avatar(m.id) + '<span><small>Viendo como</small>' + esc(m.name) + '</span>';
  };
})(window);
