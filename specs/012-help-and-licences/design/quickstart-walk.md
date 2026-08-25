# Quickstart walk: Help, Licences and Provenance

Required by T064: walk [quickstart.md](../quickstart.md) sections 1 through 8 against the built
application and record any divergence as a defect rather than as a documentation edit. Section 9 is
T065's gate, so the two together cover the document.

Walked 2026-08-25 against `654027a`, and re-walked against `main` once the defect in
finding 2 was fixed there, on the container this repository builds in.

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

### 2. The sticky command bar took 55% of a tablet-landscape viewport at 200% text — fixed

Found by section 8's full-matrix run rather than by reading, and it is this feature's, so it is
recorded as a defect and not as a note. At `chromium-tablet-landscape` (1112 x 834) in German at
200% text the frame's command bar wraps to three rows and stands 462 pixels tall while staying
`position: sticky`. A control scrolled to the middle of the viewport therefore lands behind the bar
rather than under it, which is what feature 010's `hull-anatomy.spec.ts` mode-strip assertion
reports: all five anatomy modes answer to nothing at their own centres.

`HILFE & FAQ` — this feature's frame entry — is the item on the third row. Feature 011 already holds
the rule this breaks, in `app-frame.scss`: "a sticky banner is a fixed share of a short viewport",
released below `short-viewport`. That threshold is `max-height: 30rem`, and `rem` in a media query
resolves against the _initial_ font size, so a viewport that is 834 pixels stays 834 pixels to the
query however large the text grows while the bar it is protecting doubles. The guard was written for
400% zoom, which shrinks the viewport, and does not catch 200% text, which grows the chrome.

**Measured rather than argued**, at the same profile, locale and text size:

|                                  | bar height | the five mode centres at y 417 |
| -------------------------------- | ---------- | ------------------------------ |
| as shipped                       | 462 px     | all five answer to the banner  |
| with this feature's entry hidden | 374 px     | all five answer to themselves  |
| with the interim bound           | 334 px     | all five answer to themselves  |

So the entry is what carried the bar across the middle of the window, and the defect is this
feature's to fix rather than a condition it merely revealed.

**Fixed on `main`, not here.** An interim fix was made on this branch — the bar bounded to `40dvh`
above the compact composition with its own scroller — and it is **withdrawn**. While it stood,
`3f9b574` landed on `main` with a better answer to the same defect, reached from the
same diagnosis: the frame now measures the bar it actually rendered and releases it to `position:
static` when what it leaves below is no longer a viewport anything can be stacked in, and zeroes
`--edsb-layout-bar-height` so the chrome that offsets by the bar travels with it instead of freezing
over a gap. That is the shell's own rule enforced by measurement rather than approximated by a
viewport share, and it is feature 011's to make. The interim commit was dropped on the rebase; two
competing fixes for one defect would have left the bar clamped and scrolling even once released.

The rejected alternative is worth recording. The reference draws its wide help control as a 34 x 34
`?` square, and shrinking the entry to that would also have brought the bar under the midline. It
was not done: [reference-review.md](./reference-review.md) already settles that question the other
way, replacing the `?`'s title-only naming with the reference's own `HELP & FAQ` wording as a
visible label. Fixing a layout defect by withdrawing an accepted accessibility ruling would trade a
reflow failure for a naming one.

### 3. Firefox cannot be exercised in this container — environment, not product

Section 8 asks for the complete Chromium **and Firefox** matrix. Firefox is not present in
`/opt/pw-browsers`, and `playwright install firefox` fails: the download is blocked by this
environment's network policy.

The five Firefox projects were not run here.
That is a property of this container, not a narrowed matrix — `playwright.config.ts` still declares
all ten, `pnpm run check` still runs all ten, and CI runs them on a runner that has both engines.
Recorded here so that section 8's asterisk reads as a statement about where it was walked rather
than as a suite that was quietly reduced.

