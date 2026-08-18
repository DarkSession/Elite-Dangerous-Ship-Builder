# Screen and Surface Inventory

Feature 007 adds no top-level route. Its complete Offence Profile composes inside feature 001's
`/build` workspace, is selected through feature 003's `offenceProfile` detail target, and hands exact
slot targets to feature 002. Feature 003 also consumes feature 007's compact Status contribution.

| Surface                                               | Wide/tablet presentation                                                    | Narrow/zoomed presentation                                     | Requirements           |
| ----------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------- |
| [Offence Profile](./offence-profile.md)               | Fluid total/damage/capacitor regions followed by complete weapon collection | One complete semantic stack retaining every field/action       | FR-001–FR-007          |
| Enabled returned-weapon totals                        | Complete paired burst/sustained definition groups                           | Same groups, wrapping without calculated chart shares          | FR-001–FR-003, FR-005  |
| Burst/sustained damage types                          | Two labelled textual groups with AX overlay explanation                     | Same complete groups; no type omitted for space                | FR-001–FR-003          |
| Weapon-capacitor endurance                            | Shared WEP context, six exact fields and deployed distributor observation   | Same fields stacked before weapon collection                   | FR-001, FR-006, FR-007 |
| Complete returned weapon collection                   | Scannable summaries with row-owned details and exact-slot action            | Labelled cards/details with the same fields and action         | FR-001–FR-005          |
| Coverage-unavailable qualification (feature 002)      | Explicit qualification; never inserts data into package weapon results      | Same notice before returned collection/empty explanation       | FR-001, FR-004, FR-005 |
| Compact sustained-DPS Status contribution (feature 3) | Package value, native firing condition and qualification in shared Status   | Same owner value/condition in feature 003's Status composition | FR-001, FR-002, FR-005 |
| Exact outfitting slot (feature 002)                   | Reveal/select matching inline slot/editor                                   | Open existing selected-slot layer with a named return          | FR-004                 |

## Requirement ownership

| Requirement | Planned behavior                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | One revision-coherent snapshot retains two `ShipLoadout` results and owner-supplied context; presentation creates no game value.            |
| FR-002      | Whole-build/per-weapon output and compact Status sustained DPS select exact `weaponMetrics()` fields.                                       |
| FR-003      | Both exact damage splits show all package members, absent-means-zero unclassified semantics and explicit AX overlay with no shares/folding. |
| FR-004      | Every returned weapon exposes exact identity/slot/enabled/ammunition, all metrics, sparse range/piercing and one shared exact-slot target.  |
| FR-005      | Disabled entries remain; package totals remain untouched; feature-002 coverage distinguishes confirmed empty from unavailable coverage.     |
| FR-006      | Feature-003 WEP half-pips divide by two at one boundary; all six exact capacitor fields and returned pips are shown.                        |
| FR-007      | Field-specific zero/infinity wording appears beside the feature-005-owned deployed distributor observation without inferring a cause.       |

## Cross-feature composition

- Feature 001 owns active build/revision, no-build behavior and `/build`.
- Feature 002 owns package slot coverage and exact-slot selection/editing; its ingress prevents
  unknown identities from reaching this capability.
  Its named cross-feature coverage port must be accepted before tasks.
- Feature 003 owns viewing-condition draft/Apply/Reset, integer half-pips, revisions, workspace
  capability targets, Status composition and the generic provider envelope.
- Feature 005 owns deployed distributor power meaning. Its feature-007 observation port must be
  accepted before tasks; feature 007 never joins power consumers/bands.
- Feature 007 owns exact weapon/capacitor result retention, offence semantic projection, compact
  Status contribution and this capability.
- Feature 010 may visualize hardpoint positions but cannot replace the complete textual weapon list.
- Feature 011 owns tokens, shared components, formatting/game text, announcements, previews and the
  responsive/accessibility harness.

## Required states

- workspace no active build;
- current revision pending and stale-result refusal;
- missing integration port and unexpected projection failure;
- confirmed no fitted hardpoints;
- unavailable hardpoint coverage and package-normalized unknown-module ingress;
- positive output, genuine-zero weapon, some disabled and all disabled;
- every damage type, unclassified present and absent-means-zero, positive anti-xeno overlay;
- no ammunition, finite ammunition, zero reserve and unlimited ammunition;
- effective range/piercing/projectile members present, individually absent and boundary value zero;
- finite endurance, immediate drain, sustaining positive draw and infinite zero-draw result;
- zero capacity with powered/disabled/shed/absent/unavailable/qualified distributor observation.

The exact component/state obligations are in
[component-state-preview-matrix.md](./component-state-preview-matrix.md).

## Accessibility, responsive and localization baseline

- The workspace supplies the single `main` and `h1`; this capability uses nested headings and adds no
  competing page landmark.
- Semantic reading order is condition context, totals/types, capacitor, qualifications, weapons.
  Visual columns never alter it.
- At 200% text, actual 400% zoom and every narrow/landscape layout, all groups stack/wrap with no
  document-level horizontal scroll. A labelled internal scroller is allowed only for genuinely wide
  relationships.
- Every disclosure and exact-slot action is a distinct semantic control, works by pointer/touch and
  uses feature 011's target-size token. A card click never silently navigates.
- Disabled, unavailable, absent, not-stated, no-unclassified, unlimited, overlay, zero-capacity,
  immediate and no-net-drain states use visible/programmatic text, not color, fill or position alone.
- No damage-share, range, convergence or capacitor bar appears without a package-authored scale;
  initial feature 007 uses complete text.
- Owned strings and sentinel phrases use message keys. Damage rates, MW, MJ, MJ/s, seconds, metres,
  pips, counts and ratings use active-locale formatters.
- Canonical package weapon names remain source data; visible game text uses Almanac localization by
  symbol with disclosed canonical fallback.
- Expanded-language and RTL layouts retain weapon/fact/action association. Reduced motion changes no
  meaning or update timing.
- Every meaningful state runs in Chromium and Firefox across desktop, tablet portrait/landscape and
  mobile portrait/landscape with axe; manual screen-reader and actual-zoom protocols remain required.

Where conformance is stated, use: “WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3,
2.4.7 and 2.4.11.”
