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
| 8. Validate localisation, reflow and accessibility | pass\*  | the defect in finding 2 is fixed; Firefox cannot run here — 3  |

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
was not done here: at the time, [reference-review.md](./reference-review.md) settled that question
the other way, and fixing a layout defect by withdrawing an accepted accessibility ruling would have
traded a reflow failure for a naming one. **Superseded 2026-08-26:** the ruling itself has since been
revisited on its own merits, and the wide bar now draws the `?` with the action's name carried inside
it as text — see
[reference-review.md](./reference-review.md#two-departures-withdrawn-on-2026-08-26). The narrower
control is a consequence of that decision rather than a fix for this one, which stands as made.

What `main`'s fix did carry over the rebase was a policy violation: it declares
`--edsb-layout-bar-height: 0px` inside `app-frame.scss`, and the constitution has design tokens
defined once, in the token layer, with `check-interface-foundations.mjs` enforcing that as
`token-outside-source`. `pnpm run policy` was green before the rebase and red after it, on a file
this feature does not own. It was fixed here rather than left for `main`, because a red gate on this
branch is this branch's problem whatever wrote it: the declaration moved to
`styles/tokens/_semantic.scss` beside the token's own, selected as `edsb-app-frame.frame--released`.
The frame already puts that class on its host element, so the new selector reaches exactly what
`:host(.frame--released)` reached, and the released bar still takes the chrome below it with it. The
behaviour, the unit tests over the measurement and the end-to-end assertion at 200% text are
untouched; what moved is where the decision is written. Recorded as a second cross-feature exception
in [screen-inventory.md](./screen-inventory.md).

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
folded action layer hangs its panel off a trigger inside a sticky banner, so the panel cannot be
scrolled into view, and at 200% text the panel was taller than the space left below the banner. The
Help entry sat at y 873 in an 844-pixel viewport with no way to press it — FR-001's only route,
unavailable in a state a Commander can be in.

Fixed in `src/app/ui/components/app-frame/action-layer.scss`: the panel is bounded to the viewport
and scrolls itself. Recorded as this feature's one exception to "features 001–011 change nothing" in
[screen-inventory.md](./screen-inventory.md#cross-feature-placement).

## Section 9's gate, and the two results that needed a baseline

T065 runs `pnpm run check`. Every stage is green here except as recorded below: `format:check`,
`help:artifacts:check`, `typecheck`, `build` (403.19 kB raw / 101.83 kB transfer, inside the 500 kB
warning ceiling), `build:preview`, `policy` (seven checkers), the codec capacity table, 252 generator
tests, and 160 unit files / 2152 tests at 85.8 / 84.18 / 89.46 / 86.01 against the 80% thresholds.
The five Chromium projects run 2780 tests; the timing project runs 2 and the offline stage 70.

**Five matrix failures, all of them the machine.** The complete Chromium matrix came back 2775
passed and 5 failed in 34.8 minutes. Every one is a 30-second test timeout, and re-run on their own
all five pass — 10 of 10 in 51 seconds, across all five profiles. Four are the same axe sweep in
feature 002's `outfitting-accessibility.spec.ts`, which scans every family state and exceeds the
budget under eight workers; the fifth is feature 001's two-page save test at mobile-portrait, which
lost its context at `browserContext.close()`. None is reachable from this branch's change: the
released-bar rule applies only once the bar has wrapped past what a screen can be stacked in, and
neither test runs at a text size that gets it there.

**SC-002's timing budget.** Feature 002's candidate search is asserted at under 100 ms from
keystroke to painted rows, at 4x CPU throttling. An earlier run on this container reported 105.7 ms,
then 102.6 ms, then a pass, against feature 002's own 59 ms worst on 2026-08-22. That gap was wide
enough to attribute rather than excuse, and it was measured rather than argued: the same
measurement, on the same container, at `342feec` — the last commit before this feature — reported
**116.0 ms, then 111.3 ms, then a pass**. The tree with this feature in it was the faster of the
two, so the budget was being missed by the machine and this feature had moved the number the right
way. On the final run it passes outright, first attempt, which is consistent with that reading and
not with a regression this feature introduced.

Recorded rather than acted on, because it is feature 002's assertion about feature 002's surface and
this walk is not the place to retune another feature's budget or its code.

SC-005, this feature's own timing half, passes: the modal presents its first frame inside 100 ms at
the same throttling.

**What was not run here.** The five Firefox projects, for the reason in finding 3 — the engine is
not installed in this container and cannot be downloaded through its network policy. Nothing was
skipped, narrowed or excluded in the configuration: `playwright.config.ts` still declares all ten
projects and `pnpm run check` still invokes all ten. What is recorded above is a Chromium-complete
run, and CI runs both engines.

## What section 3 through 7 were walked with

Each section's expectations are asserted rather than eyeballed, so the walk is a matter of running
the journeys that carry them and reading the failures. The mapping is in
[screen-reader-record.md](./screen-reader-record.md#what-is-automated-in-its-place), which lists the
same assertions against what the manual protocol asks. Section 7 was run against the production
build and the shipped service worker with `E2E_PRODUCTION=1`, which is the only configuration in
which the offline claim means anything.

## Re-run of 2026-08-26, for the Phase 7 wording change

The two departures withdrawn on 2026-08-26 touch a shared component and two shipped catalogues, so
the gate was walked again rather than argued about.

| Stage                                               | Result                                                                      |
| --------------------------------------------------- | --------------------------------------------------------------------------- |
| `format:check`, `help:artifacts:check`, `typecheck` | pass                                                                        |
| `build` / `build:preview`                           | pass — 403.89 kB raw, 101.94 kB transfer, inside the 500 kB warning ceiling |
| `policy` (seven checkers) and `codec:capacity`      | pass                                                                        |
| `test:scripts`                                      | 252 of 252                                                                  |
| unit suite                                          | 160 files / 2176 tests, coverage 85.83 / 84.37 / 89.44 / 86.05              |
| Chromium matrix, all five profiles                  | 2790 of 2790                                                                |
| `e2e:offline` (Chromium)                            | 70 of 70                                                                    |
| `e2e:timing`                                        | SC-005 passes; feature 002's keystroke budget fails — see below             |
| Firefox matrix                                      | **not run** — the engine is still absent and still undownloadable here      |

Two results need the same qualification they needed on 2026-08-25, and one is new.

**Feature 002's keystroke budget fails here, and did before this change.** `outfitting-timing`
reports 175.9 ms against its 100 ms budget for the first keystroke of the run, settling to 71–82 ms
by the fifth. The same test on the same commit with these changes stashed reports 162.1 ms settling
to 69 ms, so the failure is the container and not this work. It is feature 002's assertion about
feature 002's surface, and retuning it is not this feature's to do. SC-005 — the modal's own first
frame under the same throttling — passes.

**The Firefox half is still unrun**, for the reason finding 3 records. `playwright install firefox`
was attempted once more and failed on the download, and no system Firefox exists in the image. The
configuration still declares all ten projects.

**New: the 200%-text sweep was passing for the wrong reason.** Shortening the help action's words
turned it red, and the panel geometry it was measuring had been wrong all along. Both causes and
both fixes are recorded in
[reference-review.md](./reference-review.md#a-defect-the-wide-bars-mark-exposed-2026-08-26). The
suite now asserts the panel's own box against the viewport rather than inferring reachability from a
click that happened to land, so the next regression fails on the geometry instead of on a label
length.

## Re-run of 2026-08-26, for the licence links

| Stage                                               | Result                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------- |
| `format:check`, `help:artifacts:check`, `typecheck` | pass                                                                   |
| `build` / `build:preview`                           | pass — 406.90 kB raw, 102.56 kB transfer, inside the 500 kB ceiling    |
| `policy` (eight checkers)                           | pass                                                                   |
| `test:scripts`                                      | 287 of 287                                                             |
| unit suite                                          | 160 files / 2203 tests, coverage 85.83 / 84.29 / 89.42 / 86.09         |
| Chromium matrix, all five profiles                  | 2889 of 2890 — see below                                               |
| `e2e:offline` (Chromium)                            | 80 of 80                                                               |
| `e2e:timing`                                        | SC-005 passes; feature 002's keystroke budget fails, as it did before  |
| Firefox matrix                                      | **not run** — the engine is still absent and still undownloadable here |

**The one Chromium failure is not this feature's.** `defence.spec.ts`'s doubled-text reflow
assertion failed once at `chromium-tablet-landscape` under four local workers and passes three of
three on its own. It is feature 006's assertion about feature 006's surface, and nothing in this
change reaches the defence region.

**Feature 002's keystroke budget still fails here**, at 131.7 ms against 100 ms for the first
keystroke and 60–72 ms by the fifth. The reading is the same one the Phase 7 re-run recorded: the
container, not the work. SC-005 — the modal's own first frame under the same throttling — passes.

**Two assertions had to learn something new**, and both are recorded rather than relaxed:

- `expectTargetSizes` now models SC 2.5.8's **Inline** exception, and proves it rather than naming
  it: the exemption is granted only where an element is measurably `display: inline` and measurably
  beside non-target text in the nearest non-inline ancestor. A `.inline-link` that someone later
  makes a block, or drops alone into a container, goes back to the 44-pixel baseline.
- Feature 011's preview stage can now be given the prose to put around a component. Rendered bare,
  an inline link is previewed in a shape the product never draws — and the catalogue's own target
  sweep would then measure a link that is not in a sentence against a baseline the standard exempts
  sentences from.
