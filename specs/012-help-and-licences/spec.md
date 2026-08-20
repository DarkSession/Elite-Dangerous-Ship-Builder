# Feature Specification: Help, Licences and Provenance

## Scope

Commanders can open help, privacy and offline explanations, versions and licence information without
leaving or changing their current capability. Help can be closed to resume that unchanged capability.
The help, version information and exact project-specific Frontier disclaimer are present in the
initial application load; the complete licence remains available through a deliberate external link
to the repository's `LICENSE` on GitHub.

## Clarifications

### Session 2026-08-18

- Q: Should help show the exact project-specific Frontier disclaimer from the repository's `LICENSE`, with all remaining licence details available through one link to that same file on GitHub? → A: Exact Frontier disclaimer plus one GitHub link to the repository `LICENSE`.

### Session 2026-08-20

- Q: What stable comparison set determines whether application-behaviour help is current? → A: The
  accepted set is exactly the seven topics named by FR-010. Each topic appears once, each answer agrees
  with at least one explicitly referenced accepted requirement or constitution principle governing
  that topic, and any additional behavioural claim must itself be supported by such a reference or it
  blocks release. These validation references need not be displayed to the Commander.

## User Scenarios

### Story 1 — Read terms and attribution (P1)

1. The exact project-specific Frontier disclaimer is visible and clearly attributed in help.
2. Help identifies the GitHub `LICENSE` link as the destination for all remaining licence and
   third-party terms.
3. After the application has been loaded once while online, the disclaimer is available on the first
   subsequent visit without a network; following the external link may require a connection.

### Story 2 — Identify shipped versions and data (P1)

1. Application and bundled Almanac versions match their build artifacts and remain distinct.
2. A non-release build also shows a build identifier and is not presented as a release.
3. Catalogue provenance states that the bundled Almanac supplies the data and makes no live-game
   currency claim.
4. Package data and calculation defects can be reported to the Almanac issue tracker.

### Story 3 — Understand application behaviour (P2)

1. Help presents each of the seven accepted behaviour topics: build-link privacy, absence of
   accounts/uploads/telemetry, persistence and storage clearing, offline assets, completed
   engineering grades, hull facts versus build results and Almanac ownership of game values.
2. Each answer states only currently accepted behaviour; no missing, duplicate, contradictory or
   unsupported behavioural statement is presented.

## Requirements

- **FR-001**: Help, versions and legal content MUST be reachable from every capability, including when
  no build is active. Opening and closing help MUST leave the current capability, navigation state,
  build and stored records unchanged. Help, versions and the Frontier disclaimer MUST ship in the
  initial application load and, after that load has completed once, remain available without a
  network.
- **FR-002**: Wherever package artwork or values appear, relevant provenance and legal information
  MUST be reachable through the common help capability.
- **FR-003**: Help MUST reproduce only the exact project-specific Frontier disclaimer from the
  repository `LICENSE` as its embedded legal excerpt. It MUST provide one link to that `LICENSE` on
  GitHub for all remaining licence information. The link MUST require a deliberate action, MUST be
  identified as leaving the application and potentially requiring a network connection, and MUST
  NOT include build data in its URL.
- **FR-004**: Source distribution MUST carry the terms applicable to redistributed package artwork
  and game data and MUST NOT present the application code licence as granting rights to them.
- **FR-005**: FR-003's disclaimer source and licence destination MUST be verified before release. A
  missing, empty or mismatched disclaimer or an absent GitHub licence destination MUST fail the
  release rather than degrade at runtime.
- **FR-006**: The embedded Frontier disclaimer MUST remain verbatim. Application-owned labels MUST be
  localised and identify the language of the untranslated disclaimer.
- **FR-007**: Displayed application and Almanac versions MUST come from shipped artifacts. A
  non-release build MUST also show its build identifier.
- **FR-008**: Neither version MUST be called the live game or live catalogue version. Provenance MUST
  say only that the bundled Almanac supplies the catalogue and calculations.
- **FR-009**: The Almanac issue tracker MUST be offered for package defects only through a deliberate
  external navigation identified as leaving the application; no build data may enter the URL.
- **FR-010**: Help MUST describe accepted current behaviour only. Its accepted behaviour-topic set
  MUST contain exactly one answer for each of these seven topics: build-link privacy; absence of
  accounts, uploads and telemetry; persistence and storage clearing; offline assets; completed
  engineering grades; hull facts versus build results; and Almanac ownership of game values. Each
  topic MUST identify at least one accepted feature requirement or constitution principle governing
  its answer; those references form the release-validation comparison set and need not be displayed
  in the interface. Each answer MUST agree with its cited sources and MUST NOT add an unsupported
  behavioural claim. A missing or duplicate topic, a missing governing reference, a contradiction or
  an unsupported additional claim MUST fail the release.
- **FR-011**: Every capability that raises one of those questions MUST provide a route to help; the
  route need not open a specific answer. Release validation MUST enumerate every current capability,
  package-backed artwork or value surface and state that makes the common help route unavailable to
  which FR-001, FR-002 or this requirement applies; any missing required route MUST fail the release.

## Edge Cases

- A missing or mismatched embedded Frontier disclaimer or GitHub licence destination is a release
  failure, not a degradable runtime state.
- The Frontier disclaimer is reproduced rather than translated.
- After one completed online load, help remains usable offline and identifies that the external GitHub
  licence may require a network connection.
- External links are deliberate, identified and contain no build data.

## Almanac Coverage

The installed package supplies its version, ship assets and the provenance of game data and
calculations. The repository `LICENSE` supplies the exact project-specific Frontier disclaimer; its
GitHub location is the single destination for complete legal terms.

## Success Criteria

- **SC-001**: Help contains the exact, non-empty project-specific Frontier disclaimer from the
  repository `LICENSE`, and its sole legal-details link targets that file on GitHub.
- **SC-002**: Displayed versions exactly match shipped artifacts and cannot be mistaken for live-game
  currency.
- **SC-003**: All seven FR-010 behaviour topics are present exactly once, every topic identifies at
  least one governing accepted requirement or constitution principle, each answer agrees with those
  sources, and release validation reports zero missing, duplicate, unreferenced, contradictory or
  unsupported behavioural statements.
- **SC-004**: After one completed online load, help, version information and the Frontier disclaimer
  work on the first subsequent offline visit; help clearly identifies the complete licence as an
  external GitHub destination.
