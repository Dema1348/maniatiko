# maniatiko.dj

Landing page estática para el DJ **Maniatiko**. Hosting en Firebase (`maniatiko-dj.web.app`). Inspirada en `requiem-cl` (`/Users/edson/Desktop/requiem/requiem`): contenido dinámico desde `data.json`, render por JS, animaciones GSAP scroll, lightbox. Evolucionó hacia un **Ritual Engine** con shader WebGL + audio sintético opt-in.

## Idioma — EL SITIO ES EN INGLÉS

Todo el copy, labels, meta tags, alt text, navegación, descripciones y body content se escriben en inglés. La conversación entre dev y asistente sigue en español, pero **cualquier texto que termine en `public/` va en inglés**.

**Excepciones (se conservan en su idioma original):**

- Nombres propios: Santiago, Chile, Valparaíso
- Crews chilenos: Radikals Techno, Blackout, Circuito Integrado, 909 Freakz, Hollenraum, Teknokratas
- Venues, ciudades, nombres de personas (DJs del lineup)
- Títulos reales de tracks en SoundCloud (español): MANTRA, VIOLENCIA INTRAFAMILIAR, ALMA DISTORSIONADA, SINFONIA DEL MAL ETERNO, LAMENTOS, LA MELODÍA DE LA DESESPERACIÓN
- Handles de redes sociales (`@maniatiko.dj`, `maniatikx`)
- El motivo † (no es lenguaje, es recurso visual de marca)

**Formato de fechas:** US (`MM.DD.YYYY`), no europeo.

## Stack

- HTML5 / CSS3 / Vanilla JS (sin frameworks, sin build tools)
- **GSAP 3.12.7 + ScrollTrigger** (CDN) — animaciones de entrada al scroll + ambient hypnotic waves + kick jolts
- **Lenis 1.1.20** (CDN) — smooth scroll sincronizado al GSAP ticker
- **Three.js 0.160.0** (CDN) — shader WebGL fragment del hero (rings + kick + tectonic noise sincronizado al BPM)
- **Tone.js 14.8.49** (CDN) — sintetiza el kick bochka procedural (MembraneSynth) opt-in al click de "Engage ritual"
- **SoundCloud Widget API** — mini-player sticky + audio inline en Productions
- **Firebase JS SDK 11.7.1** (CDN, module) — Analytics (`G-5CXDNBQMN6`)
- Google Fonts — **Elms Sans** (logo, variable) + **Space Grotesk** (display/body) + **Space Mono** (mono)
- Firebase Hosting (proyecto `maniatiko-dj`)
- Deploy directo desde `public/` con `firebase deploy --only hosting`

## Identidad visual — "Hypnotic Neon Decay"

Inspirada en la escuela hard/hypnotic techno (SPFDJ, 999999999, Polygonia, label HEX). Encaja con la bio (Bochka pressure, hipnosis prolongada, ritualistic, tensión mental + física, motivo †).

**Paleta fija** (no temable):

- `--bg` `#050505` negro profundo
- `--text` `#e8e8e8` hueso
- `--accent` `#f20100` rojo puro
- `--accent-glow` `rgba(242, 1, 0, 0.5)`

**Tipos:**

- **Logo** (`--font-logo`): Elms Sans variable. Light + tracked wide:
  - hero-title: weight 200, letter-spacing 0.22em (mobile 0.12em)
  - nav-logo: weight 300, letter-spacing 0.18em
  - footer-brand: weight 300, letter-spacing 0.2em
- **Display** (`--font-display`): Space Grotesk — section titles, card titles, ritual venues, setlist titles
- **Body** (`--font-body`): Space Grotesk
- **Mono** (`--font-mono`): Space Mono — labels, BPM, fechas, stamps, dossier, terminal feel

**BPM canónico: 170 BPM (período 0.3529s)** — sincroniza Bochka pulse line, cursor ring, BPM stamp, glyph pulse, beat lines, hypnotic dividers, kick visual. Todo respira al mismo tempo.

**Efectos atmosféricos globales:**

