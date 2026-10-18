// Fuentes de noticias. region: 'es' | 'int'.
// trusted: true  -> medio 100% musical (filtro de relevancia más permisivo).
// trusted: false -> medio generalista: solo pasan artículos con términos musicales claros.
// kind: 'rss' (por defecto) | 'gnews' (búsqueda de Google News; la fuente real es el medio que publica).
// Si una URL falla, se ignora y el resto sigue funcionando.

const gnews = (q, name, trusted = false) => ({
  name, kind: 'gnews', region: 'es', type: 'Medio', trusted,
  url: `https://news.google.com/rss/search?q=${encodeURIComponent(q + ' when:7d')}&hl=es&gl=ES&ceid=ES:es`
});

module.exports = [
  // ---- Internacional ----
  { name: 'Billboard', region: 'int', type: 'Medio', trusted: false, url: 'https://www.billboard.com/feed/' },
  { name: 'Billboard Business', region: 'int', type: 'Medio', trusted: false, url: 'https://www.billboard.com/c/business/feed/' },
  { name: 'Pitchfork', region: 'int', type: 'Medio', trusted: true, url: 'https://pitchfork.com/feed/feed-news/rss' },
  { name: 'Music Business Worldwide', region: 'int', type: 'Medio', trusted: true, url: 'https://www.musicbusinessworldwide.com/feed/' },
  { name: 'Complete Music Update', region: 'int', type: 'Medio', trusted: true, url: 'https://completemusicupdate.com/feed/' },
  { name: 'Variety Music', region: 'int', type: 'Medio', trusted: false, url: 'https://variety.com/v/music/feed/' },
  { name: 'Rolling Stone', region: 'int', type: 'Medio', trusted: false, url: 'https://www.rollingstone.com/music/feed/' },

  // ---- España: medios con RSS propio ----
  { name: 'Industria Musical', region: 'es', type: 'Medio', trusted: true, url: 'https://industriamusical.com/feed/' },
  { name: 'Mondo Sonoro', region: 'es', type: 'Medio', trusted: true, url: 'https://www.mondosonoro.com/feed/' },
  { name: 'Efe Eme', region: 'es', type: 'Medio', trusted: true, url: 'https://www.efeeme.com/feed/' },
  { name: 'Jenesaispop', region: 'es', type: 'Medio', trusted: true, url: 'https://jenesaispop.com/feed' },
  { name: 'Muzikalia', region: 'es', type: 'Medio', trusted: true, url: 'https://www.muzikalia.com/feed/' },
  { name: '20minutos (Música)', region: 'es', type: 'Medio', trusted: false, url: 'https://www.20minutos.es/rss/musica/' },
  { name: 'ABC (Música)', region: 'es', type: 'Medio', trusted: false, url: 'https://www.abc.es/rss/2.0/cultura/musica/' },

  // ---- España: búsquedas temáticas en Google News (amplían cobertura con decenas de medios) ----
  gnews('"industria musical" España', 'GNews · Industria'),
  gnews('sello discográfico fichaje artista', 'GNews · Sellos y fichajes'),
  gnews('compra catálogo musical derechos editorial', 'GNews · Catálogos'),
  gnews('Promusicae ventas música streaming España', 'GNews · Mercado'),
  gnews('"Universal Music" OR "Sony Music" OR "Warner Music" España', 'GNews · Majors'),
  gnews('manager artista contrato discográfica', 'GNews · Management')
];
