# Specification Quality Checklist: Offence Profile

**Purpose**: Validate specification quality before planning
**Created**: 2026-08-17
**Revised**: 2026-08-24, after the specification's scope line was found to be false
**Feature**: [spec.md](../spec.md)

> **The "Almanac Integrity" section passed on a false premise.** Its second box — _every required
> game number or calculation is available from the package_ — was ticked over a scope line that
> excluded damage-at-range and shot convergence _because_ the package supposedly returned nothing for
> them. The package publishes `damageFalloff()` and `ships/gunsights`. Nobody checked; the box was
> ticked against the specification's own claim rather than against the package. Two thirds of the
> canvas was then not built.
>
> The check that would have caught it is the one now stated below: a scope exclusion resting on what
> the package does not return has to be verified against the package, not against the sentence
> asserting it.

## Content Quality

- [x] States only current accepted behavior
- [x] Focuses on user-visible behavior and outcomes
- [x] Avoids screen layouts and plan-time implementation choices
- [x] Uses concise, direct language
- [x] Contains all mandatory sections

## Requirement Completeness

- [x] Contains no unresolved clarification markers
- [x] Requirements are testable and unambiguous
- [x] Acceptance scenarios cover each user story
- [x] Edge cases distinguish zero, absence, invalidity and incomplete data where relevant
- [x] Scope and exclusions are explicit
- [x] Every exclusion justified by package coverage is verified against the installed package
- [x] Cross-feature ownership is clear
- [x] Success criteria are measurable

## Almanac Integrity

- [x] Almanac-owned game data uses package identities and values
- [x] Every required game number or calculation is available from the package
- [x] No local game formula, correction, estimate or unsupported aggregate is required
- [x] Missing package values remain unavailable rather than being fabricated

## Delivery Readiness

- [x] Desktop, tablet and mobile behavior is covered
- [x] Touch, screen-reader and automated accessibility verification is covered
- [x] Unit and end-to-end verification obligations are defined
- [x] Specification is ready for planning
