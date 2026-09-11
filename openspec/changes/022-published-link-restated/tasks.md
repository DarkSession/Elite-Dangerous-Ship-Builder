## 1. The failing test

- [ ] 1.1 Add to `fragment-publisher.spec.ts` the case a publication that lands while the address
      is on another history entry leaves the workspace's entry without the link. Drive it through
      the injectable `encode`, holding the encode open while the fragment moves, so the window is
      opened deliberately rather than raced. Verify it fails against the standing publisher
      (001/FR-020).
- [ ] 1.2 Add the case a build raised into the saved builds before its link is published comes
      back to an address carrying that link, beside `library-presence.spec.ts` or the workspace
      page's own suite — wherever `raise()` and `lower()` are already driven together. Verify it
      fails for the same reason: `raise()` pushes at the same document, so the publication's
      document guard passes and the fragment lands on the layer's entry (001/FR-020).

## 2. Restoring a lost link

- [ ] 2.1 Record in `FragmentPublisher` the document a fragment was published onto, in a private
      field beside `#token`, and not on `link()`. Verify a publication sets it and a refusal
      clears it, by driving both and asserting the restoration in task 2.2 acts on one and not the
      other (001/FR-020).
- [ ] 2.2 Add the watcher that states the published link again when the address carries no build
      link, at the same document, inside `start()` so it lives exactly as long as the publication
      effect does. `markPublished` before `replaceFragment`, as publication does. Verify tasks 1.1
      and 1.2 now pass, and that the restoration adds no history entry (001/FR-020).
- [ ] 2.3 Ask `recognizeBuildLinkFragment` what the address carries rather than testing it here.
      Verify an unrelated fragment the application does not own is treated as a lost link and the
      published link is restored over nothing of its own — the recognizer's `unrelated` verdict is
      about ownership, and an address with somebody else's fragment still lacks ours (001/FR-015,
      001/FR-020).

## 3. Leaving a replaced link alone

- [ ] 3.1 Verify in `fragment-publisher.spec.ts` that an address carrying a build link other than
      the published one is left alone: assert the fragment is not written back, and that the
      coordinator's ingest still reaches the incoming link. This is the case that would make
      navigation by link impossible if the trigger were widened, so it is stated as its own test
      rather than folded into 2.2 (001/FR-020).
- [ ] 3.2 Verify a Commander who leaves the workspace while a publication is in flight arrives at
      an address with no build link on it, and that no restoration follows them there. Drive it by
      moving `currentDocument()` between the encode and its resolution (001/FR-020).
- [ ] 3.3 Verify nothing is stated where no link is published — no build, and a refused encode —
      so a refusal that cleared the fragment is not immediately undone by the watcher
      (001/FR-019, 001/FR-020).

## 4. Reading it end to end

- [ ] 4.1 Add a journey to `e2e/build-library.spec.ts`: open a build, raise the saved builds
      before the address carries the link, close the layer, and read that the address carries the
      build link and that reloading it opens the same build. The existing two journeys stay as
      they are — they read the two ways out of the layer, not this race, and were deliberately
      made to wait for the address (001/FR-020).
- [ ] 4.2 Add the journey's assertion to the `ship-builder/build-link` row in
      `e2e/coverage-ledger.ts`. Verify with `pnpm run policy:specs`.
- [ ] 4.3 Run `pnpm run check`. Verify unit coverage stays at or above 80% on all four counters,
      and report what passed, including which Playwright projects this container could run and
      which it could not.
