// ============================================================
// maniatiko.dj — main.js
// Carga data.json → renderiza nav, hero, secciones y footer.
// Inicializa GSAP ScrollTrigger reveals y lightbox.
// ============================================================

const DATA_URL = "data.json";

// --------------------------------------------------------------
// Boot
// --------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  initBootLoader();
  initLenis();
  initCustomCursor();
  initYear();
  initNav();
  initLightbox();

  const data = await loadData();
  if (!data) {
    hideBootLoader();
    return;
  }

  applySite(data.site);
  renderNav(data);
  renderHero(data.hero);
  renderSections(data.sections, data);
  renderFooter(data);

  animateHeroIn();
  initReveals();
  initTvStatic();
  initNextRitualCountdown();
  initBookingForm();
  initMiniPlayer(data);

  if (document.querySelector(".setlist-wave")) {
    initSetlistWaves(data.mixes || []);
  }

  hideBootLoader();
});

// --------------------------------------------------------------
// Boot loader — splash 1.1s con counter 150 → 170 BPM
// --------------------------------------------------------------
let __bootLoaderStart = 0;
const BOOT_MIN_DURATION = 1100;

function initBootLoader() {
  const loader = document.getElementById("bootLoader");
  if (!loader) return;

  __bootLoaderStart = performance.now();

  const num = document.getElementById("bootLoaderNum");
  const fill = document.getElementById("bootLoaderFill");
  if (fill) requestAnimationFrame(() => (fill.style.width = "100%"));

  if (num) {
    const startN = 140;
    const endN = 170;
    function step(now) {
      const t = Math.min((now - __bootLoaderStart) / BOOT_MIN_DURATION, 1);
      num.textContent = Math.round(startN + (endN - startN) * t);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
}

function hideBootLoader() {
  const loader = document.getElementById("bootLoader");
  if (!loader || loader.classList.contains("is-hidden")) return;
  const elapsed = performance.now() - __bootLoaderStart;
  const wait = Math.max(0, BOOT_MIN_DURATION - elapsed);
  setTimeout(() => {
    loader.classList.add("is-hidden");
    setTimeout(() => loader.remove(), 600);
  }, wait);
}

// --------------------------------------------------------------
// Lenis smooth scroll — sincronizado con GSAP ticker
// --------------------------------------------------------------
function initLenis() {
  if (typeof Lenis === "undefined") return;
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
  });
  window.__lenis = lenis;

  if (typeof gsap !== "undefined") {
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    (function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    })(0);
  }

  // Anchor links pasan por Lenis para mantener el feel suave
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || href === "#" || href.length < 2) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -64 });
  });
}

// --------------------------------------------------------------
// Custom cursor — dot + ring 170 BPM (solo desktop con mouse fino)
// --------------------------------------------------------------
function initCustomCursor() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const root = document.getElementById("cursorRoot");
  if (!root) return;

  let tx = window.innerWidth / 2,
    ty = window.innerHeight / 2;
  let cx = tx,
    cy = ty;

  document.addEventListener("mousemove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
  });

  (function tick() {
    cx += (tx - cx) * 0.22;
    cy += (ty - cy) * 0.22;
    root.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(tick);
  })();

  const HOVER_SEL =
    "a, button, [data-track-index], .setlist-row, .ritual, .archive-table tbody tr, .crew-link, .roster-link, .memory, .presskit-card, .reverb-card, .featured-chip, input, textarea, .mini-player-bar";
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest && e.target.closest(HOVER_SEL))
      root.classList.add("is-hover");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest && e.target.closest(HOVER_SEL))
      root.classList.remove("is-hover");
  });
}

