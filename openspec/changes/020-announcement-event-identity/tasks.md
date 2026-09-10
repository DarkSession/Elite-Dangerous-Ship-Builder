## 1. The failing tests

- [x] 1.1 Add to `announcement.service.spec.ts` the case two events of one kind in identical
      words both publish. Verify it fails against the standing policy (011/FR-009).
- [x] 1.2 Add a reproducing case for each of the seven silent sites, beside the file that will
      hold the fixed announcement. The refusal cases go beside the two refusal notices, which
      are what hold the refusal. Verify each of the seven fails (011/FR-009).

## 2. The policy

- [x] 2.1 Remove `revision` from `AnnouncementRequest`. Mint the sequence in the service and
      stamp it into `SpokenEvent.identity`. Verify with task 1.1's case (011/FR-009).
- [x] 2.2 Record on the type that every request is announced, and that a caller decides not to
      publish a replay or a withdrawn question's outcome. Verify a reader finds both statements
      and the reason the policy cannot decide either (011/FR-009).
- [x] 2.3 Verify the service announces every request it is given. Drive it with two events of
      one kind at one urgency and assert both publish (011/FR-009).
- [x] 2.4 Rewrite the `clearOutlets()` and `reset()` cases against the sequence, which is the
      whole of the policy's memory. Verify `clearOutlets()` empties both outlets and publishes
      nothing, and that `reset()` empties the sequence (011/FR-009).

## 3. The seven sites

- [x] 3.1 `ship-catalogue.page.ts` announces the match count in `untracked`, with no
      declaration, keeping its first-run guard. Track the count as a number: `count()` is a
      fresh object whenever a reading language reorders the manifest. Verify a filter narrowed
      twice and then widened publishes three times (011/FR-009).
- [x] 3.2 Verify in the same spec that a rising count publishes once, and that a reading
      language changing with the count unchanged publishes nothing (011/FR-009).
- [x] 3.3 `build-library.page.ts` takes the same treatment. Verify its spec reads a falling
      count three times, a rising count once, and a browser language change not at all
      (011/FR-009).
- [x] 3.4 Announce the refusal from `edit-refusal-notice.ts` and `ingress-refusal-notice.ts`,
      with the refusal input as the trigger and everything the message says read in `untracked`.
      Verify two refusals with no committed edit between them publish twice (011/FR-009).
- [x] 3.5 Verify in the same specs that a committed locale publishes nothing, and that a batch
      refusing four entries publishes one message rather than four (011/FR-009).
- [x] 3.6 Remove the `revision` input, the `announce` call and the effect from
      `outfitting-notice.ts`, and the bindings from `edit-refusal-notice.html`,
      `ingress-refusal-notice.html` and `outfitting-workspace.html`. Verify the notice's spec
      reads that the lines stay in reading order and that it publishes nothing (011/FR-009).
- [x] 3.7 `hull-detail.page.ts` resolves its message in `untracked` and declares nothing.
      Verify two unresolvable addresses publish twice, and a browser language change publishes
      nothing (011/FR-009).
- [x] 3.8 Ask `SlefStore.isCurrent` before each of the three `slef.import` announcements, and
      drop the numbers. Verify a stored import and a refused import each publish after a
      committed one, and that one batch reporting a count and a refusal publishes both
      (011/FR-009, 016/FR-010, 016/FR-011).
- [x] 3.9 `slef.presenter.ts` delivery declares nothing. Verify one export copied twice
      publishes twice, and a copy that fails then succeeds publishes both outcomes
      (011/FR-009).

## 4. The remaining sites

- [x] 4.1 Answer from `SlefImportCoordinator.scanFiles` whether the scan settled, and announce
      the outcome only then. Verify two scans in flight announce the second scan's outcome and
      not the abandoned one (011/FR-009).
- [x] 4.2 Do the same in `loadout-import.coordinator.ts`, and drop the tokens from
      `loadout-import.presenter.ts`. Verify its spec reads that a superseded scan announces
      nothing (011/FR-009).
- [x] 4.3 `app-frame.ts` announces with no declaration. Verify its spec reads that a re-render
      publishes nothing and a new locale snapshot publishes once (011/FR-009).
- [x] 4.4 `app.ts` announces the failed navigation with no declaration, and remembers the
      version it announced for the update notice. Verify the overlay rising and falling twice
      on one version publishes once, and a newer version publishes again (011/FR-009).
- [x] 4.5 `hull-anatomy.ts` announces with no declaration and loses `#transition`. Verify its
      spec reads that one anatomy region failing, recovering and failing again at one build
      revision publishes three times (011/FR-009).
- [x] 4.6 Keep `NavigationWaitingStore.failures` as the effect's trigger. Verify the standing
      two-failure case in `app.spec.ts` passes unchanged (018/FR-007).

## 5. The gate

- [x] 5.1 Add two rules to `scripts/check-interface-foundations.mjs`: no `revision` key on an
      `announce` call, and an announcement published from an effect built and called inside one
      `untracked` call. Verify `pnpm run policy` passes over `src/`.
- [x] 5.2 Add fixtures to `scripts/check-interface-foundations.test.mjs`: one rejected by each
      rule, and one that resolves a message parameter in the effect before an `untracked`
      announce. Add two the rules must not reject: a `revision` key in an unrelated object, and
      an `announce` called from a method. Verify each fixture's verdict.

## 6. Reading it end to end

- [x] 6.1 Add two journeys to `e2e/announcements.spec.ts`: a filter narrowed twice and then
      widened, and an import refused twice. The refusal is an import rather than an edit
      because no edit the outfitting screen offers is one the Almanac refuses, so there is no
      journey a Commander could walk to reach one; the two refusal notices are read by their
      own unit suites instead. Assert the outlet takes a new node for each event, since the
      words do not move (011/FR-009).
- [x] 6.2 Add both assertions to the 011/FR-009 rows in `e2e/coverage-ledger.ts`. Verify with
      `pnpm run policy:specs`.
- [x] 6.3 Add the two journeys to `e2e/manual/screen-reader.protocol.md` as step 22. Record
      the rows in `e2e/manual/results/screen-reader.md`. They stand as `not run`, the way every
      other step's do: no screen reader runs in this container, and filling them in from the
      automated suite would be recording a reading nobody took.
- [ ] 6.4 Run `pnpm run check`. Verify unit coverage stays at or above 80% on all four
      counters.
