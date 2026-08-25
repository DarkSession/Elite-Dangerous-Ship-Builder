# Screen and Surface Inventory

> **Rewritten 2026-08-23 (wave 12).** Feature 003's rulings withdrew the workspace capability
> selector, the detail target and the shared viewing-condition control this inventory was written
> against. See [reference-review.md](./reference-review.md), wave 12.
>
> **Rewritten again 2026-08-24 (wave 13).** The mount overlay is withdrawn: the artboard's own
> switching script hides the plate container outside `mounts`, so `POWER` takes the plates' place
> rather than annotating them. FR-012 goes with it, and FR-002 and FR-011 lose the deployed-only
> summaries neither canvas draws. See [reference-review.md](./reference-review.md), wave 13.

Feature 005 adds no route and no top-level screen. It adds one mode to a region feature 010 already
draws, and to the status rail feature 003 already draws, one read-only block and — since the
2026-08-25 canvas revision — the `SYS` / `ENG` / `WEP` pip control.

| Surface                                          | Wide/tablet presentation                                                          | Narrow/zoomed presentation                | Requirements           |
| ------------------------------------------------ | --------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------- |
| [Power and Thermals](./power-and-heat-detail.md) | The anatomy region's `POWER` mode: four plates in the space the hull plates leave | The same four in one semantic column      | FR-001–FR-011          |
| Hardpoint state                                  | Its own line under the `PRIORITY GROUPS` heading                                  | Same control, same place                  | FR-003                 |
| Priority groups and plant summary                | The groups this build uses, over the canvas's three tiles                         | Labelled cards, every field retained      | FR-002–FR-004, FR-011  |
| Draw by module                                   | One line per kind of returned consumer, with the canvas's count                   | The same complete list as cards           | FR-004–FR-006          |
| Heat profile                                     | Bars and the threshold caption beside the canvas's four tiles                     | The same bars over the same tiles         | FR-009–FR-011          |
| Power distributor and pip allocation             | Five columns across SYS, ENG and WEP, the pip blocks in their own                 | The same five fields per bank, stacked    | FR-007, FR-008, FR-011 |
| Status rail power block (feature 003's rail)     | Between the validation issues and the metric cells                                | The same block in canvas 1d's Status mode | FR-013                 |

## Requirement ownership

| Requirement | Planned behaviour                                                                                                                                                                                                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | One pure projection calls only the three `ShipLoadout` methods; every surface reads that one result.                                                                                                                                                                                                        |
| FR-002      | Selected totals and groups map directly to named package fields; headroom, utilisation and within-budget are read in neither state, because neither canvas draws them.                                                                                                                                      |
| FR-003      | This capability owns the hardpoint selection, defaults it to deployed and shows one settled state.                                                                                                                                                                                                          |
| FR-004      | Disabled returned consumers stay visible and contribute exactly as the package reports.                                                                                                                                                                                                                     |
| FR-005      | Every returned consumer uses package post-engineering draw; rows may sort by draw descending with source order as the tie break.                                                                                                                                                                            |
| FR-006      | Every line exposes its count, its group where the plant sheds it, its off state and its state-relative draw. The list holds no action: feature 002's ledger selects a mount.                                                                                                                                |
| FR-007      | This capability owns whole `0`–`4` pips per bank; the returned allocation is what is displayed.                                                                                                                                                                                                             |
| FR-008      | Package distributor `null` is unavailable and receives no catalogue substitute or inferred cause.                                                                                                                                                                                                           |
| FR-009      | Ready heat shows three profile facts, exactly five scenarios and every one of their five fields.                                                                                                                                                                                                            |
| FR-010      | Package heat `null` is unavailable and receives no catalogue substitute.                                                                                                                                                                                                                                    |
| FR-011      | Field-specific presentation distinguishes a plant of zero, non-settling heat and never-overheating time.                                                                                                                                                                                                    |
| FR-012      | **Withdrawn (wave 13)** — the artboard hides the plates outside `mounts`, so no mount carries a power state.                                                                                                                                                                                                |
| FR-013      | The rail's shed sentences, `POWER` line and bar read the same projection and name only returned fields; none of the three is interactive. Its `SYS` / `ENG` / `WEP` blocks edit the one pip condition the distributor cell edits, under the same six-pip rule, and name the allocation each bank stands at. |

## Cross-feature composition

- Feature 001 owns the active build, its revision and the `/build` workspace.
- Feature 002 owns enabled/priority mutations and exact-slot selection. Feature 005 selects a slot
  and stops there.
- Feature 003 owns the status rail's heading and its validation issues, and no condition state of
  any kind. Feature 005 adds its own blocks to that rail.
- Feature 010 owns the plates, their side selector, their legend and the mode strip. Feature 005
  enables one segment of that strip and takes the space the plates occupy while it is open; it draws
  nothing on a mount and reads no coordinate.
- Feature 011 owns tokens, components, localization, formatters, the game-text presenter and the
  accessibility and browser harness.

## Required states

- no active build;
- deployed and retracted, each stating the same three tiles;
- within budget, and shedding — one band and several;
- every band this build puts something in, and a build that leaves a group empty;
- disabled consumers that stay visible, at zero, marked off;
- zero plant output with zero draw, and with positive draw;
- enabled, disabled and deployed-only consumers, the last two of them at zero;
- a build whose mounts aggregate into one counted line, and one whose consumer has no symbol;
- distributor ready, package unavailable, and a genuine zero-pip recharge;
- heat ready, package unavailable, and a build with no weapons;
- finite, does-not-settle and never-overheats fields;
- a hull with no mount the package returns a consumer for;
- a build with no shield cell bank, which draws five heat bars rather than six.

## Responsive, accessibility and localization baseline

- The workspace supplies the one `main` and the one `h1`; these blocks nest under the region
  heading feature 010 draws.
- Wide columns never alter DOM or read order. At narrow widths, both landscape orientations, 200%
  text and 400% zoom, the blocks stack with no document horizontal scrolling.
- A semantic table scrolls only inside its own labelled container, and its figures keep their
  columns: the pip blocks take the space they need and no more.
- Controls work by pointer and by touch and use the shared target-size tokens. Nothing required
  depends on hover.
- Powered, shed, disabled, deployed-only, unavailable and overheating states are text, visible and
  programmatic. No bar, fill, hue or position carries one.
- Owned strings use messages; megawatts, megajoules, megajoules per second, percentages, pips and
  durations use the active-locale formatters.
- Module and slot text comes from the Almanac through feature 011's presenter, with its canonical
  fallback disclosed.
- Every state is exercised in Chromium and Firefox across the five layout profiles, with axe plus
  the manual screen-reader and zoom protocols.

Where conformance is stated, use "WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3,
2.4.7 and 2.4.11."
