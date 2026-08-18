# Implementation Plan: Help, Licences and Provenance

**Branch**: `012-help-and-licences` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/012-help-and-licences/spec.md`

## Summary

Add one eagerly loaded `/help` capability, reachable through the shared application shell and from
package-backed artwork/value contexts. It presents accepted help topics, distinct application and
bundled-Almanac identities, catalogue/calculation provenance, a deliberate package-defect link and
three complete verbatim legal documents. A build-time Node pipeline reads the root application
artifacts and installed `@elite-dangerous-almanac/core` package, validates and fingerprints them,
checks committed source-distribution copies byte-for-byte, and generates an immutable TypeScript
manifest for the initial browser bundle. Missing, empty, stale or ambiguous artifacts fail the build;
the runtime has no legal-content loading fallback and makes no network request.

Almanac 0.1.1 includes the correction filed as
[Elite-Dangerous-Almanac #307](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/307).
Its installed `THIRD_PARTY_NOTICES.md` now truthfully states that matching records ship under
`PROVENANCE/`. The application preserves the notice byte-for-byte.

## Technical Context

**Language/Version**: TypeScript 6.0 in strict mode; HTML and SCSS; Node.js 24 per `.nvmrc` for
artifact generation and verification

**Primary Dependencies**: Angular 22.1 standalone and zoneless APIs, Angular Router and signals,
`@elite-dangerous-almanac/core` 0.1.1 artifacts, Node standard
library (`fs`, `crypto`, `child_process`) for build-time ingestion, feature 001's application shell
and offline service worker, and feature 011's component/localisation/accessibility infrastructure

**Storage**: No feature-owned persistence. Help and legal data are immutable build artifacts;
disclosure state is ephemeral UI state. Language persistence remains owned by feature 011, and
opening help does not alter active builds, Web Storage or build-link fragments

**Testing**: Node test runner for artifact-generation failures and byte equality; Vitest through
Angular's unit-test builder with the 80% coverage gate; Playwright with `@axe-core/playwright` over
desktop, tablet/mobile portrait and landscape in Chromium and Firefox. The current repository still
lacks the feature 011 Firefox, landscape and automated-accessibility harness

**Target Platform**: Modern evergreen browsers on desktop, tablet and mobile; static client
application whose help and legal content is usable from the installed application shell without a
network

**Project Type**: Client-side Angular single-page application producing static files only

**Performance Goals**: Activating `/help` performs zero route-specific or cross-origin requests; all
owned help messages, exact legal text and identity data are in the initial application bundle, with
no lazy help chunk or runtime metadata fetch

**Constraints**: No backend, runtime environment configuration, telemetry or automatic external
request; legal bytes stay exact and untranslated; package artifacts remain package-owned; versions
come from manifests; non-release builds show a non-personal immutable build identifier; no build
data enters the issue-tracker URL; no page horizontal scrolling; one dark tokenised theme; all
application framing is localised; touch/screen-reader operation; WCAG 2.2 AA except criteria 2.1.1,
2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: One `/help` route; seven accepted help topics; application and Almanac identity
facts; root `LICENSE`; byte-exact installed Almanac `LICENSE` and `THIRD_PARTY_NOTICES.md`; one
external package-defect destination

**Design Reference**: `.design/Ship Builder.dc.html` help/about controls and overlays in canvases
1a–1d. Their global access, grouped information order and wide-to-narrow responsive intent are
retained. The repeated fixed overlays are deliberately replaced by the single eager `/help` route,
and their invented versions and unsupported licence/asset claims are rejected in
[design/reference-review.md](./design/reference-review.md).

## Constitution Check

_GATE: Passed for planning because the design preserves installed artifacts and the upstream
correction is released. Repository prerequisites remain. Re-check after Phase 1._

| Principle                               | Design evidence                                                                                                                                        | Status                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| I. Client-Side Only                     | Build-time ingestion produces static same-origin output; runtime help performs no upload, API call, telemetry or automatic external navigation.        | PASS                   |
| II. Almanac Source of Truth             | Version, licence, notices, issue URL and provenance statements originate in the installed package; the released #307 wording is preserved exactly.     | PASS                   |
| III. Domain Logic Outside UI            | Pure manifest validation and a read-only facade own identity/document invariants; components render view models and navigation intent.                 | PASS                   |
| IV. Lossless, Honest Builds             | Missing/empty/drifted artifacts fail generation; release and non-release identities are explicit; no version or legal text is invented.                | PASS                   |
| V. Desktop, Tablet and Mobile           | One responsive semantic document covers all sizes/orientations, touch, screen reader, 200% text and 400% zoom without document overflow.               | PASS                   |
| VI. Commander's Language                | Help/framing is localised; exact English legal text is unchanged and programmatically identified as English/untranslated.                              | PASS                   |
| VII. One Design System                  | The route and shell/context entries compose feature 011 primitives and tokens; no screen-local visual language is introduced.                          | PASS; prerequisite 011 |
| VIII. Tested Before It Ships            | Generator failure cases, exact-byte tests, dual-engine viewport journeys, axe and manual screen-reader checks are specified without relaxing coverage. | PASS; prerequisite 011 |
| IX. Specification Before Implementation | Every requirement maps to a plan-time surface and contract before tasks are generated.                                                                 | PASS                   |

### Required released and repository dependencies

1. Almanac 0.1.1 supplies the corrected
   [#307](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/307) notice. The package notice
   remains verbatim in the app; a local wording patch is prohibited.
2. Feature 001 must supply the persistent application shell, canonical `/build#b.…` behavior and
   production service-worker/app-shell caching used by the offline validation.
