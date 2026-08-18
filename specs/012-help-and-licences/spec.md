# Feature Specification: Help, Licences and Provenance

## Scope

Commanders can open help, privacy and offline explanations, versions and a concise legal summary in
a modal dialog without leaving their current capability. The help, version information and exact
project-specific Frontier disclaimer are present in the initial application load; the complete
licence remains available through a deliberate external link to the repository's `LICENSE` on
GitHub.

## Clarifications

### Session 2026-08-18

- Q: Should the modal show the exact project-specific Frontier disclaimer from the repository's `LICENSE`, with all remaining licence details available through one link to that same file on GitHub? → A: Exact Frontier disclaimer plus one GitHub link to the repository `LICENSE`.

## User Scenarios

### Story 1 — Read terms and attribution (P1)

1. The exact project-specific Frontier disclaimer is visible and clearly attributed in the modal.
2. The modal identifies the GitHub `LICENSE` link as the destination for all remaining licence and
   third-party terms.
3. The disclaimer is available on a first offline visit; following the external link may require a
   network connection.

### Story 2 — Identify shipped versions and data (P1)

1. Application and bundled Almanac versions match their build artifacts and remain distinct.
2. A non-release build also shows a build identifier and is not presented as a release.
3. Catalogue provenance states that the bundled Almanac supplies the data and makes no live-game
   currency claim.
4. Package data and calculation defects can be reported to the Almanac issue tracker.

### Story 3 — Understand application behaviour (P2)

Help explains build-link privacy, local persistence, storage clearing, offline behaviour, completed
engineering grades, hull facts versus build results and Almanac ownership of game values.

## Requirements

- **FR-001**: Help, versions and legal content MUST be reachable from every capability without an
  active build. Opening it MUST present a modal dialog without navigating away from the current
  capability. Help, versions and the Frontier disclaimer MUST ship in the initial application load
  and remain available without a network.
- **FR-002**: Wherever package artwork or values appear, relevant provenance and legal information
  MUST be reachable through the modal.
- **FR-003**: The modal MUST reproduce only the exact project-specific Frontier disclaimer from the
  repository `LICENSE` as its embedded legal excerpt. It MUST provide one link to that `LICENSE` on
  GitHub for all remaining licence information. The link MUST require a deliberate action, MUST be
  identified as leaving the application and potentially requiring a network connection, and MUST
  NOT include build data in its URL.
- **FR-004**: Source distribution MUST carry the terms applicable to redistributed package artwork
  and game data and MUST NOT present the application code licence as granting rights to them.
- **FR-005**: The embedded Frontier disclaimer MUST come from the repository `LICENSE`. A missing,
  empty or mismatched disclaimer or an absent GitHub licence destination MUST fail the release.
- **FR-006**: The embedded Frontier disclaimer MUST remain verbatim. Application-owned labels MUST be
  localised and identify the language of the untranslated disclaimer.
- **FR-007**: Displayed application and Almanac versions MUST come from shipped artifacts. A
  non-release build MUST also show its build identifier.
- **FR-008**: Neither version MUST be called the live game or live catalogue version. Provenance MUST
  say only that the bundled Almanac supplies the catalogue and calculations.
- **FR-009**: The Almanac issue tracker MUST be offered for package defects only through a deliberate
  external navigation identified as leaving the application; no build data may enter the URL.
- **FR-010**: Help MUST describe accepted current behaviour only and cover build-link privacy, absence
  of accounts/uploads/telemetry, persistence and storage clearing, offline assets, completed grades,
  hull-versus-build values and Almanac ownership.
- **FR-011**: Every capability that raises one of those questions MUST provide a route to the help
  modal; the route need not open a specific answer.

## Edge Cases

- A missing or mismatched embedded Frontier disclaimer or GitHub licence destination is a release
  failure, not a degradable runtime state.
- The Frontier disclaimer is reproduced rather than translated.
- When offline, the modal content remains usable and identifies that the external GitHub licence may
  require a network connection.
- External links are deliberate, identified and contain no build data.

## Almanac Coverage

The installed package supplies its version, ship assets and the provenance of game data and
calculations. The repository `LICENSE` supplies the exact project-specific Frontier disclaimer; its
GitHub location is the single destination for complete legal terms.

## Success Criteria

- **SC-001**: The modal contains the exact, non-empty project-specific Frontier disclaimer from the
  repository `LICENSE`, and its sole legal-details link targets that file on GitHub.
- **SC-002**: Displayed versions exactly match shipped artifacts and cannot be mistaken for live-game
  currency.
- **SC-003**: Help describes only requirements that still exist.
- **SC-004**: Help, version information and the Frontier disclaimer work on a first offline visit;
  the modal clearly identifies the complete licence as an external GitHub destination.
