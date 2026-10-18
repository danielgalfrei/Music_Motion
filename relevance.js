// Filtro de relevancia: deja pasar solo noticias de la industria musical.
// REGLA DEL PROYECTO (ver MEMORIA.md): cualquier cambio futuro debe mantener fuera
// las noticias de economía general, política, cine/TV y otros sectores.

const MUSIC = new RegExp(
  '\\b(' + [
    // EN
    'music', 'musical', 'songs?', 'albums?', 'singles?', 'singers?', 'songwriters?', 'artists?', 'rappers?',
    'bands?', 'record(s| label| deal| company)?', 'labels?', 'streaming', 'spotify', 'apple music', 'deezer',
    'soundcloud', 'concerts?', 'tours?', 'festivals?', 'grammys?', 'brit awards?', 'billboard', 'charts?',
    'catalog(ue)?s?', 'publishing', 'publishers?', 'royalt(y|ies)', 'vinyl', 'djs?', 'producers?', 'a&r',
    'hip-hop', 'rap', 'pop star', 'rock', 'tracks?', 'ep', 'remix', 'lineup', 'setlist', 'songbook',
    'universal music', 'sony music', 'warner music', 'umg', 'wmg', 'bmg', 'kobalt', 'live nation', 'riaa', 'ifpi',
    'mechanicals?', 'masters', 'discography', 'debut', 'headline[rs]?', 'k-pop', 'reggaeton', 'latin',
    // ES
    'm[uú]sica', 'musicales?', 'canci[oó]n', 'canciones', 'discos?', '[aá]lbum(es)?', 'cantantes?', 'cantautor(a|es)?',
    'artistas?', 'sellos?', 'discogr[aá]ficas?', 'conciertos?', 'giras?', 'festivales?', 'raperos?', 'trap',
    'grupos?', 'bandas?', 'videoclips?', 'cat[aá]logos?', 'editoriales? musicales?', 'derechos de autor',
    'productor(a|es)?', 'promusicae', 'sgae', 'latin grammy', 'reguet[oó]n', 'flamenco', 'orquesta', 'dj'
  ].join('|') + ')\\b', 'i');

// Economía / otros sectores: si aparece en el título y no hay término musical, se descarta.
const OFF_TOPIC = new RegExp(
  '\\b(' + [
    'stocks?', 'wall street', 'nasdaq', 's&p 500', 'dow jones', 'inflation', 'gdp', 'tariffs?', 'interest rates?',
    'federal reserve', 'crypto', 'bitcoin', 'oil prices?', 'real estate', 'mortgage', 'ipo', 'quarterly earnings',
    'box office', 'netflix', 'disney', 'hbo', 'nfl', 'nba', 'mlb', 'election', 'president trump', 'congress', 'senate',
    'bolsa', 'ibex', 'inflaci[oó]n', 'pib', 'aranceles', 'hipoteca', 'euribor', 'petr[oó]leo', 'criptomonedas?',
    'elecciones', 'gobierno', 'sanchez', 's[aá]nchez', 'f[uú]tbol', 'liga', 'taquilla', 'tribunal supremo'
  ].join('|') + ')\\b', 'i');

// Temas ajenos que se descartan siempre, aunque el titular mencione música (cine/TV, deporte, bolsa).
const STRONG_OFF = /\b(biopic|cine|pel[ií]culas?|netflix|box office|taquilla|f[uú]tbol|ibex|wall street|nasdaq|serie de tv)\b/i;

// Cuántos términos musicales distintos aparecen en el texto
function musicHits(text) {
  const re = new RegExp(MUSIC.source, 'gi');
  return new Set((text.match(re) || []).map(s => s.toLowerCase())).size;
}

/**
 * @param {{title:string, summary:string}} item
 * @param {{trusted?:boolean}} src  trusted = medio 100% musical
 */
function isRelevant(item, src = {}) {
  if (STRONG_OFF.test(item.title)) return false;
  const inTitle = MUSIC.test(item.title);
  if (OFF_TOPIC.test(item.title) && !inTitle) return false;
  if (src.trusted) return true;
  if (inTitle) return true;
  return musicHits(item.summary) >= 2;
}

module.exports = { isRelevant };
