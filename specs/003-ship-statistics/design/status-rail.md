# Screen Design: The Status Rail

**Route**: existing `/build`
**Reference**: canvas 1c's 306 px rail, and canvas 1d's Status mode, which stacks the same blocks
**Rulings**: [reference-review.md](./reference-review.md), wave 11 A–C

The rail is the whole of feature 003's surface. Ruling B withdrew the separate wide Status capability,
so there is one status surface at every width and the compact arrangement is the same DOM reflowed.

## Information order

1. `BUILD STATUS`, the visible heading that names the region.
2. Every `ShipLoadout.validation()` issue, once, in package order.
3. Power — feature 005.
4. The `SYS` / `ENG` / `WEP` pip control — feature 005, added by the 2026-08-25 canvas revision.
5. The metric cells: six from features 006–008, then `CARGO` and `PASSENGERS` from this feature.
6. `COST` and `MATERIALS` — feature 009, built.

Feature 003 owns 1, 2 and its own two cells in 5. The rest of 5 and items 3, 4 and 6 are their
owners' and are listed here only because the rail is where the canvas puts them and the order is the
canvas's.

**Item 4 makes the rail interactive for the first time.** Until the 2026-08-25 revision every block
in it was a read-out, and this file said so. It is still not feature 003's control: the pips are
feature 005's one viewing condition, the same one its distributor cell edits, and the rail is only
where the canvas now also draws it (005 FR-013's 2026-08-25 extension,
`specs/005-power-and-heat/design/power-and-heat-detail.md`).

## The metric cells are one grid, not several blocks

_Relocated here from `AGENTS.md` on 2026-08-25._ Four features own cells in item 5 — `SHIELD` and
`ARMOUR` from 006, `DPS` from 007, `JUMP`, `SPEED` and `MASS` from 008, and `CARGO` and
`PASSENGERS` from this one — but the canvas rules the six it draws off each other through the gaps
of a **single** `1fr 1fr` container, two to a row, and the two FR-023 adds take the next row of the
same one. Grids stacked would rule blocks off each other instead, and `DPS` and `JUMP` could not
share a row.

So the workspace owns that grid as `.outfitting__status-cells`, and each feature's summary flattens
into it through `MetricGroup`'s `flow` input (`display: contents`). **Ownership does not move**: each
feature still builds its own cells, and the `defence-ownership` and `offence-ownership` policy
scripts still fence them. A feature adding a cell adds it to its own summary, never to the workspace.

## The band goes wherever the rail goes

The rail is one surface at every width, so its cell band is drawn at every width (FR-024). Where the
rail is a column it is always on screen and so is the band. Where the rail is the anatomy strip's
`STATUS` segment, both appear when a Commander opens that segment — and the compact key-figures
strip stands down for as long as it is open, so the same figures are never on one screen twice
(`specs/002-module-outfitting/design/outfitting-workspace.md`, "The compact key figures").

The grid carries the amber ground and nothing else — no inset. The canvas's ground is exactly the
extent of the cells: it shows through the one-pixel gaps and nowhere else, so a ground carried by a
padded element would be painted across that padding too and draw the cells inside an amber band
the canvas does not draw.

## Items 3 to 5 are one block

Canvas 1c does not rule the power line off the cells. It draws items 3, 4 and 5 — `POWER`, the pips
and the cell band — inside a **single** padded block, closed by the same one-pixel amber rule that
separates every block in the rail, and stacks them in it. The workspace owns that block as
`.outfitting__status-band`, because five features draw into it and none of them owns it: it carries
the inset once and the closing rule once, and feature 005's power block and this grid sit in it with
no padding of their own. Two insets stacked would put the figures a block's padding further in than
the cells they head, and a rule between them would read as a second reading rather than as the same
one broken out.

## The issue block

One list item per package issue, drawn as the canvas draws its warnings: a three-pixel inline-start
marker, a quiet tinted ground, and the sentence set in prose rather than in the mono numeric voice.

| Package severity | Canvas block     | Treatment                            |
| ---------------- | ---------------- | ------------------------------------ |
| `error`          | the hot one      | danger marker, danger quiet ground   |
| `warning`        | the amber one    | accent marker, accent quiet ground   |
| `incomplete`     | the neutral one  | info marker, info quiet ground       |
| — (`valid`)      | none — see below | success marker, success quiet ground |

