# Implementation Plan: Help, Licences and Provenance

**Branch**: `012-help-and-licences` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/012-help-and-licences/spec.md`

## Summary

Add one shared Help · About modal to the application frame. A visible global action opens it from
every capability and no-build state, while package-backed artwork and value surfaces can dispatch
the same open intent. Opening and closing the modal changes no route, URL fragment, build, storage or
capability state. The modal presents current privacy/offline/engineering help, separate application
and bundled-Almanac identities, bounded provenance, the exact project-specific Frontier disclaimer
extracted from the root `LICENSE`, one warned external link to that `LICENSE` on GitHub, and one
separately identified Almanac package-defect link.

A build-time Node generator validates the root and installed-package artifacts, extracts the one
permitted legal excerpt without maintaining a second copy, classifies release/non-release identity,
and emits an immutable TypeScript manifest imported by the initial Angular bundle. Missing, empty,
ambiguous or drifted inputs fail before release. Installed Almanac legal artifacts remain mirrored
byte-for-byte in the source distribution to satisfy redistribution terms, but they are not embedded
or linked as additional legal documents in the modal.

## Technical Context

**Language/Version**: TypeScript in strict mode; Angular HTML and SCSS; Node.js per the repository
tooling configuration for artifact generation and verification

**Primary Dependencies**: Angular standalone and zoneless APIs, Angular signals,
`@elite-dangerous-almanac/core` installed artifacts, Node standard library (`fs`, `crypto`,
`child_process`, `url`) for build-time generation, feature 001's application frame and offline app
shell, and feature 011's dialog, localisation, token and accessibility infrastructure

**Storage**: No feature-owned persistence. Open/closed state and invocation context are ephemeral;
the immutable help manifest is compiled into the initial application bundle. Locale persistence
remains owned by feature 011

**Testing**: Node test runner for extraction, source-distribution equality and release metadata;
Vitest through Angular's unit-test builder with the existing 80% thresholds; Playwright with
`@axe-core/playwright` over desktop, tablet/mobile portrait and landscape in Chromium and Firefox

**Target Platform**: Modern evergreen browsers on desktop, tablet and mobile; static client
application with modal content usable from the initial app shell without a network

**Project Type**: Client-side Angular single-page application producing static files only

**Performance Goals**: Opening the already-loaded modal performs no route load, same-origin asset
request or cross-origin request and presents its first complete frame within 100 ms under the shared
mobile 4x-CPU test profile; preserve the production initial-bundle error budget

**Constraints**: No backend, account, telemetry, runtime legal fetch, runtime environment
configuration or automatic external navigation; only the exact project-specific Frontier disclaimer
is embedded; the repository `LICENSE` is the sole legal-details link; source terms remain distinct
from the application MIT grant; versions come from shipped manifests; non-release builds show a
non-personal immutable identifier; external URLs contain no build data; no document horizontal
scrolling; one dark tokenised theme; all application framing is localised; untranslated legal text is
identified as English; WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and
2.4.11

**Scale/Scope**: One shared modal and dialog state; global plus contextual entry surfaces; seven
accepted help topics; application, build and Almanac identity facts; one exact Frontier excerpt;
one repository-licence destination; one Almanac package-defect destination; two required mirrored
Almanac source-distribution artifacts

**Design Reference**: `.design/Ship Builder.dc.html` canvases 1a–1d. The grouped About → FAQ →
Licence order, centered wide modal, narrow bottom sheet, persistent close control and global/mobile
entry intent are retained. Invented versions, obsolete FAQ answers, unverified asset/typeface claims,
fixed visual literals and title-only `?` controls are rejected in
[design/reference-review.md](./design/reference-review.md).

## Constitution Check

_GATE: Passed before Phase 0 research. Re-check after Phase 1. No constitutional exception is
requested._

| Principle                               | Design evidence                                                                                                                                         | Status                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| I. Client-Side Only                     | Help is compiled into the static app shell; dialog state is memory-only; external links require explicit activation and carry no build data.            | PASS                   |
| II. Almanac Source of Truth             | Almanac version and issue destination come from the installed manifest; provenance claims only the package's catalogue/calculation role.                | PASS                   |
| III. Domain Logic Outside UI            | A pure artifact generator and read-only presenter own identities/content; dialog components receive state and emit open/close/navigation intent.        | PASS                   |
| IV. Lossless, Honest Builds             | Help never mutates a build; exact source text and shipped versions are validated; unavailable or ambiguous build metadata blocks release.               | PASS                   |
| V. Desktop, Tablet and Mobile           | Centered wide modal becomes a complete narrow sheet; shared dialog semantics, touch sizing, zoom/reflow, dual engines and axe are part of the contract. | PASS                   |
| VI. Commander's Language                | Owned help/framing is localised with bundled English fallback; exact disclaimer remains unchanged in a labelled English region.                         | PASS                   |
| VII. One Design System                  | Feature 011's application frame, dialog, disclosures, facts, notices, links and tokens are reused or extended under `src/app/ui/`.                      | PASS; prerequisite 011 |
| VIII. Tested Before It Ships            | Generator failure tests, exact-source assertions, modal journeys, dual-engine viewports, axe and manual screen-reader checks retain all gates.          | PASS; prerequisite 011 |
| IX. Specification Before Implementation | Every requirement maps to a plan-time surface, model, contract and validation scenario before tasks are generated.                                      | PASS                   |

### Required repository dependencies

1. Feature 001 supplies the persistent application frame, canonical build-fragment behavior,
   browser persistence and production service-worker/app-shell caching referenced by help.
2. Feature 011 supplies shared dialog/layer primitives, tokens, localisation with bundled English
   fallback, component previews, Firefox/landscape projects and the automated accessibility harness.
3. Release automation supplies explicit version-matched release evidence. Every other build is
   classified as non-release and must have a safe immutable build identifier.
4. No Almanac defect blocks this feature. The installed package manifest and legal artifacts are
   sufficient inputs and are consumed without local correction.

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
    ├── LICENSE                         # exact installed-package source-distribution mirror
    └── THIRD_PARTY_NOTICES.md          # exact installed-package source-distribution mirror

scripts/
├── generate-help-manifest.mjs         # validate/extract identities, disclaimer and destinations
└── generate-help-manifest.test.mjs

src/app/
├── domain/distribution/
│   ├── help-manifest.ts               # immutable artifact contracts and invariant validation
│   └── help-manifest.spec.ts
├── platform/build/
│   └── help-manifest.generated.ts     # ignored deterministic browser input
├── application/help/
│   ├── help-dialog.store.ts           # global ephemeral open/close/source state
│   ├── help.presenter.ts              # generated facts + localised help view model
│   └── help.presenter.spec.ts
├── features/help/
│   ├── help-dialog.component.ts
│   ├── help-dialog.component.html
│   └── help-dialog.component.scss
├── i18n/                              # feature 011-owned help/framing message entries
└── ui/                                # reused/extended dialog, fact, notice and external-link UI

e2e/
└── help-and-licences.spec.ts
```

