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
and emits an immutable TypeScript manifest imported by the initial Angular bundle. A companion
release gate mechanically requires exactly one definition for each of FR-010's seven help topics,
complete shipped-locale messages and at least one resolvable governing accepted feature requirement
or constitution principle per topic; it emits a separate immutable browser-topic catalogue containing
only validated IDs and message keys, while content review checks each answer against its sources.
Missing, duplicate, unreferenced, contradictory or unsupported content fails before release.
Installed Almanac legal artifacts remain mirrored byte-for-byte in the source distribution to
satisfy redistribution terms, but they are not embedded or linked as additional legal documents in
the modal.

## Technical Context

**Language/Version**: TypeScript in strict mode; Angular HTML and SCSS; Node.js per the repository
tooling configuration for artifact generation and verification

**Primary Dependencies**: Angular standalone and zoneless APIs, Angular signals,
`@elite-dangerous-almanac/core` installed artifacts, Node standard library (`fs`, `crypto`,
`child_process`, `url`) for build-time generation, feature 001's application frame and offline app
shell, and feature 011's dialog, localisation, token and accessibility infrastructure

**Storage**: No feature-owned persistence. Open/closed state and invocation context are ephemeral;
the immutable help manifest and separate generated topic catalogue are compiled into the initial
application bundle. Locale persistence remains owned by feature 011

**Testing**: Node test runner for extraction, source-distribution equality and release metadata;
Vitest through Angular's unit-test builder with the existing 80% thresholds; Playwright with
`@axe-core/playwright` over desktop, tablet/mobile portrait and landscape in Chromium and Firefox

**Target Platform**: Modern evergreen browsers on desktop, tablet and mobile; static client
application with modal content usable without a network after one completed online app-shell load

**Project Type**: Client-side Angular single-page application producing static files only

**Performance Goals**: Spec SC-005 — opening the already-loaded modal performs no route load,
same-origin asset request or cross-origin request and presents its first complete frame within 100 ms
at the mobile viewport under 4× CPU slowdown — the same baseline feature 003 established and
features 005, 009 and 010 measure against, whose Chromium CDP `Emulation.setCPUThrottlingRate(4)`
harness feature 003 owns, run over the viewport projects feature 011's Playwright matrix supplies.
The timing half is therefore Chromium-only; SC-005's no-request half runs in both engines. Preserve
the existing production initial-bundle error budget (`angular.json`, `initial` `maximumError: 1MB`)
without raising its error ceiling within this feature

**Constraints**: No backend, account, telemetry, runtime legal fetch, runtime environment
configuration or automatic external navigation; only the exact project-specific Frontier disclaimer
is embedded; the repository `LICENSE` is the sole legal-details link; source terms remain distinct
from the application MIT grant; versions come from shipped manifests; non-release builds show a
non-personal immutable identifier; external URLs contain no build data; no document horizontal
scrolling; one dark tokenised theme; all application framing is localised; untranslated legal text is
identified as English; WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and
2.4.11

**Scale/Scope**: One shared modal and dialog state; global plus contextual entry surfaces; exactly
seven accepted help-topic definitions, each with unique identity and non-empty governing references;
application, build and Almanac identity facts; one exact Frontier excerpt; one repository-licence
destination; one Almanac package-defect destination; two required mirrored Almanac
source-distribution artifacts

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

1. Feature 001 supplies the persistent application frame, canonical build-fragment behavior and
   browser persistence referenced by help.
2. Feature 011 supplies the application's sole service-worker registration/base app-shell caching,
   shared dialog/layer primitives, tokens, localisation with bundled English fallback, component
   previews, Firefox/landscape projects and the automated accessibility harness.
