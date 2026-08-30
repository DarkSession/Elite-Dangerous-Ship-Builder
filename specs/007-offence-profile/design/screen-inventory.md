# Screen and Surface Inventory

Feature 007 adds no route and no screen. It adds the `OFFENCE` mode of the hull anatomy region
inside feature 001's `/build` workspace, and one cell to the outfitting status rail.
[canvas-contract.md](./canvas-contract.md) is the template for both.

| Surface                                        | Wide/tablet presentation                                                                                                                                                                                                                                                                                                                                    | Narrow/zoomed presentation                               | Requirements                   |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------ |
| [Offence Analysis panel](./offence-profile.md) | The canvas's `1fr 1fr` pair, with convergence full-width below                                                                                                                                                                                                                                                                                              | The same three blocks stacked in the same order          | FR-001–FR-013, SC-004          |
| `WEAPONS` totals                               | Returned count, then burst and sustained damage per second                                                                                                                                                                                                                                                                                                  | The same, wrapping without dropping either figure        | FR-001, FR-002, FR-005         |
| `WEAPONS` collection                           | The canvas's six columns where the block is given 36rem, all six sharing its width in the canvas's own `2fr 1fr 1fr 1fr 1fr 1fr` proportion, each row inert; labelled cards carrying the same six fields below that, still inert (`design/canvas-contract.md`, "Canvas revision, 2026-08-25", and the 2026-08-29 revision that added `SUSTAINED` beside it) | Labelled cards carrying the same six fields, still inert | FR-001–FR-005                  |
| `DAMAGE PROFILE` damage types                  | The stacked bar and the legend beside it                                                                                                                                                                                                                                                                                                                    | The same bar and legend; no type omitted for space       | FR-001, FR-003, FR-009         |
| `DAMAGE PROFILE` range bands                   | Four distances, each filled against the strongest and stated                                                                                                                                                                                                                                                                                                | The same four rows, stacked, every figure still in words | FR-001, FR-008, FR-009         |
| `DAMAGE PROFILE` weapon capacitor              | Four exact fields under the WEP allocation they were read at                                                                                                                                                                                                                                                                                                | The same four fields, stacked                            | FR-001, FR-006, FR-007, FR-009 |
| `SHOT CONVERGENCE`                             | The gunsight plate carrying every hardpoint the hull has, the selected one in its own ink, its shot sentences, the range control over 500–3,000 m                                                                                                                                                                                                           | The same, the plate narrowing with the block             | FR-001, FR-010–FR-013          |
| Coverage qualification (feature 002)           | Explicit qualification; never inserted into a package result                                                                                                                                                                                                                                                                                                | The same notice before the collection or empty statement | FR-004, FR-005                 |
| Status rail `DPS` cell                         | Label and bare figure, in the rail's six-cell row                                                                                                                                                                                                                                                                                                           | The same cell in the rail's compact stack                | FR-001, FR-002                 |

## Requirement ownership

| Requirement | Planned behavior                                                                                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | One projection retains two `ShipLoadout` results; presentation creates no game value and combines no two figures.                                                            |
| FR-002      | Whole-build damage, per-weapon output and the rail cell all select exact `weaponMetrics()` fields.                                                                           |
| FR-003      | The legend states each conventional type the build deals with its exact amount and share; a type it does not deal takes no line.                                             |
| FR-004      | Every returned weapon is one inert row carrying its module, damage per second, piercing, maximum range and falloff, with absence stated per field.                           |
| FR-005      | Disabled rows remain; package totals are untouched; feature 002's coverage separates confirmed empty from unavailable.                                                       |
| FR-006      | The WEP allocation feature 005 holds is passed to the package unchanged, and the four drawn fields are shown as returned.                                                    |
| FR-007      | Zero capacity and each duration meaning are stated in the package's own terms, with no cause attached to either.                                                             |
| FR-008      | Each band applies the package's `damageFalloff()` to every enabled weapon at the canvas's own four distances.                                                                |
| FR-009      | A bar is drawn only where its figures share one scale, and every figure is written in words whether or not it carries one.                                                   |
| FR-010      | Convergence reads the hull's published gunsight and the package's own projection; a mismatched hull is stated unavailable whole.                                             |
| FR-011      | The plate is hidden from assistive technology, and every one of the hull's mounts — drawn or left off — is a sentence beside it.                                             |
| FR-012      | Every hardpoint the catalogue places is drawn whenever its shot is inside the field of view, the empty ones in their own ink and named as empty in words either way.         |
| FR-013      | The mount the workspace has selected takes the plate's third ink, with no ring and no outline, and is named as selected in its own sentence, from the ledger's own slot key. |
| SC-004      | Nothing user-facing exists that the canvas contract does not sanction; the contract records every departure.                                                                 |

