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
- [x] 3.2 Verify in the same spec that the count a visit opens on is not announced, and that a
      reading language committing behind an unchanged count publishes nothing (011/FR-009).
- [x] 3.3 `build-library.page.ts` takes the same treatment. Verify its spec reads two
      narrowings and the widening after them as three events, the count the layer opens on as
      none, and a browser language behind an unchanged count as none (011/FR-009).
- [x] 3.4 Announce the refusal from `edit-refusal-notice.ts` and `ingress-refusal-notice.ts`,
      with the refusal input as the trigger and everything the message says read in `untracked`.
      A refusal already drawn when the workspace opens is initial content: `edit-refusal-notice`
      keeps a first-run guard for it, and `ingress-refusal-notice` asks
      `ActiveBuildStore.ingressRefusalUnannounced` instead, because a refused open reports
      before the notice exists and a guard would silence it. Verify two refusals with no
      committed edit between them publish twice, that a notice arriving with a refusal nobody
      has been told about publishes once, and that one arriving with a refusal already
      announced publishes nothing. The workspace withholds the mark while the saved builds
      layer stands over it, because the outlet is inert under an open modal and the mark would
      be spent on a sentence nobody heard; verify a refusal reported under the layer is spoken
      when the layer goes, and that one reported with no layer over it is spoken at once
      (011/FR-009).
- [x] 3.5 Verify in the same specs that a committed locale publishes nothing, and that a batch
      refusing four entries publishes one message rather than four (011/FR-009).
- [x] 3.6 Remove the `revision` and `announcementKind` inputs, the `announce` call and the
      effect from `outfitting-notice.ts`, and the bindings from `edit-refusal-notice.html`,
      `ingress-refusal-notice.html` and `outfitting-workspace.html`. Verify the notice's spec
      reads each line in the order it was handed them, and reads that a refusal arriving on its
      `lines` input publishes nothing at either urgency (011/FR-009).
- [x] 3.7 `hull-detail.page.ts` resolves its message in `untracked` and declares nothing.
      Verify two unresolvable addresses publish twice, and a browser language change publishes
      nothing (011/FR-009).
- [x] 3.8 Drop the numbers from the three `slef.import` announcements in `submit()`. None of
      them asks `SlefStore.isCurrent`: a withdrawn submit comes back as `superseded`, which no
      branch here announces, and a withdrawn batch is announced on purpose — its records are
      already in storage, and a Commander left with saved builds nobody told them about is the
      worse silence. Add the words a batch's second outcome
      needs — the refusal sentence in both counted forms, and the joiner that puts it after the
      stored count — in both catalogues. Verify a stored import and a refused import each
      publish after a committed one, that one batch reporting a count and a refusal publishes a
      single sentence stating both counts, that a batch where nothing was saved never says
      the rest were, and that a batch whose layer was closed over it still states what it saved
      (011/FR-009, 016/FR-010, 016/FR-011, constitution IV).
- [x] 3.9 `slef.presenter.ts` delivery declares nothing. Verify one export copied twice
      publishes twice, and a copy that fails then succeeds publishes both outcomes
      (011/FR-009).

## 4. The remaining sites

- [x] 4.1 Answer from `SlefImportCoordinator.scanFiles` whether the scan settled, and announce
      the outcome only then. A scan that settled on a refusal says what refused it, in the
      sentence the panel states it in: a file over the size limit was never read, and "Nothing
      was found to import." states an outcome nobody reached. That sentence goes from both
      catalogues with the branch that spoke it, which no scan can reach — `scanJournalFiles`
      reports every empty outcome as a refusal. Verify two scans in flight announce the second
      scan's outcome and not the abandoned one — in both settling orders, because the abandoned
      scan settling first is the one that used to speak over the answer — and that an oversized
      file is never reported as holding nothing (011/FR-009, constitution IV).
- [x] 4.2 Do the same in `loadout-import.coordinator.ts`, including the refused scan's own
      sentence under the scan's own event id, and drop the tokens from
      `loadout-import.presenter.ts`. Give its batch the same two-outcome sentence, which said
      only the stored count and never the refusal. Verify its spec reads that a superseded scan
      announces nothing, what a refused scan says, that an oversized file is never reported as
      holding nothing, that a batch saving one loadout and refusing another states both, and
      that a batch saving none never says the rest were saved (011/FR-009, constitution IV).