- **Bochka Pulse**: línea de 2px bajo el nav latiendo en accent a 170 BPM. Heartbeat global.
- **TV Static**: canvas full-viewport (`#tvStatic`) con noise random ~15fps, opacity 6%, mix-blend screen, z-index 9997
- **Scanlines** permanentes en overlay (opacity 0.7, mix-blend overlay, z-index 9998)
- **Grain overlay** SVG estático al 3.5% opacity, z-index 9999
- **Boot loader** 1.1s con counter 140→170 BPM (siempre se muestra, no skipea por session)
- **Custom cursor** dot + ring pulsando a 170 BPM (solo desktop con mouse fino, mix-blend difference)

## Ritual Engine (el corazón del hero)

El hero NO es decorativo. Tiene un **botón "Engage ritual"** que arranca un kick sintético real a 170 BPM. Una vez engaged, todo el sitio se intensifica + el scroll-depth modula la intensidad.

### Componentes del hero

1. **Shader WebGL Three.js fullscreen** (`canvas.hero-shader`): fragment shader que combina:
   - Sub-bass radial bloom (sincronizado al kick)
   - 5 anillos concéntricos emanando del centro (waterfall en fase)
   - Kick flash en el centro (sharp attack + exp decay)
   - Tectonic FBM noise (4 octavas) lento — "placas geológicas"
   - Vignette circular
   - Uniforms: `uTime`, `uResolution`, `uAccent`, `uIntensity` (lerps de 0 off → 1 engaged → 1.5 engaged-deep)
2. **Veil** — vignette radial + linear scrim para legibilidad
3. **Ghosts** — palabras flotantes con opacity baja, derivadas dinámicamente de `data.mixes.map(m => m.title)` — los tracks reales del artista flotan como mantra visual. Ciclo 12s con delays negativos.
4. **BPM readout** (esquina sup derecha) — mono accent latiendo al BPM
5. **Hero-core central:**
   - `MANIATIKO` — Elms Sans light, char-split, ambient hypnotic wave loop (y: -5, opacity 0.85, sine.inOut, yoyo, stagger 0.08)
   - **Role**: "Producer & DJ" mono, letter-spacing 0.42em, char-splitted, text-dim (off) → accent + glow + 0.58em (engaged)
   - **Engage button** estilo "double-rule pulse" — sin border, sin bg, solo texto + 2 líneas accent finas latiendo en contrapunto al BPM. Hover: color → accent + letter-spacing expand
6. **Scroll-hint** — línea pulsante 2.4s ease-in-out

### Audio (Tone.js)

- Click en `Engage ritual` → `await Tone.start()` (requiere user gesture, válido)
- `Tone.MembraneSynth` (pitchDecay 0.06, octaves 6, sine osc) → `Tone.Filter(420, "lowpass")` → `Tone.Gain` → `Tone.Destination`
- `Tone.Loop` triggerea kick C1 cada `"4n"` a 170 BPM
- Cada kick dispatch evento `ritual:kick` (custom event) → todos los efectos audio-reactive escuchan
- Gain modulado por scroll-depth: 0.45 (top) → 0.85 (bottom)

### Estado global engaged

`body.ritual-engaged` activa:

- Glow extra en bochka pulse line, scanlines opacity 1, TV static 0.1, grain 0.055
- Hypnotic dividers opacity 0.9, marquee right lane 0.85
- Ghosts del hero usan `ghostFadeEngaged` keyframe (peak 0.32, blur 0.4px, drop-shadow accent)
- Overlay `body.ritual-engaged::after` — radial gradient accent que crece con `--ritual-depth`
- Engage button: bg accent fill + color bg + letter-spacing 0.58em + halo glow

### Scroll-depth modulation

`scroll` event → `updateRitualDepth()` calcula `scrollY / (docHeight - vpHeight)` (0..1) → setea CSS var `--ritual-depth` + Tone.js gain rampTo + shader uIntensity target.

CSS rules usan `calc(... + var(--ritual-depth) * ...)` para que glows, opacities, box-shadows escalen con la profundidad. Cuanto más bajo, más adentro estás.