## Cross-feature composition

- Feature 001 owns the active build, its revision and the no-build behavior.
- Feature 002 owns slot views and the engineering summary this panel reuses on a weapon row. Its
  `hardpointCoverage()` adapter answers what the hardpoints are; a weapon count never does. This
  panel's rows are inert and select nothing.
- Feature 005 owns the WEP allocation. This feature reads it and passes it to the package unchanged.
- Feature 007 owns weapon and capacitor result retention, the damage-share, range-band and
  convergence projections, the panel and the rail's `DPS` cell.
- Feature 010 owns the anatomy mode strip and the plates the mode replaces. This feature enables the
  one segment that strip left disabled for it.
- Feature 011 owns tokens, shared components, formatting, game text, previews and the
  responsive/accessibility harness.

## Required states

- workspace no active build;
- confirmed no fitted hardpoints, and unavailable hardpoint coverage;
- positive output, genuine-zero weapon, some disabled and all disabled;
- every conventional type the build deals, each with its share, and a type it does not deal absent from the legend;
- a build dealing no conventional damage, and one landing nothing at any range band;
- falloff range and piercing present and individually absent;
- finite endurance, immediate drain, infinite result, and zero capacity;
- a hull with a published gunsight, one without, one placed but armed with nothing, and a shot
  outside the plate's field of view.

The exact component and state obligations are in
[component-state-preview-matrix.md](./component-state-preview-matrix.md).

## Accessibility, responsive and localization baseline

- The workspace supplies the single `main` and `h1`; this panel uses nested headings under the
  region's own rule and adds no competing landmark.
- Semantic reading order is `WEAPONS`, `DAMAGE PROFILE`, then `SHOT CONVERGENCE`. Visual columns
  never alter it.
- At 200% text, actual 400% zoom and every narrow or landscape layout, all three blocks stack with no
  document-level horizontal scroll.
- The target-range field is the panel's one control: a native range input at feature 011's target
  size, operable by pointer, touch and keyboard, announcing the distance in words. Weapon rows carry
  no control and never silently navigate.
- Disabled, unavailable, absent, not-stated, immediate, sustained-drain and gunsight-unavailable
  states use visible and programmatic text, never colour, fill or position alone. A type the build
  does not deal is stated by nothing at all, which is the reading both canvases give it.
- Every bar is decorative and every figure it stands for is written beside it. The gunsight plate is
  hidden from assistive technology and each shot it draws is a sentence.
- Owned strings use message keys. Damage rates, MW, MJ/s, seconds, metres, milliradians, percentages,
  counts and ratings use active-locale formatters.
- Canonical package weapon names stay source data; visible game text uses Almanac localization by
  symbol with disclosed canonical fallback.
- Expanded-language and RTL layouts retain every row's field and value association, and mirror the
  layout rather than a figure or its unit. Reduced motion changes no meaning.
- Every meaningful state runs in Chromium and Firefox across all five layout profiles with axe;
  manual screen-reader and actual-zoom protocols remain required.

Where conformance is stated, use: "WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3,
2.4.7 and 2.4.11."
