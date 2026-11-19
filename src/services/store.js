/* Store — estado colaborativo del Círculo (lista compartida, votos, reacciones,
   recomendaciones, actividad). Persiste en localStorage si existe; si no
   (soporte TBD en STB, guía §5.2), funciona solo en memoria. */
(function (w) {
  var KEY = 'circulo.state.v1';
  var listeners = [];
  var state;

  var storage = {
    read: function () { try { return w.localStorage ? w.localStorage.getItem(KEY) : null; } catch (e) { return null; } },
    write: function (v) { try { if (w.localStorage) w.localStorage.setItem(KEY, v); } catch (e) {} },
    clear: function () { try { if (w.localStorage) w.localStorage.removeItem(KEY); } catch (e) {} }
  };

  function now() { return new Date().getTime(); }

  function seed() {
    var t = now();
    return {
      userId: 'ana',
      list: [
        { cid: 'c01', by: 'luis', ts: t - 3600e3 * 26 },
        { cid: 'c07', by: 'marta', ts: t - 3600e3 * 20 },
        { cid: 'c10', by: 'diego', ts: t - 3600e3 * 5 },
        { cid: 'c13', by: 'sofia', ts: t - 3600e3 * 2 }
      ],
      votes: { c01: ['luis', 'marta', 'diego'], c07: ['marta', 'sofia'], c10: ['diego'], c13: ['sofia', 'ana'] },
      reactions: [
        { cid: 'c01', uid: 'marta', r: 'wow', ts: t - 3600e3 * 22 },
        { cid: 'c07', uid: 'luis', r: 'laugh', ts: t - 3600e3 * 10 },
        { cid: 'c13', uid: 'diego', r: 'love', ts: t - 3600e3 * 1 }
      ],
      recs: [
        { from: 'luis', to: 'ana', cid: 'c05', ts: t - 3600e3 * 3 }
      ],
      activity: [
        { uid: 'sofia', type: 'add', cid: 'c13', ts: t - 3600e3 * 2 },
        { uid: 'luis', type: 'rec', cid: 'c05', to: 'ana', ts: t - 3600e3 * 3 },
        { uid: 'diego', type: 'add', cid: 'c10', ts: t - 3600e3 * 5 },
        { uid: 'luis', type: 'react', cid: 'c07', r: 'laugh', ts: t - 3600e3 * 10 }
      ]
    };
  }

  function load() {
    var raw = storage.read();
    if (raw) { try { state = JSON.parse(raw); return; } catch (e) {} }
    state = seed();
  }

  function commit(evt) {
    storage.write(JSON.stringify(state));
    for (var i = 0; i < listeners.length; i++) listeners[i](evt);
  }

  function log(entry) {
    entry.ts = now();
    state.activity.unshift(entry);
    if (state.activity.length > 60) state.activity.length = 60;
  }

  function indexOf(arr, v) { for (var i = 0; i < arr.length; i++) if (arr[i] === v) return i; return -1; }

  var Store = {
    subscribe: function (fn) { listeners.push(fn); },
    state: function () { return state; },
    user: function () { return state.userId; },

    setUser: function (uid) { state.userId = uid; commit({ type: 'user', uid: uid }); },

    inList: function (cid) {
      for (var i = 0; i < state.list.length; i++) if (state.list[i].cid === cid) return state.list[i];
      return null;
    },

    toggleList: function (cid, uid) {
      var entry = Store.inList(cid);
      if (entry) {
        state.list.splice(indexOf(state.list, entry), 1);
        log({ uid: uid, type: 'remove', cid: cid });
      } else {
        state.list.push({ cid: cid, by: uid, ts: now() });
        log({ uid: uid, type: 'add', cid: cid });
      }
      commit({ type: entry ? 'remove' : 'add', uid: uid, cid: cid });
      return !entry;
    },

    voters: function (cid) { return state.votes[cid] || []; },
    hasVoted: function (cid, uid) { return indexOf(Store.voters(cid), uid) >= 0; },

    toggleVote: function (cid, uid) {
      var v = state.votes[cid] = state.votes[cid] || [];
      var i = indexOf(v, uid);
      if (i >= 0) v.splice(i, 1);
      else { v.push(uid); log({ uid: uid, type: 'vote', cid: cid }); }
      commit({ type: 'vote', uid: uid, cid: cid, on: i < 0 });
      return i < 0;
    },

    reactionsFor: function (cid) {
      var out = [];
      for (var i = 0; i < state.reactions.length; i++) if (state.reactions[i].cid === cid) out.push(state.reactions[i]);
      return out;
    },

    react: function (cid, uid, r) {
      // Una reacción por persona por título: la nueva reemplaza la anterior.
      for (var i = state.reactions.length - 1; i >= 0; i--) {
        if (state.reactions[i].cid === cid && state.reactions[i].uid === uid) state.reactions.splice(i, 1);
      }
      state.reactions.push({ cid: cid, uid: uid, r: r, ts: now() });
      log({ uid: uid, type: 'react', cid: cid, r: r });
      commit({ type: 'react', uid: uid, cid: cid, r: r });
    },

    recommend: function (cid, from, to) {
      state.recs.unshift({ from: from, to: to, cid: cid, ts: now() });
      log({ uid: from, type: 'rec', cid: cid, to: to });
      commit({ type: 'rec', uid: from, cid: cid, to: to });
    },

    watch: function (cid, uid) {
      log({ uid: uid, type: 'watch', cid: cid });
      commit({ type: 'watch', uid: uid, cid: cid });
    },

    recsFor: function (uid) {
      var out = [], seen = {};
      for (var i = 0; i < state.recs.length; i++) {
        var r = state.recs[i];
        if (r.to === uid && !seen[r.cid]) { seen[r.cid] = 1; out.push(r); }
      }
      return out;
    },

    /* Lista compartida ordenada por votos (desc) y luego por fecha. */
    rankedList: function () {
      var l = state.list.slice();
      l.sort(function (a, b) {
        var d = Store.voters(b.cid).length - Store.voters(a.cid).length;
        return d !== 0 ? d : b.ts - a.ts;
      });
      return l;
    },

    reset: function () { storage.clear(); state = seed(); commit({ type: 'reset' }); }
  };

  load();
  w.Store = Store;
})(window);
