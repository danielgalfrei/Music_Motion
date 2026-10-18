const express = require('express');
const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const sources = require('./sources');
const { isRelevant } = require('./relevance');
const { translateItems } = require('./translate');
const { buildCharts, fillCovers } = require('./charts');

const PORT = process.env.PORT || 3000;
const REFRESH_MS = 15 * 60 * 1000;
const CHARTS_REFRESH_MS = 3 * 60 * 60 * 1000;
const MAX_AGE_DAYS = 14;

const parser = new Parser({
  timeout: 12000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MusicMotionBot/1.0)' }
});

// Categorías por palabras clave (ES + EN). Orden = prioridad.
const CATEGORIES = [
  ['Adquisiciones', /\b(acquir\w*|acquisition|merger|takeover|buys?|bought|stake|compra\w*|adquiere\w*|adquisici\w*|fusi[oó]n|participaci[oó]n)\b/i],
  ['Catálogos', /\b(catalog(ue)?s?|cat[aá]logos?|publishing rights|song rights|royalt(y|ies)|derechos? (musicales|editoriales)|master recordings?|masters?)\b/i],
  ['Sellos', /\b(labels?|records|sellos?|discogr[aá]fica\w*|imprint|universal music|sony music|warner music|ceo|president|appoint\w*|nombra\w*|director)\b/i],
  ['Fichajes', /\b(sign(s|ed|ing)?|signs? (a )?deal|joins roster|ficha\w*|firma (con|por)|nuevo (sello|manager)|management deal|roster)\b/i],
  ['Lanzamientos', /\b(album|[aá]lbum|single|new music|debut|release[sd]?|lanza\w*|nuevo (disco|tema|single)|tour|gira|estreno|estrena\w*|announce\w*)\b/i],
  ['Mercado', /\b(streaming|spotify|apple music|youtube|tiktok|revenue|ingresos|market|mercado|chart|ventas|riaa|ifpi|promusicae|ai\b|inteligencia artificial|report|informe|lawsuit|demanda)\b/i]
];

function categorize(text) {
  for (const [name, re] of CATEGORIES) if (re.test(text)) return name;
  return 'General';
}

const clean = (s = '') =>
  s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&#8217;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

let cache = { items: [], updatedAt: null, status: [] };
let chartsCache = null;

async function fetchSource(src) {
  const feed = await parser.parseURL(src.url);
  const cutoff = Date.now() - MAX_AGE_DAYS * 864e5;
  return (feed.items || [])
    .map(it => {
      const date = new Date(it.isoDate || it.pubDate || Date.now());
      let title = clean(it.title || '');
      let summary = clean(it.contentSnippet || it.summary || it.content || '').slice(0, 280);
      let source = src.name;
      if (src.kind === 'gnews') {
        // Google News: "Titular - Medio". La fuente citada es el medio real.
        const i = title.lastIndexOf(' - ');
        if (i > 0) { source = title.slice(i + 3).trim(); title = title.slice(0, i).trim(); }
        summary = ''; // el resumen de Google News solo repite el titular
      }
      return {
        title, summary, url: it.link, date: date.toISOString(),
        region: src.region, source, sourceType: src.kind === 'gnews' ? 'Medio (vía Google News)' : src.type,
        category: categorize(`${title} ${summary}`),
        _trusted: !!src.trusted
      };
    })
    .filter(it => it.title && it.url && new Date(it.date).getTime() >= cutoff)
    .filter(it => isRelevant(it, { trusted: it._trusted }))
    .map(({ _trusted, ...rest }) => rest);
}

function loadManual() {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'manual.json'), 'utf8'));
    return raw.filter(e => !e.disabled && e.title && e.url && e.source).map(e => ({
      summary: '', sourceType: 'Manual', date: new Date().toISOString(), region: 'es', ...e,
      category: e.category || categorize(`${e.title} ${e.summary || ''}`)
    }));
  } catch (e) {
    console.warn('manual.json:', e.message);
    return [];
  }
}

const normTitle = t => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

async function refresh() {
  const results = await Promise.allSettled(sources.map(fetchSource));
  const status = [];
  let items = [];
  results.forEach((r, i) => {
    const s = sources[i];
    if (r.status === 'fulfilled') {
      items = items.concat(r.value);
      status.push({ source: s.name, ok: true, count: r.value.length });
    } else {
      status.push({ source: s.name, ok: false, error: String(r.reason.message || r.reason).slice(0, 120) });
    }
  });
  items = items.concat(loadManual());

  // Quita duplicados por URL y por título, y ordena por fecha
  const seenUrl = new Set(), seenTitle = new Set();
  items = items
    .filter(it => {
      const nt = normTitle(it.title);
      if (seenUrl.has(it.url) || seenTitle.has(nt)) return false;
      seenUrl.add(it.url); seenTitle.add(nt);
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Conserva traducciones ya hechas en el ciclo anterior
  const prev = new Map(cache.items.map(i => [i.url, i]));
  items = items.map(it => (prev.get(it.url)?.translated ? prev.get(it.url) : it));

  cache = { items, updatedAt: new Date().toISOString(), status };
  console.log(`[${cache.updatedAt}] ${items.length} artículos · ${status.filter(s => s.ok).length}/${status.length} fuentes OK`);

  // Internacional: traducir al español en segundo plano (la web ya puede mostrar el original mientras tanto)
  translateItems(items.filter(i => i.region === 'int'))
    .then(() => console.log('Traducciones completadas'))
    .catch(e => console.warn('translate:', e.message));
}

async function refreshCharts() {
  try {
    chartsCache = await buildCharts();
    fillCovers(chartsCache).then(() => console.log('Portadas actualizadas')).catch(e => console.warn('covers:', e.message));
    console.log(`[${chartsCache.updatedAt}] listas de streaming actualizadas`);
  } catch (e) {
    console.warn('charts:', e.message);
  }
}

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/news', (req, res) => {
  const { region, category, q, source } = req.query;
  let items = cache.items;
  if (region) items = items.filter(i => i.region === region);
  if (category) items = items.filter(i => i.category === category);
  if (source) items = items.filter(i => i.source === source);
  if (q) {
    const n = q.toLowerCase();
    items = items.filter(i => `${i.title} ${i.originalTitle || ''} ${i.summary} ${i.source}`.toLowerCase().includes(n));
  }
  res.json({ updatedAt: cache.updatedAt, total: items.length, items: items.slice(0, 200) });
});

app.get('/api/charts', async (req, res) => {
  if (!chartsCache) await refreshCharts();
  chartsCache ? res.json(chartsCache) : res.status(503).json({ error: 'Listas no disponibles todavía' });
});

app.get('/api/status', (req, res) => res.json({ updatedAt: cache.updatedAt, sources: cache.status, chartsUpdatedAt: chartsCache?.updatedAt || null }));

app.post('/api/refresh', async (req, res) => {
  await refresh();
  res.json({ ok: true, updatedAt: cache.updatedAt });
});

app.listen(PORT, () => {
  console.log(`Music Motion en http://localhost:${PORT}`);
  refresh();
  refreshCharts();
  setInterval(refresh, REFRESH_MS);
  setInterval(refreshCharts, CHARTS_REFRESH_MS);
});
