# ZHA Brand Reference (digital) - distilled from ZHA_Brand-Book_2026 + brand assets

**Date:** 2026-06-20 · **Source:** `\\zaha-hadid.com\…\__Z_H_A__Brand_Assets\BRAND ASSETS\` (Brand Book 2026, 48pp; ZHA_Colour_2026; ZHA_Gradients; ZHA_Logo; ZHA_Report_Covers). Brand Book is **"For internal use only."**
**Purpose:** the authoritative brand digest for `@zha-ui`. Curated for a *digital* design system. Where the brand book and the vendored tokens disagree, the brand book wins; where exact colour values matter, the **`.ase` swatch file is authoritative** (parse it, don't transcribe from PDFs).

> Naming rule: the firm is **ZHA** - always. Never write out its former spelled-out name.

---

## 1. Brand essence (drives design decisions)

- **Tagline:** *"Forever Advancing Architecture."*
- **Concept north-star:** *refracted light on architecture* - this is the rationale for the full 12-hue spectral palette (each hue = a business typology; combined = a prism). Design language: **"clean lines, bold geometry, striking yet refined."**
- **Black-first identity.** zha-hadid.com is pure-black backgrounds, white headlines, full-bleed architectural photography with a dark gradient overlay. Black ("Black Steel") is the *primary* brand colour.
- **Brand values:** Purposeful Innovation · Restless Curiosity · Intelligent Collaboration · Meaningful Beauty.
- **Sustainability is core** (Reason-to-Believe #4) - relevant for the ES team consumers.

---

## 2. Colour

### 2.1 Neutrals (brand-pure)
| Name | HEX | RGB | PMS | Role |
|---|---|---|---|---|
| **Black Steel** (primary) | `#000000` | 0/0/0 | 419 C | Logo, type, backgrounds - the dominant brand surface |
| **Concrete Gray** | `#d4d4d4` | 212/212/212 | 427 C | Secondary neutral |
| **Alabaster White** | `#ffffff` | 255/255/255 | 663 C | Secondary neutral |
| Dim Gray | `#999999` | 153³ | 422 C | **Type only** |
| Dark Gray | `#777777` | 119³ | 424 C | **Type only** |
| Slate Gray | `#333333` | 51³ | 447 C | **Type only** |

> The brand grays are explicitly *typography-only*. A data-dense UI legitimately needs more surface greys than the brand specifies → those live in the **data-app extension layer** (see §7), not the brand core. The **warm-paper `#F4F2F0` ladder used by CDT/Digital-Archive is NOT in the brand book** - it is a sanctioned domain extension, not brand-core.

zha-ui's firm brand, `zha-app`, takes its accent from these neutrals: ink on light, white on dark and brand surfaces. Ink (`#1d1d1b`) is not a §2.1 colour: it is zha-ui's paper-black, the logo's as-drawn fill (§4), standing in for Black Steel on the paper surface. The grays are a deliberate exception to the table's "type only" note: Dark Gray is the second gradient stop, and Slate Gray and Concrete Gray are the hover fills. Team pairs stay in §2.2.

### 2.2 Typology ramp (12 hues - authoritative mapping, brand book p.28)
Ordered cool→warm = large-scale→intimate-scale projects ("a notation… for the purposes of the website").

| # | Typology | Name | HEX | Note |
|---|---|---|---|---|
| 1 | Transport + Infrastructure | Purple | `#7633E2` | |
| 2 | Sports | Ultramarine | `#2838E6` | |
| 3 | Mixed-Use | Blue | `#1372DE` | |
| 4 | **Tall Buildings** | Teal | `#048C9C` | ⚑ brand book maps Teal→Tall Buildings (not "Offices") |
| 5 | **Offices** | Dark Green | `#1A9D67` | ⚑ Dark-Green→Offices |
| 6 | Heritage + Regeneration | Light Green | `#99C025` | |
| 7 | Education | Lime | `#C6BE13`?/`#C8BE13`? | ⚑ Colour-sheet `#C6BE13` vs Brand-Book p.28 `#C8BE13` - **resolve from `.ase`** |
| 8 | Civic | Yellow | `#F5BB00` | |
| 9 | Culture | Apricot | `#F3901B` | |
| 10 | Retail | Orange | `#E74D2B` | |
| 11 | Hospitality | Cool Red | `#E61C4E` | |
| 12 | Residential | Magenta | `#CB0092` | |

