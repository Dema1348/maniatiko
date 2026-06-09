# maniatiko.dj

Landing page estática para el DJ **Maniatiko**. Estructura tipo template inspirada en `requiem-cl` (`/Users/edson/Desktop/requiem/requiem`): contenido dinámico desde `data.json`, render por JS, animaciones GSAP scroll, lightbox.

## Idioma — **EL SITIO ES EN INGLÉS**
Todo el copy, labels, meta tags, alt text, navegación, descripciones y body content se escriben en inglés. La conversación entre dev y asistente sigue en español, pero **cualquier texto que termine en `public/` va en inglés**.

**Configuración técnica:**
- `<html lang="en">` en `index.html`
- `site.locale: "en_US"` en `data.json`
- `og:locale` y `twitter:*` también en inglés

**Excepciones (se conservan en su idioma original):**
- Nombres propios: Santiago, Chile, Valparaíso
- Crews chilenos: Radikals Techno, Blackout, Circuito Integrado, 909 Freakz, Hollenraum, Teknokratas
- Venues, ciudades, nombres de personas (DJs del lineup)
- Títulos reales de tracks en SoundCloud que están en español: MANTRA, VIOLENCIA INTRAFAMILIAR, ALMA DISTORSIONADA, SINFONIA DEL MAL ETERNO, LAMENTOS, LA MELODÍA DE LA DESESPERACIÓN
- Handles de redes sociales (`@maniatiko.dj`, `maniatikx`)
- El motivo † (no es lenguaje, es recurso visual de marca)

**Formato de fechas:** US (`MM.DD.YYYY`), no europeo.

## Stack
- HTML5 / CSS3 / Vanilla JS (sin frameworks, sin build tools)
- GSAP 3.12.7 + ScrollTrigger (CDN) — animaciones de entrada al scroll
- Google Fonts — Space Grotesk (display/body) + Space Mono (mono)
- Firebase Hosting (proyecto `maniatiko-dj`)
- Deploy directo desde `public/`

## Identidad visual — "Hypnotic Neon Decay"
Inspirada en la escuela hard/hypnotic techno (SPFDJ, 999999999, Polygonia, label HEX).
Encaja con la bio de Maniatiko (Bochka pressure, hipnosis prolongada, ritualistic,
tensión mental + física, motivo †).

**Paleta fija** (no temable — decisión cerrada):
- `--bg`     `#050505` negro profundo
- `--text`   `#e8e8e8` hueso
- `--accent` `#f20100` rojo puro

**Tipos**: Space Grotesk (display/body) + Space Mono (mono)

**Efectos**:
- **Bochka Pulse**: línea de 2px bajo el nav que late a **165 BPM** (period 0.3636s) en accent. Heartbeat global de la página = "constant propulsion" de la bio.
- **TV Static**: canvas full-viewport (`#tvStatic`) con noise random a ~15fps, opacity 6%, mix-blend screen, z-index 9997. Decay analógico industrial.
- **Scanlines** permanentes en overlay (opacity 0.7, mix-blend overlay).
- **Grain overlay** SVG estático al 3.5% opacity, z-index 9999.
- **Glitch animation** en hover sobre `.hero-title`, `.section-title` y `.setlist-row .setlist-num` (chromatic aberration entre rojo y cyan `#00d9ff`).

**Traducciones de tensión sónica por sección** (visuales, no audio):
- **Marquee**: incluye palabras Cyrillic (БОЧКА, ТЕМНОТА, ПРЕССУРА) para autenticidad rusa Bochka.
- **Origin**: tension gauge — barra vertical accent al lado de cada chapter creciendo en grosor + glow (I=fina, II=media, III=full). Build visual de la bio.
- **Live**: countdown live "Next ritual in Xd · HH:MM:SS" arriba de los rituals, actualizado cada segundo. Tensión real-time.
- **Productions**: hover sobre row → ampRatio de la wave interpola 0.42 → 0.72 (visual "louder").
- **Aftermath**: image animation `memoryDecay` (filter blur/contrast pulsando 14s loop) + anecdote con text-shadow desplazado = ghost memory.
- **Reverb**: text-shadow stack en quotes con offsets crecientes y opacity decreciente = reverberación visual.
- **Press Kit**: 4 cards (Bio · Photo · Video · **Tech Rider**). Tech Rider es la spec sheet industrial.

## Diseño por sección (cada una transmite la bio)
Cada sección traduce un concepto de la bio en lenguaje visual. Orden actual del sitio:

