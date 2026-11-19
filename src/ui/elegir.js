/* ANTES — «Elegir»: quiénes ven → ronda rápida de preguntas por turnos →
   3 sugerencias → elección directa (≤5 personas) o votación (>5).
   Todo ocurre en la misma pantalla, sin teclado. */
(function (w) {
  var Screens = w.Screens = w.Screens || {};
  var Actions = w.Actions = w.Actions || {};
  var esc = UI.esc;
  var R = w.Recommender;

  var st = null;
  var timer = null;

  function reset() {
    var present = {};
    present[Store.user()] = true;
    st = { step: 'people', present: present, guests: 0, people: [], turn: 0, q: 0, answers: [], picks: [], votes: [], voter: 0 };
  }

  function stopTimer() { if (timer) { w.clearTimeout(timer); timer = null; } }

  function buildPeople() {
    var list = [];
    for (var i = 0; i < Data.members.length; i++) {
      var m = Data.members[i];
      if (st.present[m.id]) list.push({ uid: m.id, name: m.name });
    }
    for (var g = 1; g <= st.guests; g++) list.push({ uid: null, name: 'Invitado ' + g });
    return list;
  }

  function total() { return buildPeople().length; }

  function who(p, size) {
    return p.uid ? UI.avatar(p.uid, size) : '<span class="avatar ' + (size || '') + '" style="background:#43474E">' + esc(p.name.charAt(0)) + '</span>';
  }

  function btn(label, fid, data, cls) {
    var a = '';
    for (var k in data) if (data.hasOwnProperty(k)) a += ' data-' + k + '="' + esc(data[k]) + '"';
    return '<button class="btn ' + (cls || '') + '" data-focusable data-fid="' + fid + '"' + a + '>' + label + '</button>';
  }

  /* ---------------- Render por paso ---------------- */

  function renderPeople() {
    var n = total();
    var s = '<div class="el-head"><div class="eyebrow">Elegir · Paso 1 de 3</div><h1 class="display">¿Quiénes van a ver?</h1>' +
      '<p class="muted">Marca a quienes están frente a la pantalla y suma invitados.</p></div>';
    s += '<div class="el-people">';
    for (var i = 0; i < Data.members.length; i++) {
      var m = Data.members[i], on = !!st.present[m.id];
      s += '<button class="el-person' + (on ? ' is-on' : '') + '" data-focusable data-fid="el-p-' + m.id + '" data-action="el-toggle" data-uid="' + m.id + '">' +
        UI.avatar(m.id, 'lg') + '<span>' + esc(m.name) + '</span><span class="el-check">' + (on ? '✓' : '+') + '</span></button>';
    }
    s += '</div><div class="el-guests"><span>Invitados</span>' +
      btn('–', 'el-g-minus', { action: 'el-guests', d: -1 }) + '<span class="el-count">' + st.guests + '</span>' +
      btn('+', 'el-g-plus', { action: 'el-guests', d: 1 }) + '</div>';
    s += '<div class="el-total">Son <strong>' + n + '</strong> ' + (n === 1 ? 'persona' : 'personas') +
      (n > R.VOTE_THRESHOLD ? ' · <span class="el-warn">Al final habrá votación</span>' : '') + '</div>';
    s += '<div class="actions">' + (n ? btn('¡Empezar!', 'el-start', { action: 'el-start' }, 'btn-cta') : '') +
      btn('Cancelar', 'el-cancel', { action: 'el-cancel' }) + '</div>';
    return s;
  }

  function renderQuiz() {
    var p = st.people[st.turn], q = R.questions[st.q];
    var s = '<div class="el-turn">' + who(p, 'lg') + '<div><div class="eyebrow">' +
      (st.q === 0 && st.turn > 0 ? 'Pásale el control a…' : 'Turno de') + '</div>' +
      '<div class="el-turn-name">' + esc(p.name) + '</div>' +
      '<div class="muted">Persona ' + (st.turn + 1) + ' de ' + st.people.length + ' · Pregunta ' + (st.q + 1) + ' de ' + R.questions.length + '</div></div></div>';
    s += '<h1 class="display el-q">' + esc(q.title) + '</h1>';
    s += '<div class="el-timer"><div class="el-timer-fill" style="animation-duration:' + R.SECONDS + 's"></div></div>';
    s += '<div class="el-options">';
    for (var i = 0; i < q.options.length; i++) {
      var o = q.options[i];
      s += '<button class="el-option" data-focusable data-fid="el-o-' + st.turn + '-' + st.q + '-' + i + '" data-action="el-answer" data-o="' + o.id + '">' +
        '<span class="el-sym">' + o.sym + '</span><span>' + esc(o.label) + '</span></button>';
    }
    return s + '</div>';
  }

  function sugCard(p, i, action) {
    var c = p.c;
    var inner = '<div class="el-sug-poster">' + UI.poster(c) + '</div>' +
      '<div class="el-sug-body"><div class="el-pct">' + p.pct + '%<small> coincidencia</small></div>' +
      '<div class="row-title">' + esc(c.title) + '</div><div class="meta">' + esc(c.genre) + ' · ' + esc(c.dur) + '</div>' +
      '<div class="el-reason">' + esc(p.reason) + '</div></div>';
    if (!action) return '<div class="el-sug">' + inner + '</div>';
    return '<button class="el-sug" data-focusable data-fid="el-s-' + st.step + '-' + i + '" data-action="' + action + '" data-cid="' + c.id + '">' + inner + '</button>';
  }

  function renderResults() {
    var vote = st.people.length > R.VOTE_THRESHOLD;
    var s = '<div class="el-head"><div class="eyebrow">Elegir · Paso 2 de 3</div><h1 class="display">Sus 3 opciones</h1>' +
      '<p class="muted">' + (vote ? 'Son ' + st.people.length + ' personas: toca votar.' : 'Elijan una y empieza la función.') + '</p></div>';
    s += '<div class="el-sugs">';
    for (var i = 0; i < st.picks.length; i++) s += sugCard(st.picks[i], i, vote ? null : 'el-pick');
    s += '</div><div class="actions">' + (vote ? btn('Empezar votación', 'el-vote-start', { action: 'el-vote-start' }, 'btn-cta') : '') +
      btn('Volver a jugar', 'el-again', { action: 'el-again' }) + '</div>';
    return s;
  }

  function renderVote() {
    var p = st.people[st.voter];
    var s = '<div class="el-turn">' + who(p, 'lg') + '<div><div class="eyebrow">Paso 3 de 3 · Votación secreta</div>' +
      '<div class="el-turn-name">Vota ' + esc(p.name) + '</div><div class="muted">Voto ' + (st.voter + 1) + ' de ' + st.people.length + '</div></div></div>';
    s += '<div class="el-sugs">';
    for (var i = 0; i < st.picks.length; i++) s += sugCard(st.picks[i], i, 'el-vote');
    return s + '</div>';
  }

  function tally() {
    var counts = [];
    for (var i = 0; i < st.picks.length; i++) counts.push(0);
    for (var v = 0; v < st.votes.length; v++) {
      for (var j = 0; j < st.picks.length; j++) if (st.picks[j].c.id === st.votes[v]) counts[j]++;
    }
    var best = 0, tie = false;
    for (var k = 1; k < counts.length; k++) {
      if (counts[k] > counts[best]) { best = k; tie = false; }
      else if (counts[k] === counts[best]) tie = true;
    }
    // Empate: gana la de mayor coincidencia (las sugerencias ya vienen ordenadas así).
    return { counts: counts, winner: best, tie: tie };
  }

  function renderTally() {
    var t = tally(), n = st.votes.length, wnr = st.picks[t.winner].c;
    var s = '<div class="el-head"><div class="eyebrow">Resultado</div><h1 class="display">Gana «' + esc(wnr.title) + '»</h1>' +
      (t.tie ? '<p class="muted">Hubo empate: gana la de mayor coincidencia.</p>' : '') + '</div><div class="el-tally">';
    for (var i = 0; i < st.picks.length; i++) {
      var pct = n ? Math.round(t.counts[i] / n * 100) : 0;
      s += '<div class="el-bar' + (i === t.winner ? ' is-win' : '') + '"><div class="el-bar-label">' + esc(st.picks[i].c.title) +
        '<span>' + t.counts[i] + (t.counts[i] === 1 ? ' voto' : ' votos') + '</span></div>' +
        '<div class="el-bar-track"><div class="el-bar-fill" style="width:' + pct + '%"></div></div></div>';
    }
    s += '</div><div class="actions">' + btn('▶ Ver ahora', 'el-play', { action: 'el-pick', cid: wnr.id }, 'btn-cta') +
      btn('Volver a jugar', 'el-again', { action: 'el-again' }) + '</div>';
    return s;
  }

  Screens.elegir = function () {
    if (!st) reset();
    var body = st.step === 'people' ? renderPeople()
      : st.step === 'quiz' ? renderQuiz()
      : st.step === 'results' ? renderResults()
      : st.step === 'vote' ? renderVote()
      : renderTally();
    return '<section class="elegir">' + body + '</section>';
  };

  /* ---------------- Flujo ---------------- */

  function show(fid) { App.render(fid || null, true); }

  function startQuestion() {
    stopTimer();
    show('el-o-' + st.turn + '-' + st.q + '-0');
    timer = w.setTimeout(function () { answer(R.ANY); }, R.SECONDS * 1000);
  }

  function answer(optionId) {
    stopTimer();
    var a = st.answers[st.turn] = st.answers[st.turn] || {};
    a[R.questions[st.q].id] = optionId;
    st.q++;
    if (st.q >= R.questions.length) { st.q = 0; st.turn++; }
    if (st.turn >= st.people.length) {
      st.picks = R.suggest(st.answers);
      st.step = 'results';
      show();
      return;
    }
    startQuestion();
  }

  Actions['elegir-open'] = function () { reset(); App.go({ name: 'elegir' }); };
  Actions['el-toggle'] = function (el) { var u = el.getAttribute('data-uid'); st.present[u] = !st.present[u]; show(el.getAttribute('data-fid')); };
  Actions['el-guests'] = function (el) { st.guests = Math.max(0, Math.min(10, st.guests + Number(el.getAttribute('data-d')))); show(el.getAttribute('data-fid')); };
  Actions['el-start'] = function () {
    st.people = buildPeople(); st.turn = 0; st.q = 0; st.answers = []; st.votes = []; st.voter = 0;
    st.step = 'quiz'; startQuestion();
  };
  Actions['el-answer'] = function (el) { answer(el.getAttribute('data-o')); };
  Actions['el-again'] = function () { stopTimer(); st.step = 'people'; show(); };
  Actions['el-cancel'] = function () { Elegir.cancel(); App.back(); };
  Actions['el-vote-start'] = function () { st.step = 'vote'; st.voter = 0; st.votes = []; show(); };
  Actions['el-vote'] = function (el) {
    st.votes.push(el.getAttribute('data-cid'));
    st.voter++;
    if (st.voter >= st.people.length) st.step = 'tally';
    show();
  };
  Actions['el-pick'] = function (el) {
    var cid = el.getAttribute('data-cid');
    var names = [];
    for (var i = 0; i < st.people.length; i++) names.push(st.people[i].name);
    App.openPlayer(cid, { people: names });
  };

  w.Elegir = {
    cancel: function () { stopTimer(); st = null; },
    busy: function () { return !!st && (st.step === 'quiz'); }
  };
})(window);