3. Feature 011 must supply shared tokens/components, locale selection/messages, Firefox and
   portrait/landscape projects, and the automated accessibility harness.
4. The release pipeline must provide explicit version-matched release evidence. Every other build
   is non-release and must have a safe build identifier; ambiguous metadata fails generation.

Feature 012 may be tasked after these repository contracts are accepted. No Almanac release gate remains.

## Project Structure

### Documentation (this feature)

```text
specs/012-help-and-licences/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── distribution-artifacts.md
│   └── help-navigation.md
└── design/
    ├── help-and-licences.md
    ├── reference-review.md
    └── screen-inventory.md
```

`tasks.md` is Phase 2 output and is intentionally not created by this command.

### Source Code (repository root)

```text
legal/
└── almanac/
    ├── LICENSE                         # committed exact installed-package copy
    └── THIRD_PARTY_NOTICES.md          # committed exact installed-package copy

scripts/
├── generate-distribution-manifest.mjs # validate sources, metadata and staged copies
└── generate-distribution-manifest.test.mjs

src/app/
├── domain/distribution/
│   ├── distribution-manifest.ts        # immutable identities/documents and invariants
│   └── distribution-manifest.spec.ts
├── platform/build/
│   └── distribution-manifest.generated.ts # ignored, deterministic build input
├── application/help/
│   ├── help.facade.ts                  # read-only generated manifest + locale view
│   └── help.presenter.ts
├── features/help/
│   ├── help.page.ts
│   ├── help.page.html
│   └── help.page.scss
├── i18n/                               # feature 011 owned help/framing messages
└── ui/                                 # feature 011 shared/extended document/link primitives

e2e/
└── help-and-licences.spec.ts
```

Tests live beside domain/application/component source. Existing shell, service-worker,
localisation, UI and E2E infrastructure is extended in its owning feature paths rather than copied
under help.

**Structure Decision**: Keep one Angular application and one eager route. A Node build boundary is
the only code allowed to read package files; it produces one immutable browser manifest and verifies
committed source-distribution copies. A pure validator defines truth, a read-only facade adds
localised framing, and the page only renders it. No mutable feature store, runtime file fetch,
Markdown/HTML interpretation, private legal copy or second navigation system is added.

## Phase 0: Research Conclusions

All decisions, package probes, alternatives and the released regression are recorded in
[research.md](./research.md). The decisive outcomes are:

- Resolve an exported Almanac leaf and walk to the installed package root, matching the repository's
  existing codec-table generator; direct browser/package subpath imports are not required.
- Validate UTF-8, non-whitespace content, exact package/app versions, safe metadata and SHA-256/byte
  identity before Angular compilation. Verify committed package legal copies byte-for-byte.
- Embed exact text in the initial TypeScript bundle and also ship traceable raw copies. Legal text is
  rendered as text, never translated, Markdown-rendered or inserted as HTML.
- Classify a release only from explicit version-matched release-workflow evidence. Every other build
  is visibly non-release and carries a sanitised CI identifier or commit abbreviation plus dirty
  marker; missing evidence fails the build.
- Use one eager `/help` route plus shared shell/context links. Browser Back returns to the source;
  active build/storage state is untouched.
- Source the package-defect destination from `package.json#bugs.url`; permit only an explicit native
  external action with a visible leaving-app warning and no query, fragment or build state.
- 0.1.1's notice correctly identifies its installed `PROVENANCE/` tree; byte-equality remains a
  regression requirement.

No planning clarification marker or unresolved Almanac dependency remains.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines build identity, exact legal documents, package provenance,
  help topics, external destinations and the generated immutable manifest.
- [contracts/distribution-artifacts.md](./contracts/distribution-artifacts.md) freezes artifact
  resolution, byte validation, committed-copy equality, release classification and build failures.
- [contracts/help-navigation.md](./contracts/help-navigation.md) freezes route ownership, content,
  legal rendering, contextual provenance and external-navigation behavior.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every FR to the shell/context entry
  surfaces and the `/help` route.
- [design/help-and-licences.md](./design/help-and-licences.md) defines information order,
  wide/narrow composition, legal-document states and accessibility behavior.
- [design/reference-review.md](./design/reference-review.md) records which hierarchy is adopted and
  which invented mock facts are excluded.
- [quickstart.md](./quickstart.md) supplies runnable upstream, artifact, build, offline, responsive,
  localisation, external-navigation and accessibility validation scenarios.

## Post-Design Constitution Re-check

Phase 1 introduces no server, runtime configuration request, telemetry, private game data, package
wording correction, mutable legal-content state, hard-coded display label or visual literal. The
full legal bytes and artifact identities remain traceable to shipped files; missing or contradictory
package content blocks release instead of degrading at runtime. Every FR has a surface owner and a
dual-engine responsive/accessibility validation path.

The planning gate remains **PASS with no exception**. The Almanac gate is satisfied; implementation
is sequenced behind the relevant feature 001 and 011 foundations. Before task generation,
resynchronise the committed legal copies and verify every hash/byte count.

## Complexity Tracking

No constitutional exception is requested. The build generator, immutable manifest and read-only
facade are the minimum separation that keeps filesystem/package concerns out of browser components,
makes release failures testable and keeps legal bytes exact. The single route and native disclosure
elements avoid a second content/navigation framework.
