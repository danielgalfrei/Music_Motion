// Genera la versión estática para Github Pages en la carpeta dist/:
// copia la web y guarda las noticias y listas actuales como archivos JSON.
const fs = require('fs');
const path = require('path');
const { build } = require('./server');

(async () => {
  const { news, charts } = await build();
  const failed = news.status.filter(s => !s.ok);
  failed.forEach(s => console.warn(`Fuente caída: ${s.source} (${s.error})`));
  if (!news.items.length || !charts) {
    console.error('No se han obtenido datos suficientes; no se publica.');
    process.exit(1);
  }
  const dist = path.join(__dirname, 'dist');
  fs.rmSync(dist, { recursive: true, force: true });
  fs.cpSync(path.join(__dirname, 'public'), dist, { recursive: true });
  fs.mkdirSync(path.join(dist, 'api'));
  fs.writeFileSync(path.join(dist, 'api', 'news.json'), JSON.stringify({ updatedAt: news.updatedAt, items: news.items }));
  fs.writeFileSync(path.join(dist, 'api', 'charts.json'), JSON.stringify(charts));
  fs.writeFileSync(path.join(dist, '.nojekyll'), '');
  console.log(`dist/ listo: ${news.items.length} artículos, listas ${charts.updatedAt}`);
  process.exit(0);
})();
