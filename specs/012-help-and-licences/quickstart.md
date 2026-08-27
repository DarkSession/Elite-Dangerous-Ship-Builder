# Quickstart: Validate Help, Licences and Provenance

This guide validates the completed feature end to end. It assumes feature 001's application frame/
offline shell and feature 011's localisation, shared dialog, preview and complete Playwright/axe
matrix are present. Commands named below are implementation targets from the plan; tasks must wire
them into `pnpm run check`.

## Prerequisites

- Use the Node.js version accepted by `.nvmrc` and `package.json#engines`.
- Install with the committed lockfile:

```bash
pnpm install --frozen-lockfile
```

- Confirm the installed dependency is the lockfile-selected package and do not edit its artifacts.
- For container browsers whose executables differ from Playwright's pinned download, set
  `E2E_CHROMIUM_PATH` and `E2E_FIREFOX_PATH` rather than changing the required project matrix.

## 1. Validate the help manifest's sources

```bash
pnpm run help:manifest:check
pnpm run test:scripts
```

Expected:

- root application and installed Almanac manifests resolve locally;
- exactly one project-specific Frontier disclaimer is extracted from root `LICENSE`;
- the extracted payload is non-empty and its byte count/SHA-256 match generated runtime text;
- application and Almanac versions are distinct manifest facts;
- the repository `LICENSE` destination matches its exact allowlist and contains no query/fragment,
  and it is the only destination emitted;
- installed Almanac `LICENSE` and `THIRD_PARTY_NOTICES.md` exactly equal tracked
  `legal/almanac/` mirrors.

`help:manifest:check` validates those sources and writes nothing; it does not compare against the
artifact on disk, which carries the commit id and would therefore differ after any commit for a
change nobody made. Staleness is prevented by generation rather than by comparison: every command
that reads the module regenerates it first. `test:scripts` is what proves the emitted module
contains no absolute path, personal or environment identifier, build data or extra legal
document.