- [x] 4.3 `app-frame.ts` announces with no declaration. Verify its spec reads that a re-render
      publishes nothing and a new locale snapshot publishes once (011/FR-009).
- [x] 4.4 `app.ts` announces the failed navigation with no declaration, and remembers the
      version it announced for the update notice. Verify the overlay rising and falling twice
      on one version publishes once, and a newer version publishes again (011/FR-009).
- [x] 4.5 `hull-anatomy.ts` announces with no declaration and loses `#transition`. Verify its
      spec reads that one anatomy region failing, recovering and failing again at one build
      revision publishes three times (011/FR-009).
- [x] 4.6 Keep `NavigationWaitingStore.failures` as the effect's trigger. Verify the standing
      two-failure case in `app-navigation-waiting.spec.ts` still reads two announcements. It is
      restated rather than untouched: `announce` no longer answers whether it published, so
      what the case counts is calls (018/FR-007).

## 5. The gate

- [x] 5.1 Add three rules to `scripts/check-interface-foundations.mjs`: no `revision` key on an
      `announce` call, spelled out or as shorthand; a request written as a whole literal at the
      call site that spreads nothing into itself; and an announcement published from an effect —
      `effect`, `afterRenderEffect` or `afterNextRender` — built and called inside one
      `untracked` call. The third reads any catalogue read the effect makes in the open as
      the dependency it is, wherever the value goes, and whether it is a `message()` call or one
      of the class's own members holding one. Verify `pnpm run policy` passes over `src/`.
- [x] 5.2 Add fixtures to `scripts/check-interface-foundations.test.mjs`: one rejected by each
      rule, one that resolves a message parameter in the effect before an `untracked` announce,
      one that hoists a resolved member out of it, one that hoists a read for another purpose,
      one that hoists a read with nothing bound to it, and one that spreads into the request.
      Add five the rules must not reject: a `revision` key in an unrelated object, a spread
      inside `params`, an `announce` called from a method, a trigger read in the open, and an
      effect that resolves a message for something else and announces nothing. Verify each
      fixture's verdict.

## 6. Reading it end to end

- [x] 6.1 Add two journeys to `e2e/announcements.spec.ts`: a filter narrowed twice and then
      widened, and an import refused twice. The refusal is an import rather than an edit
      because no edit the outfitting screen offers is one the Almanac refuses, so there is no
      journey a Commander could walk to reach one; the two refusal notices are read by their
      own unit suites instead. Assert the outlet takes a new node for each event, since the
      words do not move (011/FR-009).
- [x] 6.2 Add both assertions to the `shell/announcements` row in `e2e/coverage-ledger.ts`, and
      take out the locale line: no journey can read it, because a Commander reaches a language
      by asking their browser for it and the suite cannot change that mid-session. The unit
      suite beside each announcing file reads it instead. Verify with `pnpm run policy:specs`.
- [x] 6.3 Add the two journeys to `e2e/manual/screen-reader.protocol.md` as step 22. Record
      the rows in `e2e/manual/results/screen-reader.md`. They stand as `not run`, the way every
      other step's do: no screen reader runs in this container, and filling them in from the
      automated suite would be recording a reading nobody took.
- [x] 6.4 Run `pnpm run check`. Verify unit coverage stays at or above 80% on all four
      counters — above 93% of statements, 86% of branches, 94% of functions and 93% of lines. Everything
      up to and including `test` passes. Of the three e2e scripts, the five chromium projects
      pass (3714 of 3715; the one is a control in the saved-builds suite timing out on a click
      under load in this container, on a screen that announces nothing, and its whole project
      passes on a re-run) and so does the offline suite. Two things this container cannot
      answer, and neither is this change's: Firefox is not installed and cannot be fetched, so
      the five Firefox projects do not run; and the throttled candidate search settles at
      105.8 ms against a 100 ms budget, which reproduces identically on `origin/main`.