3. Release automation, when it exists, declares a release by setting `SHIP_BUILDER_RELEASE_TAG` to
   `v${applicationVersion}`, per [contracts/distribution-artifacts.md](./contracts/distribution-artifacts.md)'s
   Release declaration. **No current workflow sets it**: `ci.yml` gates `main` and pull requests and
   `deploy.yml` publishes `main` to Pages, and root `package.json#version` is `0.0.0`, which the
   contract forbids from ever being a release. Every build the repository produces today is therefore
   non-release with a safe immutable build identifier, which is the correct outcome rather than a gap.
   This feature does not add a release workflow; it implements and tests the classification. Because
   the decision is environment-driven, the release and failure branches are exercised by generator
   fixtures without a workflow existing, so no task here is blocked on one.
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
    ├── help-and-licences.md            # Phase 1 design artifact
    ├── reference-review.md             # Phase 1 design artifact
    ├── screen-inventory.md             # Phase 1 design artifact
    ├── help-topic-review.md            # release-gate record, authored during implementation
    └── screen-reader-record.md         # release-gate record, authored during implementation
```

`tasks.md` is Phase 2 output and is intentionally not created by this command. The two release-gate
records are created when the work they record is performed, not at plan time; see
[Release-gate records](#release-gate-records-authored-during-implementation).

### Source Code (repository root)

```text
legal/
└── almanac/
    ├── LICENSE                         # exact installed-package source-distribution mirror
    ├── THIRD_PARTY_NOTICES.md          # exact installed-package source-distribution mirror
    └── README.md                       # mirror ownership, sync path and review rule

scripts/
├── help-topic-definitions.mjs         # exact IDs/message keys and tooling-only governing refs
├── check-help-topics.mjs              # set/reference/catalogue invariant gate
├── check-help-topics.test.mjs
├── generate-help-manifest.mjs         # validate/extract identities, disclaimer and destinations
└── generate-help-manifest.test.mjs

src/app/
├── domain/distribution/
│   ├── help-manifest.ts               # immutable artifact contracts and invariant validation
│   └── help-manifest.spec.ts
├── domain/help/
│   ├── help-topic.ts                  # runtime-safe topic identity and generated-record contract
│   └── help-topic.spec.ts
├── platform/build/
│   ├── help-manifest.generated.ts     # ignored deterministic artifact/identity browser input
│   └── help-topics.generated.ts       # ignored deterministic topic-key browser input
├── application/help/
│   ├── help-dialog.store.ts           # global ephemeral open/close/source state
│   ├── help-dialog.store.spec.ts
│   ├── help.presenter.ts              # generated facts + localised help view model
│   └── help.presenter.spec.ts
├── features/help/
│   ├── help-dialog.component.ts
│   ├── help-dialog.component.html
│   ├── help-dialog.component.scss
│   └── help-dialog.component.spec.ts
├── i18n/                              # feature 011-owned help/framing message entries
└── ui/                                # reused/extended dialog, fact, notice and external-link UI,
                                       # each new component with a co-located spec

e2e/
├── coverage-ledger.ts                 # feature 011-owned shared ledger; this feature appends
│                                      # one `helpRouteCoverage` export holding the exhaustive
│                                      # FR-011 capability/surface set and owns no other row
└── help-and-licences.spec.ts
```

Tests remain beside TypeScript/component sources where possible. The existing frame,
service-worker, localisation, UI and E2E infrastructure is extended in its owning feature paths
rather than duplicated under help.

**Structure Decision**: Keep one Angular application and one shared modal instance mounted by the
application frame. Node tooling is the only boundary allowed to read package/repository files. It
emits the minimal browser manifest and separately verifies exact source-distribution mirrors. A
tooling-only help-definition module owns governing references and emits a separate generated topic
catalogue containing only validated IDs and message keys, so references do not enter the browser
bundle or `HelpManifestV1`. A signal store owns only ephemeral modal state, a presenter combines
immutable facts with localised messages, and presentation components render inputs. No help route,
mutable feature persistence, runtime legal fetch, Markdown renderer, private legal wording or second
navigation system is added.

## Phase 0: Research Conclusions

All decisions and alternatives are recorded in [research.md](./research.md). The decisive outcomes
are:

- Use the reference's single grouped modal, not the old plan's `/help` route. Global and contextual
  actions dispatch one store intent, so the current capability, URL and build remain intact.
- Keep seven accepted help topics as localised application messages derived from the constitution
  and accepted feature contracts. Each exact topic ID occurs once and carries non-empty tooling-only
  references to the governing accepted requirement or principle. Structural checks validate the
  set and references; required content review validates the claims against them. Missing, duplicate,
  unreferenced, contradictory or unsupported content is a release-blocking failure. Exclude the
  mock's import claim and its obsolete partial-roll answer.
- Extract the unique Markdown-indented disclaimer block beneath the Frontier section's “Under those
  rules” marker. Remove only Markdown's structural four-space prefix; preserve every remaining byte,
  newline and character, record its SHA-256 and language, and fail on ambiguity or drift.
- Read application and Almanac versions from their actual manifests. Only explicit version-matched
  evidence in a declared release workflow produces a release identity. Builds outside a declared
  release workflow carry a sanitised CI identifier or git commit abbreviation plus optional dirty
  marker; invalid evidence in a declared release workflow fails.
- Validate one audited, query-free GitHub `LICENSE` URL as the sole legal-details destination. Read
  and validate the separate package-defect destination from Almanac `package.json#bugs.url`.
