#!/usr/bin/env node
/* Genera v/<id>.html: una página pública por título con etiquetas Open Graph
   (portada de TMDB, título y descripción) para que WhatsApp muestre la vista
   previa al compartir. Correr después de scripts/fetch-tmdb.mjs:

     node scripts/build-share-pages.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sandbox = { window: {} };
sandbox.Data = undefined;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'src/config/environment.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'src/services/data.js'), 'utf8'), sandbox);
sandbox.Data = sandbox.window.Data;
vm.runInContext(fs.readFileSync(path.join(root, 'src/services/tmdb.js'), 'utf8'), sandbox);

const Data = sandbox.window.Data;
const BASE = sandbox.window.ENV.publicUrl;
const IMG = 'https://image.tmdb.org/t/p/';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const short = (s, n = 180) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s);

const outDir = path.join(root, 'v');
fs.mkdirSync(outDir, { recursive: true });

for (const c of Data.content) {
  const url = `${BASE}v/${c.id}.html`;
  const app = `${BASE}?open=${c.id}`;
  const poster = c.poster ? IMG + 'w500' + c.poster : '';
  const desc = short(c.desc);
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.title)} · Círculo</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="video.movie">
<meta property="og:site_name" content="Círculo">
<meta property="og:title" content="${esc(c.title)} (${c.year})">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
${poster ? `<meta property="og:image" content="${poster}">
<meta property="og:image:width" content="500">
<meta property="og:image:height" content="750">` : ''}
<meta name="twitter:card" content="summary_large_image">
<style>
  :root { color-scheme: dark; }
  body { margin: 0; background: #000003; color: #fff; font-family: 'Montserrat', Arial, Helvetica, sans-serif; }
  main { max-width: 34rem; margin: 0 auto; padding: 24px 16px 40px; }
  img { width: 100%; max-width: 20rem; border-radius: 16px; display: block; margin: 0 auto 20px; }
  .eyebrow { color: #F06C00; font-weight: 600; text-transform: uppercase; font-size: 14px; }
  h1 { font-size: 28px; line-height: 1.2; margin: 6px 0 4px; }
  .meta { color: #BDC0C3; font-size: 15px; }
  p { line-height: 1.5; }
  a.btn { display: inline-block; background: #F06C00; color: #fff; text-decoration: none; font-weight: 600; padding: 14px 24px; border-radius: 999px; margin-top: 8px; }
  small { display: block; color: #BDC0C3; margin-top: 28px; font-size: 12px; }
</style>
</head>
<body>
<main>
  ${poster ? `<img src="${poster}" alt="Portada de ${esc(c.title)}">` : ''}
  <div class="eyebrow">Te lo recomiendan desde Círculo</div>
  <h1>${esc(c.title)}</h1>
  <div class="meta">${esc(c.genre)} · ${c.year} · ${esc(c.dur)}</div>
  <p>${esc(c.desc)}</p>
  <a class="btn" href="${app}">Verla en Círculo</a>
  <small>Película de dominio público (Internet Archive). Portada y sinopsis de TMDB; este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.</small>
</main>
</body>
</html>
`;
  fs.writeFileSync(path.join(outDir, `${c.id}.html`), html);
}
console.log(`Listo: ${Data.content.length} páginas en v/`);
