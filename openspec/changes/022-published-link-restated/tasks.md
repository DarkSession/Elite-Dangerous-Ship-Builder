## 1. Scope and the failing test

- [ ] 1.1 Nothing is drawn and no string is added, so responsiveness, touch targets, screen-reader
      semantics, localisation and design-system composition have nothing to check in this change
      (design.md, Screens). The only surface it touches is the address bar, which is not composed
      from the design system. Verify by holding the change to it: no template, style sheet or
      catalogue file is touched, and `pnpm run check` passes the accessibility and responsive
      journeys unchanged.
- [ ] 1.2 Add to `src/app/application/build-link/fragment-publisher.spec.ts` the case where a
      publication lands while the address is on another history entry, and the workspace's entry is
      left without the link. Drive it through the injectable `encode`, holding the encode open
      while the fragment moves, so the window is opened deliberately rather than raced. Verify it
      fails against the standing publisher (001/FR-020).
- [ ] 1.3 Add the case where the saved builds are opened before the build's link is published, and
      the address carries that link once the layer closes, in
      `src/app/features/build-workspace/build-workspace.page.spec.ts`, which is where `raise()` and
      `lower()` are already driven together — `LibraryPresence` has no suite of its own. Verify it
      fails for the same reason: `raise()` pushes at the same document, so the publication's
      document guard passes and the fragment lands on the layer's entry (001/FR-020).

## 2. Restoring a lost link

- [ ] 2.1 Add the watcher to `FragmentPublisher`, inside `start()` so it lives exactly as long as
      the publication effect does. Publication records the document a fragment was written onto in
      a private field beside `#token`, and not on `link()`: that model is what the application says
      about the build, and where the fragment was written is bookkeeping. The watcher reads that
      record and states the published link again when the address comes back empty at the same
      document. `markPublished` comes
      before `replaceFragment`, as publication does. Verify tasks 1.2 and 1.3 now pass, that a
      refusal leaves nothing to restore, and that the restoration adds no history entry
      (001/FR-020).
- [ ] 2.2 Verify a restoration leaves the open build untouched: the build is not replaced, and no
      replacement is offered for it. This is what `markPublished` is for, and it is the one part
      of task 2.1 the address does not show (001/FR-020).
- [ ] 2.3 Verify the watcher leaves a fragment that is not a build link exactly as it stands:
      neither restored over nor cleared. `recognizeBuildLinkFragment` answers `unrelated` for an
      empty fragment and for a foreign one alike, so emptiness is tested here and the recogniser is
      asked only to tell a build link from everything else. This is the line
      `FragmentPublisher.#clearBuildFragment` already holds (001/FR-020).

## 3. Leaving a replaced link alone

- [ ] 3.1 Verify in the publisher suite named in task 1.2 that an address carrying a build link
      other than the published one is left alone: assert the fragment is not written back, and
      that the coordinator's ingest still reaches the incoming link. This is the case that would
      make navigation by link impossible if the trigger were widened, so it is stated as its own
      test
      rather than folded into 2.1 (001/FR-020).
- [ ] 3.2 Verify a Commander who leaves the workspace while a publication is in flight arrives at
      an address with no build link on it, and that no restoration follows them there. Drive it by
      moving `currentDocument()` between the encode and its resolution (001/FR-020).
- [ ] 3.3 Verify nothing is stated where no link is published, for both reasons there can be none:
      no build, and a refused encode. A refusal removes a stale fragment with `replaceState`, under
      `openspec/changes/archive/001-ship-selection-and-loading/contracts/build-link.md`,
      "Active-edit synchronization", and the watcher must not undo that (001/FR-020).

## 4. Reading it end to end

- [ ] 4.1 Add a journey to `e2e/build-link.spec.ts`, beside the other journeys the
      `build/share-link` ledger entry covers: open a build, open the saved builds before the
      address carries the link, close the layer, and read that the address carries the build link
      and that reloading it opens the same build. Hold the window open by delaying the lazily
      imported codec chunk, as design.md sets out under "The journey holds the window open by
      delaying the codec chunk". The two existing library journeys stay as they are: they read the
      two ways out of the layer rather than this race, and they wait for the address deliberately
      (001/FR-020).
- [ ] 4.2 Add the journey's assertion to the `assertions` array of the same `build/share-link`
      entry in `e2e/coverage-ledger.ts`. That entry already registers `001/FR-020`, so no
      requirement id is added: the new requirement extends the same source as "Link validation and
      history" rather than introducing one. The ledger keys evidence by id, so the assertion is
      added on its own account rather than to satisfy a counter. Verify with
      `pnpm run policy:specs`.
- [ ] 4.3 Run `pnpm run check`. Verify unit coverage stays at or above 80% on all four counters,
      and report what passed, including which Playwright projects this container could run and
      which it could not.
