// Traducción EN -> ES con caché en disco (data/translations.json).
// Usa el endpoint público de Google Translate; si falla, se queda el texto original.
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'data', 'translations.json');
let cache = {};
try { cache = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { /* primera ejecución */ }

async function translateText(text) {
  if (!text) return text;
  if (cache[text]) return cache[text];
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=' + encodeURIComponent(text);
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const out = data[0].map(s => s[0]).join('').trim();
      if (out) { cache[text] = out; return out; }
    } catch {
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  return text; // fallback: original
}

async function pool(tasks, size) {
  let i = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (i < tasks.length) await tasks[i++]();
  }));
}

/** Traduce in situ title/summary de los items y conserva el original en originalTitle. */
async function translateItems(items) {
  const todo = items.filter(it => !it.translated);
  await pool(todo.map(it => async () => {
    const [t, s] = await Promise.all([translateText(it.title), translateText(it.summary)]);
    if (t !== it.title) { it.originalTitle = it.title; it.title = t; it.summary = s; it.translated = true; }
  }), 4);
  try { fs.writeFileSync(FILE, JSON.stringify(cache)); } catch (e) { console.warn('translations.json:', e.message); }
}

module.exports = { translateItems };
