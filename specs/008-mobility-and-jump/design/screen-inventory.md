# Screen and Surface Inventory

Feature 008 adds no route. Drives & Mass is one capability surface inside feature 001's `/build`
workspace and the detail target for feature 003's mobility summaries. It may emit the existing shared
exact-slot target; it owns no build mutation, condition control or persisted view state.

| Surface                                         | Wide / tablet landscape                                                                                                                                                                                                                                                                                                                           | Narrow / tablet portrait / zoomed                 | Requirements                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------ |
| [Drives & Mass](./mobility-and-jump-profile.md) | The `DRIVES` mode of the hull anatomy region: two cards side by side in the space the plates leave                                                                                                                                                                                                                                                | The same two cards stacked, with no field removed | FR-001–FR-008                  |
| Thruster Load card                              | Headline mass, the additive hull/modules/fuel band with its optimal mark, its two marks written under the positions they mark, its three labelled legend rows, a hairline, and the speed envelope under the canvas's own heading                                                                                                                  | The same stack, one column                        | FR-004, FR-005, FR-006, FR-008 |
| Frame Shift Drive card                          | The heading with the `SCO` badge inside it where the drive carries the capability, drive identity on the same line, the `JUMP LADEN` / `JUMP UNLADEN` / `MASS LOCK` trio, three range rows each with the one jump figure the canvas puts on it, and the legend of drive facts — the canvas's two hairlines ruling the three blocks off each other | The same stack, one column                        | FR-002, FR-003, FR-008         |
| Status rail cells                               | `JUMP`, `SPEED` and `MASS` closing the canvas's six-cell grid, each the figure a card already states                                                                                                                                                                                                                                              | The same three in the Status stack                | FR-009, SC-001                 |
| Mobility unavailable                            | The package's own reasons in place of the speed envelope; no hull speed stands in                                                                                                                                                                                                                                                                 | The same, in the stacked card                     | FR-005                         |
| Headline mass and its split                     | One `buildMass(load)` answer: the headline total, its three legend rows and the position on the thruster curve beside it                                                                                                                                                                                                                          | The same, in the stacked card                     | SC-004                         |
| Status summaries (feature 003)                  | Not built: feature 003 still waits on the provider, and its third field is the `unladenMass` neither canvas draws                                                                                                                                                                                                                                 | The same, once the provider exists                | FR-001–FR-006                  |
| Slot reveal (features 002/003, if exposed)      | Shared exact-slot target opens owning editor context                                                                                                                                                                                                                                                                                              | Same target opens existing narrow slot layer      | FR-007 support                 |

> **Corrected against the design.** This table previously listed the region as a fluid sequence of
> five independent surfaces — jump performance, mobility performance, mass and capacity, per-module
> mass and a selected-condition context block — and named a per-module mass list neither canvas
> draws. Canvases 1c and 1d draw two cards. The rows above are those two cards and the states they
> have to reach. The settled ENG allocation is an input to the
> `mobilityCapacitorMetricsResult()` call and is not drawn at all: the canvas heads the envelope `SPEED ENVELOPE AT THIS MASS` and writes nothing
> beside it (`reference-review.md`, "Withdrawn addition").

## Requirement mapping

| Requirement | Planned behavior                                                                                                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR-001      | One pure projector copies package results/records only; presentation adds no game calculation.                                                                                                                                                   |
| FR-002      | One guarded `jumpRangeSummary()` supplies all three single ranges, total ranges and counts.                                                                                                                                                      |
| FR-003      | All three standard-load results must be complete before the summary call, which resolves all three; exact blockers remain visible.                                                                                                               |
| FR-004      | The canvas's own load feeds `mobilityMetricsResult()` and the same load with feature 005's settled ENG pips feeds `mobilityCapacitorMetricsResult()`; the five readings they draw, or exact issues. The pips are an input, never a drawn line.   |
| FR-005      | Incomplete mobility receives no hull fallback; package issues distinguish missing, disabled, shed, package-unresolved and invalid inputs.                                                                                                        |
| FR-006      | No aggregate is drawn: `unladenMass`, `fuelCapacity` and `cargoCapacity` are all real package figures neither canvas has. The revision of 2026-08-25 cut the fuel row's qualifier to the bare word `TANK`, which took the last one off the card. |
| FR-007      | Not drawn here — neither canvas lists per-module mass. The canvas's modules segment is `buildMass(load).modules`, never a local sum.                                                                                                             |
| FR-008      | Only package FSD/thruster parameters the canvas draws appear, and only when present; absent facts stay absent.                                                                                                                                   |
| FR-009      | One rail component draws the canvas's last three cells from the same projection the cards read, at the same load, allocation and digits.                                                                                                         |