// --------------------------------------------------------------
// Mini-player — SoundCloud Widget API + sticky bar
// Bridge entre setlist play buttons y el iframe oculto.
// --------------------------------------------------------------
function initMiniPlayer(data) {
  const player = document.getElementById("miniPlayer");
  const iframe = document.getElementById("scWidget");
  if (!player || !iframe || typeof SC === "undefined") return;

  const tracks = data.mixes || [];
  if (!tracks.length) return;

  // Pre-load el iframe con el primer track (sin autoplay) — el Widget API
  // necesita un src válido para bindear; luego usamos widget.load() para cambiar.
  const initSrc = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
    tracks[0].url,
  )}&auto_play=false&visual=false&show_artwork=false&show_comments=false&show_playcount=false&show_user=false&hide_related=true`;
  if (!iframe.src) iframe.src = initSrc;

  const widget = SC.Widget(iframe);

  const $title = document.getElementById("miniPlayerTitle");
  const $time = document.getElementById("miniPlayerTime");
  const $prog = document.getElementById("miniPlayerProgress");
  const $tog = document.getElementById("miniPlayerToggle");
  const $clo = document.getElementById("miniPlayerClose");
  const $bar = player.querySelector(".mini-player-bar");

  let currentRow = null;
  let isPlaying = false;
  let duration = 0;

  const fmt = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  widget.bind(SC.Widget.Events.READY, () => {
    widget.bind(SC.Widget.Events.PLAY_PROGRESS, (e) => {
      $prog.style.width = `${(e.relativePosition || 0) * 100}%`;
      $time.textContent = fmt(e.currentPosition || 0);
    });
    widget.bind(SC.Widget.Events.PLAY, () => {
      isPlaying = true;
      player.classList.add("is-playing");
      currentRow && currentRow.classList.add("is-playing");
      widget.getDuration((d) => (duration = d || 0));
    });
    widget.bind(SC.Widget.Events.PAUSE, () => {
      isPlaying = false;
      player.classList.remove("is-playing");
      currentRow && currentRow.classList.remove("is-playing");
    });
    widget.bind(SC.Widget.Events.FINISH, () => {
      isPlaying = false;
      player.classList.remove("is-playing");
      currentRow && currentRow.classList.remove("is-playing");
    });
  });

  function open() {
    player.classList.add("is-open");
    document.body.classList.add("has-miniplayer");
    player.setAttribute("aria-hidden", "false");
  }
  function closeMP() {
    widget.pause();
    player.classList.remove("is-open", "is-playing");
    document.body.classList.remove("has-miniplayer");
    player.setAttribute("aria-hidden", "true");
    currentRow && currentRow.classList.remove("is-playing");
    currentRow = null;
    isPlaying = false;
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".setlist-play");
    if (!btn) return;
    e.preventDefault();
    const row = btn.closest(".setlist-row");
    if (!row) return;
    const idx = parseInt(row.dataset.trackIndex, 10);
    const track = tracks[idx];
    if (!track || !track.url) return;

    if (currentRow === row) {
      isPlaying ? widget.pause() : widget.play();
      return;
    }
    currentRow && currentRow.classList.remove("is-playing");
    currentRow = row;
    $title.textContent = track.title || "—";
    $prog.style.width = "0%";
    $time.textContent = "0:00";
    open();
    widget.load(track.url, {
      auto_play: true,
      visual: false,
      show_artwork: false,
      show_comments: false,
      show_playcount: false,
      show_user: false,
      hide_related: true,
    });
  });

  $tog.addEventListener("click", () =>
    isPlaying ? widget.pause() : widget.play(),
  );
  $clo.addEventListener("click", closeMP);

  $bar.addEventListener("click", (e) => {
    const rect = $bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    widget.getDuration((d) => {
      duration = d || duration;
      if (duration) widget.seekTo(duration * pct);
    });
  });
}

// --------------------------------------------------------------
// Booking form — captura submit, abre mailto estructurado
// --------------------------------------------------------------
function initBookingForm() {
  const form = document.getElementById("bookingForm");
  if (!form) return;
  const status = document.getElementById("bookingStatus");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    for (const el of form.querySelectorAll("[required]")) {
      if (!el.value.trim()) {
        const label = form.querySelector(`label[for="${el.id}"]`);
        status.textContent = `† ${label ? label.textContent : el.name} is required.`;
        status.classList.remove("is-ok");
        el.focus();
        return;
      }
    }

    const fd = new FormData(form);
    const to = form.dataset.to;
    const prefix = form.dataset.subject || "[BOOKING]";
    const subject =
      `${prefix} ${fd.get("event") || ""} · ${fd.get("city") || ""} · ${fd.get("date") || ""}`.trim();
    const body = [
      `Name: ${fd.get("name") || ""}`,
      `Email: ${fd.get("email") || ""}`,
      `Event / Venue: ${fd.get("event") || ""}`,
      `Date: ${fd.get("date") || ""}`,
      `City: ${fd.get("city") || ""}`,
      `Offer: ${fd.get("offer") || "—"}`,
      ``,
      `Brief:`,
      fd.get("message") || "—",
    ].join("\n");

    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.textContent = "† Opening your email client…";
    status.classList.add("is-ok");
  });
}

// --------------------------------------------------------------
// Countdown al próximo ritual — live updating cada segundo
// --------------------------------------------------------------
function initNextRitualCountdown() {
  const el = document.getElementById("nextRitualTimer");
  if (!el) return;
  const wrap = el.closest(".next-ritual");
  const target = wrap?.dataset.target;
  if (!target) return;

  const parts = target.split(".").map(Number);
  if (parts.length !== 3) return;
  const [mm, dd, yyyy] = parts;
  // Gig empieza a las 23:59 del día. Usamos esa hora como target.
  const targetTime = new Date(yyyy, mm - 1, dd, 23, 59, 59).getTime();

  function update() {
    const diff = targetTime - Date.now();
    if (diff <= 0) {
      el.textContent = "Now invoking";
      return;
    }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    const pad = (n) => String(n).padStart(2, "0");
    el.textContent = `${days}d · ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  update();
  setInterval(update, 1000);
}

