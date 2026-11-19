# Círculo

Simulación de una app de contenido con funciones colaborativas para el STB de Totalplay (Web App, control remoto) que también se puede usar en un navegador de escritorio o en el celular.

Un "Círculo" es un grupo de personas (familia, amigos) que deciden juntas qué ver:

- **Lista del Círculo**: lista compartida; cualquiera agrega títulos y lo más votado sube.
- **Votos**: cada miembro vota por lo que quiere ver.
- **Reacciones**: reacciones predefinidas (sin teclado, la entrada de texto en el STB sigue TBD).
- **Recomendaciones**: le recomiendas un título a alguien y le aparece en «Te recomendaron».
- **Actividad**: feed de lo que hace el grupo.
- **Cambio de perfil**: el botón «Viendo como» permite actuar como otro miembro para probar la colaboración.
- **Simulador**: los demás miembros hacen cosas solos cada 20–40 s (agregan, votan, reaccionan, recomiendan).

No hay backend: el estado vive en `localStorage` del navegador (con respaldo en memoria si no existe).

## Catálogo y video

- **Videos**: 15 películas y cortos de **dominio público** (Nosferatu, La noche de los muertos vivientes, El maquinista de La General, Superman de Fleischer, etc.), servidos como MP4 desde Internet Archive. Se reproducen con `<video>` HTML5.
- **Reproductor**: OK pausa/reanuda, ◀ ▶ salta 10 s, BACK sale. Arriba muestra quién del Círculo opinó sobre el título y al reproducir se registra en la actividad.
- ⚠ La especificación de Player de Totalplay (guía §19) sigue pendiente: este reproductor es una simulación para navegador, **no está validado en el STB** (sin MSE/EME/HLS/DASH ni DRM). Todo vive en `src/platform/totalplay/player.js` para reemplazarlo cuando exista la spec.

## Portadas de TMDB

Las portadas, fondos, títulos y sinopsis en español vienen de [TMDB](https://www.themoviedb.org). La llave **no se publica**: un script consulta TMDB en tu equipo y guarda solo las rutas de imagen en `src/services/tmdb.js` (las imágenes de `image.tmdb.org` no necesitan llave).

```bash
TMDB_API_KEY=tu_api_key node scripts/fetch-tmdb.mjs
```

También acepta el *Read Access Token* con `TMDB_TOKEN=...`. Si agregas o cambias títulos en `src/services/data.js`, vuelve a correrlo. Sin ese archivo la app usa portadas de color.

Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.

## Usarla en línea (GitHub Pages)

La app es estática (HTML/CSS/JS sin build), así que GitHub Pages la sirve tal cual:

1. Settings → Pages → *Build and deployment* → Source: **Deploy from a branch**.
2. Branch: **main**, carpeta **/ (root)** → Save.
3. En 1–2 minutos queda en `https://<usuario>.github.io/<repo>/`.

## Probarla localmente

```bash
python3 -m http.server 8080
```

Abre http://localhost:8080 (nunca con `file://`, regla R7).

## Controles

| Control remoto | Teclado (escritorio) | Acción |
|---|---|---|
| Flechas | Flechas | Mover el foco |
| OK | Enter | Activar |
| BACK (461) | Backspace | Regresar / cerrar modal |
| PLAY (415) | — | Reproducir el título enfocado / pausa |

En escritorio también funciona con mouse, y en el celular con toque.

## Estructura

```
index.html
css/styles.css                 Tokens del DS STB de Totalplay (1920×1080, escala con el viewport)
src/platform/totalplay/        Único lugar que toca sagem.* (device, keys, focus, lifecycle, network, debug)
                               player.js: video HTML5 simulado · drm.js: stub (spec TBD)
src/services/                  Catálogo, datos de TMDB (generado), estado colaborativo y simulador
scripts/fetch-tmdb.mjs         Genera src/services/tmdb.js con tu llave de TMDB (no se sube)
src/ui/screens.js              Plantillas de pantallas y modales
src/app/App.js                 Router, acciones, teclas, capa mouse/touch
```

## Pendientes (TBD de la guía de Totalplay)

- Player y DRM (guía §19, §20): reproducción HTML5 simulada, sin validar en STB; DRM no implementado.
- Entrada de texto (§21): se evita; reacciones predefinidas en lugar de comentarios libres.
- Colaboración real entre dispositivos: hoy es simulada por navegador; requiere backend.
- Archivos `.woff2` de Montserrat en `/fonts` (R1): hoy se usa la Montserrat instalada en el equipo y, si no existe, Arial.
