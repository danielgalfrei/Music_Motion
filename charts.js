// Listas de streaming: datos diarios de Spotify recopilados por kworb.net.
//  - Top canciones: streams diarios por canción (lista diaria de Spotify del país).
//  - Top artistas (streaming): suma de streams diarios de todas sus canciones en esa lista.
//  - Top artistas (oyentes): oyentes mensuales de Spotify (global) de cada artista.
const BASE = 'https://kworb.net/spotify/';
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; MusicMotionBot/1.0)' };

const fs = require('fs');
const path = require('path');
const COVERS_FILE = path.join(__dirname, 'data', 'covers.json');
let covers = {};
try { covers = JSON.parse(fs.readFileSync(COVERS_FILE, 'utf8')); } catch { /* primera ejecución */ }

// Elementos de las listas que muestran portada: [tipo, lista]
function coverTargets(charts) {
  const out = [];
  for (const r of ['es', 'int']) {
    charts[r].songs.forEach(x => out.push(['track', x.trackId, x]));
    charts[r].streamingArtists.forEach(x => out.push(['artist', x.id, x]));
    charts[r].topArtists.forEach(x => out.push(['artist', x.id, x]));
  }
  return out;
}
function attachCovers(charts) {
  for (const [type, id, obj] of coverTargets(charts)) obj.cover = covers[type + ':' + id] || null;
}

// Portadas vía oEmbed público de Spotify (sin clave). Se cachean en data/covers.json.
async function fillCovers(charts) {
  const missing = [...new Map(coverTargets(charts).filter(([t, id]) => !covers[t + ':' + id]).map(([t, id]) => [t + ':' + id, [t, id]])).values()];
  let i = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (i < missing.length) {
      const [type, id] = missing[i++];
      try {
        const res = await fetch('https://open.spotify.com/oembed?url=' + encodeURIComponent('https://open.spotify.com/' + type + '/' + id), { signal: AbortSignal.timeout(10000) });
        if (res.ok) covers[type + ':' + id] = (await res.json()).thumbnail_url || null;
      } catch { /* se reintenta en el próximo ciclo */ }
    }
  }));
  try { fs.writeFileSync(COVERS_FILE, JSON.stringify(covers)); } catch (e) { console.warn('covers.json:', e.message); }
  attachCovers(charts);
}

const num = s => Number(String(s).replace(/[^\d]/g, '')) || 0;
const strip = s => s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

async function get(url) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

function parseChart(html) {
  const body = html.split('<tbody>')[1] || '';
  return body.split('<tr>').slice(1).map(row => {
    const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => m[1]);
    if (tds.length < 9) return null;
    const div = tds[2];
    const artists = [...div.matchAll(/artist\/(\w+)\.html">([^<]+)</g)].map(m => ({ id: m[1], name: strip(m[2]) }));
    const track = div.match(/track\/(\w+)\.html">([^<]+)</);
    if (!track || !artists.length) return null;
    return {
      pos: num(tds[0]),
      move: strip(tds[1]),
      title: strip(track[2]),
      trackId: track[1],
      artists,
      artistText: artists.map(a => a.name).join(', '),
      weeks: num(tds[3]),
      streams: num(tds[6])
    };
  }).filter(Boolean);
}

function artistsFromSongs(songs) {
  const map = new Map();
  for (const s of songs) {
    for (const a of s.artists) {
      const e = map.get(a.id) || { id: a.id, name: a.name, streams: 0, songs: 0 };
      e.streams += s.streams; e.songs += 1;
      map.set(a.id, e);
    }
  }
  return [...map.values()].sort((a, b) => b.streams - a.streams).map((a, i) => ({ ...a, pos: i + 1 }));
}

function parseListeners(html) {
  const body = html.split('<tbody>')[1] || html;
  return body.split('<tr>').slice(1).map(row => {
    const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => m[1]);
    const a = (tds[1] || '').match(/artist\/(\w+)_songs\.html">([^<]+)</);
    if (!a) return null;
    return { id: a[1], name: strip(a[2]), listeners: num(tds[2]), change: Number((tds[3] || '0').replace(/[^\d-]/g, '')) || 0 };
  }).filter(Boolean);
}

async function buildCharts() {
  const [esD, glD, esW, glW, listHtml] = await Promise.all([
    get(BASE + 'country/es_daily.html'),
    get(BASE + 'country/global_daily.html'),
    get(BASE + 'country/es_weekly.html'),
    get(BASE + 'country/global_weekly.html'),
    get(BASE + 'listeners.html')
  ]);
  const listeners = parseListeners(listHtml);
  const byId = new Map(listeners.map(l => [l.id, l.listeners]));
  const withListeners = list => list.map(a => ({ ...a, listeners: byId.get(a.id) || null }));

  const build = (daily, weekly) => {
    const dSongs = parseChart(daily), wSongs = parseChart(weekly);
    return {
      songs: dSongs.slice(0, 50),                                         // Top streaming > canciones (streams de ayer)
      streamingArtists: artistsFromSongs(dSongs).slice(0, 30),            // Top streaming > artistas (streams de ayer)
      weeklySongs: wSongs.slice(0, 50),
      topArtists: withListeners(artistsFromSongs(wSongs).slice(0, 40))    // Top artistas (streams de la semana + oyentes)
    };
  };

  const charts = {
    updatedAt: new Date().toISOString(),
    source: { name: 'Spotify (vía kworb.net)', url: BASE },
    es: build(esD, esW),
    int: build(glD, glW)
  };
  attachCovers(charts);
  return charts;
}

module.exports = { buildCharts, fillCovers };
