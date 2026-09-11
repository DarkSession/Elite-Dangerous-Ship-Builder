## 1. Scope and the failing test

- [ ] 1.1 The held content is the generated document's own markup, already laid out for its
      viewport, already scanned for accessibility as a first frame, and already written in bundled
      English (015/FR-010, 015/FR-019, 015/FR-011). Holding the same nodes adds no composition, no
      touch target and no string, and the container that carries them draws nothing of its own.
      Verify by holding the change to it: no new catalogue key, no new design-system component, and
      the existing responsive, touch and accessibility journeys pass unchanged.
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
- [ ] 2.2 Register it as a browser-only application initializer in `src/app/app.config.ts`, before
      `provideRouter`, where `NavigationWaitingStore` already sits and for the same stated reason:
      initializers run in the order they are provided, and the blocking initial navigation starts
      from one of them. Verify with a test asserting the copy is taken before the first
      `NavigationStart`, so an initializer added later cannot silently move it after the takeover
      (023/FR-001).
- [ ] 2.3 Put the copy back where the outlet stands when the session's first navigation ends in
      `NavigationError`. The frame renders a container in the outlet's place while content is held,
      in `src/app/ui/components/app-frame/app-frame.html` beside the `<main class="frame__main">`
      it already draws, and the adapter fills it. Verify tasks 1.2 and 1.3 now pass, and that the
      failure statement still stands over the content rather than instead of it (023/FR-001,
      018/FR-007).
- [ ] 2.4 Release the copy at the first `NavigationEnd`. Verify nothing is held after a screen has
      been presented, and that the held container is not drawn once a screen stands in the outlet
      (023/FR-001).

## 3. The boundaries

- [ ] 3.1 Verify a navigation that fails after a screen has been presented leaves the Commander on
      that screen, with nothing put back over it. This is the case that would take a screen away to
      answer a failure, so it is stated as its own test rather than folded into 2.4 (023/FR-001,
      018/FR-007).
- [ ] 3.2 Verify an address the build generates no document for is unaffected: nothing is held, and
      a failed first navigation leaves the Commander on the shell, which is what that address
      served. Read it where it already reads, in `e2e/navigation-waiting.spec.ts` on the
      development lane, and assert no held container is drawn (023/FR-001, 015/FR-015).
- [ ] 3.3 Verify held content is kept as the address served it: the same nodes, with no figure
      recomputed and no sentence written for it. Assert the held markup matches what the document
      carried before bootstrap, so a later rewrite into a re-rendering fails here (023/FR-001,
      constitution IV).

## 4. Reading it end to end

- [ ] 4.1 Re-read the takeover that succeeds, which this change must not disturb: run the existing
      015/SC-003 measurement and confirm the cumulative layout shift from first paint to
      interactive is still 0 on all five layout profiles in both orientations, and that no frame is
      emptier than the frame before it. Verify with `pnpm run e2e` over
      `e2e/prerendered-first-frame.spec.ts` (015/FR-009, 015/SC-003).
- [ ] 4.2 Remove the note at `e2e/prerendered-first-frame.spec.ts:575` that records FR-007's second
      half as unread, and tick task 6.3 of
      `openspec/changes/archive/018-navigation-loading-overlay/tasks.md` with a line saying which
      change closed it. Verify by reading the journey back: the assertion the note asked for is the
      one task 1.2 added.
- [ ] 4.3 Register the change in `e2e/coverage-ledger.ts`: add `023-served-document-held` to
      `COVERED_FEATURES`, add `023/FR-001` to the `requirements` array of the
      `prerendered/first-frame` entry, whose journey is `product/prerendered-first-frame`, and add
      the journey's assertion to that entry's `assertions` array beside "a Commander whose bundle
      never arrives is left with the readable document". Verify with `pnpm run policy:specs`, which
      fails naming any declared id that is not registered. It reads `openspec/specs/` alone, so it
      accepts the registration now and starts requiring it when the delta is archived into the
      capability specification.
- [ ] 4.4 Run `pnpm run check`. Verify unit coverage stays at or above 80% on all four counters,
      and report what passed, including which Playwright projects this container could run and
      which it could not.
