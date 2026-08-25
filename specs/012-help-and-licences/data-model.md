# Data Model: Help, Licences and Provenance

Feature 012 adds no build field, saved record or browser-storage record. Its durable inputs are
build-time artifacts; its only runtime state is whether the shared modal is open.

## BuildIdentity

Identity of the application artifact being displayed.

```text
BuildIdentity =
  | { kind: "release"; applicationVersion: string }
  | { kind: "nonRelease"; applicationVersion: string; buildId: string }
```

Validation:

- `applicationVersion` is copied exactly from root `package.json#version` and is non-empty.
- `release` requires explicit release-workflow evidence matching that version and cannot use the
  placeholder `0.0.0`.
- `nonRelease` always has a bounded, non-personal immutable `buildId` from CI evidence or a git
  commit abbreviation plus optional `dirty` marker.
- Absence of release-workflow evidence selects `nonRelease`; a missing/unsafe non-release `buildId`
  or incomplete, contradictory or placeholder evidence inside a declared release workflow is a build
  failure, not a runtime unavailable state.

## AlmanacIdentity

Identity of the installed package.

| Field         | Type   | Source                                   | Rule                                                |
| ------------- | ------ | ---------------------------------------- | --------------------------------------------------- |
| `packageName` | string | installed Almanac `package.json#name`    | exactly `@elite-dangerous-almanac/core`             |
| `version`     | string | installed Almanac `package.json#version` | non-empty and displayed separately from app version |

No issue-tracker URL is read or carried. FR-009 is withdrawn, so the installed package's `bugs.url`
is not a manifest input and the modal has no destination sourced from it.

The identity makes no live-game or live-catalogue version claim.

## FrontierDisclaimer

The one legal excerpt allowed in the modal.

| Field        | Type                   | Meaning                                       |
| ------------ | ---------------------- | --------------------------------------------- |
| `documentId` | `frontierDisclaimer`   | stable identity                               |
| `source`     | `LICENSE`              | repository-root source artifact               |
| `language`   | `en`                   | unchanged source language                     |
| `exactText`  | non-empty string       | extracted project-specific disclaimer payload |
| `byteLength` | positive integer       | UTF-8 byte count of `exactText`               |
| `sha256`     | 64 lowercase hex chars | SHA-256 of the exact UTF-8 payload            |

Validation:

- The root document is valid UTF-8 and contains exactly one matching Frontier section, marker and
  immediately following Markdown-indented block.
- Extraction removes only Markdown's four-space structural indentation; no character, internal
  space or line break inside the payload is otherwise altered.
- Re-encoding `exactText` reproduces `byteLength` and `sha256`.
- No application, Almanac or third-party document body is included in this entity.

## ExternalDestination

An audited, deliberate navigation that never contains application state.

```text
ExternalDestination {
  id: "repositoryLicense"
  url: HTTPS URL
  purpose: "completeLegalTerms"
  leavesApplication: true
  mayRequireNetwork: true
}
```

Validation:

- `repositoryLicense` is the exact query/fragment-free GitHub URL for this repository's `LICENSE`
  on `main` and is the only destination of any kind. There is exactly one.
- The URL cannot receive a current route, build fragment, SLEF, hull/module identity, search
  parameter or local data.
- Visible/localised warning text is presenter state, not part of the URL.

## SourceDistributionArtifact

Evidence that source distributions retain package-owned terms.

| Field           | Type                                 | Meaning                                  |
| --------------- | ------------------------------------ | ---------------------------------------- |
| `id`            | `almanacLicense` \| `almanacNotices` | required package document                |
| `installedPath` | build-time path                      | authoritative installed package artifact |
| `mirrorPath`    | repository-relative path             | tracked `legal/almanac/` mirror          |
| `byteLength`    | positive integer                     | installed/mirror byte count              |
| `sha256`        | 64 lowercase hex chars               | installed/mirror digest                  |

The installed and mirrored bytes must be identical. These records are build evidence only; their
document bodies do not enter the browser manifest or add modal links.

## HelpManifestV1

Immutable generated data imported by the browser application.

```text
HelpManifestV1 {
  schemaVersion: 1
  build: BuildIdentity
  almanac: AlmanacIdentity
  disclaimer: FrontierDisclaimer
  destinations: {
    repositoryLicense: ExternalDestination
  }
}
```

Invariants:

- Exactly one disclaimer and one destination exist.
- `repositoryLicense` is the sole destination, and its purpose is `completeLegalTerms`.
- Every value is deterministic for the same repository, installed package and build evidence.
- No absolute path, branch, account, person, machine, timestamp, random value, build payload or
  translated copy enters the manifest.
