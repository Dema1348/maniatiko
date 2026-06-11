// ============================================================
// maniatiko.dj — main.js
// Carga data.json → renderiza nav, hero, secciones y footer.
// Inicializa GSAP ScrollTrigger reveals y lightbox.
// ============================================================

const DATA_URL = "/data.json";

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
  renderHero(data.hero, data.mixes);
  renderSections(data.sections, data);
  renderFooter(data);

  initHypnoticTitles();
  insertHypnoticDividers();

  initHeroShader();
  initRitualAudio();
  initRitualDepthTracking();
  animateHeroIn();
  initReveals();
  initTvStatic();
  initNextRitualCountdown();
  initBookingForm();
  initMiniPlayer(data);
  initAudioReactive();
  initMarqueeJolt();
  initKickJolts();
  startHypnoticWaves();

  if (document.querySelector(".setlist-wave")) {
    initSetlistWaves(data.mixes || []);
  }

  hideBootLoader();
});

// --------------------------------------------------------------
// Hypnotic global — char-split section titles, dividers entre secciones,
// audio-reactive flash sobre elementos visibles del viewport.
// --------------------------------------------------------------
function initHypnoticTitles() {
  document.querySelectorAll(".section-title").forEach((el) => {
    if (el.dataset.hypnoticBound === "1") return;
    el.dataset.hypnoticBound = "1";
    const text = el.textContent.trim();
    if (!text) return;
    const chars = text
      .split("")
      .map((c) =>
        c === " "
          ? `<span class="hypnotic-char hypnotic-char--space">&nbsp;</span>`
          : `<span class="hypnotic-char">${escapeHtml(c)}</span>`,
      )
      .join("");
    el.innerHTML = chars;
  });
}

function startHypnoticWaves() {
  if (typeof gsap === "undefined") return;
  // Delay para que los reveals iniciales terminen antes de empezar el wave loop.
  setTimeout(() => {
    document.querySelectorAll(".section-title").forEach((title) => {
      const chars = title.querySelectorAll(".hypnotic-char");
      if (!chars.length) return;
      gsap.to(chars, {
        y: -3,
        opacity: 0.85,
        duration: 1.45,
        ease: "sine.inOut",
        stagger: { each: 0.05, repeat: -1, yoyo: true },
      });
    });
  }, 1600);
}

function insertHypnoticDividers() {
  const root = document.getElementById("sectionsRoot");
  if (!root) return;
  const children = Array.from(root.children);
  for (let i = 0; i < children.length - 1; i++) {
    const cur = children[i];
    const next = children[i + 1];
    // Skip si alguno de los dos es marquee — ya hace su propio "divider"
    if (cur.classList.contains("marquee") || next.classList.contains("marquee")) continue;

    const divider = document.createElement("div");
    divider.className = "hypnotic-divider";
    divider.setAttribute("aria-hidden", "true");
    divider.innerHTML = `<svg viewBox="0 0 60 12">
      <circle cx="14" cy="6" r="2.6"/>
      <circle cx="30" cy="6" r="2.6"/>
      <circle cx="46" cy="6" r="2.6"/>
    </svg>`;
    root.insertBefore(divider, next);
  }
}

function initMarqueeJolt() {
  // Cuando ritual engaged, cada kick empuja cada marquee-lane en su dirección
  // de scroll. Sensación de "el bochka empuja el mantra".
  document.addEventListener("ritual:kick", () => {
    if (!document.body.classList.contains("ritual-engaged")) return;
    if (typeof gsap === "undefined") return;
    document.querySelectorAll(".marquee-lane").forEach((lane) => {
      const dir = lane.classList.contains("marquee-lane--right") ? 1 : -1;
      gsap.fromTo(
        lane,
        { x: 0 },
        { x: dir * 7, duration: 0.08, ease: "power2.out", yoyo: true, repeat: 1 },
      );
    });
  });
}