// --------------------------------------------------------------
// TV static overlay — canvas con noise random a baja FPS
// --------------------------------------------------------------
function initTvStatic() {
  const canvas = document.getElementById("tvStatic");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // Render a la mitad de resolución para performance (luego CSS lo estira)
  let w = 0,
    h = 0;
  function resize() {
    w = Math.floor(window.innerWidth / 2);
    h = Math.floor(window.innerHeight / 2);
    canvas.width = w;
    canvas.height = h;
  }
  resize();
  window.addEventListener("resize", resize);

  let last = 0;
  function tick(t) {
    if (t - last > 70) {
      // Generar buffer aleatorio en escala de grises
      const img = ctx.createImageData(w, h);
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      last = t;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

async function loadData() {
  try {
    const res = await fetch(DATA_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch (err) {
    console.error("[maniatiko] no se pudo cargar data.json", err);
    return null;
  }
}

// --------------------------------------------------------------
// Site meta
// --------------------------------------------------------------
function applySite(site) {
  if (!site) return;
  if (site.name) {
    document.title = site.tagline
      ? `${site.name} — ${site.tagline}`
      : site.name;
  }
  if (site.themeColor) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", site.themeColor);
  }
}

// --------------------------------------------------------------
// Nav
// --------------------------------------------------------------
function initNav() {
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");

  window.addEventListener("scroll", () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 20);
  });

  toggle?.addEventListener("click", () => {
    toggle.classList.toggle("is-open");
    links.classList.toggle("is-open");
  });

  links?.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      toggle.classList.remove("is-open");
      links.classList.remove("is-open");
    }
  });
}

function renderNav(data) {
  const root = document.getElementById("navLinks");
  if (!root) return;

  // Si data.nav está definido y no vacío, se usa como override manual.
  // Si no, se auto-deriva desde data.sections — saltando secciones sin título
  // (marquees) y las marcadas con hideFromNav: true.
  let items = Array.isArray(data.nav) && data.nav.length ? data.nav : null;
  if (!items) {
    items = (data.sections || [])
      .filter((s) => s.title && !s.hideFromNav)
      .map((s) => ({ label: s.title, href: `#${s.id}` }));
  }

  root.innerHTML = items
    .map((it) => `<a href="${it.href}">${escapeHtml(it.label)}</a>`)
    .join("");
}

// --------------------------------------------------------------
// Hero
// --------------------------------------------------------------
function renderHero(hero) {
  if (!hero) return;
  const $title = document.getElementById("heroTitle");
  const $phrase = document.getElementById("heroPhrase");
  const $cta = document.getElementById("heroCta");
  const $logo = document.getElementById("navLogo");

  if (hero.title) {
    // Char-split: cada letra es un span para animación de entrada
    const chars = hero.title
      .split("")
      .map((c) =>
        c === " "
          ? `<span class="hero-char hero-char--space">&nbsp;</span>`
          : `<span class="hero-char">${escapeHtml(c)}</span>`,
      )
      .join("");
    $title.innerHTML = chars;
    if ($logo) $logo.textContent = hero.title;
  }
  if (hero.phrase) $phrase.textContent = hero.phrase;

  if (hero.cta && hero.cta.label && hero.cta.href) {
    $cta.textContent = hero.cta.label;
    $cta.setAttribute("href", hero.cta.href);
    $cta.hidden = false;
  }

  const stamps = hero.stamps || {};
  ["tl", "tr", "bl", "br"].forEach((pos) => {
    const el = document.getElementById("heroStamp" + pos.toUpperCase());
    if (el) el.textContent = stamps[pos] || "";
  });
}

function animateHeroIn() {
  if (typeof gsap === "undefined") return;
  gsap.from(".hero-char", {
    opacity: 0,
    y: 60,
    rotateX: -25,
    duration: 0.9,
    stagger: 0.06,
    ease: "power3.out",
    delay: 0.15,
    onComplete: () => {
      // Ambient hypnotic wave: cascade de subtle rise/opacity en loop infinito.
      // Es la traducción visual de la "prolonged hypnosis" + propulsion del Bochka.
      gsap.to(".hero-char", {
        y: -5,
        opacity: 0.85,
        duration: 1.45,
        ease: "sine.inOut",
        stagger: { each: 0.08, repeat: -1, yoyo: true },
      });
    },
  });
  gsap.from(".hero-phrase, .hero-cta:not([hidden]), .hero-stamp", {
    opacity: 0,
    y: 12,
    duration: 0.7,
    stagger: 0.08,
    ease: "power2.out",
    delay: 0.65,
  });
}

