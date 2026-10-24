---
name: kit-report
description: Create a PDF report of results a kit-sim, kit-forge or kit-viz app has calculated, in the kit-ui look. Builds one HTML page on kit-ui (light paper, A4, page numbers, break control) and prints it to PDF with headless Chrome, Edge or Playwright. Use for any report, export, printable summary or PDF of a kit module's results. Requires the kit-ui skill.
compatibility: Claude Code, Codex, Cursor, GitHub Copilot and any agent that reads the Agent Skills format; needs Chrome, Edge or Playwright's Chromium to render
metadata:
  source: "https://github.com/Cybernaut0815/kit-UI_template/tree/main/skills/kit-report"
  version: "0.1.0"
---

# kit-report

A kit report is one HTML page on kit-ui, printed by Chromium. kit-ui is the layout engine, so the report uses the same tokens, type and primitives as the app that computed the numbers. There is no PDF library and no second design system. The kit-ui rules hold: read [../kit-ui/SKILL.md](../kit-ui/SKILL.md) §3 (the one hard rule) and [../kit-ui/reference.md](../kit-ui/reference.md) (every class) before writing markup. [examples/report.html](https://github.com/Cybernaut0815/kit-UI_template/blob/main/examples/report.html) is the reference report, and `examples/report.pdf` is its render.

## 1. Skeleton

```html
<html lang="en" data-kit="sim" data-theme="light" data-density="compact">
<head><meta charset="utf-8"><title>Daylight report - Block 4</title>  <!-- the title becomes the PDF title -->
  <link rel="stylesheet" href="…/kit-ui/css/kit-ui.css"></head>
<body>
  <main class="report stack" id="main">
    <header class="page-header">
      <div class="stack stack--tight"><span class="kit-mark">kit-<span class="kit-mark__name">sim</span></span>
        <h1 class="page-header__title">Daylight report: Block 4</h1></div>
    </header>
    <div class="cluster"><span class="badge badge--success"><span class="dot"></span>Run complete</span>
      <span class="text-muted">Run R-0724 · 24 Oct 2026, 14:32 · kit-sim 0.4.2 · kit-ui 0.1.0</span></div>
    <div class="grid" style="--grid-min: 8rem"><div class="stat">…</div></div>         <!-- the summary row -->
    <section class="section stack"><h2>Summary</h2><div class="prose"><p>…</p></div></section>
    <section class="section stack"><h2>Inputs</h2>…key/value .data-table--wrap…</section>
    <section class="section stack"><h2>Results</h2>
      <figure class="card stack stack--tight"><svg viewBox="…" role="img" aria-label="…">…</svg>
        <figcaption class="text-muted">Figure 1. … with units</figcaption></figure>
      <div class="table-wrap"><table class="data-table"><caption>Table 1. …</caption>…</table></div></section>
    <section class="section stack"><h2>Method and assumptions</h2><div class="prose">…</div></section>
    <section class="section stack page-break"><h2>Appendix</h2>…provenance table…</section>
  </main>
</body></html>
```

- `data-theme="light"` is required: paper is white, and the chart, badge and intent tokens are AA on white only in the light theme. The print baseline already flattens surfaces to white and text to black.
- `data-density="compact"`: 36 px rows and tighter tiers suit a page.
- `.report` goes on `<main>`, not `<body>`. It names the page (A4, 16 mm margins, `n / N` bottom right), sets break control and prints fills exactly. On screen it previews as a white sheet on the page background.
- There is no skip link, app shell, sidebar, button, toast, dialog or menu. Nothing on paper is clickable.

## 2. Data rules

- Every number comes from the app's computed results. Never invent, estimate or re-round a value; the report shows what the app shows.
- Keep one source: build tables, stats and charts from the same rows (the example script does), so a figure can never disagree with its table.
- Every column and axis carries its unit (`.th-unit` in headers, the unit in tick labels and legends). Number figures and tables, and caption them in plain words.
- Status is a `.badge` with a dot and a word (Pass, Review, Fail), never colour alone.
- Provenance closes the report: run id, start and finish, app and kit-ui versions, engine and settings, input file names or hashes.

## 3. Page rules

- A4 portrait. For Letter, the app's CSS may set `@page report { size: letter; }`; that is the only override allowed.
- Nothing wider than the page (about 178 mm): wrap tables in `.table-wrap`, use `.data-table--wrap` for text columns, and pivot long tables (rows × floors beat floor-zone pairs).
- Charts are inline SVG with `--chart-*` tokens set through `style` (the kit-viz rules), so they stay vector in the PDF. A canvas must draw at 2× `devicePixelRatio` or it prints blurry.
- Cards, stats, alerts, figures and table rows never split; headings never sit alone at a page foot; table headers repeat on every page. `.report` does all of this, so add nothing.
- Use `.page-break` only before a major part (an appendix), never to patch a layout. The flow places the rest.
- One identity element (the lockup) and one bold element (the summary stat row). No hero, no gradients: print strips them anyway.

## 4. Render

Chromium only (Chrome, Edge, Playwright): margin boxes, named pages and oklch need it. WeasyPrint and wkhtmltopdf miss them.

**Agent or CLI.** Both paths must be absolute: a relative `--print-to-pdf` path fails without an error.

```sh
chrome --headless --no-pdf-header-footer --print-to-pdf=/abs/out/report.pdf file:///abs/path/report.html
```

The binary is `"C:\Program Files\Google\Chrome\Application\chrome.exe"` on Windows, `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"` on macOS, and `google-chrome` or `chromium` on Linux. Edge (`msedge`) takes the same flags. The print waits for the load event, so inline chart scripts and the fonts are done.

**App backend (Node or Python).** Playwright:

```js
await page.goto(url);                                  // http(s) or file:// URL of the report
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: 'report.pdf', preferCSSPageSize: true, printBackground: true });
```

Python uses the same calls: `page.pdf(path=…, prefer_css_page_size=True, print_background=True)`.

**In the app.** Render the report into a view and call `window.print()`. The user picks "Save as PDF" and turns off the browser's headers and footers.

**Paths.** The fonts resolve relative to `kit-ui.css`, so the report must reach the real stylesheet. Write the HTML beside the app's served files, or link `node_modules/kit-ui/css/kit-ui.css` as an absolute `file://` URL. If the fonts are missing, the PDF falls back to system fonts.

## 5. Before you ship

Open the PDF and read it back, page by page:

1. The page count is sensible and `n / N` shows bottom right.
2. No table is clipped at the right edge; no row, figure or card is cut across pages.
3. No heading is stranded at a page foot.
4. Headings are Space Mono, body Geist, the lockup Tektur (not a system fallback).
5. Every number matches the app's results, with units.
6. Chart colours are the light-theme tokens and every chart has a caption and a legend or labelled axis.
