# Screen and Surface Inventory

> **Rewritten at implementation, 2026-08-24.** The original inventory was written against a shared
> viewing-condition surface, a per-bank collection, exact-slot actions in the source rows and a
> hardness explanation. None of those is drawn by either canvas, and under the standing rule that
> the reference is the template they are withdrawn. See
> [reference-review.md](./reference-review.md), "Required departures".

Feature 006 adds no route and no top-level screen. It adds one mode to a region feature 010 already
draws, and one read-only block to the status rail feature 003 already draws. The SYS allocation it
is read at is the one feature 005's dashboard already owns.

| Surface                                   | Wide/tablet presentation                                                                                                                                                                        | Narrow/zoomed presentation                | Requirements           |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------- |
| [Defence analysis](./defence-profile.md)  | The anatomy region's `DEFENCE` mode: two cards in the space the hull plates leave                                                                                                               | The same two in one semantic column       | FR-001–FR-009          |
| Shield card                               | Identity, headline pool, four damage rows over five columns, three recovery facts, sources, reserve                                                                                             | The same blocks in the same order         | FR-002–FR-006, FR-009  |
| Damage relationship                       | One row per returned damage type: the type, its bar, its base resistance and its bare pool — and on the shield table that pool again at the standing SYS allocation, in a column headed with it | The same rows, scrolling inside their box | FR-002, FR-005, FR-007 |
| Armour card                               | Identity, headline pool, four damage rows, three protection facts, sources                                                                                                                      | The same blocks in the same order         | FR-007–FR-009          |
| Cell-bank reserve                         | One line under the shield sources, and every kind of bank behind it listed under it                                                                                                             | The same lines, wrapped                   | FR-006                 |
| Status rail defence block (feature 003's) | Between the power block and the cost cells                                                                                                                                                      | The same block in canvas 1d's Status mode | FR-002, FR-007         |

## Requirement ownership

| Requirement | Behaviour                                                                                                                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | One pure projection makes the five `BuildMetrics` calls and the hull lookup, and nothing else; every surface reads that one result at one revision.                                                               |
| FR-002      | The shield card presents the returned strength, role aggregates, base resistances and bare effective pools, and closes each row with the same pool read at the standing SYS allocation under a heading naming it. |
| FR-003      | A refused shield states every package issue in order; missing, disabled and shed stay distinguishable by the reason given.                                                                                        |
| FR-004      | Recovery keeps the regeneration rate, the regeneration time and the recovery time as three separate readings.                                                                                                     |
| FR-005      | Field-specific presentation distinguishes an unbounded effective pool and a recovery phase that does not finish.                                                                                                  |
| FR-006      | The reserve distinguishes no bank fitted from a fitted bank, carries the package total, and lists every bank aboard.                                                                                              |
| FR-007      | The armour card presents the returned hit points, aggregates, resistances, effective pools, module armour and protection.                                                                                         |
| FR-008      | Hardness comes from the exact hull record; the bulkhead is named from the package slot rather than from a stock assumption.                                                                                       |
| FR-009      | Each role group is named by the package identity of what it holds; the aggregate stays whole and no row is a control.                                                                                             |

## Cross-feature composition

- Feature 001 owns the active build, its revision and the `/build` workspace.
- Feature 002 owns enabled/priority mutations and exact-slot selection. Feature 006 selects nothing:
  the canvas draws no action inside either card.
- Feature 003 owns the status rail's heading and its validation issues. Feature 006 adds one block.
- Feature 005 owns the SYS pip allocation. Feature 006 reads it and sets none.
- Feature 010 owns the plates, their side selector, their legend and the mode strip. Feature 006
  enables one segment of that strip and takes the space the plates occupy while it is open.
- Feature 011 owns tokens, components, localization, formatters, the game-text presenter and the
  accessibility and browser harness.

## Required states

- no active build;
- a complete shield and a complete hull, the first four columns bare and the fifth read at the standing allocation;
- a shield the package refuses, with every reason it gave, beside a hull that stays whole;
- a generator that is missing, that is switched off, that the plant has shed, and one the package
  cannot resolve;
- recovery refused while the strength stands, and the reverse;
- a recovery phase that does not finish;
- the fifth column at no pips, where it repeats the bare pool, and at an allocation that moves it;
- a capacitor the package refuses while the bare shield stands, which withdraws the fifth column;
- an unbounded effective pool;
- a zero resistance and a negative one;
- no cell bank fitted, banks with power, and banks with none;
- a role group of one module, a group of several of the same module, and a group of unlike modules;
- a bulkhead the package resolved and one it did not.

## Responsive, accessibility and localization baseline

- The workspace supplies the one `main` and the one `h1`; these cards nest under the region heading
  feature 010 draws.
- Wide columns never alter DOM or read order. At narrow widths, both landscape orientations, 200%
  text and 400% zoom, the two cards stack with no document horizontal scrolling.
- A semantic table scrolls only inside its own labelled container.
- The panel holds no control of its own, and nothing it reports depends on hover, colour, a bar's
  length, an icon, a fixed position or motion.
- Weakness, unpowered, unavailable and unbounded are text, visible and programmatic.
- Owned strings use messages; megajoules, megajoules per second, hull points, percentages and
  durations use the active-locale formatters.
- Module and slot text comes from the Almanac through feature 011's presenter, with its canonical
  fallback disclosed.
- Every state is exercised in Chromium and Firefox across the five layout profiles, with axe plus
  the manual screen-reader and zoom protocols.

Where conformance is stated, use "WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3,
2.4.7 and 2.4.11."
