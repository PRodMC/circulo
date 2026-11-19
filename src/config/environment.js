/* Configuración por ambiente. Nada de aquí es secreto:
   la base de Firebase se protege con sus reglas (solo /salas es accesible). */
(function (w) {
  w.ENV = {
    /* Firebase Realtime Database (proyecto circulo-ce754). Se usa vía REST,
       sin SDK, para no depender de módulos ES ni WebSocket en el STB (guía §5.2). */
    firebaseDb: 'https://circulo-ce754-default-rtdb.firebaseio.com',

    /* URL pública de la app; se usa para los enlaces de QR y WhatsApp. */
    publicUrl: 'https://prodmc.github.io/circulo/'
  };
})(window);