- Keep installed Almanac `LICENSE` and `THIRD_PARTY_NOTICES.md` as byte-exact tracked mirrors for
  source redistribution, but do not expose them as extra modal documents or links.
- Import the generated manifest, separate generated topic catalogue and bundled English messages
  eagerly. Opening the modal never enters a loading/error state and never causes a request.
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
  surfaces, information order, the exact seven accepted help records and governing-reference map,
  legal/provenance framing, external navigation and state preservation.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every FR to the application-frame
  entry, contextual provenance entry and shared Help · About modal; owns the exhaustive Release
  coverage ledger required by FR-011, which the `helpRouteCoverage` export in feature 011's shared
  `e2e/coverage-ledger.ts` transcribes rather than re-derives; and records the inherited accessibility, responsive and localisation baseline that
  feature 011's FR-011, FR-012, FR-015 and FR-021 govern.
- [design/help-and-licences.md](./design/help-and-licences.md) defines wide/narrow composition,
  semantic order, modal states, responsive behavior and component-system impact.
- [design/reference-review.md](./design/reference-review.md) records what is retained from `.design`
  and why mock facts, obsolete behavior and literal styling are excluded.
- [quickstart.md](./quickstart.md) supplies runnable artifact, modal-state, offline, responsive,
  localisation, external-navigation and accessibility validation scenarios.

### Release-gate records (authored during implementation)

These two files are outputs of the gates below, not Phase 1 design artifacts. Each is written when
the review or protocol it records is actually performed, and each is release-blocking until complete:

- `design/help-topic-review.md` records the semantic review of every accepted help answer against its
  governing sources, per [contracts/help-navigation.md](./contracts/help-navigation.md)'s required
  content-review gate. Any unchecked topic or unresolved discrepancy fails release.
- `design/screen-reader-record.md` records the completed manual assistive-technology protocol. The
  automated axe sweep is a floor, not a substitute for it (constitution principle V).

## Post-Design Constitution Re-check

Phase 1 introduces no server, runtime metadata request, telemetry, build-state field, private game
data, package correction, translated legal copy, second theme or route transition. The exact
Frontier excerpt remains traceable to the root `LICENSE`; package redistribution documents remain
traceable to the installed package; missing or contradictory inputs block release instead of
degrading at runtime. The exact seven help definitions are unique, complete in every shipped locale
and each traceable to a non-empty governing-reference set; contradictory or unsupported help blocks
release. Every FR has an owning surface and a dual-engine responsive/accessibility validation path.
The modal's single legal-details link and separate package-defect action are identified, allowlisted
and free of application/build data.

The post-design gate remains **PASS with no exception**. Implementation is sequenced behind the
relevant feature 001 and 011 foundations.

## Complexity Tracking

No constitutional violation requires justification. The small build generator is necessary to make
verbatim legal text and shipped versions mechanically traceable; the signal store is necessary to
let every capability open one shared dialog without navigation or duplicated state. Both remain
narrower than a route/content framework or runtime document loader.
