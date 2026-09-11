## 1. Scope and the failing test

- [ ] 1.1 The held content is the generated document's own markup, already laid out for its
      viewport, already scanned for accessibility as a first frame, and already written in bundled
      English (015/FR-010, 015/FR-019, 015/FR-011). Holding the same nodes adds no composition, no
      touch target and no string. What is new is one state of the application frame, and it is
      carried rather than waved past: task 4.1 previews it at the three widths and task 4.2 scans
      it where it stands, before the change is read end to end. Verify the rest by holding the
      change to it: no new catalogue key, no new design-system component, and the existing
      responsive and touch journeys pass unchanged (011/FR-004, 011/FR-022).
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
- [ ] 2.3 Put the copy back when a navigation ends in `NavigationError` and no screen has been
      presented in this session. Count screens presented rather than navigations run, so a first
      navigation that is cancelled or redirected and replaced does not spend the hold: the
      replacement failing is the same case (design.md, "The boundary is the first screen presented,
      not the first navigation"). The frame renders a container inside the
      `<main class="frame__main">` it already draws, where the outlet stands, in
      `src/app/ui/components/app-frame/app-frame.html`, and the adapter
      fills it — that is where the copy was taken from, and anywhere else moves it out of its
      landmark. Verify tasks 1.2 and 1.3 now pass, and that the failure statement still stands over
      the content rather than instead of it (023/FR-001, 018/FR-007).
- [ ] 2.4 Release the copy at the first `NavigationEnd`. Verify nothing is held after a screen has
      been presented, and that the held container is not drawn once a screen stands in the outlet
      (023/FR-001).
- [ ] 2.5 Verify the held content stays in the bundled English it was served in, for a Commander
      whose committed locale is German, and that the failure statement beside it is in German
      because that sentence is the shell's own. The catalogue is applied by rendering the screen,
      and the screen is what did not arrive, so there is nothing that can apply it and nothing the
      application may write in its place (015/FR-011, constitution IV and VI).

## 3. The boundaries

- [ ] 3.1 Verify a navigation that fails after a screen has been presented leaves the Commander on
      that screen, with nothing put back over it. This is the case that would take a screen away to
      answer a failure, so it is stated as its own test rather than folded into 2.4 (023/FR-001,
      018/FR-007).
- [ ] 3.2 Verify a first navigation that is cancelled or redirected, and whose replacement then
      fails, still leaves the Commander on what the address served. The pair is one presentation
      (018/FR-005), so the hold is not spent by the cancellation. This is the case a rule written
      about the session's first navigation would miss (023/FR-001).
- [ ] 3.3 Verify an address the build generates no document for is unaffected: nothing is held, and
      a failed first navigation leaves the Commander on the shell, which is what that address
      served. Read it where it already reads, in `e2e/navigation-waiting.spec.ts` on the
      development lane, and assert no held container is drawn (023/FR-001, 015/FR-015).
- [ ] 3.4 Verify held content is kept as the address served it: the same nodes, with no figure
      recomputed and no sentence written for it. Assert the held markup matches what the document
      carried before bootstrap, so a later rewrite into a re-rendering fails here. The figures in
      it come from the pinned package and are not recomputed on the way back
      (023/FR-001, 015/FR-004).

## 4. The state the frame gains

- [ ] 4.1 Declare the frame's held state in `src/app/ui/previews/preview-manifest.ts`, with a
      fixture standing in for the content an address served, so the state previews at desktop,
      tablet and mobile widths like every other state the frame supports. Verify with
      `pnpm run policy`, which rejects a component state with no preview and no stated reason
      (011/FR-004, 011/FR-024).
- [ ] 4.2 Scan the held state where it stands, in the production lane, across the layout profiles
      the journey in task 1.2 already runs: the held content and the failure statement together,
      asserted to report no in-scope violation. The existing scans reach the generated first frame
      and the screens the application presents, and this state is neither
      (`openspec/changes/archive/018-navigation-loading-overlay/tasks.md` 6.5 scans its own
      standing overlay for the same reason). Verify with `pnpm run e2e` (011/FR-022, 011/SC-002).

## 5. Reading it end to end

- [ ] 5.1 Re-read the takeover that succeeds, which this change must not disturb: run the existing
      015/SC-003 measurement and confirm the cumulative layout shift from first paint to
      interactive is still 0 on all five layout profiles in both orientations, and that no frame is
      emptier than the frame before it. Verify with `pnpm run e2e` over
      `e2e/prerendered-first-frame.spec.ts` (015/FR-009, 015/SC-003).
- [ ] 5.2 Remove the note at `e2e/prerendered-first-frame.spec.ts:575` that records FR-007's second
      half as unread, because task 1.2 adds the assertion it asks for. Leave
      `openspec/changes/archive/018-navigation-loading-overlay/` alone: the archive is read and not
      extended, and its task 6.3 stands with the reason it carries. Verify by reading the journey
      back, and by `git status` showing nothing changed under `openspec/changes/archive/`.
- [ ] 5.3 Register the change in `e2e/coverage-ledger.ts`: add `023-served-document-held` to
      `COVERED_FEATURES`, add `023/FR-001` to the `requirements` array of the
      `prerendered/first-frame` entry, whose journey is `product/prerendered-first-frame`, and add
      the journey's assertion to that entry's `assertions` array beside "a Commander whose bundle
      never arrives is left with the readable document". Verify with `pnpm run policy:specs`, which
      fails naming any declared id that is not registered. It reads `openspec/specs/` alone, so it
      accepts the registration now and starts requiring it when the delta is archived into the
      capability specification.
- [ ] 5.4 Run `pnpm run check`. Verify unit coverage stays at or above 80% on all four counters,
      and report what passed, including which Playwright projects this container could run and
      which it could not.