1. **Hero** — backdrop con triple radial gradient rojo desvanecido (profundidad atmosférica) + 4 stamps en las esquinas: TL `† Techno` (genre tag), TR `† 165 BPM` (pulsa sincronizado con el Bochka, period 0.3636s), BL coordenadas `33.4°S · 70.6°W`, BR `Santiago · CL`. Title `Maniatiko` con char-split: cada letra es un span animado en GSAP (rise + rotateX + stagger). Phrase `DJ † Producer † Industrial † Hard Kicks` en mono 700 grande. CTA `Listen to tracks` → `#mixes`.
2. **Marquee** (divider) — 2 lanes scrolleando en direcciones opuestas con palabras del mundo de Maniatiko (Bochka Pressure, Hypnotic, Tectonic, Hard Kicks + crews chilenos). Loop infinito = "constant propulsion". Sin section wrapper.
3. **I · Origin** — capítulos numerados I/II/III con alineación alternada izq/der + línea vertical izquierda con dots de accent. Sección biográfica (no manifiesto declarativo — la bio narra de dónde viene y cómo construye su sonido). Después de los chapters: **Artist Dossier** — tabla key/value con Origin · Base · Sound · Crews · Stage w/ · Platforms · Booking. Estructura editorial pro.
4. **II · Live** — split automático por fecha actual:
   - **Upcoming** como `rituals` blocks: día gigante (5rem accent) + month/year stacked + chapter I/II/III + venue/lineup + status badge `ON SALE`.
   - **Archive** como tabla densa: Date | Venue | City. Hover row ilumina venue en accent.
5. **III · Productions** — setlist numerado (01, 02, 03...). **Cada row tiene su propia wave inline** (canvas pequeño dentro del row, debajo del título y descripción). La wave es la "firma sonora" del track: freq/amp/speed/offset derivados por hash del título. Hover sobre el row ilumina la wave (opacity 0.55 → 1) y aplica chromatic glitch al número. Cada producción lleva su huella visual única.
6. **IV · Aftermath** — filas editoriales alternadas (izq/der). Cada entrada: foto B&W tratada con corner badge de fecha + chapter num + venue + city + anecdote italic con border-left de accent. "What remained" después de cada set.
7. **V · Crews** — section type `roster` con 2 columnas — `Collectives` (crews chilenos) + `Shared Stage` (DJs con los que ha tocado: Aldes, Kask4r, 19.85, Mary B, Likikon, Bonek, Lurtz) — "expanding identity".
8. **VI · Reverb** — 3 cards con quotes en italic + source. "What lingers" — lo que se dijo y sigue resonando.
9. **VII · Press Kit** — 3 cards descargables (Bio TXT · Press Photo · Promo Video) con CTA Download. URLs `#` por ahora, se reemplazan con Drive links cuando haya assets.
10. **Footer** — brand grande, epitafio `† The ritual doesn't end. It only changes form †`, socials (IG, SC, TikTok, Facebook), copyright dinámico y credit `Made with love by @_dema1348` → `https://www.instagram.com/_dema1348/`.

**Inspiraciones explícitas** (adaptadas, no copiadas — paleta y tipos propios):
- **De requiem-cl**: estructura general, chapters numerados, lightbox, GSAP ScrollTrigger reveals, motivo †.
- **De dupouymusic.com**: Marquee, Artist Dossier, Archive table densa, Press Kit con 3 cards descargables.

Si en el futuro se quiere ajustar el accent, se cambia `--accent` y `--accent-rgb`
en `:root` de `styles.css` — todo el sitio responde por CSS vars.

## Estructura
```
public/
├── index.html          — shell HTML con nav, hero, <main id="sectionsRoot">, lightbox, footer
├── data.json           — FUENTE ÚNICA de contenido (site, hero, nav, sections, socials, gigs, mixes, gallery, crews, press, footer)
├── css/styles.css      — design system con tokens en :root (paleta placeholder)
├── js/main.js          — fetch data.json → render → GSAP reveals → lightbox
├── favicon.svg         — placeholder "M" sobre fondo negro
├── robots.txt
└── sitemap.xml
firebase.json           — rewrites a index.html + cache headers para assets
.firebaserc             — project ID: maniatiko-dj
```

## Contenido dinámico (data.json)
Todo el contenido vive en `public/data.json`. Para editar/agregar, solo se modifica este archivo.

