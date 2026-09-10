## 1. The failing tests

- [ ] 1.1 Add to `announcement.service.spec.ts` the case two events of one kind in identical
      words both publish. Verify it fails against the standing policy (011/FR-009).
- [ ] 1.2 Add a reproducing case for each of the seven silent sites, beside the file that will
      hold the fixed announcement. The refusal cases go beside `outfitting.store.ts`. Verify
      each of the seven fails (011/FR-009).

## 2. The policy

- [ ] 2.1 Remove `revision` from `AnnouncementRequest`. Mint the sequence in the service and
      stamp it into `SpokenEvent.identity`. Verify with task 1.1's case (011/FR-009).
- [ ] 2.2 Record on the type that an unrecognised event is announced, that a caller keeps a
      replay from being published rather than the service dropping it, and that the withdrawn
      question is the one exception. Verify a reader finds all three statements (011/FR-009).
- [ ] 2.3 Add the optional `request` declaration, keyed by `(kind, urgency)`. An outcome whose
      token is below the highest seen stays silent. Verify with a lower token, an equal token
      that publishes, and a higher one (011/FR-009).
- [ ] 2.4 Rewrite the `clearOutlets()` and `reset()` cases against the sequence and the token
      map. Verify `clearOutlets()` empties both outlets and publishes nothing, and that
      `reset()` empties the sequence and the map (011/FR-009).

## 3. The seven sites

- [ ] 3.1 `ship-catalogue.page.ts` announces the match count in `untracked`, with no
      declaration, keeping its first-run guard. Verify 5 → 3 → 1 publishes three times
      (011/FR-009).
- [ ] 3.2 Verify in the same spec that a rising count publishes once, and that a reading
      language changing with the count unchanged publishes nothing (011/FR-009).
- [ ] 3.3 `build-library.page.ts` takes the same treatment. Verify its spec reads a falling
      count three times, a rising count once, and a reading-language change not at all
      (011/FR-009).
- [ ] 3.4 Announce the refused edit and the refused import in `outfitting.store.ts`, where each
      refusal is produced. Verify without rendering that two refusals with no committed edit
      between them publish twice (011/FR-009).
- [ ] 3.5 Keep the batch coalesced. Verify in the store's spec that an import completing four
      partial rolls publishes one message naming four (011/FR-009).
- [ ] 3.6 Remove the `revision` input, the `announce` call and the effect from
      `outfitting-notice.ts`. Remove the binding from `edit-refusal-notice.html`,
      `ingress-refusal-notice.html` and `outfitting-workspace.html`. Verify the notice's spec
      reads that the lines stay in reading order and that it publishes nothing (011/FR-009).
- [ ] 3.7 `hull-detail.page.ts` resolves its message in `untracked` and declares nothing.
      Verify two unresolvable addresses publish twice, and a reading-language change publishes
      nothing (011/FR-009).
- [ ] 3.8 Declare `request` from the store token on the three `slef.import` announcements.
      Verify a stored import and a refused import each publish after a committed one, and that
      one batch reporting a count and a refusal publishes both (011/FR-009).
- [ ] 3.9 `slef.presenter.ts` delivery declares nothing. Verify one export copied twice
      publishes twice, and a copy that fails then succeeds publishes both outcomes
      (011/FR-009).

## 4. The sites that keep their behaviour

- [ ] 4.1 `slef.presenter.ts` scan and `loadout-import.presenter.ts` declare `request` where
      they passed the token. Verify each spec reads that a superseded outcome publishes nothing
      (011/FR-009).
- [ ] 4.2 `app-frame.ts` and `app.ts` announce with no declaration. Verify each spec reads that
      a reading-language change publishes nothing, and a new locale snapshot or version
      publishes once (011/FR-009).
- [ ] 4.3 `hull-anatomy.ts` announces with no declaration and loses `#transition`. Verify its
      spec reads that one anatomy region failing, recovering and failing again at one build
      revision publishes three times (011/FR-009).
- [ ] 4.4 Keep `NavigationWaitingStore.failures` as the effect's trigger. Verify the standing
      two-failure case in `app.spec.ts` passes unchanged (018/FR-007).

## 5. The gate

- [ ] 5.1 Add two rules to `scripts/check-interface-foundations.mjs`: no `revision` key on an
      `announce` call, and no `announce` inside an `effect` outside `untracked`. Verify
      `pnpm run policy` passes over `src/`.
- [ ] 5.2 Add fixtures to `scripts/check-interface-foundations.test.mjs`: one rejected by each
      rule, one `revision` key in an unrelated object, and one `announce` called from a method.
      Verify the two rejections fail and the two others pass.

## 6. Reading it end to end

- [ ] 6.1 Add two journeys to `e2e/`: a filter narrowed twice, and an edit refused twice.
      Assert each outlet changes for each event (011/FR-009).
- [ ] 6.2 Add both assertions to the 011/FR-009 rows in `e2e/coverage-ledger.ts`. Verify with
      `pnpm run policy:specs`.
- [ ] 6.3 Add the two journeys to `e2e/manual/screen-reader.protocol.md`. Verify by running the
      protocol and recording what was heard in `e2e/manual/results/`.
- [ ] 6.4 Run `pnpm run check`. Verify unit coverage stays at or above 80% on all four
      counters.
