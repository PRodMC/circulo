/* App — router, despacho de acciones y manejo de teclas.
   Usa TP.* (plataforma) y Store/Data/UI (negocio y vistas). */
(function (w, d) {
  var FM = TP.focus;
  var $screen = d.getElementById('screen');
  var $modal = d.getElementById('modal');
  var $modalBox = d.getElementById('modalBox');
  var $toasts = d.getElementById('toasts');
  var $profile = d.getElementById('profileBtn');
  var $net = d.getElementById('netBanner');

  var stack = [{ name: 'home' }];
  var modalReturnFid = null;

  function top() { return stack[stack.length - 1]; }

  function closest(el, sel) {
    while (el && el.nodeType === 1) {
      if ((el.matches || el.msMatchesSelector || el.webkitMatchesSelector).call(el, sel)) return el;
      el = el.parentNode;
    }
    return null;
  }

  /* ---------------- Render ---------------- */

  function render(preferFid) {
    var r = top();
    var html = r.name === 'detail' ? UI.detail(r.cid)
      : r.name === 'list' ? UI.list()
      : r.name === 'activity' ? UI.activity()
      : UI.home();
    $screen.innerHTML = html;
    $profile.innerHTML = UI.profileButton();

    var rootName = stack.length > 1 && stack[1].name !== 'detail' ? stack[1].name : 'home';
    var tabs = d.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute('data-screen') === rootName) tabs[i].classList.add('is-active');
      else tabs[i].classList.remove('is-active');
    }

    if ($modal.hidden) FM.ensure(preferFid, '#screen [data-focusable]');
  }

  function go(rec) {
    top().fid = FM.fid();
    stack.push(rec);
    $screen.scrollTop = 0;
    render();
  }

  function goTab(name) {
    stack = name === 'home' ? [{ name: 'home' }] : [{ name: 'home' }, { name: name }];
    $screen.scrollTop = 0;
    render();
  }

  function back(event) {
    if (!$modal.hidden) { closeModal(); return; }
    if (stack.length > 1) {
      stack.pop();
      render(top().fid);
      return;
    }
    TP.lifecycle.onRootBack(event); // R6: raíz → la plataforma decide.
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

  /* ---------------- Acciones ---------------- */

  function act(el) {
    var a = el.getAttribute('data-action');
    var cid = el.getAttribute('data-cid');
    var me = Store.user();
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
      case 'play': openModal(UI.modalPlay(cid)); break;
      case 'profile-open': openModal(UI.modalProfile()); break;
      case 'set-user': closeModal(); Store.setUser(el.getAttribute('data-uid')); toast('Ahora ves Círculo como ' + UI.esc(Data.member(Store.user()).name)); break;
      case 'simulate': closeModal(); Simulator.tickNow(); break;
      case 'reset': closeModal(); Store.reset(); goTab('home'); toast('Demo restablecida'); break;
      case 'close-modal': closeModal(); break;
    }
  }
  FM.onActivate = act;

  /* Cambios del estado colaborativo → re-render conservando el foco. */
  Store.subscribe(function (evt) {
    render(FM.scope ? null : FM.fid());
    if (evt && evt.uid && evt.uid !== Store.user() && evt.type !== 'user' && evt.type !== 'reset') {
      var st = Store.state();
      var last = st.activity[0];
      if (last && last.uid === evt.uid) toast(UI.avatar(evt.uid, 'sm') + '<span>' + UI.activityText(last, Store.user()) + '</span>');
    }
  });

  /* ---------------- Teclas (control remoto) ---------------- */

  d.addEventListener('keydown', function (e) {
    if (TP.lifecycle.handle(e)) return;
    var k = TP.keys.normalize(e);
    if (!k) return;
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
        if (c && $modal.hidden) { e.preventDefault(); openModal(UI.modalPlay(c)); }
        break;
    }
  });

  /* ---------------- Capa mouse/touch (R5: progressive enhancement) ----------------
     Solo fuera del STB, para no pelear con el D-pad. */
  if (!TP.device.hasRuntime()) {
    d.addEventListener('click', function (e) {
      var el = closest(e.target, '[data-focusable]');
      if (!el) {
        if (e.target === $modal) closeModal();
        return;
      }
      if (!FM.inScope(el)) return;
      e.preventDefault();
      FM.focus(el, { noReveal: true });
      FM.activate();
    });
    var fine = w.matchMedia && w.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (fine) {
      d.addEventListener('mouseover', function (e) {
        var el = closest(e.target, '[data-focusable]');
        if (el && el !== FM.current && FM.inScope(el)) FM.focus(el, { noReveal: true });
      });
    }
  }

  /* ---------------- Lifecycle y red ---------------- */

  TP.lifecycle.on('standby', function () { Simulator.stop(); TP.network.pause(); });
  TP.lifecycle.on('wakeup', function () { TP.network.resume(); Simulator.start(); render(FM.scope ? null : FM.fid()); });

  TP.network.onChange(function (online) { $net.hidden = online; });

  /* ---------------- Arranque ---------------- */

  TP.debug.log('Círculo iniciando en ' + TP.device.getModel() + ' (' + TP.device.getHdmiResolution() + ')');
  TP.network.start();
  $net.hidden = TP.network.isOnline();
  render();
  Simulator.start();
})(window, document);