ES accent **pair**: **Teal `#048C9C`** (primary) → **Magenta `#CB0092`** (secondary), blended as the team gradient `--brand-grad` (earlier framed as light/dark variants - they are the two stops of the one pair). All 12 hues match our vendored tokens except the Lime ambiguity above.

### 2.3 Opacity-tint system (core brand device)
Every typology colour ships at **100 / 75 / 50 / 25%**, shown **on white AND on black**. Brand intent is *transparency on a surface* ("the art of opacity tints… a luxurious, tactile dimension") - implement with real CSS `opacity`/alpha, surface-aware, **not** pre-mixed flat hex. → a `--typology-{name}-{100|75|50|25}` token group (or alpha-channel variants).

### 2.4 Gradients & mesh backgrounds (sanctioned)
- The 12 hues blend in **spectrum order** into continuous gradients - both a **wayfinding tool** and a **decorative hero treatment**. Shipped as `--grad-spectrum` / `.grad-spectrum`.
- **Gradient mesh backgrounds** are dark-base, soft-radial, downloadable hero assets. Four masters
  are **shipped as frozen sRGB tokens** - `--grad-hero-ember` (01), `--grad-hero-ocean` (02),
  `--grad-hero-violet` (04), `--grad-hero-dusk` (05, most brand-core; good homepage hero) - with
  matching `.grad-hero-*` utilities. Authored values live in
  `packages/tokens/src/semantic/core.tokens.json`; they are deliberately **not** oklch-converted
  (frozen art - see `docs/specs/2026-07-09-zha-ui-gradient-library-design.md`). Master 03 was not
  analysed and is not shipped. Text on these assumes `color-scheme:dark`; the amber zones
  (ember/violet/dusk) reach ~L35-40% - verify white-text contrast there (the gate can't see gradients).

---

## 3. Typography

| Role | Face | Source / licence |
|---|---|---|
| Primary (all UI/body) | **Neue Haas Unica** (Ultralight→ExtraBlack + italics, Latin+Cyrillic) | Adobe Fonts - **NOT freely self-hostable; webfont licence required** |
| Secondary (logo + editorial only) | **ZHA Sans** (bespoke) | internal (OpenAsset) |
| Chinese | **Noto Sans SC** | Google/Adobe Fonts (free) |
| Arabic display/UI | **Noto Kufi Arabic** | Google/Adobe Fonts (free) |
| Arabic body | **Noto Sans Arabic** | Google/Adobe Fonts (free) |

**zha-ui decision (Phase 0 spec 2026-06-20, revised 2026-07-13 for 0.1.1):** pursue the Neue Haas Unica webfont licence as a procurement action; **ship self-hosted Inter (bundled in the CSS package) as the fallback** meanwhile. Tokens name `"Neue Haas Unica"` first, so it renders where licensed/installed and the full swap is free once a webfont licence lands; Inter is a visually close substitute, not a metric clone.

**Type-in-use rules (brand book p.20-22):**
- **Headers:** Neue Haas Unica, **sentence case**, Medium or Regular, `letter-spacing:-0.03em` (tracking −30), `line-height:1.0`.
- **Body:** Neue Haas Unica, sentence case, Regular or Light, `letter-spacing:-0.01em` (tracking −10), `line-height:1.2`.
- **Sentence case is mandatory** for headers and body. Exceptions: small category/tag **chips may be ALL-CAPS** (e.g. "HOSPITALITY", seen on web); a **single word may be all-caps for emphasis** within body ("EXCEED"). ⚑ This tempers our current uppercase micro-label habit - keep uppercase only for chips/eyebrow labels, not headings/body.
- **ZHA Sans is restricted:** logo, short editorial headers, section dividers, large display numerals **only**. Never in long-form/body/labels/UI controls, and **never on the same surface as Neue Haas Unica**.

---

## 4. Logo

- Asset: 3-path SVG, `viewBox="0 0 283.5 110.3"` (≈2.57:1). Fill `#1d1d1b` (warm near-black, as-drawn) / `#ffffff`. Variants are identical but for fill → ship one inline **`<ZhaLogo>` with `fill="currentColor"`**, `role="img"` + `aria-label="ZHA"`. Formats on disk: AI/EPS/PDF/SVG/PNG.
- **Minimum digital width: 50px.** **Clearspace = cap-height of the "Z"** on all sides (≈ logo-height × 0.72). **Horizontal orientation only** for digital (vertical = letterhead/print exception).
- **Misuse (hard prohibitions):** no keyline/border, no recreating in another typeface, no angling/skew, **no placing the logo inside a solid filled block** (no logo-in-a-badge/pill), don't run vertical bottom-to-top, never alter proportions.
- Web placements: nav = **top-left, compact, white-on-dark**; document/cover = **bottom-right, generous, 100%**.
- **Animated reveal:** chromatic-aberration / RGB-split, resolving to white-on-black.

---

## 5. Brand decorative devices (→ `@zha-ui` components, mostly Phase 3)
- **Parametric flowing lines:** thin curved strokes sweeping **lower-left → upper-right**; either mono-tonal (lighter tint of the surface) or polychromatic (typology ramp in spectrum order). → `<ZhaLines variant="burst|sweep|both" />`, always `aria-hidden`, reduced-motion safe.
- **Ghost ZHA letterform:** oversized cropped wordmark at ~15-25% opacity as a background graphic (lighter tint on dark, darker on light). → CSS pseudo-element / SVG bg utility. (Distinct from the logo lockup - and not subject to the "no block" rule since it's a bg texture, not the logo mark.)
- **Gradient mesh heroes:** §2.4.

---

## 6. Voice & tone (→ UX-writing guidance)
- **Personality:** **Striking · Refined · Thoughtful · Grounded.**
- **Writing rules:** show don't tell · lead with the benefit · start with the end · headings carry the key points · **write to skim** (explicitly digital - short lines, brevity) · read aloud.
- **In UI:** action-forward CTAs ("Explore", "Discover", "Share →") not "Submit/Click here"; error states clear and solution-oriented; empty states inspire, don't apologise; "ZHA" rendered visually distinct in running copy.

---

## 7. Surface-role model (zha-ui decision, Phase 0 spec 2026-06-20)
**Dual-default by surface role, both themes always available:**
- **Brand surfaces** (marketing/hero/cover/landing/splash) default **black-first** - pure black, white headlines, gradient-mesh heroes, parametric lines.
- **Work surfaces** (dashboards, tables, charts, forms) default **light** for legibility on long analytical sessions and print/PDF export - with **dark mode** fully available. These use the **data-app neutral extension** (the warm-paper ladder: `#F4F2F0` page, white/`#ECEAE8`/`#DDDCDB` surfaces) layered over the brand-pure core.
- Mechanism: `data-theme` (light/dark) remains the axis; a surface declares its default (e.g. `data-surface="brand|work"`), and `data-brand` (es/code/…) overrides accent + logo slot. Brand-pure neutrals are the core primitives; warm-paper is a documented domain-extension token set (the brand book's own §10 "domain extension" rule sanctions this).

---

## 8. Web / responsive patterns observed (zha.com)
- Nav: ZHA wordmark left; mobile adds **search + hamburger** (vertical separator) right.
- Hero: full-bleed art-directed photography (different image per breakpoint) + **dark gradient overlay** (not a solid block) + large white bold headline; two-column editorial body on desktop, single column mobile.
- Layout motifs worth tokenising: hairline-rule above column headers; equal N-column "principles" grids; numbered-rule lists; 3-col portrait people grid; outline pill/chip category tags; asymmetric content-left / decoration-right shell.
- Report-cover language (print, as *inspiration*): asymmetric top-left title anchor, huge negative space, logo as bottom-right terminus, tone-on-tone diagonal line art, weight-300 titles, theme-swappable colourways (teal / crimson / navy). → digital `HeroBand`, PDF-export cover, `ZhaLines`, project-card header band, asymmetric `PageShell`.

---

## 9. Open procurement / asset actions
- **Neue Haas Unica webfont licence** (Adobe Fonts web project or Monotype) - needed before NHU ships as a self-hosted webfont; self-hosted Inter (`@fontsource-variable/inter@5.2.8`, latin + latin-ext) is the bundled fallback until then.
- **Parse `ZHA_and_Typology_Colours_2026.ase`** for canonical colour values (resolves the Lime `#C6BE13`/`#C8BE13` ambiguity) - feed the DTCG token build.
- ZHA Sans webfont packaging (from OpenAsset) for the limited editorial/logo contexts.