// --------------------------------------------------------------
// Sections (router por tipo)
// --------------------------------------------------------------
function renderSections(sections, data) {
  const root = document.getElementById("sectionsRoot");
  if (!root || !Array.isArray(sections)) return;

  // Las secciones tipo "marquee" no llevan label/title/wrapper — son dividers tipográficos.
  // Para que la numeración (roman) ignore las marquees, llevamos un counter aparte.
  let chapterIdx = 0;
  const html = sections
    .map((sec) => {
      const items = sec.source ? data[sec.source] || [] : sec.items || [];
      if (sec.type === "marquee") {
        return renderMarquee(sec);
      }
      chapterIdx += 1;
      const body = renderSectionBody(sec.type, items, sec, data);
      return `
        <section id="${sec.id}" class="section" data-section="${sec.type}">
          <span class="section-label" data-reveal>${roman(chapterIdx)}</span>
          <h2 class="section-title" data-reveal>${escapeHtml(sec.title || "")}</h2>
          ${sec.subtitle ? `<p class="section-subtitle" data-reveal>${escapeHtml(sec.subtitle)}</p>` : ""}
          ${body}
        </section>
      `;
    })
    .join("");

  root.innerHTML = html;
}

function renderSectionBody(type, items, sec, data) {
  switch (type) {
    case "text":
      return `<div class="section-text" data-reveal>${sec.body || ""}</div>`;
    case "chapters":
      return renderChapters(sec.items || [], sec.dossier);
    case "memories":
      return renderMemories(items);
    case "gigs":
      return renderGigs(items, data);
    case "mixes":
      return renderMixes(items);
    case "tracks":
      return renderTracks(items);
    case "gallery":
      return renderGallery(items);
    case "crews":
      return renderCrews(items);
    case "roster":
      return renderRoster(sec, data);
    case "press":
      return renderPress(items);
    case "featured":
      return renderFeatured(items);
    case "presskit":
      return renderPresskit(items);
    case "booking":
      return renderBooking(sec);
    case "booking-card":
      return renderBookingCard(sec);
    default:
      return `<pre data-reveal>${escapeHtml(JSON.stringify(items, null, 2))}</pre>`;
  }
}

function renderMarquee(sec) {
  const lanes = (sec.lanes || sec.items || []).filter(Boolean);
  if (!lanes.length) return "";
  return `
    <div class="marquee" id="${sec.id || ""}" data-marquee aria-hidden="true">
      ${lanes
        .map((text, i) => {
          // Repetimos el contenido 2x para que el loop sea seamless
          const dup = `${text} † ${text} † `;
          return `
        <div class="marquee-lane marquee-lane--${i % 2 === 0 ? "left" : "right"}">
          <div class="marquee-track"><span>${escapeHtml(dup)}</span><span>${escapeHtml(dup)}</span></div>
        </div>`;
        })
        .join("")}
    </div>
  `;
}

function renderMemories(items) {
  if (!items.length) return "";
  return `
    <div class="memories" data-reveal>
      ${items
        .map(
          (m, i) => `
        <article class="memory memory--${i % 2 === 0 ? "left" : "right"}">
          <div class="memory-visual">
            ${
              m.image
                ? `<img class="memory-image" src="${m.image}" alt="${escapeAttr(m.venue || "")}" loading="lazy">`
                : `<div class="memory-image memory-image--empty" aria-hidden="true"></div>`
            }
            <span class="memory-badge">${escapeHtml(m.date || "—")}</span>
            <span class="memory-chapter">${roman(i + 1)}</span>
          </div>
          <div class="memory-body">
            <h3 class="memory-venue">${escapeHtml(m.venue || "")}</h3>
            ${m.city ? `<p class="memory-city">${escapeHtml(m.city)}</p>` : ""}
            ${m.anecdote ? `<p class="memory-anecdote">"${escapeHtml(m.anecdote)}"</p>` : ""}
          </div>
        </article>`,
        )
        .join("")}
    </div>
  `;
}