Two further container facts, found the same way and belonging with it. The container's Node was
v22.22.2 by the end of this walk, below the v22.22.3 the Angular CLI requires, so `ng` refused to
start at all; and the installed `@playwright/test` wants a Chromium build that
`/opt/pw-browsers` does not hold and `cdn.playwright.dev` is blocked. Neither is a property of this
repository — `.nvmrc` asks for Node 24, and CI installs its own browsers — and both were worked
around locally without changing a tracked file. They are recorded because they are the reason the
matrix here was run through a scratch configuration rather than through `pnpm run e2e` verbatim.

No project, viewport, accessibility rule or test was skipped to obtain a pass.

### 4. A second defect the walk's own assertions found, and fixed

Not a divergence between document and product, but the walk is where it surfaced, so it is recorded
with the rest. Section 8's 200%-text state at the mobile profile could not be reached: feature 011's
compact action layer hangs its panel off a trigger inside a sticky banner, so the panel cannot be
scrolled into view, and at 200% text the panel was taller than the space left below the banner. The
Help entry sat at y 873 in an 844-pixel viewport with no way to press it — FR-001's only route,
unavailable in a state a Commander can be in.

Fixed in `src/app/ui/components/app-frame/action-layer.scss`: the panel is bounded to the viewport
and scrolls itself. Recorded as this feature's one exception to "features 001–011 change nothing" in
[screen-inventory.md](./screen-inventory.md#cross-feature-placement).

## Section 9's gate, and the two results that needed a baseline

T065 runs `pnpm run check`. Every stage is green here except as recorded below: `format:check`,
`help:artifacts:check`, `typecheck`, `build`, `build:preview`, `policy` (seven checkers), the codec
capacity table, 252 generator tests, and 159 unit files / 2148 tests at 85.8 / 84.18 / 89.47 / 86
against the 80% thresholds. The five Chromium projects run 2775 tests.

**Six matrix failures, all of them the machine.** The complete Chromium matrix came back 2769 passed
and 6 failed in 35.2 minutes. Re-run serially, all six pass — 16 of 16, in two and a half minutes.
Five were plainly the clock: four axe sweeps in feature 002's
`outfitting-accessibility.spec.ts` exceeding the 30-second budget under eight workers, one of them
losing its page outright, and feature 001's two-page save test timing out at mobile-portrait. The
sixth was a state assertion — feature 008's "leaving the mode gives feature 010's plates back
unchanged" — whose before-snapshot held one plate and whose after-snapshot held two: a settle race
on the snapshot rather than a lost state, and it too passes alone. None is reachable from this
feature's change: the bar's bound applies above the compact composition and only past `40dvh`, and
at desktop with ordinary text the bar is nowhere near it.

**SC-002's timing budget is missed on this container, and it is not this feature's doing.** Feature
002's candidate search is asserted at under 100 ms from keystroke to painted rows, at 4x CPU
throttling. Here it reports 105.7 ms, then 102.6 ms, then a pass. Feature 002 recorded 59 ms worst
on 2026-08-22, so the gap is wide enough to be worth attributing rather than excusing, and the
attribution was measured rather than argued: the same measurement, on the same container, at
`342feec` — the last commit before this feature — reports **116.0 ms, then 111.3 ms, then a pass**.
The tree with this feature in it is the faster of the two. The budget is being missed by the
machine, and this feature moved the number the right way.

Recorded here rather than fixed, because it is feature 002's assertion about feature 002's surface
and this walk is not the place to retune another feature's budget or its code.

SC-005, this feature's own timing half, passes: the modal presents its first frame inside 100 ms at
the same throttling.

## What section 3 through 7 were walked with

Each section's expectations are asserted rather than eyeballed, so the walk is a matter of running
the journeys that carry them and reading the failures. The mapping is in
[screen-reader-record.md](./screen-reader-record.md#what-is-automated-in-its-place), which lists the
same assertions against what the manual protocol asks. Section 7 was run against the production
build and the shipped service worker with `E2E_PRODUCTION=1`, which is the only configuration in
which the offline claim means anything.
