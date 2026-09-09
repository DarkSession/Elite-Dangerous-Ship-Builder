## 1. The mark and the ground it stands on

- [ ] 1.1 Add a `@media (prefers-reduced-motion: reduce)` block to the `<style>` inside
      `public/assets/loader.svg` that stops the `outer` and `inner` animations, leaving every
      shape drawn at full opacity so the mark is complete and still. This fixes a defect
      against `platform/accessible-responsive-operation`, "Reduced motion" (011/FR-013), in
      all three places the application draws the mark. No scan can judge that the animation
      stopped inside an SVG drawn through `<img>`: what verifies the edit is the policy rule
      in task 1.2, and what verifies the behaviour is the manual reading in task 7.2.
- [ ] 1.2 Add a rule to `scripts/check-interface-foundations.mjs` asserting the shared
      waiting mark carries that block and that the block names both animated classes, so the
      one motion value the token layer cannot reach cannot be dropped unnoticed. Verify with a
      case in `scripts/check-interface-foundations.test.mjs` over an asset with the block and
      one without, and by running `pnpm run policy`.
- [ ] 1.3 Add the softened scrim to the token layer: `rgb(6 6 7 / 0.55)` as a primitive
      beside `--ednb-palette-scrim` in `src/styles/tokens/_primitives.scss`, and the semantic
      name for it in `_semantic.scss`. Verify with `pnpm run policy`, which rejects a colour
      literal outside the token sources, and by reading the screen behind the overlay in the
      end-to-end journey of task 6.1 (018/FR-002).

## 2. The store that decides when the application is waiting

- [ ] 2.1 Add `NavigationWaiting` in `src/app/application/navigation/`: it subscribes to the
      router's navigation events, starts the threshold when a navigation starts, raises its
      waiting signal when the threshold passes with the navigation still going, and lowers it
      on every terminal event — completed, cancelled, redirected and failed. It renders
      nothing. Verify with unit tests over each of those four endings, over a navigation that
      ends inside the threshold raising nothing, over a navigation still going at the
      threshold raising the signal, and over a second navigation starting before the first
      ends leaving one raised signal that lowers with the navigation that is still going
      (018/FR-001, FR-004, FR-005).
- [ ] 2.2 State the threshold as one named constant of 10 milliseconds in that file, citing
      the specification that fixes the value. Verify with a unit test driving a fake clock to
      one tick either side of it, asserting nothing is raised below and the signal is raised
      above (018/FR-004).
- [ ] 2.3 Raise a second signal when a navigation ends without presenting its screen, and
      lower it on the next navigation that succeeds. It carries no reason, because the router
      reports none. Verify with unit tests over a failed navigation raising it, a successful
      one lowering it, and no reason being carried (018/FR-007).
- [ ] 2.4 Ignore the navigation that starts the session: the store answers from the first
      navigation that ends onward. Verify with a unit test asserting the first navigation
      raises nothing however long it takes, and the next one raises the signal (018/FR-008).

## 3. The overlay in the design system

- [ ] 3.1 Add `ednb-waiting-overlay` in `src/app/ui/components/waiting-overlay/`: a
      presentation-only component taking `open` and the waiting text, drawing a native
      `<dialog>` opened with `showModal()` and closed with `close()`, with the mark from
      `assets/loader.svg` — a relative path — centred in it, `alt=""` and `aria-hidden`,
      beside a visually hidden paragraph carrying the text. The paragraph is the dialog's
      `aria-labelledby` target. It carries no control, and it refuses the native cancel, as
      the update overlay does. Verify with component tests asserting the dialog is modal when
      open, renders nothing focusable when closed, exposes the text as its accessible name,
      exposes the mark to no reader, and draws no control (018/FR-001, FR-003, FR-006).
- [ ] 3.2 Style it from tokens only: the dialog fills the viewport and carries the softened
      scrim from task 1.3, the mark is centred and sized from a spacing token rather than from
      the SVG's own height attribute, and there is no transition on opening or closing. Verify
      with `pnpm run policy` for the literal rule, and with the preview states in task 3.3
      rendered at desktop, tablet and mobile widths (018/FR-002, 011/FR-011).
- [ ] 3.3 Declare the component in `src/app/ui/previews/preview-manifest.ts`: a `populated`
      state (standing) and an `empty` state (closed), each with the `normal`,
      `expanded-copy`, `rtl` and `reduced-motion` variants, and a stated reason for each of
      `loading`, `error` and `disabled` — the overlay holds no content of its own, reports
      nothing, and carries no control. The standing state is isolated, as the layer's open
      state is, because a modal makes everything beside it inert. Verify with `pnpm run
      policy`, which fails on an exported UI component that declares no preview, and with
      `e2e/ui-preview.spec.ts`, which renders and scans every declared state (018/FR-002,
      011/FR-011, 011/FR-013).

