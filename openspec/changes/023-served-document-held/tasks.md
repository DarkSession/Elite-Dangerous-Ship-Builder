## 1. Scope and the failing test

- [ ] 1.1 The held content is the generated document's own markup, already laid out for its
      viewport, already scanned for accessibility as a first frame, and already written in bundled
      English (015/FR-010, 015/FR-019, 015/FR-011). Holding the same nodes adds no composition, no
      touch target and no string. What is new is one composition of the application frame, and it
      is carried: task 4.1 confirms the preview manifest needs nothing added for it, and tasks 4.2
      and 4.4 read it at the layout profiles where it stands, before the change is read end to end
      (011/FR-004, 011/FR-022). Verify
      the rest by holding the change to it: no new catalogue key (011/FR-016), no reusable pattern
      entering the design system (011/FR-005), and the existing responsive and touch journeys pass
      unchanged (011/FR-021, 011/FR-006).
- [ ] 1.2 Add to `e2e/prerendered-first-frame.spec.ts`, in the journey "states a first navigation
      that failed, over the document it was served (018/FR-007, FR-008)" that already holds the
      failing first navigation in the production lane, the assertion the note at the end of that
      journey says is missing: the served document's own `main` is still standing, with the ship
      list in it and not only the banner and the tool links. Verify it fails against the standing
      takeover, which is what that note records (023/FR-001).
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
      `src/app/ui/components/app-frame/app-frame.html`, and takes the nodes as an input rather
      than having the adapter write into its template (design.md, "The shell draws the held content
      in the outlet's place"; constitution III) — that is where the copy was taken from, and
      anywhere else moves it out of its landmark. The container is part of the frame's first render
      rather than written in from an effect afterwards, so the copy lands in the render that
      removes the served nodes and nothing is painted between the two. The failure statement does
      not take space above the held content, which is design.md, "The failure statement does not
      take space above the content": 015/FR-009 admits three exceptions and this claims none of
      them, and reserving the space in the build is ruled out by 015/FR-010. Drawing it out of the
      flow over the content or after it both meet that, and this task picks one. Verify tasks 1.2,
      1.3 and 3.5 now pass, and that the failure statement still stands over the content rather
      than instead of it. Tasks 1.2 and 1.3 drive
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
      apply it and nothing the application may write in its place. Read it in the production lane,
      which is the only lane that serves a document to be left on. The absent disclosure is the
      delta's own rule rather than an omission: 015/FR-011a says a document read in bundled English
      has nothing to disclose (015/FR-011, 015/FR-011a, constitution VI).
- [ ] 2.6 Verify the held content carries the language it was served in, while the application
      around it declares the committed locale as its own language (011/FR-017). English standing
      inside a German page is a part in another language, so success criterion 3.1.2 is in scope:
      the target is WCAG 2.2 AA except 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11,
      and 3.1.2 is not among the eight. Assert the language on the container rather than on the
      page, and assert the language the running application declares rather than assuming it. Read
      it in the production lane, which is the only lane that serves a document to be left on
      (023/FR-001, 011/FR-015, 011/FR-017).

## 3. The boundaries

- [ ] 3.1 Verify a navigation that fails after a screen has been presented leaves the Commander on
      that screen, with nothing put back over it. This is the case that would take a screen away to
      answer a failure, so it is stated as its own test rather than folded into 2.4. Read it in the
      production lane. This reading passes against the standing takeover in either lane, because
      nothing is held today; what the production lane buys is that only there can a wrong
      implementation have something to put back, so only there can the test fail
      (023/FR-001, 018/FR-007).
- [ ] 3.2 Verify a first navigation that is cancelled or redirected, and whose replacement then
      fails, still leaves the Commander on what the address served: the pair counts as one
      presentation, so the cancellation does not end the hold. That rule is `023/FR-001`'s own —
      018/FR-005 reaches the same pair only to keep one waiting statement standing across it, and
      says nothing about what the Commander is left on. This is the case a rule written about the
      session's first navigation would miss. Read it in the unit sequence task 1.3 establishes: the
      only redirect the routes configure is the wildcard to the entry point, and an address the
      wildcard catches served the shell rather than a document, so no browser lane can reach the
      pairing at an address with something to hold (design.md, "The boundary is the first screen
      presented, not the first navigation"; 023/FR-001).
- [ ] 3.3 Verify an address the build generates no document for is unaffected: nothing is held, and
      a failed first navigation leaves the Commander on the shell, which is what that address
      served and what 018/FR-007's scenario "The first navigation fails at an address with no
      generated document" already requires. Read it on the production lane, at one of the two bench
      addresses 015/FR-018 names — `/outfitting` or `/equipment` — because that is where a build
      serves documents at other addresses and a shell at this one, so a reading there can fail. The
      development lane generates no document anywhere, so its copy is empty at every address and
      the same assertion passes however the adapter behaves; keep that reading where it already
      stands in `e2e/navigation-waiting.spec.ts`, and add the bench one beside the journey task 1.2
      extends. Assert the Commander is left on that shell and that no content is put back over it
      (023/FR-001, 018/FR-007, 015/FR-018).
- [ ] 3.4 Verify held content is kept as the address served it: the same nodes, with no figure
      recomputed and no sentence written for it. Assert the held markup matches what the document
      carried before bootstrap, so a later rewrite into a re-rendering fails here. Read it in the
      production lane. In the development lane no document is served, so there is no held markup
      and the assertion is satisfied by an adapter that does nothing. The figures in it come from
      the pinned package and are not recomputed on the way back (023/FR-001, 015/FR-004).
- [ ] 3.5 Verify a first navigation cancelled with nothing taking over leaves the Commander on what
      the address served. Nothing is stated over it, because a cancellation is not a failure
      (018/FR-007, "A navigation that is cancelled, and one that is redirected to another address,
      are not failures and MUST be stated as nothing"). No waiting statement is removed either,
      because none was drawn: 018/FR-008 says "the first presentation of a session MUST NOT be
      covered by it", and this is that presentation. So what the Commander is left on is the served
      content and nothing else. This is the case that separates
      counting screens presented from counting errors raised: an implementation restoring only on
      `NavigationError` passes every other test in this change and fails this one. Read beside it
      the outcome 018/FR-005 names as its own, "What takes over is not a navigation": a cancellation
      handed over to the address already open, which the application answers without navigating. No
      screen is presented there either, and an implementation counting navigations rather than
      screens would end the hold on it. Read both in the unit sequence task 1.3 establishes: no
      route carries a guard, so a browser lane cannot cancel a navigation at all (023/FR-001,
      018/FR-005).

## 4. Where the held frame is read

- [ ] 4.1 Verify the preview manifest needs nothing added, rather than adding a state to it.
      `ComponentState` is closed over the five states 011/FR-004 enumerates as populated, empty,
      loading, error and disabled, which the contract spells `default`, `empty`, `loading`, `error`
      and `disabled` (`src/app/ui/component-contract.ts`) — and `app-frame`
      already accounts for all five, with a fixture for three and a stated reason for the two its
      contract cannot represent. A `main` with content in it is none of the five: it is the frame
      in a state it is already previewed in, holding a composition no fixture supplies. None could
      show it in any case, because `main` is `<ng-content />` and the catalogue renders each cell
      through `NgComponentOutlet` with
      inputs alone (`projects/ui-preview/src/app/preview-app.ts`), so no component preview puts
      anything in the frame's `main`. Verify by running `pnpm run policy` with this change's code
      in place and reading that it reports nothing about `app-frame`. The composition is read
      where it occurs instead, in the product lane, which is tasks 4.2, 4.3 and 4.4 (011/FR-004,
      constitution IX).
- [ ] 4.2 Scan the held composition where it stands, in the production lane, across the layout
      profiles the journey in task 1.2 already runs: the held content and the failure statement
      together, asserted to report no in-scope violation. The existing scans reach the generated
      first frame and the screens the application presents, and this composition is neither
      (`openspec/changes/archive/018-navigation-loading-overlay/tasks.md` 6.5 scans its own
      standing overlay for the same reason). Verify with `pnpm run e2e` (011/FR-022, 011/SC-002).
- [ ] 4.3 Measure the restore, not only the takeover that succeeds: read that no content the
      Commander can see moves position, that no frame between the document arriving and the held
      content standing is emptier than the frame before it, and that the content does not blank and
      return. Read the movement against the failure statement landing beside the content, which is
      what this change stands in the same place for the first time: a statement that pushes the
      content down the page is a move. The frame draws its standing notices above the `main` the
      outlet sits in, so this is the reading that a statement taking space above the content
      fails. Measure the constraint rather than the mechanism task 2.3 chose. 015/FR-009 admits
      three exceptions and this claims none of them, so a fourth is not available and a visible
      move, removal or return is a failure rather than a cost. Verify with
      `pnpm run e2e` in the production lane, beside the journey task 1.2 extends (023/FR-001,
      015/FR-009).
- [ ] 4.4 Read the held composition at 200% text size and at 400% zoom, in the profiles the
      journey in task 1.2 already runs: the held content and the failure statement together, with
      the content complete and no horizontal page scrolling. 011/FR-011 requires it of every
      capability, and neither existing reading reaches this composition — 015/FR-019 scans the
      generated first
      frame, where no statement stands beside the content, and the responsive journeys never reach
      it. Change 018 read its own standing state the same way for the same reason
      (`openspec/changes/archive/018-navigation-loading-overlay/tasks.md` 6.6). Verify with
      `pnpm run e2e` (011/FR-011, 011/SC-003).

## 5. Reading it end to end

- [ ] 5.1 Re-read the takeover that succeeds, which this change must not disturb: run the existing
      015/SC-003 measurement and confirm the cumulative layout shift from first paint to
      interactive is still 0 on all five layout profiles in both orientations, and that no frame is
      emptier than the frame before it. This is also where the delta's scenario "A navigation
      presents a screen" is read: the copy is taken on every takeover, including the one that
      succeeds, so the measurement that proves keeping it costs nothing is this one. Verify with
      `pnpm run e2e` over `e2e/prerendered-first-frame.spec.ts` (023/FR-001, 015/FR-009,
      015/SC-003).
- [ ] 5.2 Re-read the locale replacement this change must not disturb, which is the other branch
      the modified 015/FR-011 creates. For a Commander whose committed locale is German at an
      address with a generated document, where the navigation presents the screen: the document
      paints English, the screen carries German once the catalogue arrives, nothing on the page is
      reordered or removed as it does, and each untranslated game name carries its disclosure
      (015/FR-011a). The reorder-and-removal assertion is the one that would expose a held copy
      standing where the screen should be, so read it here rather than assume it elsewhere. This is
      what an implementation that holds the English too long would break, and task 2.5 reads only
      the held branch. Read it in the production lane, which is the only lane with a generated
      document to replace. Verify with `pnpm run e2e` (015/FR-011, 015/FR-011a).
- [ ] 5.3 Remove the note at the end of the journey task 1.2 extends, in
      `e2e/prerendered-first-frame.spec.ts`,
      which records FR-007's second half as unread, because task 1.2 adds the assertion it asks
      for. Leave
      `openspec/changes/archive/018-navigation-loading-overlay/` alone: the archive is read and not
      extended, and its task 6.3 stands with the reason it carries. Verify by reading the journey
      back, and by `git status` showing nothing changed under `openspec/changes/archive/`.
- [ ] 5.4 Register the change in `e2e/coverage-ledger.ts`: add `023-served-document-held` to
      `COVERED_FEATURES`, add `023/FR-001` to the `requirements` array of the
      `prerendered/first-frame` entry, whose journey is `product/prerendered-first-frame`, and add
      the new readings to that entry's `assertions` array beside "a Commander whose bundle never
      arrives is left with the readable document" — which reads a different case and stays as it
      is: it blocks the bundle so the application never boots, where this change is about a chunk
      that never arrives after it has. One assertion for task 1.2's reading, and one each for tasks
      2.5 and 2.6, which are the new readings of `015/FR-011` and `015/FR-011a`. Those two ids are
      already in that entry's `requirements` array and stay there; what the modification adds is
      evidence, not a registration. Three rather than one per task, because the entry's assertions
      summarise what the journey reads rather than transcribing each test: it carries nine for a
      file of sixteen, and the readings tasks 3.1 to 3.5, 4.2 to 4.4 and 5.1 add are instances of
      the one the first of the three names. Verify by reading the entry back against
      the journey task 1.2 extends: the surface's journey name is the one that now carries the
      assertion, and the assertion text names what that journey reads. `pnpm run policy` is the
      command that can fail here — it reconciles each ledger surface and journey against the routes,
      the previews and the configured Playwright projects. `pnpm run policy:specs` cannot: it
      requires every id declared in `openspec/specs/` to be registered, `023/FR-001` is declared
      only in this change's delta until the change is archived, and the check would pass with the
      registration missing. It is a regression guard for what is already accepted, and the reason
      to make the entry now is that archiving turns it into a requirement rather than a courtesy.
      One surface carries the id, because task 3.3 now reads the shell scenario on the production
      journey too. Do not register it against the development-lane reading in
      `e2e/navigation-waiting.spec.ts`: that reading passes however the adapter behaves, as task
      3.3 says, and registering it would enter evidence that cannot fail.
- [ ] 5.5 Run `pnpm run check`. Verify unit coverage stays at or above 80% on all four counters,
      and report what passed, including which Playwright projects this container could run and
      which it could not.
