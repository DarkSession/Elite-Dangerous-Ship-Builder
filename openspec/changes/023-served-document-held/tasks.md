## 1. Scope and the failing test

- [ ] 1.1 The held content is the generated document's own markup, already laid out for its
      viewport, already scanned for accessibility as a first frame, and already written in bundled
      English (015/FR-010, 015/FR-019, 015/FR-011). Holding the same nodes adds no composition, no
      touch target and no string. What is new is one state of the application frame, and it is
      carried rather than waved past: task 4.1 previews it at the three widths and task 4.2 scans
      it where it stands, before the change is read end to end (011/FR-004, 011/FR-022). Verify
      the rest by holding the change to it: no new catalogue key (011/FR-016), no reusable pattern
      entering the design system (011/FR-005), and the existing responsive and touch journeys pass
      unchanged (011/FR-021, 011/FR-006).
- [ ] 1.2 Add to `e2e/prerendered-first-frame.spec.ts`, in the journey at line 496 that already
      holds the failing first navigation in the production lane, the assertion the note at line 575
      says is missing: the served document's own `main` is still standing, with the ship list in it
      and not only the banner and the tool links. Verify it fails against the standing takeover,
      which is what that note records (023/FR-001).
- [ ] 1.3 Add a unit case beside `src/app/app-navigation-waiting.spec.ts` driving the same
      sequence without a browser: content in the frame's `main` before bootstrap, a first
      navigation that ends in `NavigationError`, and the content still there afterwards. Verify it
      fails for the reason design.md gives: nothing claimed the served nodes, so hydration
      removed them (023/FR-001).

## 2. Holding what the address served

- [ ] 2.1 Add the adapter that copies the served content, under `src/app/platform/browser/`,
      beside the other adapters that own a piece of the document. It copies the nodes standing in
      the frame's `main` when it is created, keeps them as nodes rather than as a string, and
      exposes whether anything is held. Verify with a unit test that a document with content yields
      a copy, that an empty one yields nothing, and that the live nodes are untouched. A copy
      rather than a detachment is what keeps the page from blanking (023/FR-001).
- [ ] 2.2 Register it as a browser-only application initialiser in `src/app/app.config.ts`, before
      `provideRouter`, where `NavigationWaitingStore` already sits and for the same stated reason:
      initialisers run in the order they are provided, and the blocking initial navigation starts
      from one of them. Verify with a test asserting the copy is taken before the first
      `NavigationStart`, so an initialiser added later cannot silently move it after the takeover
      (023/FR-001).
