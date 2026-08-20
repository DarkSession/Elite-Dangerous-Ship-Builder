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

## 1. Generate and verify the help manifest

```bash
pnpm run help:manifest:check
pnpm run test:scripts
```

Expected:

- root application and installed Almanac manifests resolve locally;
- exactly one project-specific Frontier disclaimer is extracted from root `LICENSE`;
- the extracted payload is non-empty and its byte count/SHA-256 match generated runtime text;
- application and Almanac versions are distinct manifest facts;
- the repository `LICENSE` and Almanac issues destinations match their exact allowlists and contain
  no query/fragment;
- installed Almanac `LICENSE` and `THIRD_PARTY_NOTICES.md` exactly equal tracked
  `legal/almanac/` mirrors;
- the generated module contains no absolute path, personal/environment identifier, build data or
  extra legal document.

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
- the current placeholder/development build is visibly Non-release and shows its generated build ID;
- no label describes either value as the live game or live catalogue version.

In fixture tests, omit any release-workflow declaration and confirm a normal non-release identity is
emitted. Then declare a release workflow: provide version-matched evidence and confirm release state,
and repeat with missing, placeholder and mismatched evidence to confirm generation fails.

## 3. Open and close without navigation or mutation

Start the application:

```bash
pnpm start
```

From a no-build capability, record pathname/query/fragment/history length, open Help · About from the
frame, read it and close it. Repeat from an active build, the narrow action menu, package artwork and
a package value/calculation surface.

Expected:

- exactly one labelled modal appears above the unchanged capability;
- the URL, history length, build revision, selected capability/slot and stored records do not change;
- all entries reach the same modal; contextual entry may change only its initial in-modal position;
- close returns to the same underlying state; no focus/keyboard behavior is asserted;
- no route chunk, help file, legal file or cross-origin request occurs on open.

## 4. Validate accepted help and provenance

Confirm the modal contains all seven topics from
[contracts/help-navigation.md](./contracts/help-navigation.md): build-link privacy,
accounts/uploads/telemetry, browser persistence/clearing, offline assets, completed engineering
grades, hull facts versus build results and Almanac ownership.

Expected:

- the IDs form the exact seven-topic set with no duplicate, and every topic has a non-empty resolved
  governing-reference set matching the contract map;
- every topic matches accepted current behavior;
- no reference-only import promise appears;
- no answer says partial engineering rolls are retained;
- provenance says the bundled Almanac supplies catalogue data, validation and calculations;
- versions/provenance make no live-game/live-catalogue currency claim;
- the issue action is explicitly limited to Almanac package data/calculation defects.

## 5. Validate exact legal presentation

Compare the modal's English disclaimer text with a fresh generator extraction from root `LICENSE`.

Expected:

- exactly the project-specific disclaimer appears, unchanged, non-empty and marked as original
  English;
- application-owned attribution/framing is localised and distinguishes MIT rights from
  Frontier/package rights;
- no complete MIT licence, Almanac licence, third-party notice or second legal body is embedded;
- exactly one action is described as the destination for all remaining terms;
- its destination is
  `https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/blob/main/LICENSE`;
- the separate Almanac issues action is not described as legal detail.

## 6. Verify deliberate external navigation and privacy

Use Playwright interception rather than making internet requests. Before activation, assert that no
request or popup targets GitHub. Activate each external action independently.

Expected:

- visible and accessible text says the action leaves the application and may need a network;
- the native links use `rel="noreferrer noopener"`;
- exact destinations contain no query, fragment, current route, build payload, SLEF, hull/module
  identity, locale or browser data;
- licence activation targets only the repository `LICENSE`;
- issue activation targets only the Almanac issues page.

## 7. Verify initial-load and offline behavior

Build and serve the production output through the application-shell harness using feature 011's
single service worker. Load once to install the shell, then disable network and reload a no-build
capability. Open the modal before opening any hull artwork.

Expected:

- all seven topics, both versions, non-release/release state and the exact disclaimer are present;
- opening/reading/closing causes no request and has no loading/error/stale state;
- the licence and issue actions remain visible with their network warning but are not automatically
  followed;
- uncached package artwork may be temporarily absent under its owning contract, while help remains
  complete.

## 8. Validate localisation, reflow and accessibility

Run feature 011's preview and product E2E suites across desktop, tablet/mobile portrait and
landscape in Chromium and Firefox:

```bash
pnpm run e2e
```

Exercise release/non-release, global/contextual, alternate-locale, doubled-text, RTL, reduced-motion,
200%-text and actual-400%-zoom states.

Expected:

- owned strings translate with no raw key, blank or interpolation placeholder;
- the exact disclaimer remains unchanged, is marked `lang="en"` and stays understandable inside RTL
  framing;
- desktop uses the centered modal and narrow/constrained layouts use the complete sheet treatment;
- title/close remain available, all actions meet the shared touch target and no essential behavior
  relies on hover;
- no page/modal horizontal overflow, clipped disclaimer or unreachable final action occurs;
- axe reports no in-scope violation on the background and every open state.

Complete the manual screen-reader protocol: discover global/contextual entries, hear one labelled
modal, confirm background isolation, read headings/topics/facts, distinguish release/version facts,
identify disclaimer source/language and external warnings, then close and verify the unchanged
underlying capability.

## 9. Run the complete gate

```bash
pnpm run check
```

Expected: formatting, typecheck, production build, generator/script tests, unit coverage (at least
80% statements/branches/functions/lines) and the complete Playwright/axe matrix all pass. No browser,
viewport, accessibility rule or test is skipped to obtain a green build.

If conformance is reported, use the constitution's qualified statement: WCAG 2.2 AA except criteria
2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.
