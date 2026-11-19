/* Realtime — salas compartidas entre dispositivos (etapa «Durante»).

   Firebase Realtime Database por REST:
   - Escribir: XMLHttpRequest POST/PUT (funciona en motores viejos).
   - Escuchar: EventSource (streaming SSE de Firebase) si existe;
     si no, polling cada 3 s. Soporte de EventSource/WebSocket en el STB es TBD (§5.2).
   Si Firebase no responde, la sala sigue funcionando en local
   (mismo navegador entre pestañas con BroadcastChannel, si existe).

   Estructura:
     /salas/{codigo}/info            { cid, host, hostName, ts }
     /salas/{codigo}/gente/{device}  { name, uid, ts }
     /salas/{codigo}/eventos/{id}    { device, name, uid, type: 'reaction'|'comment', value, ts } */
(function (w) {
  var DB = (w.ENV && w.ENV.firebaseDb) || '';
  var POLL_MS = 3000;

  /* Un id por carga de página: dos pestañas o dos equipos siempre cuentan
     como pantallas distintas (no depende de ningún almacenamiento). */
  var deviceId = 'd' + new Date().getTime().toString(36) + Math.random().toString(36).slice(2, 8);

  function xhr(method, path, body, cb) {
    if (!DB) { if (cb) cb(new Error('sin db')); return; }
    try {
      var r = new XMLHttpRequest();
      r.open(method, DB + path, true);
      r.onreadystatechange = function () {
        if (r.readyState !== 4) return;
        if (r.status >= 200 && r.status < 300) {
          var data = null;
          try { data = JSON.parse(r.responseText); } catch (e) {}
          if (cb) cb(null, data);
        } else if (cb) cb(new Error('HTTP ' + r.status));
      };
      r.send(body === undefined ? null : JSON.stringify(body));
    } catch (e) { if (cb) cb(e); }
  }

  var room = null; // { code, es, timer, seen, lastKey, bc, handlers }

  function emit(name, data) {
    if (!room) return;
    var l = room.handlers[name] || [];
    for (var i = 0; i < l.length; i++) l[i](data);
  }

  function handleEvents(map) {
    if (!map || !room) return;
    var keys = [];
    for (var k in map) if (map.hasOwnProperty(k)) keys.push(k);
    keys.sort();
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var ev = map[key];
      if (key.charAt(0) !== '~' && (!room.lastKey || key > room.lastKey)) room.lastKey = key;
      if (!ev || !ev.id || room.seen[ev.id]) continue; // dedupe por id del evento
      room.seen[ev.id] = 1;
      if (ev.ts && ev.ts < room.joinedAt - 60000) continue; // no repetir historial viejo
      ev.mine = ev.device === deviceId;
      emit('event', ev);
    }
  }

  function handlePeople(map) {
    if (!room) return;
    var list = [];
    for (var k in map || {}) if (map.hasOwnProperty(k)) list.push(map[k]);
    room.people = list;
    emit('people', list);
  }

  function listen() {
    var base = '/salas/' + room.code;
    room.mode = 'poll';
    if (typeof w.EventSource === 'function') {
      try {
        var es = new w.EventSource(DB + base + '.json');
        room.es = es;
        room.mode = 'stream';
        var onData = function (e) {
          var msg; try { msg = JSON.parse(e.data); } catch (x) { return; }
          if (!msg) return;
          var p = msg.path, d = msg.data;
          if (p === '/') {
            if (d) { handleEvents(d.eventos); handlePeople(d.gente); if (d.info) emit('info', d.info); }
          } else if (p.indexOf('/eventos/') === 0) {
            var o = {}; o[p.split('/')[2]] = d; handleEvents(o);
          } else if (p === '/eventos') {
            handleEvents(d);
          } else if (p.indexOf('/gente') === 0) {
            pollPeople();
          } else if (p.indexOf('/info') === 0) {
            pollInfo();
          }
        };
        es.addEventListener('put', onData);
        es.addEventListener('patch', function (e) {
          var msg; try { msg = JSON.parse(e.data); } catch (x) { return; }
          if (msg && msg.path === '/eventos') handleEvents(msg.data);
          else pollPeople();
        });
        es.onerror = function () { if (room && room.es === es && es.readyState === 2) { room.es = null; startPolling(); } };
        return;
      } catch (e) { room.es = null; }
    }
    startPolling();
  }

  function pollInfo() { if (room) xhr('GET', '/salas/' + room.code + '/info.json', undefined, function (e, d) { if (!e && d) emit('info', d); }); }
  function pollPeople() { if (room) xhr('GET', '/salas/' + room.code + '/gente.json', undefined, function (e, d) { if (!e) handlePeople(d); }); }

  function startPolling() {
    if (!room) return;
    room.mode = 'poll';
    var tick = function () {
      if (!room) return;
      var q = room.lastKey ? '?orderBy=%22$key%22&startAt=%22' + encodeURIComponent(room.lastKey) + '%22' : '';
      xhr('GET', '/salas/' + room.code + '/eventos.json' + q, undefined, function (e, d) {
        if (e) { emit('status', 'offline'); return; }
        emit('status', 'online');
        handleEvents(d);
      });
      pollPeople();
    };
    tick();
    room.timer = w.setInterval(tick, POLL_MS);
  }

  function heartbeat(me) {
    if (!room) return;
    xhr('PUT', '/salas/' + room.code + '/gente/' + deviceId + '.json', { name: me.name, uid: me.uid || null, ts: { '.sv': 'timestamp' } });
  }

  var Realtime = {
    deviceId: deviceId,
    enabled: !!DB,

    newCode: function () { return String(1000 + Math.floor(Math.random() * 9000)); },

    /* Abre (o se une a) una sala. me = { name, uid } */
    join: function (code, me, info) {
      Realtime.leave();
      room = { code: String(code), handlers: {}, seen: {}, lastKey: null, people: [], me: me, joinedAt: new Date().getTime() };
      if (info) xhr('PUT', '/salas/' + room.code + '/info.json', info);
      heartbeat(me);
      room.hb = w.setInterval(function () { heartbeat(me); }, 30000);
      listen();
      if (typeof w.BroadcastChannel === 'function') {
        try {
          room.bc = new w.BroadcastChannel('circulo-sala-' + room.code);
          room.bc.onmessage = function (m) { var o = {}; o[m.data.key] = m.data.ev; handleEvents(o); };
        } catch (e) {}
      }
      return room.code;
    },

    on: function (name, fn) { if (room) (room.handlers[name] = room.handlers[name] || []).push(fn); },

    /* type: 'reaction' | 'comment' */
    send: function (type, value) {
      if (!room) return;
      var ts = new Date().getTime();
      var ev = { id: deviceId + '-' + ts + '-' + Math.floor(Math.random() * 1e6), device: deviceId, name: room.me.name, uid: room.me.uid || null,
                 type: type, value: String(value).slice(0, 140), ts: ts };
      // Se muestra al instante en este equipo; la copia que regresa de Firebase se ignora por id.
      var o = {}; o['~' + ev.id] = ev; handleEvents(o);
      if (room.bc) try { room.bc.postMessage({ key: '~' + ev.id, ev: ev }); } catch (x) {}
      xhr('POST', '/salas/' + room.code + '/eventos.json', ev);
    },

    getInfo: function (code, cb) { xhr('GET', '/salas/' + code + '/info.json', undefined, cb); },

    people: function () { return room ? room.people : []; },
    code: function () { return room ? room.code : null; },
    mode: function () { return room ? room.mode : null; },

    leave: function () {
      if (!room) return;
      var r = room;
      room = null;
      if (r.es) try { r.es.close(); } catch (e) {}
      if (r.timer) w.clearInterval(r.timer);
      if (r.hb) w.clearInterval(r.hb);
      if (r.bc) try { r.bc.close(); } catch (e) {}
      xhr('DELETE', '/salas/' + r.code + '/gente/' + deviceId + '.json');
    }
  };

  w.Realtime = Realtime;
})(window);
