/* Datos: miembros del Círculo y catálogo.
   El catálogo son películas y cortos de DOMINIO PÚBLICO alojados en Internet Archive
   (archive.org). Portadas y sinopsis vienen de TMDB vía src/services/tmdb.js,
   generado por scripts/fetch-tmdb.mjs (la llave de la API nunca se publica). */
(function (w) {
  var Data = w.Data = {};
  var IA = 'https://archive.org/download/';

  Data.members = [
    { id: 'ana',   name: 'Ana',   color: '#0071EB' },
    { id: 'luis',  name: 'Luis',  color: '#8A4FD8' },
    { id: 'marta', name: 'Marta', color: '#1F9E6E' },
    { id: 'diego', name: 'Diego', color: '#C2410C' },
    { id: 'sofia', name: 'Sofía', color: '#B8306B' }
  ];

  Data.reactions = [
    { id: 'love',  sym: '♥', label: 'Me encanta' },
    { id: 'wow',   sym: '★', label: '¡Imperdible!' },
    { id: 'laugh', sym: '☺', label: 'Me hizo reír' },
    { id: 'later', sym: '◷', label: 'Para el fin de semana' },
    { id: 'meh',   sym: '–', label: 'No es para mí' }
  ];

  Data.categories = [
    { id: 'terror',  title: 'Terror clásico' },
    { id: 'comedia', title: 'Comedia clásica' },
    { id: 'scifi',   title: 'Ciencia ficción de culto' },
    { id: 'anim',    title: 'Animación para toda la familia' }
  ];

  /* q + qYear: búsqueda en TMDB (título original). src: MP4 progresivo en archive.org. */
  Data.content = [
    { id: 'c01', cat: 'terror', title: 'La noche de los muertos vivientes', q: 'Night of the Living Dead', year: 1968, dur: '1 h 35 min', genre: 'Terror',
      colors: ['#1A1A1A', '#5C5C5C'], src: IA + 'night_of_the_living_dead_dvd/Night.mp4',
      desc: 'Un grupo de desconocidos se atrinchera en una granja mientras los muertos vuelven a la vida.' },
    { id: 'c02', cat: 'terror', title: 'Nosferatu', q: 'Nosferatu', year: 1922, dur: '1 h 33 min', genre: 'Terror · Cine mudo',
      colors: ['#1B1F14', '#55603A'], src: IA + 'Nosferatu_most_complete_version_93_mins./Nosferatu_1922_Symphony_of_Horror_512kb.mp4',
      desc: 'El conde Orlok deja Transilvania y lleva la plaga a la ciudad de Wisborg.' },
    { id: 'c03', cat: 'terror', title: 'El carnaval de las almas', q: 'Carnival of Souls', year: 1962, dur: '1 h 23 min', genre: 'Terror',
      colors: ['#101820', '#3E5C76'], src: IA + 'CarnivalofSouls/CarnivalOfSouls.mp4',
      desc: 'Tras sobrevivir a un accidente, una organista se siente atraída por un pabellón abandonado.' },
    { id: 'c04', cat: 'terror', title: 'El gabinete del doctor Caligari', q: 'The Cabinet of Dr. Caligari', year: 1920, dur: '51 min', genre: 'Terror · Cine mudo',
      colors: ['#3B2A14', '#9C6B2F'], src: IA + 'DasKabinettdesDoktorCaligariTheCabinetofDrCaligari/The_Cabinet_of_Dr._Caligari_512kb.mp4',
      desc: 'Un hipnotizador de feria y su sonámbulo siembran el miedo en un pueblo alemán.' },
    { id: 'c05', cat: 'terror', title: 'La tienda de los horrores', q: 'The Little Shop of Horrors', year: 1960, dur: '1 h 11 min', genre: 'Comedia de terror',
      colors: ['#0E3B1F', '#2F9E44'], src: IA + 'TheLittleShopOfHorrors1960_765/TheLittleShopOfHorrors1960.mp4',
      desc: 'Un empleado de florería cultiva una planta que se alimenta de sangre humana.' },

    { id: 'c06', cat: 'comedia', title: 'Luna nueva', q: 'His Girl Friday', year: 1940, dur: '1 h 32 min', genre: 'Comedia',
      colors: ['#4A0E2E', '#D43F7A'], src: IA + 'his_girl_friday/his_girl_friday.mp4',
      desc: 'Un editor hará lo que sea para que su exesposa, la mejor reportera, no deje el periódico.' },
    { id: 'c07', cat: 'comedia', title: 'El maquinista de La General', q: 'The General', year: 1926, dur: '1 h 07 min', genre: 'Comedia · Cine mudo',
      colors: ['#2B0A00', '#E2551B'], src: IA + 'TheGeneral/The_General_512kb.mp4',
      desc: 'Buster Keaton persigue la locomotora que le robaron durante la Guerra Civil.' },
    { id: 'c08', cat: 'comedia', title: 'El moderno Sherlock Holmes', q: 'Sherlock Jr.', year: 1924, dur: '45 min', genre: 'Comedia · Cine mudo',
      colors: ['#1A1A2E', '#4A2C6E'], src: IA + 'sherlockjr1924_201909/' + encodeURIComponent('Sherlock Jr. - Buster Keaton (1924) HD [720p].mp4'),
      desc: 'Un proyeccionista que sueña con ser detective se mete, literalmente, en la película.' },
    { id: 'c09', cat: 'comedia', title: 'El hombre mosca', q: 'Safety Last!', year: 1923, dur: '1 h 14 min', genre: 'Comedia · Cine mudo',
      colors: ['#3A2E1F', '#A68A64'], src: IA + 'SafetyLastHaroldLloyd1923.FullMovieexcellentQuality./' + encodeURIComponent('Safety Last - Harold Lloyd 1923. Full movie,excellent quality..mp4'),
      desc: 'Harold Lloyd escala un rascacielos para impresionar a su novia.' },

    { id: 'c10', cat: 'scifi', title: 'Plan 9 del espacio exterior', q: 'Plan 9 from Outer Space', year: 1957, dur: '1 h 18 min', genre: 'Ciencia ficción',
      colors: ['#0D2B2B', '#2E8B7A'], src: IA + 'plan-9-from-outer-space/plan-9-from-outer-space.mp4',
      desc: 'Extraterrestres reviven a los muertos para detener a la humanidad. Un clásico de culto.' },
    { id: 'c11', cat: 'scifi', title: 'Viaje a la Luna', q: 'A Trip to the Moon', year: 1902, dur: '13 min', genre: 'Ciencia ficción · Cine mudo',
      colors: ['#2A1B4D', '#7B5CC4'], src: IA + 'ATripToTheMoonGeorgeMelies/' + encodeURIComponent('A Trip to the Moon-George Méliès.mp4'),
      desc: 'Georges Méliès lleva a seis astrónomos a la Luna en una bala de cañón.' },

    { id: 'c12', cat: 'anim', title: 'Los viajes de Gulliver', q: "Gulliver's Travels", year: 1939, dur: '1 h 13 min', genre: 'Animación',
      colors: ['#1B3A8C', '#5DA9E9'], src: IA + 'gullivers_travels1939/gullivers_travels1939.mp4',
      desc: 'Un náufrago despierta en Liliput, un reino diminuto al borde de la guerra.' },
    { id: 'c13', cat: 'anim', title: 'Superman: Los monstruos mecánicos', q: 'The Mechanical Monsters', year: 1941, dur: '10 min', genre: 'Animación',
      colors: ['#0B3D5C', '#1E7FA8'], src: IA + 'superman_the_mechanical_monsters/superman_the_mechanical_monsters_512kb.mp4',
      desc: 'Robots gigantes asaltan bancos de Metrópolis y Lois Lane se infiltra para descubrir a su creador.' },
    { id: 'c14', cat: 'anim', title: 'Superman: Terremoto eléctrico', q: 'Electric Earthquake', year: 1942, dur: '9 min', genre: 'Animación',
      colors: ['#5C1A1A', '#B5452B'], src: IA + 'superman_electric_earthquake/superman_electric_earthquake_512kb.mp4',
      desc: 'Un científico amenaza con hundir Manhattan si no le devuelven la isla.' },
    { id: 'c15', cat: 'anim', title: 'Superman: La hora undécima', q: 'Eleventh Hour', year: 1942, dur: '8 min', genre: 'Animación',
      colors: ['#3D5A1E', '#A3C43B'], src: IA + 'superman_eleventh_hour/superman_eleventh_hour_512kb.mp4',
      desc: 'Superman sabotea barcos enemigos cada noche, hasta que Lois es capturada.' }
  ];

  /* Etiquetas para el recomendador de «Elegir»: ánimo y quién sale. */
  Data.tags = {
    c01: { mood: ['miedo'], people: [] },
    c02: { mood: ['miedo', 'mudo'], people: [] },
    c03: { mood: ['miedo'], people: [] },
    c04: { mood: ['miedo', 'mudo'], people: [] },
    c05: { mood: ['reir', 'miedo'], people: ['nicholson'] },
    c06: { mood: ['reir'], people: ['grant'] },
    c07: { mood: ['reir', 'mudo'], people: ['keaton'] },
    c08: { mood: ['reir', 'mudo'], people: ['keaton'] },
    c09: { mood: ['reir', 'mudo'], people: ['lloyd'] },
    c10: { mood: ['reir', 'miedo'], people: ['lugosi'] },
    c11: { mood: ['corto', 'mudo'], people: [] },
    c12: { mood: ['reir'], people: [] },
    c13: { mood: ['corto'], people: ['superman'] },
    c14: { mood: ['corto'], people: ['superman'] },
    c15: { mood: ['corto'], people: ['superman'] }
  };

  /* Mezcla los datos de TMDB (si el archivo generado existe) sobre el catálogo. */
  Data.applyTmdb = function (map) {
    if (!map) return;
    for (var i = 0; i < Data.content.length; i++) {
      var c = Data.content[i], t = map[c.id];
      if (!t) continue;
      c.tmdbId = t.id;
      if (t.poster) c.poster = t.poster;
      if (t.backdrop) c.backdrop = t.backdrop;
      if (t.title) c.title = t.title;
      if (t.overview) c.desc = t.overview;
    }
  };

  Data.TMDB_IMG = 'https://image.tmdb.org/t/p/';

  Data.byId = function (id) {
    for (var i = 0; i < Data.content.length; i++) if (Data.content[i].id === id) return Data.content[i];
    return null;
  };
  Data.member = function (id) {
    for (var i = 0; i < Data.members.length; i++) if (Data.members[i].id === id) return Data.members[i];
    return { id: id, name: id, color: '#333333' };
  };
  Data.reaction = function (id) {
    for (var i = 0; i < Data.reactions.length; i++) if (Data.reactions[i].id === id) return Data.reactions[i];
    return null;
  };
  Data.inCategory = function (cat) {
    var out = [];
    for (var i = 0; i < Data.content.length; i++) if (Data.content[i].cat === cat) out.push(Data.content[i]);
    return out;
  };
})(window);