- The complete help manifest is eagerly imported by the application frame.

## BrowserHelpTopic

Validated application-owned help content emitted in a generated module separate from
`HelpManifestV1`.

```text
BrowserHelpTopic {
  id: HelpTopicId
  questionKey: message key
  answerKey: message key
}
```

The separate generated catalogue contains exactly seven records in the required order and is eagerly
imported beside the manifest. It contains no governing references; those remain tooling-only review
evidence. A missing, duplicated, reordered or blank browser record prevents emission of the complete
catalogue, never publication of a partial runtime set.

## HelpTopicDefinition

Application-owned accepted help content.

| Field                 | Type                             | Rule                                                               |
| --------------------- | -------------------------------- | ------------------------------------------------------------------ |
| `id`                  | `HelpTopicId`                    | one of the seven required identities; occurs exactly once          |
| `questionKey`         | message key                      | resolves nonblank in every shipped locale                          |
| `answerKey`           | message key                      | resolves nonblank in every shipped locale; never contains raw HTML |
| `governingReferences` | non-empty `GoverningReference[]` | accepted feature requirements or constitution principles only      |

```ts
type GoverningReference =
  | { readonly kind: 'featureRequirement'; readonly feature: string; readonly requirement: string }
  | { readonly kind: 'constitutionPrinciple'; readonly principle: string };
```

Required IDs, in modal order:

1. `buildLinkPrivacy`
2. `accountsUploadsTelemetry`
3. `browserPersistence`
4. `offlineAssets`
5. `completedEngineeringGrades`
6. `hullFactsAndBuildResults`
7. `almanacOwnership`

Governing references are not displayed or bundled. Build-time checks require the exact seven-ID set,
one definition per ID, a non-empty resolvable reference set per definition and non-empty question and
answer messages in every shipped application locale. A missing, duplicate or unreferenced
definition fails mechanically; a contradictory or unsupported definition fails required content
review. Every case blocks release, and no partial topic set or runtime fallback is published.
Feature 011's bundled English remains the final catalogue fallback only after the full candidate has
passed validation and review.

## HelpInvocationContext

Ephemeral origin of an open request.

```text
HelpInvocationContext = { kind: "global" }
```

The frame's action is the only entry, so `global` is the only context. The shape is kept as a
discriminated union so a later entry can be added without changing the store's transitions. It never
enters the URL, storage, analytics, a build or an external destination.

## HelpDialogState

```text
HelpDialogState =
  | { status: "closed" }
  | { status: "open"; invocation: HelpInvocationContext }
```

Transitions:

```text
closed -- open(invocation) --> open
open   -- open(newInvocation) --> open (replace transient invocation only)
open   -- close() --> closed
```

Closing takes no reason: the modal looks the same however it was closed, and
nothing reads one.

Opening/closing preserves the active route, history length, query/fragment, capability selection,
scroll restoration record, build revision, undo history, persistence and locale preference.

## HelpDialogViewModel

Read-only projection consumed by presentation components.

```text
HelpDialogViewModel {
  title: LocalisedText
  purpose: LocalisedText
  topics: LocalisedHelpTopic[7]
  identityFacts: {
    applicationVersion: string
    buildKind: LocalisedText
    buildId?: string
    almanacVersion: string
  }
  provenance: LocalisedProvenance
  disclaimer: FrontierDisclaimer
  disclaimerLanguageNotice: LocalisedText
  repositoryLicense: WarnedExternalAction
}
```

Rules:

- Release/non-release is always textual; non-release always exposes `buildId`.
- Application and Almanac versions have separate labels.
- Provenance says only that the bundled Almanac supplies catalogue data and calculations.
- The disclaimer is passed unchanged to a text-only `lang="en"` region.
- The licence action states that it leaves the app, may need a network and is the destination for all
  remaining terms. It is the view model's only action.
- There is no runtime loading, empty, missing-artifact or legal-error view model. Those conditions
  fail generation/build.

## Relationships

```text
root package.json --------> BuildIdentity ----------+
installed package.json ---> AlmanacIdentity --------+--> HelpManifestV1
root LICENSE -------------> FrontierDisclaimer -----+
audited destination ------> ExternalDestination ----+

HelpManifestV1 + locale + BrowserHelpTopic[] --> HelpDialogViewModel
HelpDialogState ------------------------------> shared HelpDialog visibility

installed package legal files <==byte equality==> legal/almanac mirrors
                                              (build evidence only)
```
