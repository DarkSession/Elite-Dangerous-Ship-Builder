# Screen and Surface Inventory

Feature 008 adds no top-level route. Its Mobility, Mass and Jump capability composes inside feature
001's `/build` workspace, opens from feature 003's Mobility headline/capability navigation and may
target feature 002's exact fitted slot. Capability/disclosure state remains memory-only presentation
state.

| Surface                                                           | Wide/tablet presentation                                                       | Narrow/zoomed presentation                       | Requirements           |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------ | ---------------------- |
| [Mobility, Mass and Jump Profile](./mobility-and-jump-profile.md) | Jump and mobility regions may form fluid columns followed by mass/module facts | One complete semantic stack; no field removed    | FR-001–FR-008          |
| Shared load and ENG conditions                                    | Feature 003 control/context beside affected results                            | Full-width shared controls before results        | FR-004                 |
| Jump performance                                                  | FSD identity plus three complete load groups                                   | Maximum, unladen and laden cards with all values | FR-002, FR-003, FR-008 |
| Mobility performance                                              | Thruster state plus seven exact returned fields                                | Same seven labelled facts in one stack           | FR-004, FR-005, FR-008 |
| Source parameters                                                 | Sparse returned FSD/thruster thresholds, factors and multipliers               | Complete wrapping definition groups              | FR-008                 |
| Mass and capacity                                                 | Three aggregate result groups with adjacent diagnostics                        | Complete stacked results/issues                  | FR-003, FR-006         |
| Per-module mass                                                   | Complete exact-slot table/list                                                 | Complete labelled module cards                   | FR-007                 |
| Outfitting slot target (feature 002, if exposed)                  | Reveal exact slot in inline editor context                                     | Open existing selected-slot layer                | FR-007 support         |

## Requirement ownership

| Requirement | Surface behavior                                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | One immutable projection copies only package results, fitted facts and shared package-backed observations; visuals add no game result. |
| FR-002      | Three jump groups map the complete single/total/count `jumpRangeSummary()` fields and identify one exact fitted FSD.                   |
| FR-003      | Diagnostic mass/fuel/cargo results gate jump calls; incomplete issues remain adjacent and zero fuel remains numeric zero.              |
| FR-004      | Shared feature 003 load/ENG conditions feed one `mobilityMetrics()` call; all seven returned fields appear.                            |
| FR-005      | Null mobility has no hull fallback; absent, disabled, unpowered and unresolved thruster observations remain textual and distinct.      |
| FR-006      | Unladen mass, main/reserve fuel and cargo show exact diagnostic results with all ordered issues.                                       |
| FR-007      | Every fitted package snapshot has one exact-slot post-engineering mass entry; no list subtotal is created.                             |
| FR-008      | Only present package FSD/thruster thresholds, factors and multipliers appear; absent facts stay absent.                                |

## Cross-feature composition

- Feature 001 owns the active build, build revision and `/build` workspace.
- Feature 002 owns fitted-module editing and exact-slot selection. Feature 008 may emit a slot intent;
  it never mutates a module.
- Feature 003 owns the shared maximum/unladen/laden and ENG-pip state, condition revision, Mobility
  headline and detail navigation.
- Feature 005 owns the shared package-backed exact-slot power observation after Almanac #299.
- Feature 010 may visualize module locations, but anatomy cannot replace complete textual metrics or
  module mass entries.
- Feature 011 owns layout primitives, tokens, controls, localization/formatting, announcements,
  responsive behavior and the automated accessibility harness.

## Shared states

The surface and component previews cover:

- no active build;
- projecting a new revision without mixed stale values;
- complete jump, mobility, mass and capacity;
- no fitted or unresolved FSD;
- complete zero main fuel and complete zero cargo;
- incomplete mass, fuel, cargo and combined package issues;
- absent, disabled, unpowered and unresolved thrusters;
- mobility null versus non-null zero performance above supported mass;
- each optional FSD/thruster parameter present and absent;
- post-engineering module masses, duplicate symbols in separate slots and unknown module mass;
- unexpected projection failure with no stale figures.

Component previews include default, populated, empty, loading, error and disabled states where
meaningful at desktop, tablet and mobile widths, plus portrait/landscape, expanded-text and RTL
fixtures.

## Accessibility, responsive and localization baseline

- The capability participates in the workspace's one `main` and heading hierarchy; it adds no
  competing page landmark or `h1`.
- Visual columns never change semantic reading order. At 200% text, 400% zoom and narrow/landscape
  widths all groups stack without document horizontal scrolling.
- Definition groups and labelled cards are preferred. A wide module table may own internal overflow
  only if every cell/diagnostic remains programmatically associated; narrow presentation uses cards.
- Every disclosure/exact-slot action works by pointer and touch, has matching visible/accessibility
  names/state and uses at least the shared 44 CSS-pixel target token.
- Maximum/unladen/laden, zero, unavailable, incomplete, disabled, unpowered, unresolved and
  supported-mass-zero meanings are text/programmatic state, never colour, shape or bar length alone.
- Settled build/condition changes create one coalesced polite announcement; blocking application
  failures use shared alert behavior.
- Reduced motion removes nonessential transitions. Expanded text and RTL never separate a source,
  load identity, result, issue or exact-slot action.
- Application labels/sentinels use feature 011 messages. Light-years, m/s, degrees/s, tonnes,
  multipliers and integer counts use active-locale formatters.
- Ship/module game text and package diagnostics come from Almanac and receive the shared canonical-
  language disclosure when the requested locale is unavailable.
- Automated coverage scans every meaningful state in Chromium and Firefox over desktop,
  tablet/mobile portrait and landscape. Manual screen-reader journeys verify group relationships,
  diagnostics, source states and announcements.

Where conformance is stated, use: “WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3,
2.4.7 and 2.4.11.”
