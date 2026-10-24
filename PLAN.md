# Plan - kit-ui
<!-- Order within Planned = priority (top = next). One bullet per item. See AGENTS.md "Work queue". -->

## In progress

## Planned

- Port kit-sim_daylight_frontend web/ to kit-ui with data-kit="sim": swap the dependency and import, drop its radius-zeroing override and its data-theme bootstrap script in favour of the system default, replace its copied cssVar helper with getComputedStyle
- Rename the GitHub repo to kit-ui and update the install lines
- Publish the repo and tag v0.1.0 so modules can install from the git tag

## Done

- 2026-10-24 0.1.0: rebuilt from the former company design system - identity removed, square corners, orange → red → purple ramp, Geist fonts, outlined danger, no build (css/ is the package), single node:test gate, three file:// examples
- 2026-10-24 kit-ui: renamed from kit-forge-ui; dark by default and following the system; burgundy and a deeper purple in the ramp; multi-stop oklch gradients; data-kit presets sim (orange), forge (red), viz (purple) replace data-accent, with a per-kit .grad-kit
