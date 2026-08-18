# Quickstart: Validate Help, Licences and Provenance

This guide validates the completed capability end to end. It does not replace implementation tasks or
the contracts in [contracts/](./contracts/).

## Prerequisites and released regression

1. Use the repository's Node version and committed dependency graph:

   ```bash
   nvm use
   pnpm install --frozen-lockfile
   ```

2. Confirm features 001 and 011 provide the accepted app shell/service worker, localisation/design
   system, ten Playwright projects and automated accessibility harness.
3. With Almanac 0.1.1 pinned, rerun the [#307](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/307)
   reproduction in [research.md](./research.md#almanac-notice-regression).
4. Run the explicit legal sync command once for the upgraded package, review the tracked
   `legal/almanac/` byte changes, then run verification. Stop if the installed notice says the
   shipped provenance files are absent. Do not add a downstream correction.

## Focused and full commands

```bash
pnpm run distribution:verify
pnpm run test:scripts
pnpm test -- --include 'src/app/domain/distribution/**/*.spec.ts' --include 'src/app/application/help/**/*.spec.ts' --include 'src/app/features/help/**/*.spec.ts'
pnpm exec playwright test e2e/help-and-licences.spec.ts
pnpm exec playwright test --list
pnpm run check
```

The Playwright list must include ten projects: Chromium and Firefox at desktop, tablet portrait,
tablet landscape, mobile portrait and mobile landscape. The full gate must run formatting, strict
typecheck, production build and artifact verification, script tests, unit coverage at 80% or above
for all four measures, and the complete Playwright matrix without skips/quarantine.

## Scenario 1: artifact and source-distribution integrity

Run the generator/verifier against the installed package and inspect the production output.

Expected:

- application version equals root `package.json#version`;
- bundled Almanac version and issue URL equal installed `package.json` fields;
- root application licence, installed Almanac licence and installed third-party notice are non-empty
  UTF-8 and each runtime/static copy has the same byte count and SHA-256 as its source;
- `legal/almanac/` copies are tracked and byte-equal to installed files;
- the static distribution carries all three raw documents while the initial browser bundle embeds
  their exact text;
- no generated source exposes an absolute workspace path or personal/build-machine information.

Use isolated script fixtures to remove, empty, whitespace-fill, corrupt and byte-modify each input and
to mismatch package mirrors. Every case must fail before Angular compilation with the affected
artifact named; no case may emit a runtime placeholder.

## Scenario 2: release and non-release identities

Generate a normal local/CI build and open `/help`.

Expected: “Application version” and “Bundled Almanac version” are distinct exact facts; the build is
visibly non-release and shows the safe CI/commit identifier. Neither value is labelled live game,
live data or live catalogue.

Exercise generator fixtures for matching release evidence, mismatched tag/version, `0.0.0` release,
missing build ID and identifiers containing whitespace, URL/path, branch/user/machine-like content.
Only the matching non-placeholder release succeeds as `release`; every ambiguous/unsafe case fails.

## Scenario 3: help from every context

From no-build catalogue/library state, an active build capability, a package-artwork/value region and
a full-screen/modal layer, activate the visible Help/data-and-licences action.

Expected: each reaches the same eager `/help` document without requiring a build/network. Browser
Back returns to the source with the same active build, URL fragment and local/session storage bytes.
No help route contains or copies the build payload.

Read all seven topics and compare them with the accepted list in
[contracts/help-navigation.md](./contracts/help-navigation.md). No raw key, blank copy, future promise,
cloud/account implication or private game-text translation appears.

## Scenario 4: complete legal and provenance presentation

Inspect the legal coverage index, expand each document and compare its DOM text (UTF-8 re-encoded)
with the authoritative artifact.

Expected:

- application, Almanac, Frontier and other third-party scopes are distinct and the app MIT terms are
  never said to relicense game/package data;
- every document is complete and byte/hash-equivalent after transport decoding;
- legal text remains English, is programmatically `lang=en` and has a localised untranslated-English
  disclosure;
- exact content is text, not interpreted HTML/Markdown, and URLs inside it do not become automatic
  unlabeled external actions;
- the Frontier notice remains within its full authoritative documents;
- provenance says the bundled Almanac supplies catalogue/calculations without a currency claim.

## Scenario 5: deliberate package-defect navigation

Observe requests before action, then intercept the external package-defect link activation.

Expected: no GitHub or other cross-origin request/navigation occurs before the Commander clicks. The
visible/accessibility text says the action is for Almanac package data/calculation defects and leaves
the app. The intercepted URL exactly equals installed `package.json#bugs.url`, uses no query/fragment
and contains no build/SLEF/ship/module/route/local data. `rel` includes `noreferrer noopener`.

## Scenario 6: first-load and offline behavior

Serve the production static browser output with SPA fallback rather than `ng serve`. Load the app
once, wait for the feature 001 service worker to control the page, then take the browser context
offline and directly reload `/help`.

Expected: the route, English fallback, help topics, identities, coverage index and all expanded exact
documents remain available. Opening help/each disclosure causes no route-specific request. No
cross-origin request, telemetry, runtime translation, package lookup or legal-content fetch occurs.

## Scenario 7: localisation, responsive and accessibility matrix

For release/non-release, overview, every expanded document and an alternate-locale state, run the
shared axe scan and semantic/no-overflow assertions in all ten projects.

Also verify manually at 200% text and 400% zoom with expanded/RTL framing and reduced motion:

- no document-level horizontal overflow, clipped legal text or lost action;
- one `main`/`h1`, coherent nested headings, fact relationships and disclosure expanded states;
- visible names match accessible names and every action meets the touch target;
- language/source/coverage, non-release and leaving-app meaning remain explicit without color/icon;
- a screen reader can find global help, read versions/provenance, expand all notices and identify the
  warned external action in the designed order;
- legal English remains unchanged while owned framing/messages use the active locale and bundled
  English fallback works offline.

Automated success does not waive manual failures. Any conformance statement must name the seven
keyboard-operation criteria excluded by the constitution.