- [ ] 2.3 Put the copy back when a navigation ends without presenting a screen and none has been
      presented in this session — a failure, a cancellation with nothing taking over, or a
      replacement that ends the same way. Count screens presented rather than navigations run or
      errors raised: a rule written about `NavigationError` alone would leave the cancelled-with-
      nothing-taking-over Commander on an empty shell with no statement on it, which is worse than
      either outcome this change is for (design.md, "The boundary is the first screen presented,
      not the first navigation"; 018/FR-005). The frame renders a container inside the
      `<main class="frame__main">` it already draws, where the outlet stands, in
      `src/app/ui/components/app-frame/app-frame.html`, and the adapter
      fills it — that is where the copy was taken from, and anywhere else moves it out of its
      landmark. The container is part of the frame's first render rather than written in from an
      effect afterwards, so the copy lands in the render that removes the served nodes and nothing
      is painted between the two. Verify tasks 1.2, 1.3 and 3.5 now pass, and that the failure
      statement still stands over the content rather than instead of it. Tasks 1.2 and 1.3 drive
      `NavigationError` alone, so they pass against the rule this task forbids; task 3.5 is the one
      that fails against it, and this task is not done until it passes (023/FR-001, 018/FR-007).
- [ ] 2.4 Release the copy at the first `NavigationEnd`. Verify nothing is held after a screen has
      been presented, and that the held container is not drawn once a screen stands in the outlet
      (023/FR-001).
- [ ] 2.5 Verify the held content stays in the bundled English it was served in, for a Commander
      whose committed locale is German: assert the held words are the served ones, that no
      translated text and no disclosure has been written into them, and that the failure statement
      beside it is in German because that sentence is the shell's own. The catalogue is applied by
      rendering the screen, and the screen is what did not arrive, so there is nothing that can
      apply it and nothing the application may write in its place. The absent disclosure is the
      delta's own rule rather than an omission: 015/FR-011a says a document read in bundled English
      has nothing to disclose (015/FR-011, 015/FR-011a, constitution VI).
- [ ] 2.6 Verify the held content carries the language it was served in, while the application
      around it carries the committed locale as the root language (011/FR-027). English standing
      inside a German page is a part in another language, so success criterion 3.1.2 is in scope:
      the target is WCAG 2.2 AA except 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11,
      and 3.1.2 is not among the eight. Assert the language on the container rather than on the
      page (023/FR-001, 011/FR-015).

## 3. The boundaries

- [ ] 3.1 Verify a navigation that fails after a screen has been presented leaves the Commander on
      that screen, with nothing put back over it. This is the case that would take a screen away to
      answer a failure, so it is stated as its own test rather than folded into 2.4 (023/FR-001,
      018/FR-007).
- [ ] 3.2 Verify a first navigation that is cancelled or redirected, and whose replacement then
      fails, still leaves the Commander on what the address served: the pair counts as one
      presentation, so the cancellation does not spend the hold. That rule is `023/FR-001`'s own —
      018/FR-005 reaches the same pair only to keep one waiting statement standing across it, and
      says nothing about what the Commander is left on. This is the case a rule written about the
      session's first navigation would miss (023/FR-001).
- [ ] 3.3 Verify an address the build generates no document for is unaffected: nothing is held, and
      a failed first navigation leaves the Commander on the shell, which is what that address
      served and what 018/FR-007's scenario "The first navigation fails at an address with no
      generated document" already requires. Read it where it already reads, in
      `e2e/navigation-waiting.spec.ts` on the development lane, and assert no held container is
      drawn (023/FR-001, 018/FR-007).
- [ ] 3.4 Verify held content is kept as the address served it: the same nodes, with no figure
      recomputed and no sentence written for it. Assert the held markup matches what the document
      carried before bootstrap, so a later rewrite into a re-rendering fails here. The figures in
      it come from the pinned package and are not recomputed on the way back
      (023/FR-001, 015/FR-004).
- [ ] 3.5 Verify a first navigation cancelled with nothing taking over leaves the Commander on what
      the address served. Nothing is stated over it, because a cancellation is not a failure
      (018/FR-007, "A navigation that is cancelled, and one that is redirected to another address,
      are not failures and MUST be stated as nothing"), and the waiting statement is removed
      (018/FR-005, scenario "The navigation is cancelled with nothing taking over"), so what the
      Commander is left on is the served content and nothing else. This is the case that separates
      counting screens presented from counting errors raised: an implementation restoring only on
      `NavigationError` passes every other test in this change and fails this one (023/FR-001).

## 4. The state the frame gains

- [ ] 4.1 Declare the frame's held state in `src/app/ui/previews/preview-manifest.ts`, with a
      fixture standing in for the content an address served, so the state previews at desktop,
      tablet and mobile widths like every other state the frame supports. Verify with
      `pnpm run e2e` over `e2e/ui-preview.spec.ts`, which renders every registered state at its
      own address across the layout profiles and scans each one: a state that is declared is read,
      and one that is not declared is read nowhere. Do not verify this with `pnpm run policy`: its
      preview rule is written per component rather than per state, `AppFrame` is already declared,
      and it therefore passes whether or not this fixture exists. Task 4.4 is where that gap is
      recorded (011/FR-004, 011/FR-024).
- [ ] 4.2 Scan the held state where it stands, in the production lane, across the layout profiles
      the journey in task 1.2 already runs: the held content and the failure statement together,
      asserted to report no in-scope violation. The existing scans reach the generated first frame
      and the screens the application presents, and this state is neither
      (`openspec/changes/archive/018-navigation-loading-overlay/tasks.md` 6.5 scans its own
      standing overlay for the same reason). Verify with `pnpm run e2e` (011/FR-022, 011/SC-002).

- [ ] 4.3 Measure the restore, not only the takeover that succeeds: read that no frame between the
      document arriving and the held content standing is emptier than the frame before it, and that
      the content does not blank and return. 015/FR-009 admits three exceptions and this claims
      none of them, so a visible removal and return is a failure rather than a cost. Verify with
      `pnpm run e2e` in the production lane, beside the journey task 1.2 adds (023/FR-001,
      015/FR-009).
- [ ] 4.4 Re-read the gap proposal.md, Impact, records, so the record is true when the change
      lands rather than only when it was written. 011/FR-024's scenario is "A component state has
      no preview", whose WHEN is "a component supports a state that has no preview" and whose THEN
      is that the automated check rejects it; the check is written per component, so a component
      already declared passes with a state it does not preview. Of the two the checker is the
      defect — the accepted requirement is what the project wants — and widening it needs a way to
      read which states a component supports, which the source does not state. That is its own
      change against `platform/design-system`, not this one, which owns the takeover. Verify by
      running `pnpm run policy` with task 4.1's fixture removed and seeing it pass: that is the gap,
      and it can fail. If it now fails, the checker has been fixed since, and the Impact bullet is
      stale and comes out (constitution IX; 011/FR-024).

## 5. Reading it end to end

- [ ] 5.1 Re-read the takeover that succeeds, which this change must not disturb: run the existing
      015/SC-003 measurement and confirm the cumulative layout shift from first paint to
      interactive is still 0 on all five layout profiles in both orientations, and that no frame is
      emptier than the frame before it. Verify with `pnpm run e2e` over
      `e2e/prerendered-first-frame.spec.ts` (015/FR-009, 015/SC-003).
- [ ] 5.2 Re-read the locale replacement this change must not disturb, which is the other branch
      the modified 015/FR-011 creates. For a Commander whose committed locale is German at an
      address with a generated document, where the navigation presents the screen: the document
      paints English, the screen carries German once the catalogue arrives, and each untranslated
      game name carries its disclosure (015/FR-011a). This is what an implementation that holds the
      English too long would break, and task 2.5 reads only the held branch. Verify with
      `pnpm run e2e` (015/FR-011, 015/FR-011a).
- [ ] 5.3 Remove the note at `e2e/prerendered-first-frame.spec.ts:575` that records FR-007's second
      half as unread, because task 1.2 adds the assertion it asks for. Leave
      `openspec/changes/archive/018-navigation-loading-overlay/` alone: the archive is read and not
      extended, and its task 6.3 stands with the reason it carries. Verify by reading the journey
      back, and by `git status` showing nothing changed under `openspec/changes/archive/`.
- [ ] 5.4 Register the change in `e2e/coverage-ledger.ts`: add `023-served-document-held` to
      `COVERED_FEATURES`, add `023/FR-001` to the `requirements` array of the
      `prerendered/first-frame` entry, whose journey is `product/prerendered-first-frame`, and add
      the journey's assertion to that entry's `assertions` array beside "a Commander whose bundle
      never arrives is left with the readable document". Verify by reading the entry back against
      the journey task 1.2 extends: the surface's journey name is the one that now carries the
      assertion, and the assertion text names what that journey reads. `pnpm run policy` is the
      command that can fail here — it reconciles each ledger surface and journey against the routes,
      the previews and the configured Playwright projects. `pnpm run policy:specs` cannot: it
      requires every id declared in `openspec/specs/` to be registered, `023/FR-001` is declared
      only in this change's delta until the change is archived, and the check would pass with the
      registration missing. It is a regression guard for what is already accepted, and the reason
      to make the entry now is that archiving turns it into a requirement rather than a courtesy.
- [ ] 5.5 Run `pnpm run check`. Verify unit coverage stays at or above 80% on all four counters,
      and report what passed, including which Playwright projects this container could run and
      which it could not.
