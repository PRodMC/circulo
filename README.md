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

No hay backend: el estado vive en `localStorage` del navegador (con respaldo en memoria si no existe). La reproducción de video es un placeholder, porque la especificación de Player/DRM de Totalplay sigue pendiente.

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
| PLAY (415) | — | Abrir reproducción del título enfocado |

En escritorio también funciona con mouse, y en el celular con toque.

## Estructura

```
index.html
css/styles.css                 Tokens del DS STB de Totalplay (1920×1080, escala con el viewport)
src/platform/totalplay/        Único lugar que toca sagem.* (device, keys, focus, lifecycle, network, debug)
                               player.js y drm.js son stubs: spec TBD
src/services/                  Datos simulados, estado colaborativo (store) y simulador de actividad
src/ui/screens.js              Plantillas de pantallas y modales
src/app/App.js                 Router, acciones, teclas, capa mouse/touch
```

## Pendientes (TBD de la guía de Totalplay)

- Player y DRM (guía §19, §20): no implementados, solo placeholder.
- Entrada de texto (§21): se evita; reacciones predefinidas en lugar de comentarios libres.
- Colaboración real entre dispositivos: hoy es simulada por navegador; requiere backend.
- Archivos `.woff2` de Montserrat en `/fonts` (R1): hoy se usa la Montserrat instalada en el equipo y, si no existe, Arial.