## Cross-feature ownership

- Feature 001 owns the active build/revision and `/build` workspace.
- The shared ingress boundary supplies package-populated fixed mounts before calculations. Feature
  002 owns committed-edit revision changes and exact-slot reveal/edit behavior.
- Feature 003 owns viewing-condition draft/Apply/Reset, read-only condition identity, generic status
  envelope and workspace targets. Feature 008 owns its concrete three-summary provider.
- Feature 005 owns the ENG allocation. This capability reads the settled pips read-only and passes
  them to the package unchanged; it publishes no distributor control of its own and draws them
  nowhere, because neither canvas does. Thruster power
  meaning stays the package's — its mobility diagnostics distinguish a shed thruster from a
  switched-off one, and neither is reinterpreted here.
- Feature 010 owns the hull anatomy region and its mode control. Canvas 1c draws Drives & Mass as
  that region's `DRIVES` mode, beside `MOUNTS` and `POWER`, so this feature contributes the mode's
  content and feature 010 keeps the plates and the switch. The plates layer is unchanged: no
  mass-sized node and no centre-of-mass mark is added to it. The artboard does author a
  `data-anat-layer="mass"` overlay, but its own switching script never shows it — the script hides
  the plate container for every mode but `mounts` — so it is authored-but-unreachable content, which
  is the same reason feature 005 leaves the `power` overlay alone.

  > **Corrected against the design.** This previously read "feature 010 keeps anatomy hardpoint-only
  > and does not host Drives & Mass overlays", which would have put this capability somewhere the
  > canvas does not draw it. What the canvas excludes is anatomy artwork driven by mass, not the
  > mode itself.

- Feature 011 owns tokens, shared components, locale/game-text/diagnostic presentation, previews,
  announcements and the test/accessibility matrix.

## Required states

The surface and previews cover:

- no active build — the region draws nothing at all rather than a set of zeroes;
- complete jump/mobility/aggregate values;
- the mass split read at the load the card names, every part carrying its own package figure and its
  own length on one additive band;
- a thruster publishing no curve, where the band and its two marks are absent rather than scaled
  against a maximum chosen here;
- incomplete mass, fuel or cargo and each standard-load guard;
- missing and package-incomplete FSD;
- zero main fuel and zero cargo;
- missing, disabled, shed and package-incomplete thrusters plus power-capacity/draw issues;
- complete all-zero mobility above supported mass;
- each sparse FSD/thruster parameter present and absent.

There is no failure state and no loading state: the projection is synchronous over a loadout already
in memory, so a package exception is an application defect rather than a screen (feature 005's
ruling for the same region). There is no preview declaration either — the manifest holds one per
exported `src/app/ui/` component, and `DrivesMass` is a feature region rather than a design-system
component, the same reason the power dashboard has none. The states above are covered by the
Playwright suite, at desktop, tablet and mobile widths with portrait/landscape, expanded text, RTL
and reduced motion.

## Accessibility, responsive and localization baseline

- Use the workspace's single `main`/`h1`; Drives & Mass uses nested headings and named regions.
- Keep one DOM/assistive order at every width. Grid placement must not change reading order.
- Use labelled definition groups, lists or accessible tables. At narrow/400% zoom use wrapping cards
  rather than hiding columns; internal table overflow is acceptable only when associations survive.
- Any tab/action uses actual semantic controls with visible name/state and feature 011's minimum
  touch target. Nothing essential depends on hover or `title`.
- Load, zero, unavailable, incomplete, disabled, shed, package-issue unresolved and failure meanings are explicit
  text/programmatic state—not colour, bar length, shape or position.
- Package issues are associated with their owning result; a settled revision produces one concise
  polite update rather than one announcement per field.
- All application labels, state text, units and announcements are localized and all numbers use the
  active locale. Module/slot names and diagnostics use Almanac locale helpers plus the shared
  canonical fallback disclosure.
- Test every meaningful state with axe across Chromium and Firefox at all five layout projects;
  retain manual screen-reader, 200% text and actual 400% zoom protocols.

Where conformance is stated, name the exclusion: WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4,
2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.