## 4. The shell mounts it, and states a navigation that failed

- [ ] 4.1 Add the waiting sentence and the failed-navigation notice — its message and its
      detail — to `src/app/i18n/locales/en.json` and `de.json`. Verify with `pnpm run policy`,
      which fails on a key missing from either catalogue (018/FR-006, FR-007).
- [ ] 4.2 Widen the application frame's status slot from one notice to a list, drawn in
      reading order, so a version notice and a failed navigation stand together rather than
      replacing each other. Verify with component tests over a slot given none, one and two
      notices, and by the existing frame and update tests staying green (018/FR-007).
- [ ] 4.3 Mount the overlay in `src/app/app.html` beside the frame, under the same
      browser-only condition the help modal and the update overlay are mounted under, driven
      by the store's waiting signal and the resolved sentence from `src/app/app.ts`. Verify
      with unit tests over the shell asserting the overlay is drawn when the signal is raised
      and absent when it is not, and with `pnpm run build`, whose prerender must emit no
      overlay into any generated document (018/FR-002, FR-008).
- [ ] 4.4 Publish the failed navigation from `src/app/app.ts`: the notice into the frame's
      status list at error tone, and one announcement through `AnnouncementService` at
      assertive urgency, once per failure. Verify with unit tests asserting the notice carries
      the localised words, that the announcement is published once for one failure, and that a
      version notice standing at the same time keeps its place first in the list
      (018/FR-007).

## 5. Unit and component verification

- [ ] 5.1 Assert in the shell's tests that a navigation resolved inside the threshold draws
      nothing, and that a navigation held open draws the overlay over whatever screen was on
      (018/FR-004).
- [ ] 5.2 Assert that the overlay carries no control and that the native cancel does not
      close it, so the only thing that removes it is the navigation ending (018/FR-003,
      FR-005).
- [ ] 5.3 Confirm coverage stays at or above the 80% floor `angular.json` enforces, by
      running `pnpm run test`.

## 6. End-to-end journeys

- [ ] 6.1 Add `e2e/navigation-waiting.spec.ts`, running in all ten projects. Hold the ship
      builder's chunk with `page.route`, press its entry on the start page, and read: the
      overlay stands, the mark is centred in the viewport, the screen behind it is subdued,
      still recognisable and not clickable, the page does not scroll horizontally, and the
      overlay is gone once the chunk is released and the screen is presented (018/FR-001,
      FR-002, FR-003, FR-005, 011/FR-011).
- [ ] 6.2 In the same file, cover the endings that are not a screen arriving: a navigation
      redirected to another address takes the overlay down, and a navigation whose code is
      already held draws nothing at all (018/FR-004, FR-005).
- [ ] 6.3 Cover the failure: abort the chunk, and read that the overlay comes down, the
      Commander is left on a screen they can still use, the notice states that the screen
      could not be opened, and the words stay on the page (018/FR-005, FR-007).
- [ ] 6.4 Cover the stacked case: open the saved builds layer, open a build from it with the
      workspace chunk held, and read that the overlay stands in front of that layer
      (018/FR-002).
- [ ] 6.5 Scan the standing overlay and the failure notice with `@axe-core/playwright` under
      the rule set `e2e/accessibility.ts` already applies, with nothing disabled, and assert
      the screen behind the standing overlay is absent from the accessibility tree
      (018/FR-003, 011/FR-012).
- [ ] 6.6 Read the overlay at 200% text size and at 400% zoom in the profiles that already
      carry those readings, asserting the mark stays centred, whole and inside the viewport
      (011/FR-011).
- [ ] 6.7 Assert in the served-document checks that no generated document carries the overlay
      or its text, and that opening an address draws no overlay over the first presentation
      (018/FR-008).

## 7. The record

- [ ] 7.1 Add `018-navigation-loading-overlay` to `COVERED_FEATURES` in
      `e2e/coverage-ledger.ts`, and register an entry for every id from `018/FR-001` to
      `018/FR-008`, naming the journey, whether it is scanned, the assertions beyond the scan
      and the manual protocol where one covers it. Verify with `pnpm run policy:specs`, which
      names any declared id the ledger does not register.
- [ ] 7.2 Add a step to `e2e/manual/screen-reader.protocol.md` covering what a reader is told
      when a navigation waits and when one fails, and a step covering the mark standing still
      under the platform's reduced-motion preference in both engines. Record the results
      beside the protocol in `e2e/manual/results/` (018/FR-006, FR-007, 011/FR-013).
- [ ] 7.3 Run `pnpm run check` and report what passed.
