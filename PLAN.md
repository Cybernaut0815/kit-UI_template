# Plan - kit-ui
<!-- Order within Planned = priority (top = next). One bullet per item. See AGENTS.md "Work queue". -->

## In progress

## Planned

- Port kit-sim_daylight_frontend web/ to kit-ui with data-kit="sim": swap the dependency and import, drop its radius-zeroing override and its data-theme bootstrap script in favour of the system default, replace its copied cssVar helper with getComputedStyle
- Report footer: a running report title beside the page number (Chrome has no string-set; a position: fixed element repeats per printed page)
- Print light chart tokens on an unthemed dark page: fold print into the system-light block (@media (prefers-color-scheme: light), print) so Ctrl+P of a dark app keeps charts legible on white
- examples/index.html app bar overflows at 390 px (six nav links): collapse them below 640 px

## Done

- 2026-10-24 0.1.0: rebuilt from the former company design system - identity removed, square corners, orange → red → purple ramp, Geist fonts, outlined danger, no build (css/ is the package), single node:test gate, three file:// examples
- 2026-10-24 kit-ui: renamed from kit-forge-ui; dark by default and following the system; burgundy and a deeper purple in the ramp; multi-stop oklch gradients; data-kit presets sim (orange), forge (red), viz (purple) replace data-accent, with a per-kit .grad-kit
- 2026-10-24 .kit-mark lockup (KIT-SIM / KIT-FORGE / KIT-VIZ, kit word in the kit accent), .viewport with run bar and info, .split--fill full-height tool layout; one test page per kit (simulation, generation, visualization)
- 2026-10-24 always-black app bar, gradient kit word (--grad-mark), Tektur lockup, Space Mono headings, edge-to-edge tool layout (.panel, gapless .split--fill, borderless viewport)
- 2026-10-24 button fills = centre colour of each kit gradient (--accent-fill per kit, gate-checked), --accent split off for links and focus; lockup uses --grad-kit itself (--grad-mark removed) with a hover sweep over KIT-
- 2026-10-24 README preview image (.github/preview.png); GitHub Pages entry (root index.html redirect, .nojekyll); install lines point at Cybernaut0815/kit-UI_template
- 2026-10-24 kit-report skill (skills/kit-report): PDF reports as one kit-ui page printed by Chromium; .report (A4 named page, n / N page numbers, break control, sheet preview) and .page-break in kit-ui.css; examples/report.html (kit-sim daylight results) with its render examples/report.pdf
- 2026-10-24 v0.2.0: first git tag (0.1.0 was never tagged), with the kit-report skill; install lines, package and skill versions point at #v0.2.0
- 2026-10-29 v0.2.1: skills/ ships in the package (files and the "./skills/*" export), so apps read both skills from node_modules; install lines, package and skill versions point at #v0.2.1