function initSetlistWaves(items) {
  const canvases = document.querySelectorAll(".setlist-wave");
  if (!canvases.length || !items.length) return;

  const accentRgb =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--accent-rgb")
      .trim() || "242, 1, 0";
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const hash = (s) => {
    let h = 0;
    for (let i = 0; i < (s || "").length; i++) {
      h = (h << 5) - h + s.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  };

  // ampRatio = porcentaje de la mitad-altura disponible (con 1px de margen).
  // Así la onda nunca se sale del canvas, sin importar la altura.
  const AMP_BASE = 0.68;
  const AMP_HOVER = 0.96;

  const renderers = Array.from(canvases)
    .map((canvas) => {
      const idx = parseInt(canvas.dataset.waveIndex, 10);
      const item = items[idx];
      if (!item) return null;
      const ctx = canvas.getContext("2d");
      const h = hash(item.title || `track-${idx}`);
      const wave = {
        freq: 0.018 + (h % 80) / 7000,
        ampRatio: AMP_BASE,
        targetAmp: AMP_BASE,
        speed: 0.008 + (h % 40) / 6000,
        offset: ((h % 360) * Math.PI) / 180,
        phase: 0,
      };
      const row = canvas.closest(".setlist-row");
      const state = { width: 0, height: 0 };
      function resize() {
        state.width = canvas.offsetWidth;
        state.height = canvas.offsetHeight;
        canvas.width = state.width * dpr;
        canvas.height = state.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      resize();
      // ResizeObserver: el layout puede cambiar después del init (fonts, grid shrink,
      // hide/show mini-player). Cada canvas se re-mide cuando su row cambia de ancho.
      if (typeof ResizeObserver !== "undefined" && row) {
        const ro = new ResizeObserver(() => resize());
        ro.observe(row);
      }
      return {
        canvas,
        ctx,
        wave,
        row,
        state,
        resize,
        ampHover: AMP_HOVER,
        ampBase: AMP_BASE,
      };
    })
    .filter(Boolean);

  // Re-medir al frame siguiente — fuerza un measure post-layout en caso de
  // que el primer resize() haya corrido antes de que el grid finalizara.
  requestAnimationFrame(() => renderers.forEach((r) => r.resize()));

  window.addEventListener("resize", () => renderers.forEach((r) => r.resize()));

  // Bridge hover entre rows (mouseenter/leave) y el flag is-active que
  // controla el highlight del número y del wave.
  const rows = document.querySelectorAll(".setlist-row");
  rows.forEach((el) => {
    el.addEventListener("mouseenter", () => el.classList.add("is-active"));
    el.addEventListener("mouseleave", () => el.classList.remove("is-active"));
  });

  function tick() {
    renderers.forEach((r) => {
      const { width, height } = r.state;
      if (!width || !height) return;
      r.ctx.clearRect(0, 0, width, height);
      r.wave.phase += r.wave.speed;

      const active = r.row.classList.contains("is-active");
      // Smooth amplitude interpolation hacia hover state
      r.wave.targetAmp = active ? r.ampHover : r.ampBase;
      r.wave.ampRatio += (r.wave.targetAmp - r.wave.ampRatio) * 0.12;
      r.ctx.beginPath();
      if (active) {
        r.ctx.strokeStyle = `rgba(${accentRgb}, 0.95)`;
        r.ctx.lineWidth = 1.6;
        r.ctx.shadowColor = `rgba(${accentRgb}, 0.5)`;
        r.ctx.shadowBlur = 10;
      } else {
        r.ctx.strokeStyle = "rgba(232, 232, 232, 0.3)";
        r.ctx.lineWidth = 1;
        r.ctx.shadowBlur = 0;
      }

      const cy = height / 2;
      const maxAmp = Math.max(0, height / 2 - 1);
      const amp = maxAmp * r.wave.ampRatio;
      for (let x = 0; x <= width; x += 2) {
        const y =
          cy + Math.sin(x * r.wave.freq + r.wave.phase + r.wave.offset) * amp;
        if (x === 0) r.ctx.moveTo(x, y);
        else r.ctx.lineTo(x, y);
      }
      r.ctx.stroke();
    });
    requestAnimationFrame(tick);
  }
  tick();
}

function renderChapters(items, dossier) {
  if (!items.length && !dossier) return "";
  const chaptersHtml = items.length
    ? `<div class="chapters" data-reveal>
        ${items
          .map(
            (text, i) => `
        <article class="chapter chapter--${i % 2 === 0 ? "left" : "right"}">
          <span class="chapter-num">${roman(i + 1)}</span>
          <p class="chapter-text">${escapeHtml(text)}</p>
        </article>`,
          )
          .join("")}
      </div>`
    : "";
  const dossierHtml =
    dossier && dossier.rows
      ? `<div class="dossier" data-reveal>
         ${dossier.title ? `<h3 class="dossier-title">${escapeHtml(dossier.title)}</h3>` : ""}
         <dl class="dossier-list">
           ${dossier.rows
             .map(
               (r) => `
             <div class="dossier-row">
               <dt class="dossier-key">${escapeHtml(r.key || "")}</dt>
               <dd class="dossier-value">${escapeHtml(r.value || "")}</dd>
             </div>`,
             )
             .join("")}
         </dl>
       </div>`
      : "";
  return chaptersHtml + dossierHtml;
}

function renderEpkStats(data) {
  const gigs = (data.gigs || []).length;
  const tracks = (data.mixes || []).length;
  const platforms = (data.socials || []).length;
  const stats = [
    { num: String(gigs).padStart(2, "0"), label: "Rituals played" },
    { num: String(tracks).padStart(2, "0"), label: "Productions" },
    { num: String(platforms).padStart(2, "0"), label: "Platforms" },
    { num: "170", label: "BPM peak" },
  ];
  return `
    <div class="epk-stats" data-reveal>
      ${stats
        .map(
          (s) => `
        <div class="epk-stat">
          <span class="epk-stat-num">${escapeHtml(s.num)}</span>
          <span class="epk-stat-label">${escapeHtml(s.label)}</span>
        </div>`,
        )
        .join("")}
    </div>
  `;
}

function renderGigs(items, data) {
  if (!items.length) return "";

  const statsHtml = data ? renderEpkStats(data) : "";

  const upcoming = items.filter((g) => computeGigStatus(g.date) !== "past");
  const past = items.filter((g) => computeGigStatus(g.date) === "past");
  // Past: orden descendente por fecha (más reciente primero)
  past.sort((a, b) => gigDateValue(b.date) - gigDateValue(a.date));

  // Countdown al gig más cercano (futuro)
  const nextGig = upcoming
    .slice()
    .sort((a, b) => gigDateValue(a.date) - gigDateValue(b.date))[0];
  const countdownHtml = nextGig
    ? `<div class="next-ritual" data-reveal data-target="${nextGig.date}">
         <span class="next-ritual-label">† Next ritual in</span>
         <span class="next-ritual-timer" id="nextRitualTimer">—</span>
         <span class="next-ritual-target">${escapeHtml(nextGig.venue || "")}</span>
       </div>`
    : "";

  const ritualsHtml = upcoming.length
    ? `<div class="rituals" data-reveal>
        ${upcoming
          .map((g, i) => {
            const { day, month, year } = parseGigDate(g.date);
            return `
          <article class="ritual ritual--onsale">
            <div class="ritual-date">
              <span class="ritual-day">${day}</span>
              <span class="ritual-month">${month}</span>
              <span class="ritual-year">${year}</span>
            </div>
            <span class="ritual-chapter">${roman(i + 1)}</span>
            <div class="ritual-body">
              <h3 class="ritual-venue">${escapeHtml(g.venue || "")}</h3>
              ${g.city ? `<p class="ritual-city">${escapeHtml(g.city)}</p>` : ""}
              ${g.lineup ? `<p class="ritual-lineup">${escapeHtml(g.lineup.join(" · "))}</p>` : ""}
            </div>
            <div class="ritual-action">
              <span class="ritual-status">ON SALE</span>
              ${g.tickets ? `<a class="ritual-tickets" href="${g.tickets}" target="_blank" rel="noopener">Tickets ↗</a>` : ""}
            </div>
          </article>`;
          })
          .join("")}
      </div>`
    : "";

  const archiveHtml = past.length
    ? `<div class="archive" data-reveal>
        <h3 class="archive-title">† Archive</h3>
        <table class="archive-table">
          <thead>
            <tr><th>Date</th><th>Venue</th><th>City</th></tr>
          </thead>
          <tbody>
            ${past
              .map((g) => {
                const { day, month, year } = parseGigDate(g.date);
                return `<tr>
                  <td class="archive-date">${day} ${month} ${year}</td>
                  <td class="archive-venue">${escapeHtml(g.venue || "")}</td>
                  <td class="archive-city">${escapeHtml(g.city || "")}</td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>`
    : "";

  return statsHtml + countdownHtml + ritualsHtml + archiveHtml;
}

function gigDateValue(str) {
  const parts = (str || "").split(".").map(Number);
  if (parts.length !== 3) return 0;
  const [mm, dd, yyyy] = parts;
  return new Date(yyyy, mm - 1, dd).getTime();
}

function parseGigDate(str) {
  // Formato esperado: "MM.DD.YYYY"
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const parts = (str || "").split(".");
  if (parts.length !== 3) return { day: str || "—", month: "", year: "" };
  const [mm, dd, yyyy] = parts;
  return {
    day: dd,
    month: months[parseInt(mm, 10) - 1] || mm,
    year: yyyy,
  };
}

function computeGigStatus(str) {
  const parts = (str || "").split(".");
  if (parts.length !== 3) return "onsale";
  const [mm, dd, yyyy] = parts.map(Number);
  const gigDate = new Date(yyyy, mm - 1, dd, 23, 59, 59);
  return gigDate < new Date() ? "past" : "onsale";
}

function renderMixes(items) {
  if (!items.length) return "";
  const playSvg = `
    <svg class="setlist-play--play"  viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
    <svg class="setlist-play--pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z"/></svg>`;
  return `
    <ol class="setlist" data-reveal>
      ${items
        .map(
          (m, i) => `
        <li class="setlist-row" data-track-index="${i}">
          <div class="setlist-num-wrap">
            <button class="setlist-play" aria-label="Play ${escapeAttr(m.title || "")}">${playSvg}</button>
            <span class="setlist-num">${String(i + 1).padStart(2, "0")}</span>
          </div>
          <div class="setlist-meta">
            <h3 class="setlist-title">${escapeHtml(m.title || "")}</h3>
            ${m.description ? `<p class="setlist-desc">${escapeHtml(m.description)}</p>` : ""}
            <canvas class="setlist-wave" data-wave-index="${i}" aria-hidden="true"></canvas>
          </div>
          ${m.url ? `<a class="setlist-action" href="${m.url}" target="_blank" rel="noopener">↗ SoundCloud</a>` : ""}
        </li>`,
        )
        .join("")}
    </ol>
  `;
}

function renderTracks(items) {
  if (!items.length) return "";
  return `
    <div class="grid" data-reveal>
      ${items
        .map(
          (t) => `
        <article class="card">
          <div class="card-meta">${escapeHtml(t.year || "")}</div>
          <h3 class="card-title">${escapeHtml(t.title || "")}</h3>
          ${t.label ? `<p class="card-body">${escapeHtml(t.label)}</p>` : ""}
          ${t.url ? `<a class="hero-cta" href="${t.url}" target="_blank" rel="noopener">Reproducir</a>` : ""}
        </article>`,
        )
        .join("")}
    </div>
  `;
}

function renderGallery(items) {
  if (!items.length) return "";
  return `
    <div class="gallery-grid" data-reveal>
      ${items
        .map(
          (g, i) => `
        <button class="gallery-item" data-gallery-index="${i}" data-src="${g.image}" data-video="${g.video || ""}" aria-label="${escapeAttr(g.alt || "")}">
          <img src="${g.image}" alt="${escapeAttr(g.alt || "")}" loading="lazy">
        </button>`,
        )
        .join("")}
    </div>
  `;
}

function renderRoster(sec, data) {
  const left = (sec.left && data[sec.left.source]) || [];
  const right = (sec.right && data[sec.right.source]) || [];
  const col = (label, items) => `
    <div class="roster-col">
      <h4 class="roster-label">${escapeHtml(label || "")}</h4>
      <ul class="roster-list">
        ${items
          .map((x) => {
            const name = `<span class="roster-name">${escapeHtml(x.name || "")}</span>`;
            return `<li class="roster-item">${
              x.link
                ? `<a href="${x.link}" target="_blank" rel="noopener" class="roster-link">${name}</a>`
                : name
            }</li>`;
          })
          .join("")}
      </ul>
    </div>
  `;
  return `
    <div class="roster" data-reveal>
      ${col(sec.left && sec.left.label, left)}
      ${col(sec.right && sec.right.label, right)}
    </div>
  `;
}

function renderCrews(items) {
  if (!items.length) return "";
  return `
    <div class="crews-track" data-reveal>
      ${items
        .map((c) => {
          const inner = c.logo
            ? `<img class="crew-logo" src="${c.logo}" alt="${escapeAttr(c.name || "")}" loading="lazy">`
            : `<span class="crew-name">${escapeHtml(c.name || "")}</span>`;
          return c.link
            ? `<a class="crew-link" href="${c.link}" target="_blank" rel="noopener">${inner}</a>`
            : inner;
        })
        .join("")}
    </div>
  `;
}

function renderPresskit(items) {
  if (!items.length) return "";
  return `
    <div class="presskit" data-reveal>
      ${items
        .map(
          (it) => `
        <article class="presskit-card">
          <span class="presskit-kind">${escapeHtml(it.kind || "")}</span>
          <h3 class="presskit-title">${escapeHtml(it.title || "")}</h3>
          ${it.description ? `<p class="presskit-desc">${escapeHtml(it.description)}</p>` : ""}
          <a class="presskit-cta" href="${it.url || "#"}" ${it.url && it.url.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>${escapeHtml(it.cta || "Download")} →</a>
        </article>`,
        )
        .join("")}
    </div>
  `;
}

function renderPress(items) {
  if (!items.length) return "";
  return `
    <div class="reverb" data-reveal>
      ${items
        .map(
          (p) => `
        <blockquote class="reverb-card">
          <p class="reverb-quote">"${escapeHtml(p.quote || "")}"</p>
          <div class="reverb-source">— ${escapeHtml(p.source || "")}</div>
        </blockquote>`,
        )
        .join("")}
    </div>
  `;
}

function renderFeatured(items) {
  if (!items.length) return "";
  return `
    <div class="featured" data-reveal>
      ${items
        .map((it) => {
          if (it.link) {
            return `<a class="featured-chip" href="${it.link}" target="_blank" rel="noopener">${escapeHtml(it.name)}</a>`;
          }
          return `<span class="featured-chip">${escapeHtml(it.name)}</span>`;
        })
        .join("")}
    </div>
  `;
}

function renderBookingCard(sec) {
  const c = sec.card || {};
  if (!c.email) return "";
  const subj = encodeURIComponent(c.emailSubject || "[BOOKING]");
  const briefItems = Array.isArray(c.brief) ? c.brief : [];
  const briefHtml = briefItems.length
    ? `<div class="booking-card-brief">
         <span class="booking-card-brief-label">† Include in your brief</span>
         <ol class="booking-card-brief-list">
           ${briefItems
             .map(
               (it, i) =>
                 `<li><span class="booking-card-brief-num">${String(i + 1).padStart(2, "0")}</span>${escapeHtml(it)}</li>`,
             )
             .join("")}
         </ol>
       </div>`
    : "";
  const altHtml =
    c.alt && c.alt.url && c.alt.handle
      ? `<div class="booking-card-alt">
           <span class="booking-card-alt-label">${escapeHtml(c.alt.label || "Or DM")}</span>
           <a href="${c.alt.url}" target="_blank" rel="noopener" class="booking-card-alt-link">${escapeHtml(c.alt.handle)} ↗</a>
         </div>`
      : "";

  return `
    <div class="booking-card" data-reveal>
      ${c.intro ? `<p class="booking-card-intro">${escapeHtml(c.intro)}</p>` : ""}
      <a class="booking-card-cta" href="mailto:${c.email}?subject=${subj}">
        <span class="booking-card-cta-label">${escapeHtml(c.emailLabel || "† Direct booking")}</span>
        <span class="booking-card-cta-email">${escapeHtml(c.email)}</span>
        <span class="booking-card-cta-arrow">→</span>
      </a>
      ${briefHtml}
      ${altHtml}
    </div>
  `;
}

function renderBooking(sec) {
  const form = sec.form || {};
  const fields = Array.isArray(form.fields) ? form.fields : [];
  if (!fields.length) return "";
  const intro = form.intro
    ? `<p class="booking-intro" data-reveal>${escapeHtml(form.intro)}</p>`
    : "";
  const inputs = fields
    .map((f) => {
      const id = `bk-${f.name}`;
      const required = f.required ? "required" : "";
      const reqCls = f.required ? "booking-field--required" : "";
      const fullCls = f.type === "textarea" ? "booking-field--full" : "";
      const control =
        f.type === "textarea"
          ? `<textarea id="${id}" name="${escapeAttr(f.name)}" class="booking-textarea" ${required}></textarea>`
          : `<input id="${id}" name="${escapeAttr(f.name)}" type="${escapeAttr(f.type || "text")}" class="booking-input" ${required}>`;
      return `
        <div class="booking-field ${reqCls} ${fullCls}">
          <label class="booking-label" for="${id}">${escapeHtml(f.label || f.name)}</label>
          ${control}
        </div>`;
    })
    .join("");

  return `
    <div class="booking" data-reveal>
      ${intro}
      <form class="booking-form" id="bookingForm" novalidate
            data-to="${escapeAttr(form.to || "")}"
            data-subject="${escapeAttr(form.subjectPrefix || "[BOOKING]")}">
        ${inputs}
        <button type="submit" class="booking-submit">${escapeHtml(form.submit || "Send")} →</button>
        <div class="booking-status" id="bookingStatus"></div>
      </form>
    </div>
  `;
}

// --------------------------------------------------------------
// Footer
// --------------------------------------------------------------
function renderFooter(data) {
  const site = data.site || {};
  const footer = data.footer || {};
  const socials = Array.isArray(data.socials) ? data.socials : [];

  document.getElementById("footerBrand").textContent = site.name || "";
  document.getElementById("footerName").textContent = site.name || "";

  if (footer.epitaph) {
    document.getElementById("footerEpitaph").textContent = footer.epitaph;
  }

  const $booking = document.getElementById("footerBooking");
  if ($booking && footer.booking && footer.booking.email) {
    const label = footer.booking.label || "Booking";
    $booking.innerHTML = `
      <span class="footer-booking-label">† ${escapeHtml(label)}</span>
      <a class="footer-booking-email" href="mailto:${footer.booking.email}">${escapeHtml(footer.booking.email)}</a>
    `;
  }

  const $links = document.getElementById("footerLinks");
  if ($links) {
    $links.innerHTML = socials
      .map(
        (s) =>
          `<a href="${s.url}" target="_blank" rel="noopener">${escapeHtml(s.label)}</a>`,
      )
      .join("");
  }

  if (footer.credit && footer.credit.label) {
    const credit = document.getElementById("footerCredit");
    const prefix = footer.credit.prefix || "Made by";
    const name = footer.credit.href
      ? `<a href="${footer.credit.href}" target="_blank" rel="noopener">${escapeHtml(footer.credit.label)}</a>`
      : escapeHtml(footer.credit.label);
    credit.innerHTML = `${escapeHtml(prefix)} ${name}`;
  }
}

function initYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

// --------------------------------------------------------------
// GSAP reveals
// --------------------------------------------------------------
function initReveals() {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined")
    return;
  gsap.registerPlugin(ScrollTrigger);

  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });
  });
}

// --------------------------------------------------------------
// Lightbox
// --------------------------------------------------------------
function initLightbox() {
  const lb = document.getElementById("lightbox");
  const close = document.getElementById("lightboxClose");
  const content = document.getElementById("lightboxContent");

  document.addEventListener("click", (e) => {
    const item = e.target.closest("[data-gallery-index]");
    if (!item) return;
    const src = item.dataset.src;
    const video = item.dataset.video;
    content.innerHTML = video
      ? `<iframe src="${video}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`
      : `<img src="${src}" alt="">`;
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
  });

  const closeLb = () => {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    content.innerHTML = "";
  };
  close?.addEventListener("click", closeLb);
  lb?.addEventListener("click", (e) => {
    if (e.target === lb) closeLb();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLb();
  });
}

// --------------------------------------------------------------
// Helpers
// --------------------------------------------------------------
function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}
function roman(n) {
  const map = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  return map[n - 1] || String(n);
}
