## 1. The held height in the token layer

- [x] 1.1 Add `--ednb-layout-grade-ladder-block` to `src/styles/tokens/_semantic.scss` as the
      grade ladder's own label line over its step cell: the micro text size at the control
      leading, plus `--ednb-layout-grade-step`. The stack gap between the two is not in the
      sum, because it is not drawn — the ladder is a `fieldset` whose label is its `legend`,
      which is not a flex item of its own fieldset, so the fieldset's `row-gap` has one flex
      item to sit between and never applies (`grade-selector.scss` states the same thing about
      the legend's width). Write the comment beside it in the form
      `--ednb-layout-bar-height` uses: what the figure is composed of, and why it is composed
      rather than declared. Every part is `rem`-based, so the track scales with text size as
      the ladder does. Verify with `pnpm run build`, which fails on a stylesheet that does not
      compile, and with the journeys in tasks 5.1 to 5.3, which measure whether the figure is
      the ladder's. Nothing mechanical checks the figure itself: `pnpm run policy` rejects a
      literal outside the token layer, and this declaration is inside it.

## 2. The item column holds the ladder's track

- [x] 2.1 In `src/app/features/equipment/item-view/item-view.html`, draw the track whether or
      not the item publishes a grade: move the `@if (item.grades.length > 0)` inside a
      `.item__grades` element that is always drawn, so the ladder is conditional and the track
      is not. Where the track holds no ladder, give it `[attr.inert]="true"` and
      `aria-hidden="true"`, as the suit gate does for its own previews, so the track is hidden
      from the accessibility tree and out of the focus order (019/FR-002). Verify with the
      unit tests in task 4.1.
- [x] 2.2 In `src/app/features/equipment/item-view/item-view.scss`, give the empty track its
      held size inside the `container-medium-up(item)` block only, as a `min-block-size` of
      `--ednb-layout-grade-ladder-block` beside the width the block already declares, so the
      track measures the ladder where the ladder stands beside the name. Where the header takes
      `display: contents` and the ladder stands below the list, take the empty track out of
      flow rather than leaving it at no height: the column is a stack with a gap between its
      items, so a zero-height item still costs 22px under the list (design, "The narrow column
      holds nothing, and holds it out of flow"). Verify with the track's own reading in task 5.1: the
      list's place cannot fail on a wrongly scoped query, because the track stands below the
      list where the column is narrow and pushes down only what follows it. A unit test cannot
      verify this either, because jsdom computes no layout.

## 3. The empty bench and the item measure the same

- [x] 3.1 In `src/app/features/equipment/suit-gate/suit-gate.scss`, set the gate header's
      `padding-block-end` to `var(--ednb-space-2xl)`, which is the seam the item column ends
      its own header with. State it once, unconditionally: the gate's header is taken out of
      flow where the column is narrow, so the seam is drawn wide and nowhere else (design,
      "The gate's seam is stated once, for both arrangements"). Record in the comment that the
      gate stands in the column the item takes and the two must agree with each other, which
      is the recorded 4px divergence from artboard `2a`. Verify with the journey in task 5.2.
- [x] 3.2 Give the item column its own step in the width the bench takes its three-column
      arrangement at, so the gate and the item column answer alike wherever the bench draws
      them side by side. In `src/styles/_responsive.scss` compose
      `$equipment-bench-wide-min` from the ledger rail, `$container-medium-min`, the commander
      rail and the two hairline rules the grid draws between them, and read it from the
      `@container bench-page` query in `src/app/features/equipment/equipment-bench.page.scss`;
      in `src/app/ui/equipment/bench-composition.ts` compose `BENCH_WIDE_MINIMUM_REM` from the
      same parts. Record in both comments why the item share is that step and not a content
      minimum of its own (design, "A wide bench leaves the item column its own step"). Verify
      with the case in task 4.3 and with the journey in task 5.2.

## 4. What the unit tests state

- [x] 4.1 In `src/app/features/equipment/item-view/item-view.spec.ts`, add cases over an item
      that publishes no grade: the track is drawn, it carries no `ednb-grade-selector` and no
      radio, it carries `inert`, and it is `aria-hidden`. Keep the standing case that an item
      with grades draws the ladder with one radio per grade, and add that the track carries
      neither attribute there. Verify with `pnpm run test`.
- [x] 4.2 In the same file, add a case that the track is drawn whatever the item is, so a
      later edit cannot make it conditional again. Note in the test that its size is measured
      by the end-to-end journeys, which are the only place layout is computed. Verify with
      `pnpm run test`.
- [x] 4.3 Register the two statements of the bench's step as a reconciled pair in
      `SCOPE.duplicatedSteps` in `scripts/check-interface-foundations.mjs`, so the policy that
      already holds the other composition steps together holds this one. Teach
      `duplicatedStepViolations` to add a step up from the terms it is composed of, resolving
      a named term from the source it is written in, so a step built on `$container-medium-min`
      moves when that step does and a change to one side alone is a violation. Reject a term
      the rule cannot read and a step that refers to itself, rather than passing on either.
      Drive both readings from fixtures in `scripts/check-interface-foundations.test.mjs`, as
      every other rule there is driven. Verify with `pnpm run policy` and `pnpm run
test:scripts`.

## 5. The journeys the requirements are about

- [x] 5.1 In `e2e/equipment-builder.spec.ts`, add the weapon journey, pinning no viewport so
      that each of the five layout profiles runs it in both engines (011/FR-021): wear a suit,
      open an empty weapon mount, read the bounding box of `.item__alternatives`, choose a
      weapon from `swapList`, and assert the block's `y` is unchanged. Assert in the same
      journey that the mount's grade ladder is absent before the choice and present after it,
      so a passing test cannot mean the ladder never appeared (019/FR-001). Then read the empty
      track's own bounding box against the arrangement the item column draws, which the journey
      takes from the boxes themselves: where the track's top is above `.item__alternatives` the
      header is a row and the track's block size is the ladder's, and where the track stands
      below that list it has none. Read the column rather than the bench, because the bench's
      composition is a second threshold and the two cross (design, "The bench's composition is
      not the oracle"). This is what fails if the container query in task 2.2 is scoped wrongly
      and a block is held where the ladder stands below the list. Verify with `pnpm run e2e`.
- [x] 5.2 In the same file, add the empty-bench journey, again pinning no viewport: open the
      bench on the gate, read the bounding box of `.gate__choose`, choose a suit, and assert
      the `y` of `.item__alternatives` matches it. Guard the assertion on the list still being
      offered, because the narrow bench answers the choice with the loadout in place of the
      gate and holds no list — which is what the requirement's third scenario states. Assert
      in that case that the loadout is stated instead, so the guard cannot hide a failure
      (019/FR-001). Verify with `pnpm run e2e`.
- [x] 5.3 In the same file, add the item-to-item journey, pinning no viewport: read a fitted
      item, open an empty weapon mount, and branch on the arrangement the item column draws,
      which the journey takes from the ladder's own box as task 5.1 does. Where the ladder
      stands above the list, assert `.item__alternatives` has the same `y` on both items; this
      is the case that fails if the held track measures anything other than the ladder
      (019/FR-001). Where it stands below, assert the empty mount's track holds nothing,
      because there the grade choice reaches nothing above the list and what is above it is
      each item's own name, which the requirement leaves to the item. Verify with
      `pnpm run e2e`.
- [x] 5.4 In `e2e/equipment-accessibility.spec.ts`, add a reading over an empty weapon mount
      that the held track is absent from the accessibility tree and offers no control, and
      confirm the existing axe scan of the bench still reports no violation of a criterion the
      constitution does not exclude — 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7 and
      2.4.11 (019/FR-002). Verify with `pnpm run e2e`.

## 6. The record

- [x] 6.1 Add `019-held-grade-ladder` to `COVERED_FEATURES` in `e2e/coverage-ledger.ts` and
      register both ids. `019/FR-001` and `019/FR-002` go on the `equipment/loadout` surface,
      whose journey is `equipment/bench` and which is already scanned by axe, with one
      assertion line naming each journey added in group 5. Verify with `pnpm run policy:specs`,
      which fails naming any declared id that is not registered.
- [ ] 6.2 Run `pnpm run check` — format, typecheck, build, unit tests with coverage and the
      Playwright matrix — and report what passed. Then run the implementation gate the project
      context defines, fix every actionable finding, and run it again until none remains.
