## 1. The faces reach the first frame

- [x] 1.1 Turn the critical-CSS pass off for the production build in `angular.json`
      (`optimization.styles.inlineCritical: false`), so the stylesheet that declares the
      faces is applied before the document paints rather than after it. Verify by reading
      the emitted `dist/navbeacon/browser/index.html`: one plain `<link rel="stylesheet">`
      and no `media="print"` deferral (019/FR-001).
- [x] 1.2 Preload in `src/index.html` the six faces a served document draws with, each
      relative to the deployment base and each carrying `crossorigin`. Verify by measuring
      the built output in a browser: every one of the six is fetched with the document and
      finishes before the first contentful paint (019/FR-001).
- [x] 1.3 Record in `src/styles/_fonts.scss` why the stylesheet must stay render-blocking
      and what the pass does to the faces, so the setting is not read as a preference and
      undone. Verify by reading the file; it names the setting, the pass and the rule that
      holds them.

## 2. The gate

- [x] 2.1 Add `firstFrameTypefaceViolations` to `scripts/check-interface-foundations.mjs`:
      a published document may not defer a stylesheet behind a media query, must ask for a
      face of every family the emitted stylesheets declare, and every face it asks for must
      be a declared one, stated relatively, with `crossorigin`, under `rel="preload"`.
      Verify with fixtures in `scripts/check-interface-foundations.test.mjs` for each
      rejection and for the constructs each one could mistake for a violation, and by
      running `pnpm run policy` over the built output.
- [x] 2.2 Register the requirement in `e2e/coverage-ledger.ts` and evidence it in
      `e2e/prerendered-first-frame.spec.ts` over the documents the build publishes. Verify
      with `pnpm run policy:specs` and by running the production journeys
      (`pnpm run e2e:offline`).
