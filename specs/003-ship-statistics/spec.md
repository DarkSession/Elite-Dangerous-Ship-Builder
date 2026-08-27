# Feature Specification: Ship Statistics and Status

> **Amended 2026-08-22 (wave 11).** Three collisions between this specification and
> `.design/Ship Builder.dc.html` were surfaced before implementation and the design won all three.
> The rulings are in [design/reference-review.md](./design/reference-review.md) and are binding.
> What they withdrew or reassigned is listed under
> [Withdrawn and reassigned requirements](#withdrawn-and-reassigned-requirements) below, with its
> requirement ids deliberately unbolded so the coverage ledger no longer demands evidence for a
> surface that is not built.

## Scope

This capability presents the active build's structural status, as canvases 1c and 1d draw it: the
`BUILD STATUS` heading opening the workspace's status rail, and the Almanac's validation issues
beneath it.

Feature 004's import-completion notice is drawn under that same heading, beneath the issues, since
2026-08-26 (Commander request). It is not this capability's to own — the wording, the dismissal and
what counts as a completion all belong to [004](../004-slef/spec.md) — but it is this rail's to
place, on the same reading that puts the issues there: both are what the package says about the build
that is now open.

The headline results, power block and viewing conditions the canvas draws further down that rail
belong to [005](../005-power-and-heat/spec.md), [006](../006-defence-profile/spec.md),
[007](../007-offence-profile/spec.md) and [008](../008-mobility-and-jump/spec.md); the cost and
material blocks belong to [009](../009-cost-and-materials/spec.md) and are built. Feature 003
composes none of them and passes no conditions to any of them.

## User Scenarios

### Story 1 — Understand build status (P1)

1. Every validation issue appears once, in package order, with its package severity in words.
2. Structural validity and completeness are conveyed by the issues the package raises about them.
3. A build the package reports nothing about draws nothing, so no readiness claim is made.
4. A diagnostic the package cannot translate reads in its canonical language, disclosed as such.

### Story 2 — Read a build's status across revisions (P2)

1. A committed edit re-renders the issues for the build now in memory.
2. A resolved issue disappears; a newly raised one appears in its package position.
3. Package-defaulted fixed modules remain ordinary fitted state and raise nothing of their own.

## Requirements

- **FR-001**: This capability MUST require an active build and MUST NOT create one.
- **FR-002**: Structural status MUST come from `@elite-dangerous-almanac/core` for the current build.
  The application MUST NOT derive, clamp, estimate, repair or reinterpret a package result.
- **FR-003**: Structural status MUST use only `ShipLoadout.validation().valid` and `.complete` and the
  issues the package raises about them, and MUST never claim that the build is flyable, ready,
  working, good or optimal.
- **FR-004**: Every validation issue MUST appear once with its severity and its package diagnostic.
  Package issue order MUST be preserved.
- **FR-005**: Package game text and diagnostic text MUST NOT be parsed or privately translated.
  Application-owned labels MUST use the localisation layer.
- **FR-007**: A package diagnostic MUST be preserved. The application MUST NOT invent a game
  diagnosis, and MUST NOT substitute its own sentence for one the package supplies.
- **FR-013**: Package-defaulted fixed modules MUST appear only as ordinary fitted build state and
  MUST NOT create a separate normalization or provenance region.
- **FR-014**: Status MUST NOT persist or publish import/defaulting history derived from fixed-module
  state to stored builds, links, SLEF or edit history.
- **FR-015**: Where the package reports the build valid, the status block MUST draw one line saying
  so, and nothing else — no count, no structural-facts list and no readiness or quality claim beyond
  the package's own verdict. The line MUST be read from `LoadoutValidation.valid` and MUST NOT be
  derived from the issue count: the two are different claims, because a build carrying only
  `incomplete` issues is one the package calls valid. Where there is no build, nothing MUST be drawn
  at all: no build is not a valid build. The original requirement withheld the line entirely; a
  Commander read the silence as a block that had failed to load rather than as an all-clear, and
  asked for the confirmation (2026-08-27).
- **FR-022**: Issue severity MUST be expressed as text beside its issue and MUST NOT depend on
  colour alone. The text is not drawn, because neither canvas draws a severity word; the tiers differ
  by ground as well as by hue.

## Withdrawn and reassigned requirements

Ruled 2026-08-22. Ids are unbolded here on purpose: an unbolded id is not declared, so the repository
policy checker no longer requires coverage-ledger evidence for it.

| Id       | Was                                                     | Outcome                                                                                          |
| -------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `FR-006` | Every value shows meaning, unit and conditions          | **Reassigned** to 005–008 with the values it governs                                             |
| `FR-008` | Zero, unavailable, incomplete, lower-bound and infinite | **Reassigned** to 005–008 with the results it governs                                            |
| `FR-009` | Hardpoint-sensitive results; deployed/retracted switch  | **Reassigned to 005** — ruling C: the canvas draws that toggle in the Power capability           |
| `FR-010` | The seven headline slots                                | **Reassigned** to 005–008, which own the cells the canvas draws                                  |
| `FR-011` | Retail credits, Merc Coin and materials                 | **Reassigned to 009**, and already built                                                         |
| `FR-012` | Slot and detail targets reachable in one interaction    | **Withdrawn** — ruling A: nothing in either block is interactive on either canvas                |
| `FR-016` | Load state defaults and choices                         | **Reassigned to 005/008** — ruling C: no load control is drawn anywhere                          |
| `FR-017` | Half-pip allocation, total six, four per capacitor      | **Reassigned to 005** — ruling C: the canvas draws whole pip bars in the Power capability        |
| `FR-018` | Hardpoint default deployed                              | **Reassigned to 005** — ruling C                                                                 |
| `FR-019` | Viewing conditions never persisted                      | **Reassigned to 005** with the state it constrains                                               |
| `FR-020` | One build/condition revision, never mixed               | **Withdrawn** — nothing is composed across owners, and `validation` is a field on the live build |
| `FR-021` | Settled count changes announced once                    | **Withdrawn** — ruling A: there are no counts, and visible content is not live                   |

## Edge Cases

- A build can be invalid and incomplete at once, and raises the issues for both.
- A build can be valid and complete, and then nothing is drawn.
- A diagnostic can carry string-list parameters and can be long enough to wrap several lines.
- Rapid edits re-render against the build in memory; there is no second source to fall behind it.

## Almanac Coverage

`ShipLoadout.validation()` and `getLoadoutIssueMessage` provide every value, state and sentence this
feature presents. The application consolidates nothing and owns no game calculation or verdict.

## Success Criteria

- **SC-001**: Structural status and every validation issue match the Almanac result.

Withdrawn or reassigned with their requirements: `SC-002` and `SC-004` (to 005–009, with the results
they govern), `SC-003` (to 005–008; reading a field on a build in memory has no measurable budget),
`SC-005` (with ruling C) and `SC-006` (with ruling A).