### Kick jolts (audio-reactive cuando engaged)

Listener global a `ritual:kick`. En cada beat, dispara micro-animations GSAP en:

1. **Hero title MANIATIKO** chars — cascade scale-punch (1 → 1.06, stagger 0.012s)
2. **Hero role** "Producer & DJ" chars — cascade scale-punch (1 → 1.10, stagger 0.015s)
3. **Section titles** — micro-shake X (1.5px, yoyo)
4. **Hypnotic dividers** circles — scale-punch unísono (1.55 → 1) que reemplaza el waterfall CSS mientras dure engaged. `clearProps: "transform"` restaura el waterfall al desengage.
5. **Ritual day numbers** (gigs upcoming) — jolt Y -3px
6. **Booking CTA arrow** → — vibra +5px X
7. **Marquee lanes** — empujadas en su dirección de scroll (+/- 7px) — "el bochka empuja el mantra"
8. **Kick-flash global** — todos los elementos visibles dentro de `[section-title, epk-stat-num, ritual-day, setlist-num, featured-chip, dossier-key, presskit-kind, archive-venue]` reciben un text-shadow accent flash de 0.32s en cada beat (via IntersectionObserver para performance)

### Mode off (sin engaged)

El hero queda calmado: shader boost 0.4 (en vez de 1.3+), ghosts peak 0.055. El resto del sitio mantiene sus defaults atmosféricos (scanlines 0.7, bochka pulse normal, etc) — el "calmado" del off **solo aplica al hero**, no al resto.

## Diseño por sección

Orden actual (auto-derivado del nav desde `data.sections`):

1. **Hero** (Ritual Engine, ver arriba)
2. **Marquee** (divider) — 2 lanes **mantra**: lane top = "HYPNOTIC · HYPNOTIC · …" text-dim (90s loop), lane bottom = "BOCHKA · BOCHKA · …" accent diluido (110s loop, dirección opuesta). Cuando engaged, cada kick empuja las lanes 7px en su dir. Sin section wrapper.
3. **I · Origin** — `chapters` (3 párrafos numerados I/II/III con alineación alternada + tension gauge accent vertical) + **Artist Dossier** (key/value table: Origin · Base · Sound · BPM · Crews · Stage w/ · Platforms · Booking).
4. **II · Live** — `gigs`:
   - **EPK stats banner** (4 columnas mono): Rituals played · Productions · Platforms · BPM peak
   - **Countdown** al próximo gig (live HH:MM:SS update cada segundo)
   - **Upcoming** como rituals blocks (día gigante 5rem accent + month/year + venue/lineup + status `ON SALE`)
   - **Archive** como tabla densa (Date | Venue | City), hover ilumina venue
5. **III · Productions** — `mixes` como setlist numerado (01, 02…). Cada row tiene **botón play** + canvas con wave inline (firma sonora por hash del título, ResizeObserver para re-medir). Click play → SoundCloud Widget API carga el track en mini-player sticky bottom. Hover/playing ilumina el wave + número con hypnotic glow (sin chromatic, escala 1.04). Playing: pulse animation 1.45s sincronizado con hero hypnotic wave.
6. **IV · Aftermath** — `memories` editorial alternated rows. Foto B&W (filter grayscale + brightness + contrast + memoryDecay 14s loop) + corner badge fecha + chapter num + venue + city + anecdote italic con border-left accent.
7. **V · Reverb** — `press` quotes con text-shadow stack = reverberación visual.
8. **Hosted by** — `featured` chips horizontales con los venues/crews que lo han hosteado.
9. **VI · Press Kit** — `presskit` 4 cards (Bio TXT · Press Photo · Promo Video · Tech Rider) con CTA Download.
10. **Booking** — `booking-card` (sin form, sin backend): bloque destacado con mailto pre-armado (subject `[BOOKING] Event · Date · City`) + lista numerada "Include in your brief" + alt DM secundario al IG.
11. **Footer** — brand grande, epitafio, socials, copyright, credit. **Sin booking block** (se removió — duplicaba la sección Booking).