Run the generator's fixture suite and confirm named failures for missing/duplicate/malformed/empty
disclaimer blocks, invalid UTF-8, one-byte mirror drift, unsafe destinations, mismatched release
evidence and missing/unsafe non-release IDs. Run the help-definition invariant fixtures and confirm
named failures for a missing or duplicate required topic, empty or unresolved governing references,
and shipped-locale message gaps. Then execute the
[required content-review gate](./contracts/help-navigation.md#required-content-review-gate) against
the contract map and reject contradictions with cited sources or unsupported claims. No failed
mechanical or review gate may fall back to runtime content.

## 2. Verify release and non-release identities

Build the normal repository configuration and open Help · About.

Expected:

- application version equals root `package.json#version`;
- bundled Almanac version equals installed package `package.json#version`;
- exactly two identity facts appear, each separately labelled, and nothing in the modal says which
  classification the build has — FR-007's display half is withdrawn, and the reference draws two
  version facts and no third;
- no label describes either value as the live game or live catalogue version.

The classification below is therefore verified at the generator, by reading its output, not by
reading the screen.

No workflow is needed to exercise this — the classification reads one variable:

```bash
# 1. No declaration -> nonRelease with a buildId
unset SHIP_BUILDER_RELEASE_TAG; pnpm run help:manifest

# 2. Version-matched declaration over a non-0.0.0 version -> release
SHIP_BUILDER_RELEASE_TAG="v$(node -p "require('./package.json').version")" pnpm run help:manifest

# 3. Anything else while declared -> generation fails, never a silent downgrade
SHIP_BUILDER_RELEASE_TAG=latest pnpm run help:manifest   # expect non-zero exit, no output written
```

Note that root `package.json#version` declares `major.minor.0` and CI stamps the patch before it
builds (`scripts/resolve-build-version.mjs --write`), so case 2 succeeds here against the committed
declaration while the value a deployed build actually carries is `major.minor.<commit count>`.

Run case 2 against that value too, since it is the version release automation would have to agree
with — but run it the way CI does, with the stamp actually written, because the generator compares
the tag against `package.json#version` and nothing else:

```bash
# Stamp first, exactly as ci.yml does, then declare the stamped version.
version="$(node scripts/resolve-build-version.mjs --write)"
SHIP_BUILDER_RELEASE_TAG="v$version" pnpm run help:manifest   # expect release $version
git checkout package.json                                     # the stamp is never committed
```

Declaring the resolved version **without** writing the stamp is a failure, and the correct one: the
tree still says `major.minor.0`, so the tag and the shipped version genuinely disagree. **Corrected
2026-08-25** — an earlier revision of this section asked for exactly that and called it a pass.

Repeat case 3 with `v0.0.0`, `HEAD`, `undefined` and a mismatched version to confirm each fails and
writes no partial output.

## 3. Open and close without navigation or mutation

Start the application:

```bash
pnpm start
```

From a no-build capability, record pathname/query/fragment/history length, open Help · About from the
frame, read it and close it. Repeat from an active build, from the compact action layer, from hull
detail (package artwork) and from the outfitting ledger (package values). Confirm that none of those
surfaces carries a help control of its own.

Expected:

- exactly one labelled modal appears above the unchanged capability;
- the URL, history length, build revision, selected capability/slot and stored records do not change;
- the wide action and the compact action-layer item reach the same single modal;
- close returns to the same underlying state; no focus/keyboard behavior is asserted;
- no route chunk, help file, legal file or cross-origin request occurs on open;
- SC-005: at the mobile viewport under 4× CPU slowdown, the first complete frame of the
  already-loaded modal is presented within 100 ms of activation.

## 4. Validate accepted help and provenance

Confirm the modal contains every topic from
[contracts/help-navigation.md](./contracts/help-navigation.md): browser persistence/clearing and
completed engineering grades.

Expected:

- the IDs form the exact declared topic set with no duplicate, and every topic has a non-empty resolved
  governing-reference set matching the contract map;
- every topic matches accepted current behavior;
- no reference-only import promise appears;
- no answer says partial engineering rolls are retained;
- the `ABOUT` provenance sentence says the bundled Almanac supplies the catalogue, the checks and the
  calculations and that this application neither maintains nor corrects those game values — this is
  where the once-per-application Almanac credit lives;
- `ABOUT` carries the purpose sentence, the maintainer sentence, the provenance sentence and the two
  version facts, in that order, and nothing else;
- nothing in the modal makes a live-game/live-catalogue currency claim;
- no issue-tracker, support or defect-reporting action appears anywhere in the modal.

## 5. Validate exact legal presentation

Compare the modal's English disclaimer text with a fresh generator extraction from root `LICENSE`.

Expected:

- exactly the project-specific disclaimer appears, unchanged and non-empty, inside a region
  carrying `lang="en"`;
- above it, the four-line summary of what covers what — the application's code, the bundled
  Almanac, the game data and imagery, and the typefaces — one line each, localised;
- no sentence of prose framing above the summary, no sentence naming the excerpt's source and no
  sentence naming its language: the reference draws none of the three, and the language is a
  property of the text rather than a claim about it;
- no complete MIT licence, Almanac licence, third-party notice or second legal body is embedded.

## 6. Verify the modal offers no way out of the application

Use Playwright interception rather than making internet requests. Open the modal in every state and
inspect its subtree.

Expected:

- the modal contains no `a[href]`, no `target="_blank"`, no `form` and nothing that navigates;
- no request or popup targets GitHub, or any other origin, at any point;
- the only control the modal draws is its close, which is the reference's own;
- the repository-`LICENSE` address is still validated by the generator — a wrong address for the
  terms the source distribution carries is still a release failure — and is rendered nowhere. Assert
  it by reading the generated manifest, not the screen.

## 7. Verify initial-load and offline behavior

Build and serve the production output through the application-shell harness using feature 011's
single service worker. Load once to install the shell, then disable network and reload a no-build
capability. Open the modal before opening any hull artwork.

Expected:

- both topics, all three `ABOUT` sentences, both version facts, the licence summary and the exact disclaimer are
  present;
- opening/reading/closing causes no request and has no loading/error/stale state;
- there is nothing to follow: the modal has no external action offline or online;
- uncached package artwork may be temporarily absent under its owning contract, while help remains
  complete.

## 8. Validate localisation, reflow and accessibility

Run feature 011's preview and product E2E suites across desktop, tablet/mobile portrait and
landscape in Chromium and Firefox:

```bash
pnpm run e2e
```

Exercise alternate-locale, doubled-text, RTL, reduced-motion, 200%-text and actual-400%-zoom
states. There is no release/non-release state to exercise: the modal does not draw one.

Expected:

- owned strings translate with no raw key, blank or interpolation placeholder;
- the exact disclaimer remains unchanged, is marked `lang="en"` and stays understandable inside an
  RTL interface;
- desktop uses the centered modal and narrow/constrained layouts use the complete sheet treatment;
- title/close remain available, all actions meet the shared touch target and no essential behavior
  relies on hover;
- no page/modal horizontal overflow, clipped disclaimer or unreachable final section occurs;
- axe reports no in-scope violation on the background and every open state.

Complete the manual screen-reader protocol: discover the frame entry from a no-build and an active
capability, hear one labelled modal, confirm background isolation, read the `ABOUT`, `FAQ` and
`LICENCE` headings with their facts, questions and answers, hear the two version facts as two
distinct labelled facts, hear each question as a heading over its own answer, reach the three licence
summary lines as a list and then the excerpt in its declared language, then close and verify the
unchanged underlying capability.

## 9. Run the complete gate

```bash
pnpm run check
```

Expected: formatting, typecheck, production build, generator/script tests, unit coverage (at least
80% statements/branches/functions/lines) and the complete Playwright/axe matrix all pass. No browser,
viewport, accessibility rule or test is skipped to obtain a green build.

If conformance is reported, use the constitution's qualified statement: WCAG 2.2 AA except criteria
2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.
