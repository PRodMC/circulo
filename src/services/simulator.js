/* Simulador de colaboración: los otros miembros del Círculo "actúan" cada cierto
   tiempo (agregan a la lista, votan, reaccionan, te recomiendan algo), para que
   se pueda probar la parte colaborativa sin backend. Se pausa en standby. */
(function (w) {
  var MIN_MS = 20000, MAX_MS = 40000;
  var timer = null;

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function others() {
    var me = Store.user(), out = [];
    for (var i = 0; i < Data.members.length; i++) if (Data.members[i].id !== me) out.push(Data.members[i].id);
    return out;
  }

  function tick() {
    var uid = pick(others());
    var roll = Math.random();
    var c = pick(Data.content);
    if (roll < 0.3) {
      if (!Store.inList(c.id)) Store.toggleList(c.id, uid);
      else if (!Store.hasVoted(c.id, uid)) Store.toggleVote(c.id, uid);
    } else if (roll < 0.6) {
      var l = Store.state().list;
      if (l.length) {
        var e = pick(l);
        if (!Store.hasVoted(e.cid, uid)) Store.toggleVote(e.cid, uid);
      }
    } else if (roll < 0.85) {
      Store.react(c.id, uid, pick(Data.reactions).id);
    } else {
      Store.recommend(c.id, uid, Store.user());
    }
    schedule();
  }

  function schedule() {
    if (timer) w.clearTimeout(timer);
    timer = w.setTimeout(tick, MIN_MS + Math.random() * (MAX_MS - MIN_MS));
  }

  w.Simulator = {
    start: function () { if (!timer) schedule(); },
    stop: function () { if (timer) { w.clearTimeout(timer); timer = null; } },
    tickNow: tick
  };
})(window);
