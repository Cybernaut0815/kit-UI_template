# Plan - zha-ui
<!-- Work tracking. Order within Planned = priority (top = next). One bullet per item. See AGENTS.md "Work queue". -->

## In progress

- Send docs/tickets/2026-10-01-consumer-notes-0.1.3.md to both dogfood apps

## Planned

- Team accent-pair confirmations (Phase B) - blocked on team decisions: a team now adopts a catalog ENTRY (pair + signature form, per the 2026-07-23 spec §4); at confirmation - add accent.2 to its brand file, record the entry name, render-verify its surfaces
- Phase 3: React components (React Aria + CVA) + Storybook
- Phase 3: brand devices - parametric flowing lines + ghost letterform
- Phase 4: Figma <-> Git token round-trip and governance
- CI render-verify phase (automate the manual browser gate; deferred pre-1.0 by drift-guard triage)
- Detector lint over examples/ (research 2026-09-30, Spec 3 §2 "next spec", agent-first spec 2026-10-06 §8): a CI check for the anti-pattern list (inline layout, invented classes, more than one primary action, ZHA Sans below 24 px) - needs its own spec
- Contrast gate: add a brand-surface leg to the brand loop (team fills against `[data-surface="brand"]` surface-1), as island reach now puts team fills on the brand floor; ten lines on the dark-leg pattern

## Done

- 2026-10-14 0.2.0: zha-app default brand, multi-agent skill wording, consumer preflight
- 2026-10-07 0.1.4 released (PR #9 + its release PR): the README pin line names the tag form, so the copy inside the release tags stops pointing at an older version; plans, specs and the publish-branches fixture name 0.1.3

- 2026-10-06 0.1.3 released (PR #7 + release PR #8): Spec 3, the fix-later pass, the register sweep and the agent-first pass, as a patch at the maintainer's decision; registry publish, tags, release branches and the no-PAT install verified

- 2026-10-06 Agent-first pass on feat/composition-layer (plan: docs/plans/2026-10-06-zha-ui-agent-first-pass.md): the graphic design team's meshes on the showcase; .hero--bleed aligned with the container; fourteen open review items closed (skip link, aria-disabled controls, chip-remove guard, reduced transparency, forced colours, llms deprecation, React drift guard, failing-when-missing tests, foundation labels, deck primitives, status lines, ports); the zha-ui skill (skills/zha-ui) with the agent-first quick start in the README and hub; render-verified
- 2026-07-23 0.1.2 released (PR #5 + release PR #6): quick wins, the no-PAT git-URL install route, the gradient pool redesign and the viz tokens; release branches and tags verified end-to-end
- 2026-10-02 Composition layer fix-later pass: the 19 minors the 2026-10-01 whole-branch review deferred (test anchors and order pins, zero-specificity hero floor, .app-bar__nav-toggle, disabled-hover guard, chevron exemption, prose first heading, 16px alert icon, print toast, guard boundary + script-only prefix skip, guidance lines, spec amendments, notes) on feat/composition-layer (plan: docs/plans/2026-10-02-composition-layer-fix-later.md)
- 2026-10-01 Composition layer (Spec 3) IMPLEMENTED per the 2026-09-30 spec (§11 executed, 13 tasks on feat/composition-layer): layout and type tokens incl. two z-index tokens, element defaults in :where() + .prose, .container/.stack/.cluster/.grid/.section/.split/.toolbar/.form-grid/.hero/.eyebrow/.table-wrap, control state matrix + outline focus ring, phone-width shell with the data-nav-open drawer, .toast/.spinner, drift-guard inline-style rule, AGENTS/DESIGN/AI-USAGE rewritten (rules + recipes + checklist), hub + vanilla + React starters rebuilt, 0.1.3 changeset + consumer notes; render-verified per §9 (vanilla, hub and React starter at 1440/390 in light, dark and on the brand floor, with hover/focus crops, dialog/toast/empty state/nav-open and foundation section 26: 43 captures, no defects); preview deleted (plan: docs/plans/2026-10-01-zha-ui-composition-layer.md)
- 2026-07-23 Gradient pool redesign IMPLEMENTED per the same-day spec (§7 executed): 16 signature-form entries (journeys/conics/auroras/fields) + -oklch twins + .accent-grad-aurora/-conic/-duo team wardrobe; aurora background-color floors; split linear/conic in-oklch feature tests; showcase rebuilt by family; docs + llms + changeset rewritten; render-verified light/dark/brand + 7-brand wardrobe matrix; preview deleted (plan: docs/plans/2026-07-23-zha-ui-gradient-pool-redesign.md)
- 2026-07-22 Viz/chart tokens IMPLEMENTED per the same-day spec (§7 executed): --chart-cat-1..8/other + --chart-seq-1..6 + --chart-div-neg-3..pos-3/mid + text/grid aliases, per-theme incl. brand-surface; gate 3.0 pairs + ramp-monotonicity/mirror tests (chart.test.ts); llms guidance; AI-USAGE/AGENTS/DESIGN §Charts; consumer notes updated with the colormap.js/chartTheme.js mapping (3D result-field ramps explicitly kept); render-verified light/dark/brand
- 2026-07-22 Adversarial review (3 parallel reviewers) of the tie-up commit; all findings fixed in 4e27d65 — print-safe tinted chips, correct css-v tag form, gate bg-page composite leg, cascade order pins, chip__remove 24px halo, spec scoping
- 2026-07-22 Phase tie-up: team-pair gradient pool exposed (13 un-assigned --grad-pair-*/.grad-pair-* sweeps + showcase section + docs); per-hue --typology-<hue>-text tokens (culori-computed, gate-enforced vs surface AND tint composite) + 12 .chip--<hue> variants + .chip__remove; P4 viz/chart token spec authored (docs/specs/2026-07-22-zha-ui-viz-chart-tokens-design.md, validator-derived palette + ramps); changesets cut; consumer notes drafted
- 2026-07-15 Examples hub shipped: navigational front door for all examples + team network-share mirror + file://-safe inlined logo
- 2026-07-13 v0.1.1 released: self-hosted Inter Variable bundled as the primary-font fallback (OFL, no API changes)
- 2026-07-13 v0.1.0 released: Phase 0 foundation (tokens + CSS packages) merged via PR #1 and published to the org GitHub Packages registry
- 2026-07-10 Phase-B token keystone landed pre-release: [data-theme=light] counter-scope block + deck reconversion payoff + structural drift-guard hardening