// Kick jolts globales — cada beat del bochka empuja elementos clave del sitio
function initKickJolts() {
  if (typeof gsap === "undefined") return;
  document.addEventListener("ritual:kick", () => {
    if (!document.body.classList.contains("ritual-engaged")) return;

    // 1. Hero title MANIATIKO — cascade scale punch char-por-char
    const heroChars = document.querySelectorAll(".hero-char");
    if (heroChars.length) {
      gsap.fromTo(
        heroChars,
        { scale: 1 },
        {
          scale: 1.06,
          duration: 0.05,
          ease: "power2.out",
          stagger: 0.012,
          yoyo: true,
          repeat: 1,
          overwrite: "auto",
        },
      );
    }

    // 1b. Hero role (PRODUCER & DJ) — cascade scale punch en cada char
    const roleChars = document.querySelectorAll(".hero-role-char");
    if (roleChars.length) {
      gsap.fromTo(
        roleChars,
        { scale: 1 },
        {
          scale: 1.1,
          duration: 0.05,
          ease: "power2.out",
          stagger: 0.015,
          yoyo: true,
          repeat: 1,
          overwrite: "auto",
        },
      );
    }

    // 2. Section titles — micro-shake X (todo el sitio vibra al kick)
    document.querySelectorAll(".section-title").forEach((title) => {
      gsap.fromTo(
        title,
        { x: 0 },
        { x: 1.5, duration: 0.06, yoyo: true, repeat: 1, ease: "power2.out" },
      );
    });

    // 3. Hypnotic dividers — scale-punch unísono (los 3 circles al unísono,
    //    override del waterfall continuo CSS mientras dure el ritual)
    document.querySelectorAll(".hypnotic-divider circle").forEach((c) => {
      gsap.fromTo(
        c,
        { scale: 1.55 },
        {
          scale: 1,
          duration: 0.18,
          ease: "power2.out",
          overwrite: "auto",
          clearProps: "transform",
        },
      );
    });

    // 4. Ritual day numbers (números gigantes de gigs upcoming) — jolt Y
    document.querySelectorAll(".ritual-day").forEach((day) => {
      gsap.fromTo(
        day,
        { y: 0 },
        { y: -3, duration: 0.07, yoyo: true, repeat: 1, ease: "power2.out" },
      );
    });

    // 5. Booking CTA arrow → — vibra +5px X (más se acerca, más invita)
    const arrow = document.querySelector(".booking-card-cta-arrow");
    if (arrow) {
      gsap.fromTo(
        arrow,
        { x: 0 },
        { x: 5, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.out" },
      );
    }
  });
}

function initAudioReactive() {
  const SEL =
    ".section-title, .epk-stat-num, .ritual-day, .setlist-num, .featured-chip, .dossier-key, .presskit-kind, .archive-venue";
  const visible = new Set();

  if (typeof IntersectionObserver !== "undefined") {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) visible.add(e.target);
          else visible.delete(e.target);
        });
      },
      { rootMargin: "20% 0% 20% 0%" },
    );
    // Observe matching elementos después de que las secciones se hayan renderizado
    setTimeout(() => {
      document.querySelectorAll(SEL).forEach((el) => io.observe(el));
    }, 500);
  } else {
    // Fallback: trackeamos todo
    setTimeout(() => {
      document.querySelectorAll(SEL).forEach((el) => visible.add(el));
    }, 500);
  }

  document.addEventListener("ritual:kick", () => {
    if (!document.body.classList.contains("ritual-engaged")) return;
    visible.forEach((el) => {
      el.classList.remove("kick-flash");
      // Forzar reflow para reiniciar la animación cuando ya tenía la clase
      void el.offsetWidth;
      el.classList.add("kick-flash");
    });
  });
}

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
    player.inert = false;
  }
  function closeMP() {
    widget.pause();
    player.classList.remove("is-open", "is-playing");
    document.body.classList.remove("has-miniplayer");
    player.inert = true;
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
  const tagline = t(site.tagline);
  if (site.name) {
    document.title = tagline
      ? `${site.name} — ${tagline}`
      : site.name;
  }
  if (site.themeColor) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", site.themeColor);
  }
  // Actualizar meta description al cambiar idioma (los HTML estáticos ya
  // traen su versión inicial; este overwrite es por si data.json cambia).
  const description = t(site.description);
  if (description) {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", description);
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

  const linksHtml = items
    .map((it) => `<a href="${it.href}">${escapeHtml(t(it.label))}</a>`)
    .join("");

  // Switcher de idioma — preserva el hash para que el ancla sobreviva al cambio
  const switcher = renderLangSwitcher(data);

  root.innerHTML = linksHtml + switcher;
}

