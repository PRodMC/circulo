/* Datos simulados: miembros del Círculo y catálogo de contenido (ficticio). */
(function (w) {
  var Data = w.Data = {};

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
    { id: 'series',   title: 'Series' },
    { id: 'peliculas', title: 'Películas' },
    { id: 'docs',     title: 'Documentales' },
    { id: 'kids',     title: 'Para toda la familia' }
  ];

  // Pósters como degradados CSS: cero imágenes que decodificar (R2).
  Data.content = [
    { id: 'c01', cat: 'series', title: 'Marea Alta', genre: 'Drama', year: 2026, dur: '2 temporadas', colors: ['#0B3D5C', '#1E7FA8'], desc: 'Una familia de pescadores en Ensenada enfrenta una temporada que cambiará el puerto para siempre.' },
    { id: 'c02', cat: 'series', title: 'Código Norte', genre: 'Thriller', year: 2025, dur: '1 temporada', colors: ['#1A1A2E', '#4A2C6E'], desc: 'Una analista descubre un patrón en apagones de la red eléctrica de Monterrey.' },
    { id: 'c03', cat: 'series', title: 'La Vecindad 2050', genre: 'Comedia', year: 2026, dur: '3 temporadas', colors: ['#7A3E00', '#E08A1E'], desc: 'Vecinos de un edificio inteligente que no siempre entiende lo que le piden.' },
    { id: 'c04', cat: 'series', title: 'Sabor a Origen', genre: 'Gastronomía', year: 2024, dur: '1 temporada', colors: ['#5C1A1A', '#B5452B'], desc: 'Cocineras tradicionales comparten recetas de ocho regiones de México.' },
    { id: 'c05', cat: 'series', title: 'Señal Perdida', genre: 'Ciencia ficción', year: 2026, dur: '1 temporada', colors: ['#0D2B2B', '#2E8B7A'], desc: 'Un radioaficionado recibe mensajes que parecen venir de su propio futuro.' },
    { id: 'c06', cat: 'peliculas', title: 'El Último Tren a Zacatecas', genre: 'Aventura', year: 2025, dur: '1 h 52 min', colors: ['#3B2A14', '#9C6B2F'], desc: 'Dos hermanos cruzan el desierto para entregar una carta que nadie quiere recibir.' },
    { id: 'c07', cat: 'peliculas', title: 'Noche de Lotería', genre: 'Comedia', year: 2026, dur: '1 h 38 min', colors: ['#4A0E2E', '#D43F7A'], desc: 'Una reunión familiar se sale de control cuando aparece un boleto ganador.' },
    { id: 'c08', cat: 'peliculas', title: 'Frecuencia', genre: 'Suspenso', year: 2024, dur: '2 h 04 min', colors: ['#101820', '#3E5C76'], desc: 'Una locutora nocturna recibe la llamada de un oyente que sabe demasiado.' },
    { id: 'c09', cat: 'peliculas', title: 'Volcán', genre: 'Acción', year: 2026, dur: '1 h 47 min', colors: ['#2B0A00', '#E2551B'], desc: 'Un equipo de rescate tiene seis horas antes de que el Popocatépetl despierte.' },
    { id: 'c10', cat: 'docs', title: 'Arrecife Vivo', genre: 'Naturaleza', year: 2025, dur: '6 episodios', colors: ['#00303F', '#0FA3B1'], desc: 'El Sistema Arrecifal Mesoamericano contado por quienes lo protegen.' },
    { id: 'c11', cat: 'docs', title: 'Hecho a Mano', genre: 'Cultura', year: 2024, dur: '8 episodios', colors: ['#3A2E1F', '#A68A64'], desc: 'Artesanos que mantienen vivos oficios de siglos.' },
    { id: 'c12', cat: 'docs', title: 'Cancha Llena', genre: 'Deportes', year: 2026, dur: '5 episodios', colors: ['#0E3B1F', '#2F9E44'], desc: 'Una temporada dentro de un equipo de futbol femenil de segunda división.' },
    { id: 'c13', cat: 'kids', title: 'Pixel y Pancho', genre: 'Animación', year: 2026, dur: '2 temporadas', colors: ['#1B3A8C', '#5DA9E9'], desc: 'Un robot y un ajolote resuelven misterios en Xochimilco.' },
    { id: 'c14', cat: 'kids', title: 'La Banda del Jardín', genre: 'Musical', year: 2025, dur: '1 temporada', colors: ['#3D5A1E', '#A3C43B'], desc: 'Insectos músicos preparan el concierto más grande del jardín.' },
    { id: 'c15', cat: 'kids', title: 'Estrella Fugaz', genre: 'Aventura', year: 2024, dur: '1 h 25 min', colors: ['#2A1B4D', '#7B5CC4'], desc: 'Una niña construye un cohete para devolver una estrella a su lugar.' }
  ];

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
