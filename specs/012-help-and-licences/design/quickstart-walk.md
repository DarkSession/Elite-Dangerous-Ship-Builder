# Quickstart walk: Help, Licences and Provenance

Required by T064: walk [quickstart.md](../quickstart.md) sections 1 through 8 against the built
application and record any divergence as a defect rather than as a documentation edit. Section 9 is
T065's gate, so the two together cover the document.

Walked 2026-08-25 against `654027a`, on the container this repository builds in.

## Result by section

| Section                                            | Outcome | Note                                                           |
| -------------------------------------------------- | ------- | -------------------------------------------------------------- |
| 1. Generate and validate the artifacts             | pass    | 252 script tests; both generators clean                        |
| 2. Verify release and non-release identities       | pass\*  | one instruction was wrong; the product was not — see finding 1 |
| 3. Open and close without navigation or mutation   | pass    | every ledger row, plus SC-005 both halves                      |
| 4. Validate accepted help                          | pass    | seven topics, order, headings, both routes                     |
| 5. Validate exact legal presentation               | pass    | byte-identical excerpt; three summary lines; one legal body    |
| 6. Verify the modal offers no way out              | pass    | no anchor, no popup, no request to any origin                  |
| 7. Verify initial-load and offline behaviour       | pass    | production build and service worker, network disabled          |
| 8. Validate localisation, reflow and accessibility | open    | one defect open at tablet-landscape; Firefox cannot run here   |

## Findings

### 1. Section 2 asked for a release case that must fail — corrected

**The document was wrong, not the product.** Section 2 asked the reader to run the release case
against the version `scripts/resolve-build-version.mjs` resolves, and to expect it to pass:

```bash
SHIP_BUILDER_RELEASE_TAG="v$(node scripts/resolve-build-version.mjs)" pnpm run help:manifest
```

It fails, and correctly. The generator compares the declared tag against root
`package.json#version` and nothing else. `resolve-build-version.mjs` without `--write` only
_reports_ the version a deployed build would carry; the tree still declares `major.minor.0`, so the
tag and the shipped version genuinely disagree and a mismatch is a build failure by
[FR-007](../spec.md) and the [distribution contract](../contracts/distribution-artifacts.md).

CI does not hit this because `ci.yml` runs the resolver with `--write` before it builds, so by the
time the generator runs, `package.json#version` _is_ the resolved version. Verified by doing exactly
that:

```
Stamped package.json with version 0.1.7: 7 commits since 0.1 was declared in 60ef722990ba.
help manifest: release 0.1.7, Almanac 0.1.8, disclaimer 323 bytes
```

Section 2 now says that, including the `git checkout package.json` that puts the stamp back, and
records the correction inline. This is the one case where the walk edited the document, because the
document's instruction was the thing that was untrue.

The rest of section 2 behaves exactly as written: no declaration gives `nonRelease 0.1.0`; a
version-matched declaration gives `release 0.1.0`; and `latest`, `v0.0.0`, `HEAD`, `undefined` and a
mismatched version each exit non-zero and write no output.

### 2. The sticky command bar takes 55% of a tablet-landscape viewport at 200% text — open

Found by section 8's full-matrix run rather than by reading, and it is this feature's, so it is
recorded as a defect and not as a note. At `chromium-tablet-landscape` (1112 x 834) in German at
200% text the frame's command bar wraps to three rows and stands 455 pixels tall while staying
`position: sticky`. A control scrolled to the middle of the viewport therefore lands behind the bar
rather than under it, which is what feature 010's `hull-anatomy.spec.ts` mode-strip assertion
reports: all five anatomy modes answer to nothing at their own centres.

`HILFE & FAQ` — this feature's frame entry — is the item on the third row. Feature 011 already holds
the rule this breaks, in `app-frame.scss`: "a sticky banner is a fixed share of a short viewport",
released below `short-viewport`. That threshold is `max-height: 30rem`, and `rem` in a media query
resolves against the _initial_ font size, so a viewport that is 834 pixels stays 834 pixels to the
query however large the text grows while the bar it is protecting doubles. The guard was written for
400% zoom, which shrinks the viewport, and does not catch 200% text, which grows the chrome.

Under investigation: whether the bar crosses the viewport's middle without this feature's entry, and
what the remedy is. Recorded open rather than closed, because a section-8 pass that steps over a
failing assertion is not a pass.

### 3. Firefox cannot be exercised in this container — environment, not product

Section 8 asks for the complete Chromium **and Firefox** matrix. Firefox is not present in
`/opt/pw-browsers`, and `playwright install firefox` fails: the download is blocked by this
environment's network policy.

The five Firefox projects were not run here.
That is a property of this container, not a narrowed matrix — `playwright.config.ts` still declares
all ten, `pnpm run check` still runs all ten, and CI runs them on a runner that has both engines.
Recorded here so that "section 8: partial" reads as a statement about where it was walked rather
than as a suite that was quietly reduced.

No project, viewport, accessibility rule or test was skipped to obtain a pass.

### 4. A defect the walk's own assertions found, and fixed

Not a divergence between document and product, but the walk is where it surfaced, so it is recorded
with the rest. Section 8's 200%-text state at the mobile profile could not be reached: feature 011's
compact action layer hangs its panel off a trigger inside a sticky banner, so the panel cannot be
scrolled into view, and at 200% text the panel was taller than the space left below the banner. The
Help entry sat at y 873 in an 844-pixel viewport with no way to press it — FR-001's only route,
unavailable in a state a Commander can be in.

Fixed in `src/app/ui/components/app-frame/action-layer.scss`: the panel is bounded to the viewport
and scrolls itself. Recorded as this feature's one exception to "features 001–011 change nothing" in
[screen-inventory.md](./screen-inventory.md#cross-feature-placement).

## What section 3 through 7 were walked with

Each section's expectations are asserted rather than eyeballed, so the walk is a matter of running
the journeys that carry them and reading the failures. The mapping is in
[screen-reader-record.md](./screen-reader-record.md#what-is-automated-in-its-place), which lists the
same assertions against what the manual protocol asks. Section 7 was run against the production
build and the shipped service worker with `E2E_PRODUCTION=1`, which is the only configuration in
which the offline claim means anything.