Tests remain beside TypeScript/component sources where possible. The existing frame,
service-worker, localisation, UI and E2E infrastructure is extended in its owning feature paths
rather than duplicated under help.

**Structure Decision**: Keep one Angular application and one shared modal instance mounted by the
application frame. Node tooling is the only boundary allowed to read package/repository files. It
emits the minimal browser manifest and separately verifies exact source-distribution mirrors. A
signal store owns only ephemeral modal state, a presenter combines immutable facts with localised
messages, and presentation components render inputs. No help route, mutable feature persistence,
runtime legal fetch, Markdown renderer, private legal wording or second navigation system is added.

## Phase 0: Research Conclusions

All decisions and alternatives are recorded in [research.md](./research.md). The decisive outcomes
are:

- Use the reference's single grouped modal, not the old plan's `/help` route. Global and contextual
  actions dispatch one store intent, so the current capability, URL and build remain intact.
- Keep seven accepted help topics as localised application messages derived from the constitution
  and accepted feature contracts. Exclude the mock's import claim and its obsolete partial-roll
  answer.
- Extract the unique Markdown-indented disclaimer block beneath the Frontier section's “Under those
  rules” marker. Remove only Markdown's structural four-space prefix; preserve every remaining byte,
  newline and character, record its SHA-256 and language, and fail on ambiguity or drift.
- Read application and Almanac versions from their actual manifests. Only explicit version-matched
  release evidence produces a release identity; every other build carries a sanitised CI identifier
  or git commit abbreviation plus optional dirty marker.
- Validate one audited, query-free GitHub `LICENSE` URL as the sole legal-details destination. Read
  and validate the separate package-defect destination from Almanac `package.json#bugs.url`.
- Keep installed Almanac `LICENSE` and `THIRD_PARTY_NOTICES.md` as byte-exact tracked mirrors for
  source redistribution, but do not expose them as extra modal documents or links.
- Import the generated manifest and bundled English help catalogue eagerly. Opening the modal never
  enters a loading/error state and never causes a request.
- Compose feature 011's dialog/facts/notices/actions, with a centered wide treatment and bottom-sheet
  narrow treatment matching `.design` while meeting reflow, touch, screen-reader and reduced-motion
  requirements.

No planning clarification marker or unresolved upstream dependency remains.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines immutable build/package identity, the exact disclaimer,
  external destinations, source-distribution evidence, help topics, dialog state and the composed
  view model.
- [contracts/distribution-artifacts.md](./contracts/distribution-artifacts.md) freezes source
  resolution, exact extraction, byte/hash checks, source-distribution mirrors, URL validation,
  release classification and failure behavior.
- [contracts/help-navigation.md](./contracts/help-navigation.md) freezes modal ownership, entry
  surfaces, information order, accepted help content, legal/provenance framing, external navigation
  and state preservation.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every FR to the application-frame
  entry, contextual provenance entry and shared Help · About modal.
- [design/help-and-licences.md](./design/help-and-licences.md) defines wide/narrow composition,
  semantic order, modal states, responsive behavior and component-system impact.
- [design/reference-review.md](./design/reference-review.md) records what is retained from `.design`
  and why mock facts, obsolete behavior and literal styling are excluded.
- [quickstart.md](./quickstart.md) supplies runnable artifact, modal-state, offline, responsive,
  localisation, external-navigation and accessibility validation scenarios.

## Post-Design Constitution Re-check

Phase 1 introduces no server, runtime metadata request, telemetry, build-state field, private game
data, package correction, translated legal copy, second theme or route transition. The exact
Frontier excerpt remains traceable to the root `LICENSE`; package redistribution documents remain
traceable to the installed package; missing or contradictory inputs block release instead of
degrading at runtime. Every FR has an owning surface and a dual-engine responsive/accessibility
validation path. The modal's single legal-details link and separate package-defect action are
identified, allowlisted and free of application/build data.

The post-design gate remains **PASS with no exception**. Implementation is sequenced behind the
relevant feature 001 and 011 foundations.

## Complexity Tracking

No constitutional violation requires justification. The small build generator is necessary to make
verbatim legal text and shipped versions mechanically traceable; the signal store is necessary to
let every capability open one shared dialog without navigation or duplicated state. Both remain
narrower than a route/content framework or runtime document loader.