**Hypnotic dividers** entre secciones (excepto donde ya hay marquee) — 3 dots concéntricos SVG en waterfall pulsando al BPM. Insertados dinámicamente por JS en `insertHypnoticDividers()`.

## Estructura

```
public/
├── index.html          shell + meta SEO + JSON-LD + Firebase Analytics + <noscript> SEO fallback
├── data.json           FUENTE ÚNICA de contenido
├── css/styles.css      design system con tokens en :root
├── js/main.js          fetch → render → init (shader, audio, jolts, depth, mini-player, etc.)
├── favicon.svg         placeholder "M" sobre fondo negro
├── robots.txt          allow all + sitemap
├── sitemap.xml         con lastmod + image:image entries
└── img/                dj1.jpg, dj2.jpeg, dj3.jpeg (fotos reales para Aftermath + og:image)
firebase.json           rewrites a index.html + cache headers
.firebaserc             project ID: maniatiko-dj
```

## Contenido dinámico (data.json)

Todo el contenido vive en `public/data.json`. Para editar/agregar, **solo se modifica este archivo** (excepto los assets visuales que van en `public/img/`).

### Estructura principal

- **site** — `{ name, tagline, description, url, locale, ogImage, themeColor }`
- **analytics** — `{ enabled, firebase: { ... } }` (currently **enabled: true**, conectado al proyecto)
- **nav[]** — opcional override. Vacío `[]` → auto-derivado desde `sections` (saltando `marquee` y `hideFromNav: true`)
- **hero** — `{ title, role, bpm, engage: { labelOff, labelOn } }`. Los ghosts se derivan automáticamente de `mixes`
- **sections[]** — `{ id, type, title, subtitle?, source?, items?, card?, dossier?, lanes?, form?, hideFromNav? }`
  - `type`: `text` | `chapters` | `marquee` | `gigs` | `mixes` | `tracks` | `gallery` | `memories` | `crews` | `roster` | `press` | `featured` | `presskit` | `booking` | `booking-card`
  - **marquee.lanes**: array de strings (palabras únicas para mantra; se repiten 20× con separador `·`)
  - **chapters** soporta `dossier: { title, rows: [{ key, value }] }`
  - **booking-card.card**: `{ intro, email, emailLabel, emailSubject, brief: [...], alt: { label, handle, url } }`
- **socials[]** — `{ label, url }`. Orden: música primero (Bandcamp · Spotify · SoundCloud · YouTube), luego redes (IG · TikTok · Facebook)
- **gigs[]** — `{ date (MM.DD.YYYY), city, venue, lineup?, tickets? }`. JS particiona en upcoming/past
- **mixes[]** — `{ platform, title, description, url }`. SoundCloud Widget API consume `url` directamente
- **memories[]** — `{ date, venue, city, anecdote, image }`. Foto opcional
- **featured[]** — `{ name, link? }`. Venues/crews que lo han hosteado
- **press[]** — `{ quote, source }`
- **presskit[]** — `{ kind, title, description, cta, url }`
- **footer** — `{ epitaph, credit: { label, href, prefix } }` (sin booking block)

### Flujo de render (main.js)

1. `initBootLoader()` + `initLenis()` + `initCustomCursor()` (preboot)
2. `fetch(data.json)` → `renderNav()` → `renderHero(data.hero, data.mixes)` → `renderSections()` → `renderFooter()`
3. `initHypnoticTitles()` (char-split en todos los section-titles) + `insertHypnoticDividers()` (3 dots entre secciones)
4. `initHeroShader()` (Three.js) + `initRitualAudio()` (Tone.js bind al engage button) + `initRitualDepthTracking()` (scroll modula audio + visual)
5. `animateHeroIn()` (delay 1300ms, reveals del hero + ambient wave loop)
6. `initReveals()` (GSAP ScrollTrigger para todos los `[data-reveal]`)
7. `initTvStatic()` + `initNextRitualCountdown()` + `initBookingForm()` + `initMiniPlayer(data)` + `initAudioReactive()` + `initMarqueeJolt()` + `initKickJolts()` + `startHypnoticWaves()` + `initSetlistWaves(data.mixes)`
8. `hideBootLoader()` (espera al BOOT_MIN_DURATION 1100ms)

