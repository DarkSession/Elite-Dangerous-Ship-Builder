## 1. The mark and the ground it stands on

- [ ] 1.1 Add a `@media (prefers-reduced-motion: reduce)` block to the `<style>` inside
      `public/assets/loader.svg` that stops the `outer` and `inner` animations, leaving every
      shape drawn at full opacity so the mark is complete and still. Verify with a unit test
      over the asset's text asserting the block is present and names both animated classes,
      and with the reduced-motion preview variant of the component in task 3, which renders
      the mark under the preference (018/FR-007).
- [ ] 1.2 Add the softened scrim to the token layer: one primitive beside
      `--ednb-palette-scrim` in `src/styles/tokens/_primitives.scss`, and the semantic name
      for it in `_semantic.scss`. Verify with `pnpm run policy`, which rejects a colour
      literal outside the token sources, and by reading the screen behind the overlay in the
      end-to-end journey of task 6.2 (018/FR-002).

## 2. The store that decides when the application is waiting

- [ ] 2.1 Add `NavigationProgress` in `src/app/application/navigation/`: it subscribes to the
      router's navigation events, starts the threshold on a navigation starting, raises its
      signal when the threshold passes with the navigation still going, and lowers it on
      every terminal event — completed, cancelled, redirected and failed. It renders nothing.
      Verify with unit tests over each of those four endings, over a navigation that ends
      inside the threshold raising nothing, over a navigation still going at the threshold
      raising the signal, and over a second navigation starting before the first ends leaving
      one raised signal that lowers with the navigation that is still going
      (018/FR-001, FR-004, FR-005).
- [ ] 2.2 State the threshold as one named constant in that file, with the reason for its
      value beside it. Verify with a unit test that reads the constant and drives the fake
      clock to one tick either side of it.
- [ ] 2.3 Ignore the navigation that starts the session: the store answers from the first
      navigation that ends onward. Verify with a unit test asserting the first navigation
      raises nothing however long it takes, and the next one raises the signal
      (018/FR-009).

## 3. The overlay in the design system

- [ ] 3.1 Add `ednb-waiting-overlay` in `src/app/ui/components/waiting-overlay/`: a
      presentation-only component taking `open` and the waiting text, drawing a native
      `<dialog>` opened with `showModal()` and closed with `close()`, with the mark from
      `assets/loader.svg` — a relative path — centred in it, `alt=""` and `aria-hidden`,
      beside a visually hidden paragraph carrying the text. The paragraph is the dialog's
      `aria-labelledby` target. Verify with component tests asserting the dialog is modal
      when open, renders nothing focusable when closed, exposes the text as its accessible
      name, and exposes the mark to no reader (018/FR-001, FR-003, FR-006).
- [ ] 3.2 Style it from tokens only: the dialog fills the viewport and carries the softened
      scrim from task 1.2, the mark is sized from a spacing token rather than the SVG's own
      height attribute, and there is no transition on opening or closing. Verify with
      `pnpm run policy` for the literal rule, and with the preview states in task 3.3 at all
      three form factors (018/FR-002, FR-008).
- [ ] 3.3 Declare the component in `src/app/ui/previews/preview-manifest.ts`: a standing
      state and a closed state, each with the `normal`, `expanded-copy`, `rtl` and
      `reduced-motion` variants, and a stated reason for each state its contract cannot
      represent — it holds no content, so it has no populated, error or disabled state. The
      standing state is isolated, as the layer's open state is, because a modal makes
      everything beside it inert. Verify with `pnpm run policy`, which fails on an exported
      UI component that declares no preview, and with `e2e/ui-preview.spec.ts`, which renders
      and scans every declared state (018/FR-002, FR-007, FR-008).

## 4. The shell mounts it

- [ ] 4.1 Add the waiting sentence to `src/app/i18n/locales/en.json` and `de.json`. Verify
      with `pnpm run policy`, which fails on a key missing from either catalogue
      (018/FR-006).
- [ ] 4.2 Mount the overlay in `src/app/app.html` beside the frame, under the same
      browser-only condition the help modal and the update overlay are mounted under, driven
      by the store's signal and the resolved sentence from `src/app/app.ts`. Verify with unit
      tests over the shell asserting the overlay is drawn when the store's signal is raised
      and absent when it is not, and with `pnpm run build`, whose prerender must emit no
      overlay into any generated document (018/FR-002, FR-009).

## 5. Unit and component verification

- [ ] 5.1 Assert in the shell's tests that a navigation whose code is held raises nothing,
      and that a navigation held open raises the overlay over whatever screen was on
      (018/FR-004).
- [ ] 5.2 Assert that the overlay carries no control, that Escape does not close it, and that
      nothing the application does removes it except the navigation ending — the wait is no
      time limit on anything behind it (018/FR-003).
- [ ] 5.3 Confirm coverage stays at or above the 80% floor `angular.json` enforces, by
      running `pnpm run test`.

## 6. End-to-end journeys

- [ ] 6.1 Add `e2e/navigation-progress.spec.ts`, running in all ten projects. Hold the ship
      builder's chunk with `page.route`, press its entry on the start page, and read: the
      overlay stands, the mark is centred in the viewport, the screen behind it is dimmed and
      not clickable, the page does not scroll horizontally, and the overlay is gone once the
      chunk is released and the screen is presented (018/FR-001, FR-002, FR-003, FR-005,
      FR-008).
- [ ] 6.2 In the same file, cover the three endings that are not a screen arriving: a chunk
      that never arrives leaves a screen a Commander can still use, a navigation redirected
      to another address takes the overlay down, and a navigation whose code is already held
      draws nothing at all (018/FR-004, FR-005).
- [ ] 6.3 Cover the stacked case: open the saved builds layer, open a build from it with the
      workspace chunk held, and read that the overlay stands in front of that layer
      (018/FR-002).
- [ ] 6.4 Scan the standing overlay with `@axe-core/playwright` against WCAG 2.0/2.1/2.2 A
      and AA with no disabled rules, and assert the screen behind it is absent from the
      accessibility tree (018/FR-003).
- [ ] 6.5 Read the overlay at 200% text size and at 400% zoom in the layout profiles that
      already carry those readings, asserting the mark stays centred and the sentence is not
      cut off (018/FR-008).
- [ ] 6.6 Assert in the served-document checks that no generated document carries the overlay
      or its text, and that opening an address draws no overlay over the first presentation
      (018/FR-009).

## 7. The record

- [ ] 7.1 Add `018-navigation-loading-overlay` to `COVERED_FEATURES` in
      `e2e/coverage-ledger.ts`, and register an entry for every id from `018/FR-001` to
      `018/FR-009`, naming the journey, whether it is scanned, the assertions beyond the scan
      and the manual protocol where one covers it. Verify with `pnpm run policy:specs`, which
      names any declared id the ledger does not register.
- [ ] 7.2 Add a step to `e2e/manual/screen-reader.protocol.md` covering what a reader is told
      when a navigation waits, and a step to the reduced-motion reading covering the mark
      standing still under the platform preference in both engines. Record the result beside
      the protocol in `e2e/manual/results/` (018/FR-006, FR-007).
- [ ] 7.3 Run `pnpm run check` and report what passed.
