# Memoria del proyecto: Music Motion

**Última actualización:** 18 de octubre de 2026
**Estado:** prototipo funcional (v0.3), ejecutable en local

---

## 0. Normas del proyecto (leer antes de cualquier cambio)

> **NORMA 1 — Relevancia estricta.** Cada vez que se haga un cambio en el proyecto (nuevas fuentes, nuevas secciones, cambios en el filtrado, la clasificación o el código en general) hay que tener muy presente que **solo deben aparecer noticias directamente relacionadas con la industria musical**. En la sección Internacional se colaban artículos de economía y de otros sectores (bolsa, cine, deporte, política…); eso no debe volver a ocurrir. En concreto:
> - Toda fuente nueva debe pasar por el filtro de relevancia ([relevance.js](relevance.js)). No se añade ninguna fuente que lo evite.
> - Si se añade una fuente generalista (no exclusivamente musical), se marca como `trusted: false` en [sources.js](sources.js), para que solo pasen artículos con términos musicales claros.
> - Si se modifican las listas de términos del filtro, comprobar después que no entran noticias de otros sectores ni se pierden noticias musicales legítimas.
> - Tras cualquier cambio, revisar a mano una muestra de artículos de ambas secciones antes de darlo por bueno.
>
> **NORMA 2 — Fuente siempre citada.** Todo artículo debe mostrar su fuente y el enlace al original.
>
> **NORMA 3 — Sin copiar contenido completo.** Solo título, resumen corto y enlace.
>
> **NORMA 4 — Actualizar esta memoria** con cada cambio relevante.

---

## 1. Resumen ejecutivo

Music Motion es una aplicación web para profesionales de la industria musical (ejecutivos de discográficas, A&Rs y managers). Reúne en un solo lugar la actualidad del sector (adquisiciones, ventas de catálogo, movimientos de sellos, fichajes y lanzamientos) y las listas de streaming más importantes.

Tiene tres secciones principales, cada una dividida en **España** e **Internacional**:

1. **Noticias**: con filtros por categoría y fuente citada en cada artículo.
2. **Top streaming**: con las subcategorías **Top canciones** y **Top artistas**.
3. **Top artistas**: ranking semanal de artistas.

## 2. Objetivo y público

**Objetivo:** que un profesional del sector se ponga al día cada día en pocos minutos, sin visitar una decena de webs.

**Público:** ejecutivos de sellos, A&Rs y managers.

## 3. Cómo funciona

### 3.1 Noticias
1. Cada 15 minutos (y al pulsar "Actualizar") el servidor descarga los canales RSS de las fuentes configuradas.
2. De cada artículo guarda título, resumen corto (máx. 280 caracteres), fecha, enlace y fuente.
3. **Filtro de relevancia** ([relevance.js](relevance.js)): descarta lo que no es música (ver norma 1).
4. Descarta artículos de más de 14 días y elimina duplicados por enlace y por título.
5. Clasifica cada artículo (Adquisiciones, Catálogos, Sellos, Fichajes, Lanzamientos, Mercado, General) por palabras clave.
6. **Traducción:** los artículos de Internacional (en inglés) se traducen automáticamente al español, título y resumen ([translate.js](translate.js)). Se marcan como "Traducido del inglés" y conservan el título original. Las traducciones se guardan en `data/translations.json` para no repetirlas.
7. Añade las entradas manuales de `data/manual.json`.

### 3.2 Listas de streaming
Los datos proceden de las listas de Spotify recopiladas por **kworb.net** ([charts.js](charts.js)), que se actualizan cada 3 horas:

| Sección | Qué muestra | Datos |
|---|---|---|
| Top streaming > Top canciones | 50 canciones más escuchadas | Streams del último día, lista de España / lista global |
| Top streaming > Top artistas | 30 artistas | Suma de streams del último día de todas sus canciones en la lista |
| Top artistas | 40 artistas | Streams de la última semana (lista semanal), canciones en lista y oyentes mensuales |

Cada tabla indica la fuente y enlaza a las listas originales.

