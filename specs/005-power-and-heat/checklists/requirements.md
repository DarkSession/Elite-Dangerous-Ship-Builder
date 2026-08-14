# Specification Quality Checklist: Power and Heat

**Purpose**: Validate specification completeness and quality before proceeding to planning

**Created**: 2026-08-14

**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`.
- **This is an area of the statistics family.** [Feature 003](../../003-ship-statistics/spec.md) is
  the contract: provenance, units, the honesty rules for unavailable figures, the recompute
  obligation and the viewing conditions apply here without being restated. This document adds only
  what is specific to power, the distributor and heat.
- **Nothing here is blocked.** Every figure was verified against the installed
  `@elite-dangerous-almanac/core@0.1.0-beta.4` on 2026-08-14. Build heat arrived in that release;
  the power budget, the priority-group breakdown and the distributor capacities predate it. Three
  figures are composed under feature 003's FR-001a — the retracted headroom and utilisation, the
  powered and unpowered shares of the draw, and the modules a shed priority group takes offline — and
  the Upstream dependencies section names all three.
- **Heat capacity is not a budget.** The package is explicit that heat capacity is thermal inertia,
  governing how long a build takes to reach a temperature, while thermal load against hull heat
  dissipation is what decides whether it overheats. An earlier draft framed the heat figures against
  capacity and never required dissipation at all; FR-010 now requires both and states which does
  what.
- **An unknown heat contribution is more dangerous than an unknown power draw.** An unknown draw
  makes a power total a lower bound (FR-004); an unknown heat contribution makes every heat figure a
  projection that is wrong in either direction, including the overheat verdict. FR-013 carries the
  stronger obligation for that reason.
- **User story 2 is new to this family.** The ranked by-module power breakdown was implicit in
  feature 003's requirement that per-module draw be reachable. It is stated as its own story here
  because resolving a deficit is a distinct Commander need from detecting one, and because every
  figure it needs — each module's own draw — is already a package value, so no arithmetic is
  involved.
- **The WEP capacitor is deliberately split across two specifications.** Its capacity and recharge
  are the distributor's, specified here; how quickly a given loadout drains it belongs to
  [feature 007](../../007-offence-profile/spec.md), which composes them with the weapons' draw. That
  composition is blocked upstream and recorded there, not here.
