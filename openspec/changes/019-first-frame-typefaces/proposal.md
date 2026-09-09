## Why

A Commander opening `navbeacon.app` sees the text change. The page arrives in a system
face, and a moment later every word of it is re-drawn in Barlow. The two families do not
measure the same, so the page changes height under the swap as well as changing shape.

The faces are same-origin subsets declared in the one stylesheet the application ships.
The production build's critical-CSS pass is what separates them from the first frame. That
pass inlines the rules it judges critical, moves the stylesheet behind the first paint, and
keeps an `@font-face` only where a critical rule names the family in a `font-family` value.
Every rule in this application names a family through a design token, which the pass cannot
resolve, so it drops all twenty faces: the first frame is served with the tokens, the
layout and the colours, and no typeface to draw them in.

Nothing states that a served document has to arrive wearing its own faces, so nothing
caught it. `platform/published-addresses` says the first frame shows the address's content
(015/FR-008) and is laid out for its viewport (015/FR-010); "An invisible takeover"
(015/FR-009) measures what the application moves, and the suite waits the faces out before
it measures, on purpose. The development build runs no critical-CSS pass, so no suite ever
saw the defect either.

## What Changes

- A served document is drawn in the application's own typefaces from its first frame. The
  stylesheet that declares the faces is applied before the document paints, and the faces a
  document draws with are asked for beside the document rather than a round trip behind
  that stylesheet.
- The production build stops deferring that stylesheet: `optimization.styles.inlineCritical`
  is `false` in `angular.json`. The first paint waits for one 36 kB same-origin stylesheet,
  and the service worker holds it and the faces for every load after the first.
- `src/index.html` preloads the faces a served document draws with — Barlow 400 and 700,
  Barlow Condensed 600 and 700, and JetBrains Mono 400, 500 and 700, each the `latin` subset,
  which covers both languages the application ships. The set is measured on the built output
  with the bundle held, across the start page, the catalogue, a hull, the two benches and the
  fallback.
- A policy rule holds both halves in the emitted output, because neither is visible in a
  source file and both are one configuration key away from being undone.

The change declares one requirement:

- **FR-001** A served document is drawn in the application's own typefaces from its first
  frame: the stylesheet declaring its faces is applied before it paints, and it asks for a
  face of every family it draws with.

Nothing is added to the design system, no screen changes, and the faces, their subsets and
their licences are unchanged.

## Impact

- `platform/published-addresses` gains FR-001 above.
- `angular.json`, `src/index.html` and `src/styles/_fonts.scss` carry the fix and the reason.
- `scripts/check-interface-foundations.mjs` gains the rule, with fixtures beside it.
- `e2e/prerendered-first-frame.spec.ts` evidences the requirement over the served documents.