**Importante:** "Top artistas España" son los artistas más escuchados *en el mercado español* (incluye artistas latinos e internacionales que triunfan en España), no solo artistas de nacionalidad española. Se intentó filtrar por nacionalidad con MusicBrainz, pero los datos eran incompletos e inestables, y se descartó.

**Portadas y reproductor:** junto a cada canción y artista se muestra su portada (foto del artista en los rankings de artistas) y un botón de reproducir. Las portadas se obtienen del servicio público oEmbed de Spotify y se guardan en `data/covers.json`. Al pulsar ▶ se abre un reproductor fijo en la parte inferior (Spotify iFrame API) que sigue sonando mientras se navega. Sin sesión iniciada en Spotify en el navegador suena un fragmento de 30 segundos; con sesión (cuenta Premium), la canción completa. En artistas suena una selección de sus temas.

### 3.3 Interfaz
- **Nombre:** Music Motion.
- **Modo día / noche:** botón arriba a la izquierda. Respeta la preferencia del sistema la primera vez y recuerda la elección.
- **Lupa de búsqueda:** arriba a la derecha. En Noticias busca en España e Internacional a la vez (nombres de artistas, sellos, palabras clave, también en el título original en inglés). En las listas filtra por artista o canción.

## 4. Fuentes

**Internacional (7):** Billboard, Billboard Business, Pitchfork, Music Business Worldwide, Complete Music Update, Variety Music, Rolling Stone.

**España, medios con RSS propio (7):** Industria Musical, Mondo Sonoro, Efe Eme, Jenesaispop, Muzikalia, 20minutos (Música), ABC (Música).

**España, búsquedas en Google News (6):** consultas temáticas (industria musical, sellos y fichajes, catálogos, mercado/Promusicae, majors, management). Amplían la cobertura con decenas de medios; **la fuente citada es el medio real** que publica cada noticia (COPE, La Razón, Infobae, ESCplus, KISS FM, etc.).

**Descartadas:** Hypebot, Rolling Stone España y Los40 (sin canal RSS válido), Europa Press Cultura (demasiado generalista), El País Música (canal desactualizado), Cultura Inquieta (sin contenido musical relevante).

**Listas:** Spotify vía kworb.net.

## 5. Redes sociales (Instagram, TikTok, YouTube)

No hay acceso gratuito y fiable a las publicaciones de terceros, y extraerlas automáticamente incumple las condiciones de uso de las plataformas. Por eso, de momento se cargan a mano en `data/manual.json` (título, resumen, enlace y fuente "Instagram @…").

Alternativas futuras: servicio de pago que convierta Instagram en RSS, API oficial de Meta (solo cuentas propias) o un formulario web para introducir publicaciones.

## 6. Estructura técnica

| Archivo | Función |
|---|---|
| `Iniciar.bat` | Arranca la app con doble clic y abre el navegador |
| `server.js` | Servidor: noticias, API, actualización periódica |
| `sources.js` | Lista de fuentes de noticias |
| `relevance.js` | Filtro de relevancia (norma 1) |
| `translate.js` | Traducción EN → ES con caché |
| `charts.js` | Listas de streaming (Spotify vía kworb.net) |
| `data/manual.json` | Entradas manuales de redes sociales |
| `data/covers.json` | Caché de portadas (se genera sola) |
| `data/translations.json` | Caché de traducciones (se genera sola) |
| `public/index.html` | Interfaz web |

**API:** `GET /api/news` (region, category, source, q), `GET /api/charts`, `GET /api/status`, `POST /api/refresh`.

**Tecnología:** Node.js, Express, rss-parser. Sin base de datos.

## 7. Cómo usarla

1. Doble clic en `Iniciar.bat`.
2. Se abre http://localhost:3000. Si está vacía, esperar 10-20 segundos (la primera vez, la traducción puede tardar un poco más; mientras tanto se ve el original en inglés).
3. Elegir sección y región, filtrar, buscar con la lupa.
4. Para cerrar, cerrar la ventana negra.

## 8. Historial de cambios