## SEO — reglas vivas

**El sitio depende de JS para mostrar contenido visualmente** pero el HTML inicial tiene structured data + `<noscript>` fallback para crawlers. Mantener ambos sincronizados.

### Checklist SEO (estado actual)

- ✅ `<html lang="en">`, charset, viewport
- ✅ Title rico con keywords + geo ("DJ & Producer · Santiago, Chile")
- ✅ Meta description (160 chars) con Bochka, BPM, booking
- ✅ Meta keywords (Maniatiko, DJ Chile, hypnotic techno, Lo Prado, etc.)
- ✅ Geo tags (`geo.region CL-RM`, `geo.position -33.45;-70.73`, `ICBM`)
- ✅ Robots directives (max-image-preview:large, max-snippet:-1)
- ✅ Canonical
- ✅ Open Graph completo (type: profile, image apuntando a dj1.jpg con dimensions declared)
- ✅ Twitter Card summary_large_image
- ✅ `music:musician` namespace
- ✅ JSON-LD `@graph` con **MusicGroup + WebSite + 6 MusicRecording + MusicEvent** (Schema.org)
- ✅ `<noscript>` fallback en `<main>` con bio + tracks + gigs + socials con `rel="me"`
- ✅ Sitemap.xml con lastmod + image:image entries de las 3 fotos
- ✅ robots.txt allow + sitemap reference
- ✅ Firebase Analytics conectado (`G-5CXDNBQMN6`)

### Regla CRÍTICA — actualizar SEO al cambiar contenido

**Cada vez que se agregue, quite o cambie información en `data.json` (tracks, gigs, bio, socials, etc.) hay que sincronizar:**

1. **JSON-LD en `index.html`** — si se agrega/quita un track de `mixes`, agregar/quitar el `MusicRecording` correspondiente en el `@graph`. Si cambia un gig upcoming, actualizar el `MusicEvent`. Si cambia bio, actualizar `description` del `MusicGroup`. Si se suma/saca una plataforma social, actualizar `sameAs[]`.
2. **`<noscript>` fallback en `index.html`** — duplicar el cambio textual (lista de tracks, gigs upcoming, socials).
3. **`sitemap.xml`** — actualizar `lastmod` con la fecha del cambio.
4. **Meta description/keywords** — si cambia el género, el sonido, o un dato relevante, actualizar.

Esta sincronización es manual; el JS no la hace automáticamente porque los crawlers leen el HTML inicial sin esperar a JS.

**Para cualquier task que toque `data.json`, verificar si requiere update SEO al final.**

## Pendientes (resto)

- Reemplazar mock content cuando llegue contenido real:
  - Memories anecdotes (las fotos sí son reales)
  - Press quotes (3 mock — esperan reviews reales)
  - Press Kit URLs (todos `#`, esperan Drive links reales)
- og-image dedicado de 1200x630 (actualmente apunta a dj1.jpg que es la foto general)
- Favicon definitivo (actualmente SVG placeholder "M")
- Web3Forms u otro service si se quiere form de booking real (actualmente Booking Card sin backend)

## Inspiraciones

- **De requiem-cl**: estructura general, char-split, lightbox, GSAP ScrollTrigger reveals, motivo †, boot loader, custom cursor, Lenis, Firebase Analytics pattern
- **De dupouymusic.com**: Marquee, Artist Dossier, Archive table densa, Press Kit cards
- **De SPFDJ / 999999999 / Polygonia / HEX**: shader BPM-locked, char-split + ambient wave, minimalismo, mantra repetition
- **Conceptual de la bio del artista**: el shader es el bochka literal; el button "Engage" hace audible la "constant propulsion"; los ghosts son los tracks como mantras flotantes; los kick jolts son la "propulsion" empujando el sitio
