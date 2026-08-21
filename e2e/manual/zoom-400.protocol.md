# Manual protocol: actual 400% browser zoom

**Protocol id**: `zoom-400`
**Covers**: FR-011, FR-012, SC-003
**Version**: 2

## What is automated, and what is left

WCAG 1.4.10 defines 400% zoom by equivalence: content at 1280x1024 zoomed to 400% is content at a
**320x256 CSS-pixel viewport**. That is the normative measurement, and `e2e/reflow.spec.ts` runs it
in both engines across all ten projects — no horizontal page scroll, every landmark, every action
present with visible text, every target reachable, the banner released and travelling with the page,
nothing clipped, a layer at full height, an axe scan, and the same viewport again at 200% text.

Under actual browser zoom every length scales with the CSS pixel, so the layout in CSS pixels is the
same layout. Borders, focus rings and scrollbars do not consume more CSS space at 400% — a scrollbar
consumes less. This protocol therefore does **not** exist because automation measures the wrong
thing.

It exists for the two things the automated run genuinely cannot reach:

1. **Actual zoom cannot be driven.** Playwright has no API for reflow zoom, CDP's
   `setPageScaleFactor` is pinch-zoom rather than reflow zoom, and Firefox exposes nothing
   equivalent. Real zoom also brings the browser's own chrome and the operating system's toolbars,
   which take physical space no viewport setting reproduces.
2. **Usability is a judgment, not an assertion.** "Nothing is lost" and "nothing is truncated
   without a way to read it" are asserted mechanically; whether a Commander can still _get the job
   done_ in what is left is not a measurement.

A person running this is confirming the automated result against a real browser and forming that
judgment — not substituting for the measurement.

## Environment to record

Every run records all of it. A result without versions cannot be reproduced or trusted later.

| Field                | Example                         |
| -------------------- | ------------------------------- |
| Operating system     | Windows 11 24H2                 |
| Browser and version  | Firefox 141.0                   |
| Application build    | git SHA of the build under test |
| Physical display     | 1920×1080 at 100% OS scaling    |
| Viewport before zoom | 1280×800 CSS pixels             |
| Orientation          | landscape                       |
| Date                 | ISO date of the run             |

Run the full protocol in **both Chromium and Firefox**, and in **both orientations** where the
device can be rotated. Rotating a desktop window means resizing it to a portrait aspect.

## Setup

1. Build and serve the production build (`pnpm run build && pnpm run e2e:offline` serves it, or
   `node scripts/serve-production.mjs`). Zoom behaviour differs between a dev server and a
   production build only if the styles differ; use the production build so the record matches what
   ships.
2. Open the application at 100% zoom and confirm the capability under test renders.
3. Apply **browser zoom** — `Ctrl`/`Cmd` and `+` until the indicator reads 400%. Do not use the
   operating-system magnifier, and do not change the root font size: that is the separate 200%
   text-scale gate.

## Steps, for each capability and state

Steps 1-4 and 8 are already asserted at the equivalent viewport; confirm rather than re-derive them,
and record a row only where the browser disagrees with the automated result. Steps 5-7 are where a
real window, real chrome and a real pointing device can still surprise the suite.

1. **No horizontal page scrolling.** Scroll to the block end of the page. The document must not
   scroll sideways at any point. A component may own a labelled, bounded scroller; the page may not.
2. **Nothing is lost.** Every action, datum and status available at 100% is still present. An action
   that has moved into the compact action layer counts as present; an action that has disappeared
   does not.
3. **Every action still carries visible text.** No control collapses to an unlabelled glyph or
   ellipsis at any zoom level.
4. **Nothing is truncated without a way to read it.** Text may wrap; it may not be clipped with no
   scroller and no disclosure to reach the rest.
5. **Sticky regions release.** The banner must not occupy a large share of the viewport. At 400%
   the viewport is short, so the banner is expected to scroll away with the page.
6. **Layers stay usable.** Open a layer. It must present full height rather than as a centred
   dialog whose content is cut off, and dismissing it must return to the invoking control.
7. **Targets stay reachable.** Every control can be activated by pointer, and by a single touch on
   a touch device, without a hover step and without a two-finger gesture.
8. **Focus stays visible.** The focus ring is visible against the surface under it and is not
   clipped by an ancestor's overflow.

## Recording the result

Append one row per capability/state/engine/orientation to `results/zoom-400.md`, with the expected
behaviour, what actually happened, and pass or fail. A failure records what was observed, not a
diagnosis. Do not summarise several runs into one row; a row is one observation.