### Estructura
- **site** — `{ name, tagline, description, url, locale, ogImage, themeColor }`
- **analytics** — `{ enabled, firebase: { ... } }` (placeholder, no inicializado todavía)
- **nav[]** — `{ label, href }` — opcional. Si está **vacío `[]`** o ausente, el nav se **auto-deriva desde `sections`**: toma cada sección con `title` y `id`, salta las que tienen `hideFromNav: true` (y las que no tienen título, como `marquee`). Cuando se agrega una sección nueva, el nav se actualiza solo. Si querés un orden custom o etiquetas distintas, llená este array y se usa como override.
- **hero** — `{ title, phrase, stamps: { tl, tr, bl, br }, cta: { label, href } }`. Stamps son las 4 esquinas (top-left, top-right, bottom-left, bottom-right). `tr` recibe el pulso BPM automáticamente vía CSS.
- **sections[]** — `{ id, type, title, subtitle?, source?, items?, body?, left?, right? }`
  - `type`: `text` | `chapters` | `marquee` | `gigs` | `mixes` | `tracks` | `gallery` | `memories` | `crews` | `roster` | `press` | `presskit`
  - **marquee**: divider tipográfico full-bleed sin section wrapper. Field `lanes`: array de strings, cada uno scrollea en dirección alterna.
  - **chapters** soporta `dossier: { title, rows: [{ key, value }] }` que se renderiza después de los capítulos (Artist Dossier).
  - `source`: nombre de array top-level del JSON (ej. `"gigs"`, `"mixes"`) — el render busca los items ahí
  - `items`: alternativa, items inline (usado por `chapters`: array de strings con cada párrafo)
  - `left` / `right` (solo para `roster`): `{ label, source }` — define las 2 columnas (collectives + shared stage)
- **socials[]** — `{ label, url }` — links del footer
- **gigs[]** — `{ date (MM.DD.YYYY), city, venue, lineup[], tickets? }`. JS particiona en upcoming/past por fecha actual.
- **mixes[]** — `{ platform, title, description, url }`. Usado por Tracks PRO (canvas + setlist).
- **tracks[]**, **gallery[]** — actualmente vacías (legado por si se necesitan a futuro).
- **memories[]** — `{ date, venue, city, anecdote, image }`. Foto opcional; si no hay, placeholder con gradiente accent.
- **crews[]** — `{ name, link, logo? }`. Logo opcional; sin logo → chip de texto.
- **lineup[]** — `{ name }`. DJs con los que ha compartido escenario.
- **press[]** — `{ quote, source }`.
- **presskit[]** — `{ kind, title, description, cta, url }`. URLs placeholder `#` hasta tener assets reales.
- **footer** — `{ epitaph, credit: { label, href, prefix } }`. `prefix` permite personalizar el texto antes del nombre (default "Made by", actual "Made with love by").

### Flujo de render (main.js)
1. `fetch("data.json")` al `DOMContentLoaded`
2. `applySite()` — title, theme-color
3. `renderNav()` — links a partir de `data.nav`
4. `renderHero()` — overline, título, frase, CTA
5. `renderSections()` — itera `data.sections`, despacha por `type` a renderers específicos
6. `renderFooter()` — brand, epitafio, socials, credit
7. `initReveals()` — GSAP ScrollTrigger para todos los `[data-reveal]`

### Para agregar contenido
1. Editar `public/data.json` (agregar items a las colecciones)
2. Agregar imágenes en `public/img/`
3. `firebase deploy --only hosting`

## Estado actual
- Scaffold completo con 10 piezas (hero + marquee + 7 secciones + footer)
- Identidad visual cerrada: rojo `#f20100` + Bochka pulse 140bpm + glitch en hover + scanlines permanentes + motivo †
- **Datos reales**: handles sociales (IG, SC, TikTok, Facebook), 6 tracks reales con URLs SoundCloud, bio en inglés desde el bio largo del dev, crews chilenos reales, lineup real de DJs B2B, dossier completo
- **Mock que falta reemplazar**:
  - Gigs (3 futuros + 5 pasados — usan crews/venues reales pero fechas inventadas)
  - Memories (3 entradas con anecdotes poéticas genéricas + picsum placeholders)
  - Press quotes (3 quotes mock)
  - Press Kit URLs (todos `#`, esperan Drive links reales)
  - `img/og-image.jpg` (1200x630) y favicon definitivo

## Pendientes
- Reemplazar mock content cuando llegue contenido real
- Crear `img/og-image.jpg` y favicon definitivo
- Conectar Press Kit a Drive links reales (Bio TXT, fotos, video promo)
- Configurar Firebase Analytics si se quiere (credentials en `data.analytics.firebase` + `enabled: true`)
- Deploy: `firebase login` → `firebase deploy --only hosting`

## Ideas de requiem que NO se trajeron (decisión consciente)
Por el nivel "esenciales" elegido, queda fuera por ahora (se puede sumar después si se quiere):
- Preloader cinemático con variantes
- Cursor personalizado (dot + ring)
- Particles canvas reactivo al scroll (sistema por fases)
- Lenis smooth scroll
- Ritual progresivo (localStorage para visitantes recurrentes)
- Atmósfera por hora del día
- Frases rotativas en hero/footer/breath
- Slider infinito de logos
- Modal de detalle de eventos pasados
