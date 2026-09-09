## 1. The held height in the token layer

- [ ] 1.1 Add `--ednb-layout-grade-ladder-block` to `src/styles/tokens/_semantic.scss` as the
      grade ladder's own label line, stack gap and step cell added together: the micro text
      size at the control leading, plus `--ednb-space-stack-tight`, plus
      `--ednb-layout-grade-step`. Write the comment beside it in the form
      `--ednb-layout-bar-height` uses: what the figure is composed of, and why it is composed
      rather than declared. Every part is `rem`-based, so the held track scales with text size
      as the ladder does. Verify with `pnpm run policy`, which rejects a literal outside the
      token sources, and with `pnpm run build`, which fails on an unresolved custom property
      in a stylesheet that uses it.

## 2. The item column holds the ladder's track

- [ ] 2.1 In `src/app/features/equipment/item-view/item-view.html`, draw the track whether or
      not the item publishes a grade: move the `@if (item.grades.length > 0)` inside a
      `.item__grades` element that is always drawn, so the ladder is conditional and the track
      is not. Where the track holds no ladder, give it `[attr.inert]="true"` and
      `aria-hidden="true"`, as the suit gate does for its own previews, so the held track is
      hidden from the accessibility tree and out of the focus order (019/FR-002). Verify with
      the unit tests in task 4.1.
- [ ] 2.2 In `src/app/features/equipment/item-view/item-view.scss`, give the empty track its
      held size inside the `container-medium-up(item)` block only, as a `min-block-size` of
      `--ednb-layout-grade-ladder-block` beside the width the block already declares, so
      the track measures the ladder where the ladder stands beside the name, and measures
      nothing where the header takes `display: contents` and the ladder stands below the list
      (design, "The narrow column holds nothing"). Verify with the journeys in tasks 5.1 and
      5.4, which measure the wide arrangement and the narrow one; a unit test cannot verify
      this, because jsdom computes no layout.

## 3. The empty bench and the item measure the same

- [ ] 3.1 In `src/app/features/equipment/suit-gate/suit-gate.scss`, set the gate header's
      `padding-block-end` to `var(--ednb-space-2xl)`, which is the seam the item column ends
      its own header with. Record in the comment that the gate stands in the column the item
      takes and the two must agree with each other, which is the recorded 4px divergence from
      artboard `2a` (design, "The gate takes the item column's seam"). Verify with the journey
      in task 5.2.

## 4. What the unit tests state

- [ ] 4.1 In `src/app/features/equipment/item-view/item-view.spec.ts`, add cases over an item
      that publishes no grade: the track is drawn, it carries no `ednb-grade-selector` and no
      radio, it carries `inert`, and it is `aria-hidden`. Keep the standing case that an item
      with grades draws the ladder with one radio per grade, and add that the track carries
      neither attribute there. Verify with `pnpm run test`.
- [ ] 4.2 In the same file, add a case that the track is drawn whatever the item is, so a
      later edit cannot make it conditional again. Note in the test that its size is measured
      by the end-to-end journeys, which are the only place layout is computed. Verify with
      `pnpm run test`.

## 5. The journeys the requirements are about

- [ ] 5.1 In `e2e/equipment-builder.spec.ts`, add a journey under a pinned wide viewport
      (`test.use({ viewport: { width: 1320, height: 900 } })`, as `design-reference.spec.ts`
      pins one for the wide manifest, so every one of the ten projects still runs it): wear a
      suit, open an empty weapon mount, read the bounding box of `.item__alternatives`, choose
      a weapon from `swapList`, and assert the block's `y` is unchanged. Assert in the same
      journey that the mount's grade ladder is absent before the choice and present after it,
      so a passing test cannot mean the ladder simply never appeared (019/FR-001). Verify with
      `pnpm run e2e`.
- [ ] 5.2 In the same file and at the same pinned width, add the empty-bench journey: open the
      bench on the gate, read the bounding box of `.gate__choose`, choose a suit, and assert
      the `y` of `.item__alternatives` matches it. Both lists are the same list in the same
      place, which is what the requirement says (019/FR-001). Verify with `pnpm run e2e`.
- [ ] 5.3 In the same file and at the same pinned width, add the third scenario: read a fitted
      item, open an empty weapon mount, and assert `.item__alternatives` has the same `y` on
      both. This is the case that fails if the held track measures anything other than the
      ladder (019/FR-001). Verify with `pnpm run e2e`.
- [ ] 5.4 In the same file, add the same weapon journey as task 5.1 with no viewport pinned,
      so each of the five layout profiles runs it at its own size and the narrow arrangement
      is measured rather than assumed. Assert only that the list holds its place, which is
      what the requirement states at every width; the arrangement around it differs by
      profile. Verify with `pnpm run e2e`.
- [ ] 5.5 In `e2e/equipment-accessibility.spec.ts`, add a reading over an empty weapon mount
      that the held track is absent from the accessibility tree and offers no control, and
      confirm the existing axe scan of the bench still reports no violation of a criterion the
      constitution does not exclude — 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7 and
      2.4.11 (019/FR-002). Verify with `pnpm run e2e`.

## 6. The record

- [ ] 6.1 Add `019-reserved-grade-ladder` to `COVERED_FEATURES` in `e2e/coverage-ledger.ts`
      and register both ids. `019/FR-001` and `019/FR-002` go on the `equipment/loadout`
      surface, whose journey is `equipment/bench` and which is already scanned by axe, with
      one assertion line naming each journey added in group 5. Verify with
      `pnpm run policy:specs`, which fails naming any declared id that is not registered.
- [ ] 6.2 Run `pnpm run check` — format, typecheck, build, unit tests with coverage and the
      Playwright matrix — and report what passed. Then run the implementation gate the project
      context defines, fix every actionable finding, and run it again until none remains.