The canvas draws four blocks in its `BUILD STATUS` list, each with a marker and a ground of its own,
and every block in this list has both. Two of the four rows above are departures:

- **The `incomplete` row is drawn in the system's info tone, and the canvas's fourth block is
  neutral ink** — a `rgba(232, 222, 209, 0.28)` marker over a `0.04` ground, against this
  application's cool `--edsb-text-info`. The tone was chosen when the row was: an `incomplete` is a
  statement about a build that is not finished, and the system has a role for that. The 2026-08-29
  revision added the ground under it and did not change the hue.
- **The green block is not this feature's `valid` verdict.** Its sentence is
  `Jump range and mass lock clear the requirements for this build` — an authored mobility sentence,
  the same class as the two power and heat sentences above it, and feature 008's subject rather than
  a `LoadoutValidation` issue (`design/reference-review.md`, "Tiers 1 and 2 are authored power and
  heat sentences"). So the all-clear line this rail draws for a build the package calls valid is
  still a departure from the reference, exactly as it was before the revision. What the green block
  settles is only what such a line should _look_ like: a marker and a quiet ground in the success
  role, drawn in the shape the other three blocks are drawn in.

A `warning` stands beside `valid` and `complete`: the package raises one where a load the pilot
chooses, rather than the fit itself, crosses a limit. The block draws the severity the package
states, never one read off `valid`.

The severity is also written in words — hidden, because neither canvas draws one. The reference
carries the tier in its marker and its ground, and a word the design does not draw does not go on the
screen; it stays as the accessibility floor, read aloud beside the sentence and costing the design
nothing. That word is what carries the severity, because the four tones differ from each other in
hue alone. The tones reinforce it; they do not state it.

The sentence itself is package game text, resolved through `getLoadoutIssueMessage` by way of feature
011's presenter and rendered by `edsb-game-text`, so a locale the package has no translation for shows
its canonical English with the shared untranslated disclosure. The application keeps no copy of a
package diagnostic and parses none.

## Behavior

- The block reads one active loadout at one revision. There is no projection envelope, no provider
  port and no pending state: `ShipLoadout.validation()` reads a build that is already in
  memory, and reading it cannot fail or arrive late.
- Nothing **feature 003 owns** here is interactive. Ruling A withdrew the per-issue slot action, and
  at both widths the slot ledger it would have reached is already on screen. Feature 005's pip
  control, drawn in this rail since the 2026-08-25 canvas revision, is the one control in the region
  and belongs to that feature; it changes neither this block nor ruling A.
- A build the package calls valid draws one line saying so, and nothing beyond it — no count, no
  structural facts, no readiness or flyability claim. The line is read from
  `LoadoutValidation.valid`, so it stands whether the package raised nothing at all or raised only a
  `warning`, and the issue blocks are drawn beneath it in that second case. It was added ahead of
  the canvas, because a Commander read the silence as a rail that had failed to load rather than as
  an all-clear (2026-08-27, revising FR-015 and half of ruling A), and it is still ahead of it: the
  2026-08-29 revision's green block is an authored mobility sentence, not a verdict on the loadout.
  What that block settles is the shape — a success marker over a success quiet ground, drawn like
  the other three. The line states the package's verdict and nothing built on top of it.
- Where there is no build, nothing is drawn at all. No build is not a valid build.
- Visible content is not live. A revalidated build is ordinary re-rendered content, not an event, and
  ruling A withdrew the announcer that would have reported one.

## Layout

The rail is canvas 1c's third track at wide width and a stacked region at compact width, decided in
CSS from the space the region is given — the arrangement feature 009 already established for the two
blocks below it. Long canonical diagnostics, expanded translations and RTL text wrap. The document
never scrolls horizontally.

## States

- no active build: the workspace's existing empty state, which owns the whole region;
- issues present, in every package order and both severities;
- no issues: the block is absent;
- a locale miss on any issue: canonical text with its disclosure;
- long diagnostics, expanded translations, RTL.

## Accessibility

The rail is a group named by the visible `BUILD STATUS` heading rather than by an invisible label —
the canvas draws that heading, so the region's name is on the screen. The issues are a semantic list,
one item each. Severity is text, hidden beside the sentence it belongs to. Nothing requires hover and
nothing is a live region.
