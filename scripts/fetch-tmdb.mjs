#!/usr/bin/env node
/* Genera src/services/tmdb.js con portadas, fondos, título y sinopsis en español
   de TMDB para cada título del catálogo (src/services/data.js).

   La llave se lee de una variable de entorno y NO se guarda en el repo:
   el archivo generado solo contiene rutas de imagen (image.tmdb.org no pide llave).

   Uso (cualquiera de las dos):
     TMDB_API_KEY=tu_api_key_v3  node scripts/fetch-tmdb.mjs
     TMDB_TOKEN=tu_read_access_token_v4  node scripts/fetch-tmdb.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = process.env.TMDB_API_KEY;
const TOKEN = process.env.TMDB_TOKEN;
const LANG = process.env.TMDB_LANG || 'es-MX';

if (!KEY && !TOKEN) {
  console.error('Falta la llave. Ejecuta:  TMDB_API_KEY=xxxx node scripts/fetch-tmdb.mjs');
  process.exit(1);
}

// Cargar el catálogo tal como lo ve el navegador.
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'src/services/data.js'), 'utf8'), sandbox);
const content = sandbox.window.Data.content;

async function tmdb(endpoint, params = {}) {
  const url = new URL('https://api.themoviedb.org/3' + endpoint);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  if (KEY) url.searchParams.set('api_key', KEY);
  const res = await fetch(url, { headers: TOKEN ? { Authorization: 'Bearer ' + TOKEN, accept: 'application/json' } : {} });
  if (!res.ok) throw new Error(`TMDB ${res.status} en ${endpoint}: ${await res.text()}`);
  return res.json();
}

async function find(item) {
  let r = await tmdb('/search/movie', { query: item.q, year: item.year, language: LANG, include_adult: 'false' });
  if (!r.results.length) r = await tmdb('/search/movie', { query: item.q, language: LANG, include_adult: 'false' });
  return r.results[0] || null;
}

const out = {};
for (const item of content) {
  try {
    const m = await find(item);
    if (!m) { console.warn(`✗ ${item.id} sin resultados: ${item.q}`); continue; }
    out[item.id] = {
      id: m.id,
      title: m.title || null,
      overview: m.overview || null,
      poster: m.poster_path || null,
      backdrop: m.backdrop_path || null
    };
    console.log(`✓ ${item.id} ${item.q} → ${m.title} (${(m.release_date || '').slice(0, 4)}) #${m.id}`);
  } catch (e) {
    console.error(`✗ ${item.id}: ${e.message}`);
    if (/401/.test(e.message)) process.exit(1);
  }
}

const file = path.join(root, 'src/services/tmdb.js');
fs.writeFileSync(file,
  '/* GENERADO por scripts/fetch-tmdb.mjs — no editar a mano.\n' +
  '   Datos de TMDB (https://www.themoviedb.org). Sin llave de API. */\n' +
  'Data.applyTmdb(' + JSON.stringify(out, null, 2) + ');\n');
console.log(`\nListo: ${Object.keys(out).length}/${content.length} títulos → ${path.relative(root, file)}`);
