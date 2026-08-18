# Screen and Surface Inventory

Feature 007 adds no top-level route. Its logical Offence Profile composes inside feature 001's
`/build` workspace, is reached from feature 003's offence headline/capability navigation, and targets
feature 002's exact hardpoint selection in one interaction. Capability/detail expansion state is
memory-only presentation state and never enters the build fragment.

| Surface                                    | Wide/tablet presentation                                                         | Narrow/zoomed presentation                                     | Requirements           |
| ------------------------------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------- |
| [Offence Profile](./offence-profile.md)    | Build totals/damage and capacitor groups beside a complete weapon collection     | One ordered stack retaining every field and weapon             | FR-001–FR-007          |
| Whole-build output                         | Definition groups for every returned total and both damage splits                | Same groups, wrapping labels/values without a percentage chart | FR-001–FR-003, FR-005  |
| Weapon output list                         | Semantic summary rows/cards with row-owned complete detail and exact-slot action | Complete weapon cards/details with the same action             | FR-001–FR-005          |
| Weapon capacitor                           | Shared pip context plus six exact package fields and distributor observation     | Pip context first, then stacked fields and semantic duration   | FR-001, FR-006, FR-007 |
| Unresolved hardpoint context (feature 002) | Separate notice/list; never inserted into package weapon results                 | Same exact-slot notices before the no-result/weapon collection | FR-001, FR-004         |
| Outfitting slot target (feature 002)       | Selected exact slot is revealed in the inline outfitting/editor context          | Existing full-screen selected-slot layer is revealed           | FR-004                 |

## Requirement ownership

| Requirement | Surface behavior                                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | One immutable snapshot maps two `ShipLoadout` calls and shared package-backed context; visuals add no game result.                            |
| FR-002      | Whole-build and per-weapon output, including sparse range/piercing, comes from 0.1.1 `weaponMetrics()`.                                       |
| FR-003      | Burst/sustained conventional types and anti-xeno overlay are complete textual groups with no locally calculated shares or folded type.        |
| FR-004      | Every returned weapon exposes identity, exact slot, enabled state, ammunition, all metrics, sparse range/piercing and one exact-slot action.  |
| FR-005      | Disabled weapons remain in the collection; exact package totals remain separate and unresolved occupied hardpoints qualify empty results.     |
| FR-006      | Shared selected WEP pips feed `weaponsCapacitorMetrics()`; all six exact returned fields are displayed.                                       |
| FR-007      | Field-specific duration wording and shared distributor observation distinguish infinity, zero capacity, no load and missing/shed power state. |

## Cross-feature composition

- Feature 001 owns the active build, build revision and `/build` workspace.
- Feature 002 owns package slots, unresolved fitted entries, exact-slot selection and module edits.
  Feature 007 emits a slot intent; it never mutates a module.
- Feature 003 owns WEP-pip conditions, condition revision, hardpoint viewing state and the offence
  headline/detail action. It does not recalculate offence values.
- Feature 005 owns the shared package-backed distributor/power observation from 0.1.1.
- Feature 010 may visualize hardpoint locations, but anatomy cannot replace the complete textual
  weapon collection or its exact-slot actions.
- Feature 011 owns layout primitives, tokens, controls, localization/formatting, live announcements,
  responsive behavior and the accessibility harness.

## Shared states

The screen and its components require previews and tests for:

- no active build;
- projection pending for a new revision, without stale mixed values;
- no fitted hardpoints;
- occupied unresolved hardpoints with no returned weapon result;
- a mixture of returned weapons and unresolved occupied hardpoints;
- enabled positive output, enabled genuine-zero output, some disabled and all disabled;
- optional unclassified damage absent/present and positive anti-xeno overlay;
- ammunition none, finite, zero reserve and unlimited;
- range/piercing present and each optional member absent;
- finite endurance, immediate drain, sustaining positive draw and infinite zero-draw result;
- zero capacity with present/disabled/shed/absent/unresolved distributor state;
- unexpected package/presenter failure with no stale prior figures.

Component previews cover populated, empty, loading, error and disabled states where meaningful at
desktop, tablet and mobile widths, plus expanded-language and right-to-left fixtures.

## Accessibility, responsive and localization baseline

- The surface participates in the workspace's one `main` and heading hierarchy; it does not add a
  competing page landmark or `h1`.
- Wide visual columns never alter semantic reading order. At 200% text, 400% zoom and narrow widths,
  groups stack without document horizontal scrolling.
- Weapon details use labelled semantic groups. If a wide summary uses a table, its complete details
  remain associated with the same row and the component owns any necessary internal overflow.
- Every disclosure/control and exact-slot action works by pointer and touch, exposes matching visible
  and accessible names/state, and uses at least the shared 44 CSS-pixel target token.
- Enabled, disabled, no-result, unavailable, unlimited, overlay, zero-capacity and no-net-drain states
  are text, never color/shape/fill alone.
- Damage charts and range bars are omitted because the allowed package output supplies no share/scale
  that can drive them without calculation.
- Settled build/pip and availability changes use one coalesced polite announcement; blocking
  projection errors use shared alert behavior.
- Reduced motion removes nonessential transitions. Text expansion and RTL do not reverse numeric
  meaning or separate a weapon from its facts/action.
- Application text and semantic sentinels use feature 011 message keys. Damage rates, MW, MJ, MJ/s,
  seconds, metres and ratings use active-locale formatters.
- Game module text comes from the Almanac and receives the shared untranslated disclosure when the
  active locale is unavailable.
- Automated coverage scans every meaningful state in Chromium and Firefox over desktop,
  tablet/mobile portrait and landscape. Manual screen-reader journeys verify group relationships,
  detail state, exact-slot actions and announcements.

Where conformance is stated, use: “WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3,
2.4.7 and 2.4.11.”
