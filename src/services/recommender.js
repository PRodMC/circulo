/* Recommender — preguntas del juego «Elegir» y cálculo de las 3 sugerencias. */
(function (w) {
  var ANY = 'any';

  var Rec = {
    ANY: ANY,
    SECONDS: 10, // tiempo por pregunta
    VOTE_THRESHOLD: 5, // con MÁS de 5 personas, la votación es obligatoria

    questions: [
      { id: 'genre', title: '¿Qué se te antoja?', options: [
        { id: 'terror', sym: '☠', label: 'Terror' },
        { id: 'comedia', sym: '☺', label: 'Comedia' },
        { id: 'scifi', sym: '✦', label: 'Ciencia ficción' },
        { id: 'anim', sym: '✎', label: 'Animación' },
        { id: ANY, sym: '?', label: 'Me da igual' }
      ] },
      { id: 'mood', title: '¿Cómo te quieres sentir?', options: [
        { id: 'reir', sym: '☺', label: 'Reírme' },
        { id: 'miedo', sym: '!', label: 'Pasar miedo' },
        { id: 'corto', sym: '◷', label: 'Algo cortito' },
        { id: 'mudo', sym: '♪', label: 'Un clásico mudo' },
        { id: ANY, sym: '?', label: 'Me da igual' }
      ] },
      { id: 'person', title: '¿Alguien que quieras ver?', options: [
        { id: 'keaton', sym: '★', label: 'Buster Keaton' },
        { id: 'lloyd', sym: '★', label: 'Harold Lloyd' },
        { id: 'grant', sym: '★', label: 'Cary Grant' },
        { id: 'lugosi', sym: '★', label: 'Bela Lugosi' },
        { id: 'nicholson', sym: '★', label: 'Jack Nicholson' },
        { id: 'superman', sym: 'S', label: 'Superman' },
        { id: ANY, sym: '?', label: 'Me da igual' }
      ] }
    ],

    label: function (qid, oid) {
      for (var i = 0; i < Rec.questions.length; i++) {
        var q = Rec.questions[i];
        if (q.id !== qid) continue;
        for (var j = 0; j < q.options.length; j++) if (q.options[j].id === oid) return q.options[j].label;
      }
      return oid;
    },

    /* answers: [{ genre, mood, person }, ...] (una por persona).
       Devuelve las 3 mejores: [{ c, score, pct, reason }] */
    suggest: function (answers) {
      var n = answers.length || 1;
      var scored = [];
      for (var i = 0; i < Data.content.length; i++) {
        var c = Data.content[i], t = Data.tags[c.id] || { mood: [], people: [] };
        var score = 0, hits = { genre: 0, mood: 0, person: 0 };
        for (var a = 0; a < answers.length; a++) {
          var ans = answers[a];
          if (ans.genre === ANY || ans.genre === c.cat) { score += 3; if (ans.genre !== ANY) hits.genre++; }
          if (ans.mood === ANY || indexOf(t.mood, ans.mood) >= 0) { score += 2; if (ans.mood !== ANY) hits.mood++; }
          if (ans.person === ANY) score += 1;
          else if (indexOf(t.people, ans.person) >= 0) { score += 4; hits.person++; }
        }
        score += Store.voters(c.id).length * 0.1; // desempate: lo que ya votó el Círculo
        scored.push({ c: c, score: score, hits: hits });
      }
      scored.sort(function (x, y) { return y.score - x.score; });

      var max = n * 9, out = [];
      for (var k = 0; k < 3 && k < scored.length; k++) {
        var s = scored[k];
        out.push({ c: s.c, score: s.score, pct: Math.max(5, Math.min(100, Math.round((s.score / max) * 100))), reason: reason(s, answers, n) });
      }
      return out;
    }
  };

  function indexOf(arr, v) { for (var i = 0; i < arr.length; i++) if (arr[i] === v) return i; return -1; }

  function reason(s, answers, n) {
    var t = Data.tags[s.c.id] || { people: [] };
    if (s.hits.person) {
      var p = t.people[0];
      return s.hits.person === 1 && n > 1 ? 'Alguien quería ver a ' + Rec.label('person', p) : 'Sale ' + Rec.label('person', p);
    }
    if (s.hits.genre) return s.hits.genre + ' de ' + n + ' querían ' + Rec.label('genre', s.c.cat).toLowerCase();
    if (s.hits.mood) {
      var moods = { reir: 'reírse', miedo: 'pasar miedo', corto: 'algo cortito', mudo: 'un clásico mudo' };
      for (var a = 0; a < answers.length; a++) if (moods[answers[a].mood] && indexOf(t.mood || Data.tags[s.c.id].mood, answers[a].mood) >= 0) {
        return s.hits.mood + ' de ' + n + ' querían ' + moods[answers[a].mood];
      }
    }
    return 'Le gusta a tu Círculo';
  }

  w.Recommender = Rec;
})(window);
