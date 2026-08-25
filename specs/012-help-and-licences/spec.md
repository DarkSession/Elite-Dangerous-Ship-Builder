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

### Session 2026-08-25

- Q: Where this specification and the design reference `.design/Ship Builder.dc.html` disagree, which
  one governs? → A: The design. Its Help · About overlay is the template, and this specification is
  updated to match it rather than the other way round.
- Q: What is the modal's section structure? → A: The reference's own three sections in its order —
  `ABOUT`, `FAQ`, `LICENCE` — with the application and bundled-Almanac versions inside `ABOUT`, where
  the reference draws its version line, rather than in a separate section after the questions.
- Q: Should package-backed artwork and value surfaces carry a contextual help entry of their own? →
  A: No. The reference draws no such control on any of its four canvases, including the outfitting,
  anatomy and status surfaces. The application frame's own Help action is the single route, and
  FR-002 and FR-011 are narrowed to match.
- Q: Which external destinations may the modal offer? → A: Exactly one — the repository `LICENSE` on
  GitHub, which FR-003 requires and which replaces the reference's unsupported licence summary. The
  Almanac issue-tracker action is withdrawn with FR-009.

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
- **FR-002**: Wherever package artwork or values appear, their provenance and legal information MUST
  be content of the common help capability reached through the application frame. A surface MUST NOT
  embed a private copy of that information, and MUST NOT present it through a second help or legal
  destination of its own. A surface MUST NOT carry a contextual help entry of its own either: the
  frame's Help action is the single route, and the design reference draws no per-surface control.
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
- **FR-009**: _Withdrawn 2026-08-25._ An in-modal action pointing at the Almanac issue tracker was
  removed. The design reference draws no such control, and reporting a package defect is a support
  route rather than help content. The modal offers no replacement destination, and FR-003's
  repository `LICENSE` link remains its only external navigation. The identifier is retained rather
  than reused so references elsewhere in this feature stay resolvable.
- **FR-010**: Help MUST describe accepted current behaviour only. Its accepted behaviour-topic set
  MUST contain exactly one answer for each of these seven topics: build-link privacy; absence of
  accounts, uploads and telemetry; persistence and storage clearing; offline assets; completed
  engineering grades; hull facts versus build results; and Almanac ownership of game values. Each
  topic MUST identify at least one accepted feature requirement or constitution principle governing
  its answer; those references form the release-validation comparison set and need not be displayed
  in the interface. Each answer MUST agree with its cited sources and MUST NOT add an unsupported
  behavioural claim. A missing or duplicate topic, a missing governing reference, a contradiction or
  an unsupported additional claim MUST fail the release.
- **FR-011**: FR-001's common route — the application frame's own Help action — is the only route,
  and it MUST NOT need to open a specific answer. Release validation MUST enumerate every current
  capability, package-backed artwork or value surface and state that obscures the application frame,
  and MUST record for each whether that route is available in it or, where a dismissible layer covers
  the frame, that help is reached from the capability beneath once the layer is dismissed. A
  capability from which help cannot be reached MUST fail the release.

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
- **SC-005**: Opening the already-loaded help capability presents its first complete frame within
  100 ms at the mobile viewport under 4× CPU slowdown, and performs no route load, same-origin asset
  request or cross-origin request.
