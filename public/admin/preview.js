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

    // Cargar el CSS del sitio + nuestros overrides en el iframe
    CMS.registerPreviewStyle("/css/styles.css");
    CMS.registerPreviewStyle("/admin/preview.css");

    // ===== Helpers =====
    const roman = (n) =>
      ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n - 1] || String(n);

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
          hero.role && h("span", { className: "hero-role" }, hero.role),
          h("button", { className: "hero-engage", disabled: true },
            h("span", { className: "hero-engage-rule hero-engage-rule--top" }),
            h("span", { className: "hero-engage-label" }, hero.engage?.labelOff || "Engage ritual"),
            h("span", { className: "hero-engage-rule hero-engage-rule--bottom" })
          )
        )
      );
    }

    function SectionHeader({ idx, title, subtitle }) {
      return [
        h("span", { key: "lbl", className: "section-label" }, roman(idx)),
        h("h2",   { key: "ttl", className: "section-title" }, title || ""),
        subtitle && h("p", { key: "sub", className: "section-subtitle" }, subtitle),
      ];
    }

    function ChaptersBlock({ section, idx }) {
      const items = section.items || [];
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
          dossier.title && h("h3", { className: "dossier-title" }, dossier.title),
          h("dl", { className: "dossier-list" },
            dossier.rows.map((r, i) =>
              h("div", { key: i, className: "dossier-row" },
                h("dt", { className: "dossier-key" }, r.key || ""),
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

      const stats = h("div", { className: "epk-stats" }, [
        h("div", { key: "s1", className: "epk-stat" },
          h("span", { className: "epk-stat-num" }, String(gigs.length).padStart(2, "0")),
          h("span", { className: "epk-stat-label" }, "Rituals played")),
        h("div", { key: "s2", className: "epk-stat" },
          h("span", { className: "epk-stat-num" }, String((mixes || []).length).padStart(2, "0")),
          h("span", { className: "epk-stat-label" }, "Productions")),
        h("div", { key: "s3", className: "epk-stat" },
          h("span", { className: "epk-stat-num" }, String((socials || []).length).padStart(2, "0")),
          h("span", { className: "epk-stat-label" }, "Platforms")),
        h("div", { key: "s4", className: "epk-stat" },
          h("span", { className: "epk-stat-num" }, "170"),
          h("span", { className: "epk-stat-label" }, "BPM peak")),
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
              h("span", { className: "ritual-status" }, "ON SALE")
            )
          );
        })
      );

      const archiveEl = past.length && h("div", { className: "archive" },
        h("h3", { className: "archive-title" }, "† Archive"),
        h("table", { className: "archive-table" },
          h("thead", null, h("tr", null,
            h("th", null, "Date"), h("th", null, "Venue"), h("th", null, "City"))),
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
                m.description && h("p", { className: "setlist-desc" }, m.description)
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
                  ? h("img", { className: "memory-image", src: m.image, alt: m.venue || "" })
                  : h("div", { className: "memory-image memory-image--empty" }),
                h("span", { className: "memory-badge" }, m.date || "—"),
                h("span", { className: "memory-chapter" }, roman(i + 1))
              ),
              h("div", { className: "memory-body" },
                h("h3", { className: "memory-venue" }, m.venue || ""),
                m.city && h("p", { className: "memory-city" }, m.city),
                m.anecdote && h("p", { className: "memory-anecdote" }, `"${m.anecdote}"`)
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
              h("p", { className: "reverb-quote" }, `"${p.quote || ""}"`),
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
              h("span", { className: "presskit-kind" }, it.kind || ""),
              h("h3", { className: "presskit-title" }, it.title || ""),
              it.description && h("p", { className: "presskit-desc" }, it.description),
              h("span", { className: "presskit-cta" }, `${it.cta || "Download"} →`)
            )
          )
        )
      );
    }

    function BookingCardBlock({ section, idx }) {
      const c = section.card || {};
      if (!c.email) return null;
      return h("section", { id: section.id, className: "section" },
        SectionHeader({ idx, title: section.title, subtitle: section.subtitle }),
        h("div", { className: "booking-card" },
          c.intro && h("p", { className: "booking-card-intro" }, c.intro),
          h("div", { className: "booking-card-cta" },
            h("span", { className: "booking-card-cta-label" }, c.emailLabel || "† Direct booking"),
            h("span", { className: "booking-card-cta-email" }, c.email),
            h("span", { className: "booking-card-cta-arrow" }, "→")
          ),
          c.brief?.length && h("div", { className: "booking-card-brief" },
            h("span", { className: "booking-card-brief-label" }, "† Include in your brief"),
            h("ol", { className: "booking-card-brief-list" },
              c.brief.map((b, i) =>
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
          footer.epitaph && h("p", { className: "footer-epitaph" }, footer.epitaph),
          socials.length && h("div", { className: "footer-links" },
            socials.map((s, i) => h("a", { key: i, href: "#" }, s.label || ""))
          ),
          h("div", { className: "footer-bottom" },
            h("p", null, `© ${new Date().getFullYear()} ${site.name || ""}.`)
          )
        )
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

      let idx = 0;
      const sectionBlocks = sections.map((sec) => {
        if (sec.type === "marquee") return null;
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

      return h("div", { className: "preview-root" },
        h("div", { className: "preview-banner" }, "● Preview · cambios live (sin animaciones)"),
        HeroBlock({ hero }),
        h("main", null, sectionBlocks),
        Footer({ site, footer, socials })
      );
    }

    CMS.registerPreviewTemplate("site", SitePreview);
    console.log("[admin/preview] preview template registered for 'site'");
  });
})();
