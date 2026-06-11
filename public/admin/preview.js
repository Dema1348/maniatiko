// ============================================================
// Decap CMS — preview template para la collection "site".
// Renderiza un componente React (createElement) con los datos del form
// para que el editor vea EN VIVO cómo queda el contenido editado.
//
// Cubre: hero, chapters (Origin) + dossier, gigs (Live), mixes (Productions),
// memories (Aftermath), press (Reverb), featured (Hosted by), presskit,
// booking-card, footer.
// ============================================================
(function () {
  // Decap CMS v3 expone window.h (createElement). En v2 exponía window.React.
  // Esperamos polling porque el bundle se inicializa async después de su <script>.
  function whenReady(cb, tries) {
    tries = tries || 0;
    const cms = window.CMS;
    const h = window.h || (window.React && window.React.createElement);
    if (cms && typeof cms.registerPreviewTemplate === "function" && h) {
      console.log("[admin/preview] CMS ready, registering preview template");
      cb(cms, h);
      return;
    }
    if (tries > 40) {
      console.warn("[admin/preview] CMS or h() not available after 4s. window.CMS:", !!window.CMS, "window.h:", !!window.h, "window.React:", !!window.React);
      return;
    }
    setTimeout(() => whenReady(cb, tries + 1), 100);
  }

  whenReady((CMS, h) => {

    // Cargar el CSS del sitio + overrides en el iframe del preview.
    // Usamos URLs absolutas porque el iframe del preview vive en un
    // contexto aislado y las rutas relativas no se resuelven.
    const ORIGIN = window.location.origin;
    CMS.registerPreviewStyle(ORIGIN + "/css/styles.css");
    CMS.registerPreviewStyle(ORIGIN + "/admin/preview.css");

    // También cargamos las fuentes del sitio en el iframe
    CMS.registerPreviewStyle(
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Elms+Sans:ital,wght@0,100..900;1,100..900&display=swap"
    );

    // ===== Helpers =====
    const roman = (n) =>
      ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n - 1] || String(n);

    // Resuelve paths de imágenes a URL absoluta. El iframe del preview no
    // resuelve paths relativas contra el origin del CMS — hay que explicitarlo.
    function resolveAsset(path) {
      if (!path) return "";
      if (/^(https?:)?\/\//.test(path) || path.startsWith("data:") || path.startsWith("blob:")) return path;
      if (path.startsWith("/")) return ORIGIN + path;
      return ORIGIN + "/" + path;
    }

    const parseGigDate = (str) => {
      const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
      const parts = (str || "").split(".");
      if (parts.length !== 3) return { day: str || "—", month: "", year: "" };
      const [mm, dd, yyyy] = parts;
      return { day: dd, month: months[parseInt(mm, 10) - 1] || mm, year: yyyy };
    };

    const isPast = (str) => {
      const parts = (str || "").split(".").map(Number);
      if (parts.length !== 3) return false;
      const [mm, dd, yyyy] = parts;
      return new Date(yyyy, mm - 1, dd, 23, 59, 59) < new Date();
    };

    // ===== i18n del preview =====
    // El preview tiene su propio toggle ES/EN (top-right) que el editor usa
    // para ver cómo queda cada idioma. Persiste en localStorage entre cargas.
    let PREVIEW_LANG = (() => {
      try { return localStorage.getItem("preview_lang") || "es"; }
      catch (_) { return "es"; }
    })();
    const setPreviewLang = (lang) => {
      PREVIEW_LANG = lang;
      try { localStorage.setItem("preview_lang", lang); } catch (_) {}
      // Force re-render disparando un click en algo o resetear React por cambio de state
      // Decap re-renderiza el preview en cada keystroke del form; cambiamos el state
      // y disparamos un re-render forzado con un dummy update.
      window.dispatchEvent(new Event("decap-preview-lang-change"));
    };

    // Traduce un valor que puede ser string (legacy/no traducible) o {es, en}.
    // Soporta también shape de Decap CMS list widgets ({item} / {lane} / etc).
    const ASTEXT_KEYS = ["item", "text", "value", "lane", "name"];
    const t = (v) => {
      if (v == null) return "";
      if (typeof v === "string") return v;
      if (typeof v === "object") {
        if (typeof v[PREVIEW_LANG] === "string") return v[PREVIEW_LANG];
        if (typeof v.es === "string") return v.es;
        if (typeof v.en === "string") return v.en;
      }
      return "";
    };
    // Mantengo asText como alias — extrae texto desde strings, i18n directo,
    // list widget shape, o list widget + i18n anidado ({item: {es, en}}).
    const asText = (it) => {
      if (it == null) return "";
      if (typeof it === "string") return it;
      if (typeof it === "object") {
        if (typeof it[PREVIEW_LANG] === "string") return it[PREVIEW_LANG];
        if (typeof it.es === "string") return it.es;
        if (typeof it.en === "string") return it.en;
        for (const k of ASTEXT_KEYS) {
          const v = it[k];
          if (typeof v === "string") return v;
          if (v && typeof v === "object") {
            if (typeof v[PREVIEW_LANG] === "string") return v[PREVIEW_LANG];
            if (typeof v.es === "string") return v.es;
            if (typeof v.en === "string") return v.en;
          }
        }
      }
      return "";
    };

    // ===== Section renderers =====

    function HeroBlock({ hero }) {
      if (!hero) return null;
      const chars = (hero.title || "").split("").map((c, i) =>
        h("span", { key: i, className: c === " " ? "hero-char hero-char--space" : "hero-char" },
          c === " " ? " " : c)
      );
      return h("section", { className: "hero" },
        h("div", { className: "hero-core" },
          h("h1", { className: "hero-title" }, chars),
          h("span", { className: "hero-role" }, t(hero.role)),
          h("button", { className: "hero-engage", disabled: true },
            h("span", { className: "hero-engage-rule hero-engage-rule--top" }),
            h("span", { className: "hero-engage-label" }, t(hero.engage?.labelOff) || "Engage ritual"),
            h("span", { className: "hero-engage-rule hero-engage-rule--bottom" })
          )
        )
      );
    }

    function SectionHeader({ idx, title, subtitle }) {
      return [
        h("span", { key: "lbl", className: "section-label" }, roman(idx)),
        h("h2",   { key: "ttl", className: "section-title" }, t(title)),
        subtitle && h("p", { key: "sub", className: "section-subtitle" }, t(subtitle)),
      ];
    }

    function MarqueeBlock({ section }) {
      const raw = section.chapters || section.items || section.lanes || [];
      const lanes = raw.map(asText).filter(Boolean);
      if (!lanes.length) return null;
      const REPS = 12;
      const SEP = "  ·  ";
      return h("div", { id: section.id || "marquee", className: "marquee", "aria-hidden": true },
        lanes.map((mantra, i) => {
          const line = (String(mantra).trim() + SEP).repeat(REPS);
          return h("div", { key: i, className: `marquee-lane marquee-lane--${i % 2 === 0 ? "left" : "right"}` },
            h("div", { className: "marquee-track" },
              h("span", null, line),
              h("span", null, line)
            )
          );
        })
      );
    }

    function ChaptersBlock({ section, idx }) {
      const rawItems = section.chapters || section.items || [];
      const items = rawItems.map(asText).filter(Boolean);
      const dossier = section.dossier;
      return h("section", { id: section.id, className: "section" },
        SectionHeader({ idx, title: section.title, subtitle: section.subtitle }),
        items.length && h("div", { className: "chapters" },
          items.map((text, i) =>
            h("article", { key: i, className: `chapter chapter--${i % 2 === 0 ? "left" : "right"}` },
              h("span", { className: "chapter-num" }, roman(i + 1)),
              h("p", { className: "chapter-text" }, text)
            )
          )
        ),
        dossier?.rows?.length && h("div", { className: "dossier" },
          dossier.title && h("h3", { className: "dossier-title" }, t(dossier.title)),
          h("dl", { className: "dossier-list" },
            dossier.rows.map((r, i) =>
              h("div", { key: i, className: "dossier-row" },
                h("dt", { className: "dossier-key" }, t(r.key)),
                h("dd", { className: "dossier-value" }, r.value || "")
              )
            )
          )
        )
      );
    }

    function GigsBlock({ section, gigs, mixes, socials, idx }) {
      if (!gigs.length) return null;
      const upcoming = gigs.filter((g) => !isPast(g.date));
      const past = gigs.filter((g) => isPast(g.date));

      const L = I18N_LABELS.epkStats || {};
      const stats = h("div", { className: "epk-stats" }, [
        h("div", { key: "s1", className: "epk-stat" },
          h("span", { className: "epk-stat-num" }, String(gigs.length).padStart(2, "0")),
          h("span", { className: "epk-stat-label" }, t(L.rituals) || "Rituals played")),
        h("div", { key: "s2", className: "epk-stat" },
          h("span", { className: "epk-stat-num" }, String((mixes || []).length).padStart(2, "0")),
          h("span", { className: "epk-stat-label" }, t(L.productions) || "Productions")),
        h("div", { key: "s3", className: "epk-stat" },
          h("span", { className: "epk-stat-num" }, String((socials || []).length).padStart(2, "0")),
          h("span", { className: "epk-stat-label" }, t(L.platforms) || "Platforms")),
        h("div", { key: "s4", className: "epk-stat" },
          h("span", { className: "epk-stat-num" }, "170"),
          h("span", { className: "epk-stat-label" }, t(L.bpmPeak) || "BPM peak")),
      ]);

      const ritualsEl = upcoming.length && h("div", { className: "rituals" },
        upcoming.map((g, i) => {
          const d = parseGigDate(g.date);
          return h("article", { key: i, className: "ritual ritual--onsale" },
            h("div", { className: "ritual-date" },
              h("span", { className: "ritual-day" }, d.day),
              h("span", { className: "ritual-month" }, d.month),
              h("span", { className: "ritual-year" }, d.year)
            ),
            h("span", { className: "ritual-chapter" }, roman(i + 1)),
            h("div", { className: "ritual-body" },
              h("h3", { className: "ritual-venue" }, g.venue || ""),
              g.city && h("p", { className: "ritual-city" }, g.city),
              g.lineup && h("p", { className: "ritual-lineup" }, g.lineup.join(" · "))
            ),
            h("div", { className: "ritual-action" },
              h("span", { className: "ritual-status" }, t(I18N_LABELS.onSale) || "ON SALE")
            )
          );
        })
      );

      const archCols = I18N_LABELS.archiveCols || {};
      const archiveEl = past.length && h("div", { className: "archive" },
        h("h3", { className: "archive-title" }, t(I18N_LABELS.archive) || "† Archive"),
        h("table", { className: "archive-table" },
          h("thead", null, h("tr", null,
            h("th", null, t(archCols.date) || "Date"),
            h("th", null, t(archCols.venue) || "Venue"),
            h("th", null, t(archCols.city) || "City"))),
          h("tbody", null, past.map((g, i) => {
            const d = parseGigDate(g.date);
            return h("tr", { key: i },
              h("td", { className: "archive-date" }, `${d.day} ${d.month} ${d.year}`),
              h("td", { className: "archive-venue" }, g.venue || ""),
              h("td", { className: "archive-city" }, g.city || "")
            );
          }))
        )
      );

      return h("section", { id: section.id, className: "section" },
        SectionHeader({ idx, title: section.title, subtitle: section.subtitle }),
        stats,
        ritualsEl,
        archiveEl
      );
    }

    function MixesBlock({ section, mixes, idx }) {
      if (!mixes.length) return null;
      return h("section", { id: section.id, className: "section" },
        SectionHeader({ idx, title: section.title, subtitle: section.subtitle }),
        h("ol", { className: "setlist" },
          mixes.map((m, i) =>
            h("li", { key: i, className: "setlist-row" },
              h("div", { className: "setlist-num-wrap" },
                h("span", { className: "setlist-num" }, String(i + 1).padStart(2, "0"))
              ),
              h("div", { className: "setlist-meta" },
                h("h3", { className: "setlist-title" }, m.title || ""),
                m.description && h("p", { className: "setlist-desc" }, t(m.description))
              )
            )
          )
        )
      );
    }

    function MemoriesBlock({ section, memories, idx }) {
      if (!memories.length) return null;
      return h("section", { id: section.id, className: "section" },
        SectionHeader({ idx, title: section.title, subtitle: section.subtitle }),
        h("div", { className: "memories" },
          memories.map((m, i) =>
            h("article", { key: i, className: `memory memory--${i % 2 === 0 ? "left" : "right"}` },
              h("div", { className: "memory-visual" },
                m.image
                  ? h("img", { className: "memory-image", src: resolveAsset(m.image), alt: m.venue || "" })
                  : h("div", { className: "memory-image memory-image--empty" }),
                h("span", { className: "memory-badge" }, m.date || "—"),
                h("span", { className: "memory-chapter" }, roman(i + 1))
              ),
              h("div", { className: "memory-body" },
                h("h3", { className: "memory-venue" }, m.venue || ""),
                m.city && h("p", { className: "memory-city" }, m.city),
                m.anecdote && h("p", { className: "memory-anecdote" }, `"${t(m.anecdote)}"`)
              )
            )
          )
        )
      );
    }

    function PressBlock({ section, items, idx }) {
      if (!items.length) return null;
      return h("section", { id: section.id, className: "section" },
        SectionHeader({ idx, title: section.title, subtitle: section.subtitle }),
        h("div", { className: "reverb" },
          items.map((p, i) =>
            h("blockquote", { key: i, className: "reverb-card" },
              h("p", { className: "reverb-quote" }, `"${t(p.quote)}"`),
              h("div", { className: "reverb-source" }, `— ${p.source || ""}`)
            )
          )
        )
      );
    }

    function FeaturedBlock({ section, items, idx }) {
      if (!items.length) return null;
      return h("section", { id: section.id, className: "section" },
        SectionHeader({ idx, title: section.title, subtitle: section.subtitle }),
        h("div", { className: "featured" },
          items.map((it, i) =>
            h("span", { key: i, className: "featured-chip" }, it.name || "")
          )
        )
      );
    }

    function PresskitBlock({ section, items, idx }) {
      if (!items.length) return null;
      return h("section", { id: section.id, className: "section" },
        SectionHeader({ idx, title: section.title, subtitle: section.subtitle }),
        h("div", { className: "presskit" },
          items.map((it, i) =>
            h("article", { key: i, className: "presskit-card" },
              h("span", { className: "presskit-kind" }, t(it.kind)),
              h("h3", { className: "presskit-title" }, t(it.title)),
              it.description && h("p", { className: "presskit-desc" }, t(it.description)),
              h("span", { className: "presskit-cta" }, `${t(it.cta) || "Download"} →`)
            )
          )
        )
      );
    }

    function BookingCardBlock({ section, idx }) {
      // section puede tener las keys directas (mergeado vía source="booking")
      // o anidadas en section.card (legacy inline)
      const c = section.card || section;
      if (!c.email) return null;
      const briefTexts = (c.brief || []).map(asText).filter(Boolean);

      return h("section", { id: section.id, className: "section" },
        SectionHeader({ idx, title: section.title, subtitle: section.subtitle }),
        h("div", { className: "booking-card" },
          c.intro && h("p", { className: "booking-card-intro" }, t(c.intro)),
          h("div", { className: "booking-card-cta" },
            h("span", { className: "booking-card-cta-label" }, t(c.emailLabel) || "† Direct booking"),
            h("span", { className: "booking-card-cta-email" }, c.email),
            h("span", { className: "booking-card-cta-arrow" }, "→")
          ),
          briefTexts.length > 0 && h("div", { className: "booking-card-brief" },
            h("span", { className: "booking-card-brief-label" }, t(I18N_LABELS.briefHeading) || "† Include in your brief"),
            h("ol", { className: "booking-card-brief-list" },
              briefTexts.map((b, i) =>
                h("li", { key: i },
                  h("span", { className: "booking-card-brief-num" }, String(i + 1).padStart(2, "0")),
                  b
                )
              )
            )
          )
        )
      );
    }

    function Footer({ site, footer, socials }) {
      return h("footer", { className: "footer" },
        h("div", { className: "footer-inner" },
          h("div", { className: "footer-brand" }, site.name || ""),
          footer.epitaph && h("p", { className: "footer-epitaph" }, t(footer.epitaph)),
          socials.length && h("div", { className: "footer-links" },
            socials.map((s, i) => h("a", { key: i, href: "#" }, s.label || ""))
          ),
          h("div", { className: "footer-bottom" },
            h("p", null, `© ${new Date().getFullYear()} ${site.name || ""}.`)
          )
        )
      );
    }

    // Global con los labels i18n del data — seteado por SitePreview antes de los renders.
    let I18N_LABELS = {};

    // Banner del preview con toggle ES/EN. Click → cambia localStorage + reload del iframe.
    function PreviewBanner() {
      const onSwitch = (lang) => (e) => {
        e.preventDefault();
        setPreviewLang(lang);
        // Recargar SOLO el iframe del preview — el form del CMS no se ve afectado.
        setTimeout(() => location.reload(), 30);
      };
      return h("div", { className: "preview-banner" },
        h("span", null, "● Preview · cambios live (sin animaciones) · "),
        h("a", {
          href: "#",
          onClick: onSwitch("es"),
          style: { color: PREVIEW_LANG === "es" ? "var(--accent)" : "inherit", marginRight: "0.5em" }
        }, "ES"),
        h("span", null, " · "),
        h("a", {
          href: "#",
          onClick: onSwitch("en"),
          style: { color: PREVIEW_LANG === "en" ? "var(--accent)" : "inherit", marginLeft: "0.5em" }
        }, "EN")
      );
    }

    // ===== Componente principal =====
    function SitePreview(props) {
      const data = props.entry.getIn(["data"]).toJS();
      const site = data.site || {};
      const hero = data.hero || {};
      const sections = data.sections || [];
      const footer = data.footer || {};
      const socials = data.socials || [];

      // Set global labels para que los blocks puedan leer sin pasarlos por props
      I18N_LABELS = data?.i18n?.labels || {};

      // Resolución homologa de source (espejo de main.js renderSections):
      //   - data[source] array → se inyecta como sec.items (acceso uniforme en los renderers)
      //   - data[source] object → se mergea sobre sec (chapters, dossier, booking shape, etc)
      function resolveSec(sec) {
        const src = sec.source ? data[sec.source] : null;
        if (Array.isArray(src)) return { ...sec, items: src };
        if (src && typeof src === "object") return { ...src, ...sec };
        return sec;
      }

      let idx = 0;
      const sectionBlocks = sections.map((rawSec) => {
        const sec = resolveSec(rawSec);
        // El marquee no incrementa el contador roman (es un divider, no chapter)
        if (sec.type === "marquee") return h(MarqueeBlock, { key: sec.id || "marquee", section: sec });
        idx += 1;
        switch (sec.type) {
          case "chapters":     return h(ChaptersBlock, { key: sec.id, section: sec, idx });
          case "gigs":         return h(GigsBlock, { key: sec.id, section: sec, gigs: data.gigs || [], mixes: data.mixes, socials, idx });
          case "mixes":        return h(MixesBlock, { key: sec.id, section: sec, mixes: data.mixes || [], idx });
          case "memories":     return h(MemoriesBlock, { key: sec.id, section: sec, memories: data.memories || [], idx });
          case "press":        return h(PressBlock, { key: sec.id, section: sec, items: data.press || [], idx });
          case "featured":     return h(FeaturedBlock, { key: sec.id, section: sec, items: data.featured || [], idx });
          case "presskit":     return h(PresskitBlock, { key: sec.id, section: sec, items: data.presskit || [], idx });
          case "booking-card": return h(BookingCardBlock, { key: sec.id, section: sec, idx });
          default: return null;
        }
      });

      return h("div", { className: "preview-root", "data-preview-lang": PREVIEW_LANG },
        h(PreviewBanner),
        HeroBlock({ hero }),
        h("main", null, sectionBlocks),
        Footer({ site, footer, socials })
      );
    }

    // En file collections, Decap usa el nombre del FILE entry, no de la collection.
    // El config.yml define: collections[name=site].files[name=site_general]
    // → registramos para AMBOS nombres por compatibilidad
    CMS.registerPreviewTemplate("site_general", SitePreview);
    CMS.registerPreviewTemplate("site", SitePreview);
    console.log("[admin/preview] preview templates registered for 'site_general' and 'site'");
  });
})();