// Switcher ES / EN — links full-reload preservando el hash actual.
// Idioma activo en accent, inactivo en text-dim.
function renderLangSwitcher(data) {
  const sw = data?.i18n?.labels?.switcher || {
    es: { label: "ES", title: "Español" },
    en: { label: "EN", title: "English" },
  };
  const hash = location.hash || "";
  // Path equivalente en el otro idioma (sin slash final para clean URLs)
  const currentPath = location.pathname.replace(/\/$/, "") || "/";
  const isEn = LANG === "en";
  // Stripping /en al pasar a ES
  const esPath = isEn ? currentPath.replace(/^\/en(\/|$)/, "/") : currentPath;
  // Prefijo /en al pasar a EN
  const enPath = isEn ? currentPath : "/en" + (currentPath === "/" ? "/" : currentPath);

  return `
    <div class="lang-switcher" role="group" aria-label="Language">
      <a href="${esPath}${hash}" class="lang-switcher-link ${isEn ? "" : "is-active"}" title="${escapeAttr(sw.es?.title || "Español")}" hreflang="es">${escapeHtml(sw.es?.label || "ES")}</a>
      <span class="lang-switcher-sep">·</span>
      <a href="${enPath}${hash}" class="lang-switcher-link ${isEn ? "is-active" : ""}" title="${escapeAttr(sw.en?.title || "English")}" hreflang="en">${escapeHtml(sw.en?.label || "EN")}</a>
    </div>`;
}

// --------------------------------------------------------------
// Hero — Ritual Engine
// --------------------------------------------------------------
let __ritualEngaged = false;
let __ritualDepth = 0;
let __ritualGain = null;
let __shaderUniforms = null;

