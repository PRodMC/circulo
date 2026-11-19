/* App — router, despacho de acciones, reproductor y manejo de teclas.
   Las pantallas se registran en window.Screens y las acciones en window.Actions
   (screens.js, elegir.js, durante.js, despues.js). */
(function (w, d) {
  var FM = TP.focus;
  var Screens = w.Screens;
  var Actions = w.Actions;

  var $screen = d.getElementById('screen');
  var $modal = d.getElementById('modal');
  var $modalBox = d.getElementById('modalBox');
  var $toasts = d.getElementById('toasts');
  var $profile = d.getElementById('profileBtn');
  var $net = d.getElementById('netBanner');
  var $player = d.getElementById('player');
  var $playerUi = d.getElementById('playerUi');
  var $playerMsg = d.getElementById('playerMsg');

  var stack = [{ name: 'home' }];
  var modalReturnFid = null;
  var session = null; // { cid, people, keepRoom, failed }

  function top() { return stack[stack.length - 1]; }
  function playerOpen() { return !$player.hidden; }

  function closest(el, sel) {
    while (el && el.nodeType === 1) {
      if ((el.matches || el.msMatchesSelector || el.webkitMatchesSelector).call(el, sel)) return el;
      el = el.parentNode;
    }
    return null;
  }

  /* ---------------- Render y navegación ---------------- */

  function render(preferFid) {
    var r = top();
    var fn = Screens[r.name] || Screens.home;
    $screen.innerHTML = fn(r);
    $profile.innerHTML = UI.profileButton();

    var rootName = stack.length > 1 && stack[1].name !== 'detail' ? stack[1].name : 'home';
    var tabs = d.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute('data-screen') === rootName) tabs[i].classList.add('is-active');
      else tabs[i].classList.remove('is-active');
    }
    if ($modal.hidden && !playerOpen()) FM.ensure(preferFid, '#screen [data-focusable]');
  }

  function go(rec) {
    top().fid = FM.fid();
    stack.push(rec);
    $screen.scrollTop = 0;
    render();
  }

  function leaving(rec) {
    if (rec.name === 'elegir') Elegir.cancel();
    if (rec.name === 'sala') Realtime.leave();
  }

  function goTab(name) {
    for (var i = stack.length - 1; i >= 0; i--) leaving(stack[i]);
    stack = name === 'home' ? [{ name: 'home' }] : [{ name: 'home' }, { name: name }];
    $screen.scrollTop = 0;
    render();
  }

  function back(event) {
    if (!$modal.hidden) { closeModal(); return; }
    if (stack.length > 1) {
      leaving(stack.pop());
      render(top().fid);
      return;
    }
    TP.lifecycle.onRootBack(event); // R6: en la raíz decide la plataforma.
  }

  /* ---------------- Modal ---------------- */

  function openModal(html) {
    modalReturnFid = FM.fid();
    $modalBox.innerHTML = html;
    $modal.hidden = false;
    FM.setScope($modal);
    FM.ensure(null, '#modal [data-focusable]');
  }

  function closeModal() {
    $modal.hidden = true;
    $modalBox.innerHTML = '';
    if (playerOpen()) {
      if (Durante.isTrayOpen()) { FM.setScope(d.getElementById('playerTray')); FM.ensure(modalReturnFid); }
      else { FM.setScope(null); FM.current = null; }
      return;
    }
    FM.setScope(null);
    FM.ensure(modalReturnFid || null);
  }

  /* ---------------- Toasts ---------------- */

  function toast(html) {
    var el = d.createElement('div');
    el.className = 'toast';
    el.innerHTML = html;
    $toasts.appendChild(el);
    while ($toasts.children.length > 3) $toasts.removeChild($toasts.firstChild);
    w.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 5000);
  }

  /* ---------------- Reproductor (DURANTE) ---------------- */

  var idleTimer = null;

  function wakeUi() {
    $playerUi.className = 'player-ui';
    if (idleTimer) w.clearTimeout(idleTimer);
    idleTimer = w.setTimeout(function () {
      var s = TP.player.state();
      if (s && !s.paused && $playerMsg.hidden && !Durante.isTrayOpen() && $modal.hidden) $playerUi.className = 'player-ui is-idle';
    }, 4000);
  }

  function updatePlayerUi() {
    var s = TP.player.state();
    if (!s) return;
    d.getElementById('playerState').innerHTML = s.paused ? '❚❚' : '▶';
    d.getElementById('playerTime').innerHTML = UI.formatTime(s.time) + ' / ' + UI.formatTime(s.duration);
    d.getElementById('playerFill').style.width = (s.duration ? (s.time / s.duration) * 100 : 0) + '%';
  }

  /* opts: { people: [nombres], room: '1234' (unirse), keepRoom: true (ya en la sala) } */
  function openPlayer(cid, opts) {
    opts = opts || {};
    var c = Data.byId(cid);
    if (!c || !c.src) return;
    if (!$modal.hidden) closeModal();
    if (top().name === 'elegir') { Elegir.cancel(); stack.pop(); render(); }
    top().fid = FM.fid();
    session = { cid: cid, people: opts.people || [Data.member(Store.user()).name], keepRoom: !!opts.keepRoom, failed: false };

    d.getElementById('playerTitle').innerHTML = UI.esc(c.title);
    $playerMsg.hidden = true;
    $player.hidden = false;
    FM.setScope(d.getElementById('playerTray'));
    FM.current = null;
    Simulator.stop();
    if (opts.keepRoom) Durante.resumeRoom(); else Durante.openRoom(cid, opts.room);
    TP.player.open(d.getElementById('playerStage'), c.src);
    updatePlayerUi();
    wakeUi();
    Store.watch(cid, Store.user());
  }

  function closePlayer() {
    if (!session) return;
    var s = session;
    session = null;
    var watchers = s.people.concat(Durante.people());
    TP.player.close();
    Durante.stop(s.keepRoom);
    $player.hidden = true;
    if (idleTimer) w.clearTimeout(idleTimer);
    FM.setScope(null);
    Simulator.start();
    if (s.failed || s.keepRoom) { render(top().fid); return; }
    Despues.show(s.cid, watchers); // DESPUÉS
  }

  TP.player.on('timeupdate', updatePlayerUi);
  TP.player.on('play', function () { updatePlayerUi(); wakeUi(); });
  TP.player.on('pause', function () { updatePlayerUi(); wakeUi(); });
  TP.player.on('error', function () {
    if (session) session.failed = true;
    $playerMsg.innerHTML = 'No se pudo reproducir este video en este equipo.<br><span class="muted">Presiona BACK para regresar.</span>';
    $playerMsg.hidden = false;
    wakeUi();
  });
  TP.player.on('ended', closePlayer);

  function playerKey(k, e) {
    wakeUi();
    if (!$modal.hidden) return false; // el modal (invitar) usa la navegación normal
    if (Durante.handleKey(k, e)) return true;
    e.preventDefault();
    switch (k) {
      case 'OK': case 'PLAY': TP.player.toggle(); break;
      case 'LEFT': TP.player.seekBy(-10); break;
      case 'RIGHT': TP.player.seekBy(10); break;
      case 'BACK': case 'EXIT': case 'CANCEL': closePlayer(); break;
    }
    return true;
  }

  /* ---------------- Acciones ---------------- */

  function act(el) {
    var a = el.getAttribute('data-action');
    var cid = el.getAttribute('data-cid');
    var me = Store.user();
    if (Actions[a]) { Actions[a](el); return; }
    switch (a) {
      case 'tab': goTab(el.getAttribute('data-screen')); break;
      case 'open': if ($modal.hidden) go({ name: 'detail', cid: cid }); break;
      case 'toggle-list': Store.toggleList(cid, me); break;
      case 'vote': Store.toggleVote(cid, me); break;
      case 'react-open': openModal(UI.modalReact(cid)); break;
      case 'react': Store.react(cid, me, el.getAttribute('data-r')); closeModal(); toast('Tu reacción ya la ve tu Círculo'); break;
      case 'rec-open': openModal(UI.modalRecommend(cid)); break;
      case 'recommend':
        var to = el.getAttribute('data-to');
        Store.recommend(cid, me, to); closeModal();
        toast(UI.avatar(to, 'sm') + '<span>Le recomendaste «' + UI.esc(Data.byId(cid).title) + '» a ' + UI.esc(Data.member(to).name) + '</span>');
        break;
      case 'play': openPlayer(cid); break;
      case 'profile-open': openModal(UI.modalProfile()); break;
      case 'set-user': closeModal(); Store.setUser(el.getAttribute('data-uid')); toast('Ahora ves Círculo como ' + UI.esc(Data.member(Store.user()).name)); break;
      case 'simulate': closeModal(); Simulator.tickNow(); break;
      case 'reset': closeModal(); Store.reset(); goTab('home'); toast('Demo restablecida'); break;
      case 'close-modal': closeModal(); break;
    }
  }
  FM.onActivate = act;

  /* Cambios del estado colaborativo → re-render conservando el foco.
     No se re-renderizan pantallas con estado propio (juego, sala, cierre). */
  var NO_RERENDER = { elegir: 1, sala: 1, despues: 1 };
  Store.subscribe(function (evt) {
    if (!NO_RERENDER[top().name] && !playerOpen()) render(FM.scope ? null : FM.fid());
    if (evt && evt.uid && evt.uid !== Store.user() && evt.type !== 'user' && evt.type !== 'reset' && !playerOpen()) {
      var last = Store.state().activity[0];
      if (last && last.uid === evt.uid) toast(UI.avatar(evt.uid, 'sm') + '<span>' + UI.activityText(last, Store.user()) + '</span>');
    }
  });

  /* ---------------- Teclas (control remoto) ---------------- */

  d.addEventListener('keydown', function (e) {
    if (TP.lifecycle.handle(e)) return;
    var code = e.keyCode || e.which;

    // Campo de texto (solo fuera del STB): dejar escribir; Enter envía; ▲▼ salen.
    var ae = d.activeElement;
    if (ae && ae.tagName === 'INPUT') {
      if (code === 13) { e.preventDefault(); if (Actions['du-send']) Actions['du-send'](); return; }
      if (code === 27) { e.preventDefault(); ae.blur(); return; }
      if (code !== 38 && code !== 40) return;
    }

    // Teclas numéricas del control en el teclado de sala.
    if (code >= 48 && code <= 57 && !$modal.hidden && d.querySelector('#modal .keypad')) {
      var b = d.querySelector('#modal [data-k="' + (code - 48) + '"]');
      if (b) { e.preventDefault(); FM.focus(b); FM.activate(); }
      return;
    }

    var k = TP.keys.normalize(e);
    if (!k) return;
    if (playerOpen() && playerKey(k, e)) return;

    switch (k) {
      case 'LEFT': e.preventDefault(); FM.move('left'); break;
      case 'RIGHT': e.preventDefault(); FM.move('right'); break;
      case 'UP': e.preventDefault(); FM.move('up'); break;
      case 'DOWN': e.preventDefault(); FM.move('down'); break;
      case 'OK': e.preventDefault(); FM.activate(); break;
      case 'BACK': e.preventDefault(); back(e); break;
      case 'EXIT': case 'CANCEL':
        if (!$modal.hidden) { e.preventDefault(); closeModal(); }
        break; // R6: sin lógica de salida propia.
      case 'MENU': TP.lifecycle.onMenu(e); break;
      case 'PLAY':
        var c = FM.current && FM.current.getAttribute('data-cid');
        if (c && $modal.hidden) { e.preventDefault(); openPlayer(c); }
        break;
    }
  });

  /* ---------------- Capa mouse/touch (R5) — solo fuera del STB ---------------- */

  if (!TP.device.hasRuntime()) {
    d.addEventListener('click', function (e) {
      var el = closest(e.target, '[data-focusable]');
      if (playerOpen() && !el && $modal.hidden) {
        wakeUi();
        if (!closest(e.target, '#playerTray')) TP.player.toggle();
        return;
      }
      if (!el) {
        if (e.target === $modal) closeModal();
        return;
      }
      if (el.tagName === 'INPUT') { FM.focus(el, { noReveal: true }); return; }
      if (!FM.inScope(el) && !(playerOpen() && closest(el, '#playerTray'))) return;
      e.preventDefault();
      FM.focus(el, { noReveal: true });
      FM.activate();
    });
    var fine = w.matchMedia && w.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (fine) {
      d.addEventListener('mouseover', function (e) {
        var el = closest(e.target, '[data-focusable]');
        if (el && el !== FM.current && FM.inScope(el) && el.tagName !== 'INPUT') FM.focus(el, { noReveal: true });
      });
      d.addEventListener('mousemove', function () { if (playerOpen()) wakeUi(); });
    }
  }

  /* ---------------- Lifecycle y red ---------------- */

  TP.lifecycle.on('standby', function () { TP.player.pause(); Simulator.stop(); TP.network.pause(); });
  TP.lifecycle.on('wakeup', function () {
    TP.network.resume();
    if (!playerOpen()) { Simulator.start(); if (!NO_RERENDER[top().name]) render(FM.scope ? null : FM.fid()); }
    else wakeUi(); // el video queda en pausa; el usuario decide si sigue
  });
  TP.network.onChange(function (online) { $net.hidden = online; });

  /* ---------------- API para los módulos de UI ---------------- */

  w.App = {
    FM: FM,
    render: render,
    go: go,
    goTab: goTab,
    back: back,
    openModal: openModal,
    closeModal: closeModal,
    toast: toast,
    openPlayer: openPlayer,
    closePlayer: closePlayer,
    top: top
  };

  /* ---------------- Arranque ---------------- */

  function param(name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(w.location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }

  TP.debug.log('Círculo iniciando en ' + TP.device.getModel() + ' (' + TP.device.getHdmiResolution() + ')');
  TP.network.start();
  $net.hidden = TP.network.isOnline();
  render();
  Simulator.start();

  var salaParam = param('sala'), openParam = param('open');
  if (salaParam && /^\d{4}$/.test(salaParam)) Durante.startFromUrl(salaParam);
  else if (openParam && Data.byId(openParam)) go({ name: 'detail', cid: openParam });
})(window, document);