**v0.3 (18/10/2026)**
- Portadas y botón de reproducir en Top streaming y Top artistas, con reproductor fijo inferior.

**v0.2 (18/10/2026)**
- Nombre cambiado a Music Motion.
- Nuevas secciones Top streaming (canciones y artistas) y Top artistas, con España e Internacional.
- Mayor cobertura de España: 5 medios nuevos y 6 búsquedas temáticas en Google News.
- Filtro de relevancia para eliminar noticias de economía y otros sectores (norma 1).
- Lupa de búsqueda, modo día/noche y traducción al español de Internacional.
- Eliminación de duplicados también por título.

**v0.1 (18/10/2026)**
- Primera versión: noticias de España e Internacional con fuente citada.

## 9. Limitaciones conocidas

- **Clasificación por palabras clave:** a veces asigna mal la categoría; muchos artículos caen en "General".
- **Filtro de relevancia heurístico:** puede dejar pasar algún artículo dudoso o descartar uno válido. Revisar con regularidad (norma 1).
- **Traducción automática:** usa un servicio público no oficial de Google Translate; puede fallar o ser limitado en volumen, y en ese caso se muestra el original. La calidad es buena pero no perfecta (nombres propios, jerga del sector).
- **Listas dependientes de kworb.net:** un sitio de terceros; si cambia su formato o desaparece, las listas dejarían de funcionar. Los datos son de Spotify, no oficiales de la plataforma, y no incluyen otras plataformas (Apple Music, YouTube) ni las listas oficiales de Promusicae.
- **Reproductor y portadas dependen de Spotify:** si Spotify cambia su servicio oEmbed o su reproductor, dejarían de funcionar. La primera vez, las portadas tardan unos segundos en aparecer.
- **Redes sociales sin carga automática** (ver 5).
- **Solo local:** funciona en el ordenador donde se ejecuta.
- **Sin histórico:** al reiniciar se pierden artículos (las traducciones sí se conservan).
- **Enlaces de Google News:** las noticias vía Google News enlazan a través de un redireccionamiento de Google hacia el medio original.

## 10. Consideraciones legales

- Solo se muestran título, resumen corto y enlace, con la fuente citada.
- Los medios y servicios usados (RSS, Google News, Google Translate, kworb.net) tienen condiciones de uso propias; conviene revisarlas antes de un uso comercial o público. Obtener los datos de listas de un sitio de terceros sin acuerdo no es adecuado para un producto de pago.
- Para una versión pública convendría pasar a fuentes con licencia o API oficial (Spotify, Promusicae, servicios de traducción de pago) y añadir una nota legal.

## 11. Hoja de ruta propuesta

**Corto plazo**
- Formulario web para cargar publicaciones de Instagram, TikTok y YouTube.
- Mejorar la clasificación y el filtro de relevancia con IA.
- Añadir listas de Promusicae y de otras plataformas.

**Medio plazo**
- Base de datos con histórico.
- Resumen diario ("briefing") por email o WhatsApp y alertas por sello, artista o tema.
- Publicación online con acceso por usuario.

**Largo plazo**
- Agrupar la misma noticia de varias fuentes.
- Directorio de sellos, editoras, managers y fichajes.
- Cronología de operaciones (M&A y catálogos).

## 12. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Un canal RSS o kworb.net cambia o desaparece | Pérdida de cobertura | Revisar `/api/status`; varias fuentes por tema |
| Entran noticias de otros sectores | Pérdida de credibilidad | Norma 1; revisión de muestras tras cada cambio |
| Traducción pública bloqueada | Internacional en inglés | Caché; pasar a un servicio de traducción con clave |
| Cuestiones de derechos / términos de uso | Legal | Solo extractos y enlace; revisar términos |

## 13. Conclusión

Music Motion cubre ya noticias y rankings de streaming para España e Internacional, con fuentes citadas y verificables. Los siguientes pasos de más valor son resolver la entrada de contenido de redes sociales, usar fuentes oficiales con licencia para las listas y publicar la herramienta para el equipo.
