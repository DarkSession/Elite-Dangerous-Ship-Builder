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
5. The six metric cells — features 006–008.
6. `COST` and `MATERIALS` — feature 009, built.

Feature 003 owns 1 and 2. Items 3–6 are their owners' and are listed here only because the rail is
where the canvas puts them and the order is the canvas's.

**Item 4 makes the rail interactive for the first time.** Until the 2026-08-25 revision every block
in it was a read-out, and this file said so. It is still not feature 003's control: the pips are
feature 005's one viewing condition, the same one its distributor cell edits, and the rail is only
where the canvas now also draws it (005 FR-013's 2026-08-25 extension,
`specs/005-power-and-heat/design/power-and-heat-detail.md`).

## The six metric cells are one grid, not three blocks

_Relocated here from `AGENTS.md` on 2026-08-25._ Features 006, 007 and 008 each own cells in item 5 —
`SHIELD` and `ARMOUR`, `DPS`, and `JUMP`, `SPEED` and `MASS` — but the canvas rules all six off each
other through the gaps of a **single** `1fr 1fr` container, two to a row. Three grids stacked would
rule three blocks off each other instead, and `DPS` and `JUMP` could not share a row.

So `.outfitting__status-cells` in the workspace owns that grid, and each feature's summary flattens
into it through `MetricGroup`'s `flow` input (`display: contents`). **Ownership does not move**: each
feature still builds its own cells, and the `defence-ownership` and `offence-ownership` policy
scripts still fence them. A feature adding a cell adds it to its own summary, never to the workspace.

## The issue block

One list item per package issue, drawn as the canvas draws its warnings: a three-pixel inline-start
marker, a quiet tinted ground, and the sentence set in prose rather than in the mono numeric voice.

| Package severity | Canvas tier | Treatment                          |
| ---------------- | ----------- | ---------------------------------- |
| `error`          | 1           | danger marker, danger quiet ground |
| `incomplete`     | 3           | info marker, no tint               |

Tier 2, the amber middle, carries no package severity and is unused.

The severity is also written in words — hidden, because neither canvas draws one. The reference
carries the tier in its marker and its ground, and a word the design does not draw does not go on the
screen; it stays as the accessibility floor, read aloud beside the sentence and costing the design
nothing. The tiers still differ visually by more than hue, because tier 1 carries a tinted ground and
tier 3 does not.

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
- A build with no package issues draws no block at all — not an all-clear line, not a count, not a
  statement. That is what the canvas does, and it is the strongest available guarantee that no
  readiness, flyability or quality claim is being made.
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
