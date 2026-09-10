## 1. The failing tests

- [ ] 1.1 Add the reproducing cases to `announcement.service.spec.ts`. Two events of one kind
      in identical words must both publish. Verify each case fails now (011/FR-009).
- [ ] 1.2 Add a reproducing case beside each of the six silent sites: the two match counts, the
      two outfitting refusals, the unresolvable address, and the import announced from two
      counters. Verify all six fail now (011/FR-009).

## 2. The policy

- [ ] 2.1 Remove `revision` from `AnnouncementRequest` and mint the sequence in the service.
      Stamp it into `SpokenEvent.identity`. Verify with the cases from task 1.1 (011/FR-009).
- [ ] 2.2 Record on the type why a caller supplies no number, and which way the policy leans
      in doubt. Verify by reading the file against the requirement (011/FR-009).
- [ ] 2.3 Add the optional `request` declaration, keyed by `(kind, urgency)`. An outcome whose
      token does not exceed the highest seen stays silent. Verify with a lower token, an equal
      token and a higher one (011/FR-009).
- [ ] 2.4 Add the optional `occurrence` declaration, keyed by `(kind, urgency)`. Equal to the
      last announced it stays silent. Verify with a repeat, a change, and a return to an
      earlier value, which announces (011/FR-009).
- [ ] 2.5 Rewrite the `clearOutlets()` and `reset()` cases against the new memory: the
      sequence, and both declaration maps. Verify a locale switch clears the outlets and
      replays nothing, and that `reset()` empties all three (011/FR-009).

## 3. The sites that were silent

- [ ] 3.1 `ship-catalogue.page.ts` announces the match count with no declaration, keeping its
      first-run guard. Verify 5 → 3 → 1 publishes three times (011/FR-009).
- [ ] 3.2 `ship-catalogue.page.ts` publishes a rising count too. Verify 3 → 10 publishes
      (011/FR-009).
- [ ] 3.3 `build-library.page.ts` the same, with both readings in its spec (011/FR-009).
- [ ] 3.4 Announce the refused edit and the refused import in `outfitting.store.ts`, where each
      refusal is produced. Verify without rendering that two refusals with no committed edit
      between them publish twice (011/FR-009).
- [ ] 3.5 Keep the batch coalesced: one accepted import completing four partial rolls publishes
      one message naming four. Verify in the store's spec with a four-line batch (011/FR-009).
- [ ] 3.6 Remove the `revision` input, the `announce` call and the effect from
      `outfitting-notice.ts`, and the binding from `outfitting-workspace.html` and the two
      notice templates. Verify the notice's spec reads that the lines stay in reading order and
      that it announces nothing.
- [ ] 3.7 `hull-detail.page.ts` resolves its message in `untracked` and declares nothing.
      Verify two unresolvable addresses publish twice, and a locale commit publishes nothing
      (011/FR-009).
- [ ] 3.8 `slef.presenter.ts` announces an accepted import with no declaration, so a stored or
      failed import after a committed one is heard. Verify that sequence in its spec
      (011/FR-009).

## 4. The sites that were already right

- [ ] 4.1 `slef.presenter.ts` scan and `loadout-import.presenter.ts` declare `request` where
      they passed the token. Verify their specs read the same superseded-outcome behaviour as
      the standing suite (011/FR-009).
- [ ] 4.2 `slef.presenter.ts` delivery declares `occurrence` as the artifact revision with the
      reported result. Verify one artifact copied twice publishes once, and a copy that fails
      then succeeds publishes twice (011/FR-009).
- [ ] 4.3 `app-frame.ts`, `app.ts` and `hull-anatomy.ts` announce with no declaration, and
      `hull-anatomy.ts` loses `#transition`. Verify each spec: a re-render publishes nothing,
      and a side failing, recovering and failing again publishes three times (011/FR-009).
- [ ] 4.4 Keep `NavigationWaitingStore.failures` as the effect's trigger. Verify the standing
      two-failure case in `app.spec.ts` passes unchanged (018/FR-007).

## 5. The gate

- [ ] 5.1 Add the three rules to `scripts/check-interface-foundations.mjs`: no `revision` key,
      no literal `occurrence`, and no `announce` inside an `effect` outside `untracked`.
- [ ] 5.2 Add fixtures to `scripts/check-interface-foundations.test.mjs` for each rejection,
      and for what each rule must not mistake for one: a `revision` key in an unrelated object,
      an `occurrence` built from a signal read, and an `announce` called from a method.
      Verify with `pnpm run policy`.

## 6. Reading it end to end

- [ ] 6.1 Add the two journeys to `e2e/`: a filter narrowed twice, and an edit refused twice.
      Assert each outlet changes for each event (011/FR-009).
- [ ] 6.2 Add both assertions to the 011/FR-009 rows in `e2e/coverage-ledger.ts`. Verify with
      `pnpm run policy:specs`.
- [ ] 6.3 Add the two readings to `e2e/manual/screen-reader.protocol.md`, and record the result
      in `e2e/manual/results/`.
- [ ] 6.4 Run `pnpm run check`. Verify unit coverage stays at or above 80% on all four counters.
