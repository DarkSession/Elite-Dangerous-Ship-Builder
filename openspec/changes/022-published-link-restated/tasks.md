## 1. The failing test

- [ ] 1.1 Add to `fragment-publisher.spec.ts` the case a publication that lands while the address
      is on another history entry leaves the workspace's entry without the link. Drive it through
      the injectable `encode`, holding the encode open while the fragment moves, so the window is
      opened deliberately rather than raced. Verify it fails against the standing publisher
      (001/FR-020).
- [ ] 1.2 Add the case a build raised into the saved builds before its link is published comes
      back to an address carrying that link, in
      `src/app/features/build-workspace/build-workspace.page.spec.ts`, which is where `raise()` and
      `lower()` are already driven together — `LibraryPresence` has no suite of its own. Verify it
      fails for the same reason: `raise()` pushes at the same document, so the publication's
      document guard passes and the fragment lands on the layer's entry (001/FR-020).

## 2. Restoring a lost link

- [ ] 2.1 Add the watcher to `FragmentPublisher`, inside `start()` so it lives exactly as long as
      the publication effect does. It records the document a fragment was published onto in a
      private field beside `#token` — not on `link()`, which is what the application says about the
      build rather than bookkeeping — and states the published link again when the address comes
      back empty at that same document. `markPublished` before `replaceFragment`, as publication
      does. Verify tasks 1.1 and 1.2 now pass, that a refusal leaves nothing to restore, and that
      the restoration adds no history entry (001/FR-020).
- [ ] 2.2 Verify the watcher leaves a fragment this application does not own exactly as it stands:
      neither restored over nor cleared. `recognizeBuildLinkFragment` answers `unrelated` for an
      empty fragment and for a foreign one alike, so emptiness is tested here and the recognizer is
      asked only to tell a build link from everything else. This is the line
      `FragmentPublisher.#clearBuildFragment` already holds — the fragment is shared space
      (001/FR-015, 001/FR-020).

## 3. Leaving a replaced link alone

- [ ] 3.1 Verify in `fragment-publisher.spec.ts` that an address carrying a build link other than
      the published one is left alone: assert the fragment is not written back, and that the
      coordinator's ingest still reaches the incoming link. This is the case that would make
      navigation by link impossible if the trigger were widened, so it is stated as its own test
      rather than folded into 2.1 (001/FR-020).
- [ ] 3.2 Verify a Commander who leaves the workspace while a publication is in flight arrives at
      an address with no build link on it, and that no restoration follows them there. Drive it by
      moving `currentDocument()` between the encode and its resolution (001/FR-020).
- [ ] 3.3 Verify nothing is stated where no link is published — no build, and a refused encode —
      so a refusal that cleared the fragment is not immediately undone by the watcher
      (001/FR-019, 001/FR-020).

## 4. Reading it end to end

- [ ] 4.1 Add a journey to `e2e/build-link.spec.ts`, beside the other FR-020 journeys and under
      the `product/build-link` journey the ledger already names: open a build, raise the saved
      builds before the address carries the link, close the layer, and read that the address
      carries the build link and that reloading it opens the same build. Hold the window open
      deterministically by delaying the lazily imported codec chunk with `page.route`, installed
      once the workspace has loaded so only the lazy request is caught — `e2e/first-frame.ts`
      already delays JavaScript this way. If that chunk cannot be told from other lazy requests,
      assert the post-condition only and say so in the journey, with the race itself owned by
      tasks 1.1 and 1.2. The existing two library journeys stay as they are — they read the two
      ways out of the layer, not this race, and were deliberately made to wait for the address
      (001/FR-020).
- [ ] 4.2 Add the journey's assertion to the `assertions` array of the `build/share-link` entry in
      `e2e/coverage-ledger.ts`. The entry already registers `001/FR-020`, so no requirement is
      added. Verify with `pnpm run policy:specs`.
- [ ] 4.3 Nothing is drawn and no string is added, so responsiveness, touch targets, screen-reader
      semantics, localisation and design-system composition have nothing to check here — the only
      surface this change touches is the address bar, which is not composed from the design system
      (design.md, Screens).
- [ ] 4.4 Run `pnpm run check`. Verify unit coverage stays at or above 80% on all four counters,
      and report what passed, including which Playwright projects this container could run and
      which it could not.