function renderHero(hero, mixes) {
  if (!hero) return;
  const $title = document.getElementById("heroTitle");
  const $role = document.getElementById("heroRole");
  const $bpm = document.getElementById("heroBpm");
  const $engageLabel = document.getElementById("heroEngageLabel");
  const $engage = document.getElementById("heroEngage");
  const $logo = document.getElementById("navLogo");

  if (hero.title) {
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
  const role = t(hero.role);
  if ($role && role) {
    // Char-split también en el role — habilita el cascade scale punch al kick
    const chars = role
      .split("")
      .map((c) =>
        c === " "
          ? `<span class="hero-role-char hero-role-char--space">&nbsp;</span>`
          : `<span class="hero-role-char">${escapeHtml(c)}</span>`,
      )
      .join("");
    $role.innerHTML = chars;
  }
  if ($bpm && hero.bpm) $bpm.textContent = `${hero.bpm} BPM`;
  if (hero.engage) {
    const labelOff = t(hero.engage.labelOff) || "Engage";
    const labelOn  = t(hero.engage.labelOn)  || "Disengage";
    if ($engageLabel) $engageLabel.textContent = labelOff;
    if ($engage) {
      $engage.dataset.labelOff = labelOff;
      $engage.dataset.labelOn  = labelOn;
    }
  }

  // Ghost words: override manual con hero.ghostWords, o derivar de los tracks del artista
  const ghosts =
    Array.isArray(hero.ghostWords) && hero.ghostWords.length
      ? hero.ghostWords
      : (Array.isArray(mixes) ? mixes : []).map((m) => m.title).filter(Boolean);
  initGhostWords(ghosts);
}

// Ghost words — fragmentos del catálogo (track titles) flotando con opacidad baja
function initGhostWords(words) {
  const root = document.getElementById("heroGhosts");
  if (!root || !Array.isArray(words) || !words.length) return;
  // Delays negativos → al cargar ya hay ghosts in-progress en distintos puntos del ciclo
  const positions = [
    { x: 6,  y: 16, delay: -1,  rotate: -3 },
    { x: 64, y: 22, delay: -4,  rotate: 4  },
    { x: 12, y: 70, delay: -6,  rotate: -2 },
    { x: 62, y: 76, delay: -8,  rotate: 3  },
    { x: 38, y: 6,  delay: -10, rotate: 0  },
    { x: 4,  y: 46, delay: -2,  rotate: 2  },
    { x: 70, y: 50, delay: -5,  rotate: -4 },
    { x: 42, y: 88, delay: -7,  rotate: 1  },
  ];
  root.innerHTML = words
    .slice(0, positions.length)
    .map((w, i) => {
      const p = positions[i];
      return `<span class="hero-ghost"
        style="left:${p.x}%; top:${p.y}%; transform: rotate(${p.rotate}deg); animation-delay: ${p.delay}s;">${escapeHtml(w)}</span>`;
    })
    .join("");
}

async function animateHeroIn() {
  if (typeof gsap === "undefined") return;
  await new Promise((r) => setTimeout(r, 1250));

  gsap.from(".hero-char", {
    opacity: 0,
    y: 40,
    rotateX: -25,
    duration: 0.85,
    stagger: 0.06,
    ease: "power3.out",
    onComplete: () => {
      gsap.to(".hero-char", {
        y: -5,
        opacity: 0.85,
        duration: 1.45,
        ease: "sine.inOut",
        stagger: { each: 0.08, repeat: -1, yoyo: true },
      });
    },
  });
  gsap.from(".hero-engage", { opacity: 0, y: 12, duration: 0.7, delay: 1.0, ease: "power2.out" });
}

// --------------------------------------------------------------
// Hero shader — Three.js fragment compuesto (5 layers)
// --------------------------------------------------------------
function initHeroShader() {
  const canvas = document.getElementById("heroShader");
  if (!canvas || typeof THREE === "undefined") return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const accentRgbStr =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--accent-rgb")
      .trim() || "242, 1, 0";
  const [r, g, b] = accentRgbStr.split(",").map((s) => parseFloat(s) / 255);

  __shaderUniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uAccent: { value: new THREE.Vector3(r, g, b) },
    uIntensity: { value: 0.0 }, // 0..1 — sube cuando el ritual está engaged
  };

  const material = new THREE.ShaderMaterial({
    uniforms: __shaderUniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2  uResolution;
      uniform vec3  uAccent;
      uniform float uIntensity;

      #define BPM 170.0

      // FBM noise para el layer tectonic — "placas geológicas" moviéndose lentas
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
                   mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * vnoise(p);
          p *= 2.0;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = vUv - 0.5;
        uv.x *= uResolution.x / uResolution.y;
        float dist = length(uv);

        float beatTime  = uTime * BPM / 60.0;
        float beatFract = fract(beatTime);

        // Sub-bass: bloom radial que se expande con cada kick
        float subBass = exp(-beatFract * 5.0) * smoothstep(0.7, 0.0, dist) * 0.5;

        // Tectonic: FBM noise muy lento (placas geológicas)
        vec2 nUv = uv * 1.6 + vec2(uTime * 0.014, uTime * 0.009);
        float tectonic = fbm(nUv) * 0.14 * smoothstep(1.0, 0.0, dist);

        // Sonar rings: 5 anillos concéntricos al BPM
        float rings = 0.0;
        for (int i = 0; i < 5; i++) {
          float ringPhase = float(i) / 5.0;
          float ringT = mod(beatTime + ringPhase, 1.0);
          float ringRadius = ringT * 0.9;
          float ringDist = abs(dist - ringRadius);
          float ri = smoothstep(0.018, 0.0, ringDist) * (1.0 - ringT);
          rings += ri;
        }
        rings *= 0.45;

        // Kick flash al centro (sharp attack + exp decay)
        float kick = exp(-beatFract * 9.0) * smoothstep(0.22, 0.0, dist) * 0.85;

        // Off: pulso calmado (0.4). Engaged top: 1.3. Engaged deep: 1.75.
        float boost = 0.4 + uIntensity * 0.9;
        float vignette = 1.0 - smoothstep(0.48, 1.0, dist);

        vec3 color = uAccent * (subBass + rings + kick + tectonic) * boost * vignette;
        color += uAccent * 0.008;

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    __shaderUniforms.uResolution.value.set(w, h);
  }
  resize();
  window.addEventListener("resize", resize);

  const t0 = performance.now();
  function tick() {
    __shaderUniforms.uTime.value = (performance.now() - t0) / 1000;
    // Lerp suave de uIntensity. Cuando engaged el target sube con la profundidad
    // del scroll (0..1) → de 1.0 (top) a 1.5 (bottom). Cuando no engaged: 0.
    const target = __ritualEngaged ? 1.0 + __ritualDepth * 0.5 : 0.0;
    __shaderUniforms.uIntensity.value += (target - __shaderUniforms.uIntensity.value) * 0.06;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// --------------------------------------------------------------
// Ritual audio — Tone.js sintetiza un kick a 170 BPM (opt-in)
// Tone.js se carga lazy: solo si el visitante clickea Engage la primera vez.
// Ahorra ~150KB de transferencia para visitantes que solo navegan.
// --------------------------------------------------------------
const TONE_CDN = "https://cdn.jsdelivr.net/npm/tone@14.8.49/build/Tone.js";
let __tonePromise = null;

function loadTone() {
  if (typeof Tone !== "undefined") return Promise.resolve();
  if (__tonePromise) return __tonePromise;
  __tonePromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = TONE_CDN;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Tone.js"));
    document.head.appendChild(s);
  });
  return __tonePromise;
}

function initRitualAudio() {
  const $btn = document.getElementById("heroEngage");
  const $label = document.getElementById("heroEngageLabel");
  if (!$btn) return;

  let kick = null;
  let lp = null;
  let loop = null;

  $btn.addEventListener("click", async () => {
    if (!__ritualEngaged) {
      // Cargar Tone.js si no está cargado todavía (primera vez = ~150KB download)
      try {
        await loadTone();
      } catch (e) {
        console.error("[ritual] Tone.js failed to load", e);
        return;
      }
      // Inicia contexto de audio (requiere user gesture — el click es válido)
      if (Tone.context.state !== "running") {
        await Tone.start();
      }
      if (!kick) {
        kick = new Tone.MembraneSynth({
          pitchDecay: 0.06,
          octaves: 6,
          oscillator: { type: "sine" },
          envelope: {
            attack: 0.001,
            decay: 0.45,
            sustain: 0.01,
            release: 0.6,
            attackCurve: "exponential",
          },
        });
        lp = new Tone.Filter(420, "lowpass");
        __ritualGain = new Tone.Gain(0.45);
        kick.chain(lp, __ritualGain, Tone.Destination);

        Tone.Transport.bpm.value = 170;
        loop = new Tone.Loop((time) => {
          kick.triggerAttackRelease("C1", "8n", time);
          // Dispatch evento visual sincronizado con cada kick real
          Tone.Draw.schedule(() => {
            document.dispatchEvent(new CustomEvent("ritual:kick"));
          }, time);
        }, "4n");
      }
      Tone.Transport.start();
      loop.start(0);
      __ritualEngaged = true;
      $btn.classList.add("is-engaged");
      if ($label) $label.textContent = $btn.dataset.labelOn || "Disengage";
      document.body.classList.add("ritual-engaged");
      updateRitualDepth();
    } else {
      loop && loop.stop();
      Tone.Transport.stop();
      __ritualEngaged = false;
      $btn.classList.remove("is-engaged");
      if ($label) $label.textContent = $btn.dataset.labelOff || "Engage ritual";
      document.body.classList.remove("ritual-engaged");
      updateRitualDepth();
    }
  });
}

// --------------------------------------------------------------
// Ritual depth — cuanto más scroll down, más intenso el ritual (solo si engaged).
// Modula audio gain, shader intensity, y CSS var --ritual-depth (0..1).
// --------------------------------------------------------------
function updateRitualDepth() {
  if (!__ritualEngaged) {
    if (__ritualDepth !== 0) {
      __ritualDepth = 0;
      document.documentElement.style.setProperty("--ritual-depth", "0");
      if (__ritualGain) __ritualGain.gain.rampTo(0.45, 0.35);
    }
    return;
  }
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const depth = Math.min(1, Math.max(0, window.scrollY / max));
  __ritualDepth = depth;
  document.documentElement.style.setProperty("--ritual-depth", depth.toFixed(3));
  if (__ritualGain) __ritualGain.gain.rampTo(0.45 + depth * 0.4, 0.25);
}

function initRitualDepthTracking() {
  document.addEventListener("scroll", updateRitualDepth, { passive: true });
  // Lenis usa su propio scroll stream — engancho también ahí si está activo
  if (window.__lenis && typeof window.__lenis.on === "function") {
    window.__lenis.on("scroll", updateRitualDepth);
  }
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
      // Resolución homologa de source:
      //  - Si data[sec.source] es array → es la colección de items (gigs, mixes, press, etc.)
      //  - Si data[sec.source] es object → se mergea sobre sec (bio.chapters/dossier, booking.intro/email/etc.)
      //    Las keys del sec (id, type, title, subtitle, source) sobrescriben las del source para que
      //    el shape del section siga siendo el canónico.
      const src = sec.source ? data[sec.source] : null;
      const items = Array.isArray(src) ? src : sec.items || [];
      const mergedSec = src && !Array.isArray(src) ? { ...src, ...sec } : sec;
      if (sec.type === "marquee") {
        return renderMarquee(mergedSec, data);
      }
      chapterIdx += 1;
      const body = renderSectionBody(sec.type, items, mergedSec, data);
      const title = t(sec.title);
      const subtitle = t(sec.subtitle);
      return `
        <section id="${sec.id}" class="section" data-section="${sec.type}">
          <span class="section-label" data-reveal>${roman(chapterIdx)}</span>
          <h2 class="section-title" data-reveal>${escapeHtml(title)}</h2>
          ${subtitle ? `<p class="section-subtitle" data-reveal>${escapeHtml(subtitle)}</p>` : ""}
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
      // sec.chapters viene del source top-level "bio"; sec.items es el legacy inline
      return renderChapters(sec.chapters || sec.items || [], sec.dossier);
    case "memories":
      return renderMemories(items);
    case "gigs":
      return renderGigs(items, data);
    case "mixes":
      return renderMixes(items);
    case "press":
      return renderPress(items);
    case "featured":
      return renderFeatured(items);
    case "presskit":
      return renderPresskit(items);
    case "booking":
      return renderBooking(sec);
    case "booking-card":
      return renderBookingCard(sec, data);
    default:
      return `<pre data-reveal>${escapeHtml(JSON.stringify(items, null, 2))}</pre>`;
  }
}

function renderMarquee(sec, data) {
  // Las palabras pueden venir de sec.source → array top-level del JSON,
  // o de sec.lanes inline (legacy). asText() normaliza strings y objects {lane}.
  const fromSource =
    sec.source && data && Array.isArray(data[sec.source])
      ? data[sec.source].map(asText)
      : null;
  const lanes = (fromSource || sec.lanes || sec.items || []).map(asText).filter(Boolean);
  if (!lanes.length) return "";
  // Mantra: la palabra única se repite muchas veces con separador para que el loop
  // sea seamless. La velocidad de cada lane está controlada por CSS.
  const REPS = 20;
  const SEP = "  ·  ";
  return `
    <div class="marquee" id="${sec.id || ""}" data-marquee aria-hidden="true">
      ${lanes
        .map((mantra, i) => {
          const line = (String(mantra).trim() + SEP).repeat(REPS);
          return `
        <div class="marquee-lane marquee-lane--${i % 2 === 0 ? "left" : "right"}">
          <div class="marquee-track"><span>${escapeHtml(line)}</span><span>${escapeHtml(line)}</span></div>
        </div>`;
        })
        .join("")}
    </div>
  `;
}

// Genera <picture> con source WebP + fallback al original (JPG/PNG).
// Si el path es "img/foo.jpg", el WebP esperado es "img/foo.webp" (mismo basename).
function pictureTag(src, alt, className) {
  if (!src) return "";
  const webp = src.replace(/\.(jpe?g|png)$/i, ".webp");
  return `
    <picture>
      <source srcset="${webp}" type="image/webp">
      <img class="${className}" src="${src}" alt="${escapeAttr(alt || "")}" loading="lazy">
    </picture>`;
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
                ? pictureTag(m.image, m.venue, "memory-image")
                : `<div class="memory-image memory-image--empty" aria-hidden="true"></div>`
            }
            <span class="memory-badge">${escapeHtml(m.date || "—")}</span>
            <span class="memory-chapter">${roman(i + 1)}</span>
          </div>
          <div class="memory-body">
            <h3 class="memory-venue">${escapeHtml(m.venue || "")}</h3>
            ${m.city ? `<p class="memory-city">${escapeHtml(m.city)}</p>` : ""}
            ${m.anecdote ? `<p class="memory-anecdote">"${escapeHtml(t(m.anecdote))}"</p>` : ""}
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
            (raw, i) => `
        <article class="chapter chapter--${i % 2 === 0 ? "left" : "right"}">
          <span class="chapter-num">${roman(i + 1)}</span>
          <p class="chapter-text">${escapeHtml(asText(raw))}</p>
        </article>`,
          )
          .join("")}
      </div>`
    : "";
  const dossierTitle = dossier ? t(dossier.title) : "";
  const dossierHtml =
    dossier && dossier.rows
      ? `<div class="dossier" data-reveal>
         ${dossierTitle ? `<h3 class="dossier-title">${escapeHtml(dossierTitle)}</h3>` : ""}
         <dl class="dossier-list">
           ${dossier.rows
             .map(
               (r) => `
             <div class="dossier-row">
               <dt class="dossier-key">${escapeHtml(t(r.key))}</dt>
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
  const L = data?.i18n?.labels?.epkStats || {};
  const stats = [
    { num: String(gigs).padStart(2, "0"),     label: t(L.rituals)     || "Rituals played" },
    { num: String(tracks).padStart(2, "0"),   label: t(L.productions) || "Productions" },
    { num: String(platforms).padStart(2, "0"), label: t(L.platforms)   || "Platforms" },
    { num: "170",                              label: t(L.bpmPeak)     || "BPM peak" },
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
  const nextRitualLabel = t(data?.i18n?.labels?.nextRitual) || "Next ritual";
  const countdownHtml = nextGig
    ? `<div class="next-ritual" data-reveal data-target="${nextGig.date}">
         <span class="next-ritual-label">† ${escapeHtml(nextRitualLabel)}</span>
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
              <span class="ritual-status">${escapeHtml(t(data?.i18n?.labels?.onSale) || "ON SALE")}</span>
              ${g.tickets ? `<a class="ritual-tickets" href="${g.tickets}" target="_blank" rel="noopener">Tickets ↗</a>` : ""}
            </div>
          </article>`;
          })
          .join("")}
      </div>`
    : "";

  const archCols = data?.i18n?.labels?.archiveCols || {};
  const archiveHtml = past.length
    ? `<div class="archive" data-reveal>
        <h3 class="archive-title">${escapeHtml(t(data?.i18n?.labels?.archive) || "† Archive")}</h3>
        <table class="archive-table">
          <thead>
            <tr><th>${escapeHtml(t(archCols.date) || "Date")}</th><th>${escapeHtml(t(archCols.venue) || "Venue")}</th><th>${escapeHtml(t(archCols.city) || "City")}</th></tr>
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
            ${m.description ? `<p class="setlist-desc">${escapeHtml(t(m.description))}</p>` : ""}
            <canvas class="setlist-wave" data-wave-index="${i}" aria-hidden="true"></canvas>
          </div>
          ${m.url ? `<a class="setlist-action" href="${m.url}" target="_blank" rel="noopener">↗ SoundCloud</a>` : ""}
        </li>`,
        )
        .join("")}
    </ol>
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
          <span class="presskit-kind">${escapeHtml(t(it.kind))}</span>
          <h3 class="presskit-title">${escapeHtml(t(it.title))}</h3>
          ${it.description ? `<p class="presskit-desc">${escapeHtml(t(it.description))}</p>` : ""}
          <a class="presskit-cta" href="${it.url || "#"}" ${it.url && it.url.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>${escapeHtml(t(it.cta) || "Download")} →</a>
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
          <p class="reverb-quote">"${escapeHtml(t(p.quote))}"</p>
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

function renderBookingCard(sec, data) {
  // sec puede traer las keys directas (vía source="booking") o anidadas en sec.card (legacy inline)
  const c = sec.card || sec;
  if (!c.email) return "";
  const subj = encodeURIComponent(t(c.emailSubject) || "[BOOKING]");
  const intro = t(c.intro);
  const emailLabel = t(c.emailLabel) || "† Direct booking";
  const briefItems = Array.isArray(c.brief) ? c.brief.map(asText).filter(Boolean) : [];
  const briefHeading = t(data?.i18n?.labels?.briefHeading) || "† Include in your brief";
  const briefHtml = briefItems.length
    ? `<div class="booking-card-brief">
         <span class="booking-card-brief-label">${escapeHtml(briefHeading)}</span>
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
           <span class="booking-card-alt-label">${escapeHtml(t(c.alt.label) || "Or DM")}</span>
           <a href="${c.alt.url}" target="_blank" rel="noopener" class="booking-card-alt-link">${escapeHtml(c.alt.handle)} ↗</a>
         </div>`
      : "";

  return `
    <div class="booking-card" data-reveal>
      ${intro ? `<p class="booking-card-intro">${escapeHtml(intro)}</p>` : ""}
      <a class="booking-card-cta" href="mailto:${c.email}?subject=${subj}">
        <span class="booking-card-cta-label">${escapeHtml(emailLabel)}</span>
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

  const epitaph = t(footer.epitaph);
  if (epitaph) {
    document.getElementById("footerEpitaph").textContent = epitaph;
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
    const prefix = t(footer.credit.prefix) || "Made by";
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
    lb.inert = false;
  });

  const closeLb = () => {
    lb.classList.remove("is-open");
    lb.inert = true;
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
// Normalizador de items que pueden venir como string ("foo") o object con key
// principal ({item:"foo"} / {text:"foo"} / {lane:"foo"} / etc).
// Los widgets list de Decap CMS guardan como objects con un nombre de field;
// data.json puede tener forma legacy con strings simples — ambos válidos.
//
// Sin parámetros adicionales para que `arr.map(asText)` no rompa: map pasa
// (value, index, array) — si tuviéramos `keys` como 2do param, recibiría el
// índice numérico y el `for...of` rompería con TypeError.
const ASTEXT_KEYS = ["item", "text", "value", "lane", "name"];
function asText(it) {
  if (it == null) return "";
  if (typeof it === "string") return it;
  if (typeof it === "object") {
    // Soporte i18n: si es {es, en, ...} extrae según LANG con fallback
    if (it[LANG] && typeof it[LANG] === "string") return it[LANG];
    if (typeof it.es === "string") return it.es;
    if (typeof it.en === "string") return it.en;
    for (const k of ASTEXT_KEYS) if (typeof it[k] === "string") return it[k];
  }
  return "";
}

// ============================================================
// i18n — el idioma se determina al cargar la página:
//   1) Si la URL incluye /en/ → 'en'
//   2) Si <html lang="en"> → 'en'
//   3) Default → 'es'
// El switcher en el nav navega a /en/<path> o /<path> (full reload).
// ============================================================
const LANG = (() => {
  const path = location.pathname;
  if (path === "/en" || path === "/en/" || path.startsWith("/en/")) return "en";
  const htmlLang = (document.documentElement.lang || "").toLowerCase();
  if (htmlLang.startsWith("en")) return "en";
  return "es";
})();

// Traduce un valor que puede ser string (común) o object con shape {es, en}.
// Es seguro pasar cualquier cosa — strings pasan sin cambio, objects sin
// {es, en} también (fallback a asText), null/undefined → "".
function t(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    if (typeof v[LANG] === "string") return v[LANG];
    if (typeof v.es === "string") return v.es;
    if (typeof v.en === "string") return v.en;
  }
  return "";
}

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
