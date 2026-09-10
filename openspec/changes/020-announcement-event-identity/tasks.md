## 1. The policy

- [ ] 1.1 Remove `revision` from `AnnouncementRequest` in
      `src/app/ui/announcements/announcement.service.ts` and mint the sequence inside the
      service, stamping it into `SpokenEvent.identity` as the outlet already expects. Record on
      the type why a caller has no number to supply and which way the policy leans in doubt
      (011/FR-009). Verify with `announcement.service.spec.ts`: two announcements of one kind in
      identical words both publish, and the outlet's identity differs between them.
- [ ] 1.2 Add the optional `request` declaration: an outcome whose token is below the highest
      seen for its kind stays silent, and one at or above it is announced. Verify with a
      superseded-token case and a fresh-token case in `announcement.service.spec.ts`.
- [ ] 1.3 Add the optional `occurrence` declaration: equal to the last announced for its kind it
      stays silent, anything else is announced. Verify with a restatement, a changed occurrence
      and an occurrence that returns to an earlier value, which is a new occurrence and speaks.
- [ ] 1.4 Confirm `clearOutlets()` and `reset()` still separate the outlets from the policy's
      memory across a locale switch. Verify with the existing locale-switch cases in
      `announcement.service.spec.ts`, unchanged.

## 2. The callers that were silent

- [ ] 2.1 `src/app/features/ship-catalogue/ship-catalogue.page.ts` announces the match count with
      no declaration, keeping its first-run guard. Verify in its spec that 5 → 3 → 1 publishes
      three times and that the opening count publishes nothing (011/FR-009, "A reading falls").
- [ ] 2.2 `src/app/features/build-library/build-library.page.ts` the same, with the same reading
      in its spec.
- [ ] 2.3 Move the refused-edit and refused-import announcements into
      `src/app/application/outfitting/outfitting.store.ts`, at the moment each refusal is
      produced, coalescing a batch into one message naming its count. Verify in the store's spec,
      without rendering: two refusals with no committed edit between them publish twice.
- [ ] 2.4 Remove the `revision` input from `src/app/ui/outfitting/outfitting-notice.ts`, its
      `announce` call and the effect around it, and drop the binding in
      `outfitting-workspace.html` and the two notice templates. Verify the notice's spec still
      reads that the lines stay on the page in reading order, and that the component announces
      nothing.
- [ ] 2.5 `src/app/features/hull-detail/hull-detail.page.ts` declares `occurrence` as the hull
      symbol the address named. Verify in its spec that two unresolvable addresses publish twice
      and that re-resolving one publishes once.
- [ ] 2.6 `src/app/application/slef/slef.presenter.ts` delivery declares `occurrence` as the
      artifact revision with the reported result. Verify in its spec that copying one artifact
      twice publishes once, and that a copy which fails and then succeeds publishes twice.

## 3. The callers that were already right

- [ ] 3.1 `slef.presenter.ts` import and `src/app/application/equipment/loadout-import.presenter.ts`
      declare `request` where they passed the token. Verify their specs read the same
      superseded-outcome behaviour as before, unchanged.
- [ ] 3.2 `src/app/ui/components/app-frame/app-frame.ts` declares `occurrence` as the locale
      snapshot revision, and `src/app/app.ts` declares it as the waiting version for the update
      notice. Verify each spec reads that a re-render publishes nothing and a new snapshot or
      version publishes once.
- [ ] 3.3 `src/app/app.ts` announces a failed navigation with no declaration, and
      `NavigationWaitingStore.failures` stays as the effect's trigger. Verify the existing
      two-failure reading in `app.spec.ts` still passes (018/FR-007).
- [ ] 3.4 `src/app/features/build-workspace/outfitting/hull-anatomy/hull-anatomy.ts` announces
      with no declaration and loses `#transition`. Verify its spec still reads a side that fails,
      recovers and fails again at one build revision as three announcements.

## 4. The gate

- [ ] 4.1 Add the rule to `scripts/check-interface-foundations.mjs`: no `announce({…})` call in
      `src/` carries a `revision` key, and no `occurrence` is a literal. Verify with fixtures in
      `scripts/check-interface-foundations.test.mjs` for each rejection and for the constructs it
      must not mistake for one — a `revision` key in an unrelated object literal, and an
      `occurrence` built as a template string over a signal read — and by running `pnpm run policy`.

## 5. Reading it end to end

- [ ] 5.1 Add to `e2e/` the two journeys that were silent: a filter narrowed twice, and an edit
      refused twice. Assert the polite and assertive outlets change for each event. Register the
      assertions against 011/FR-009 in `e2e/coverage-ledger.ts` and verify with
      `pnpm run policy:specs`.
- [ ] 5.2 Add the same two readings to `e2e/manual/screen-reader.protocol.md`, where what a
      reader is actually told can be judged, and record the result in `e2e/manual/results/`.
- [ ] 5.3 Run `pnpm run check` and confirm unit coverage stays at or above 80% on all four
      counters.
