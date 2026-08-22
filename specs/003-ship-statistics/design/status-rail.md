# Screen Design: The Status Rail

**Route**: existing `/build`
**Reference**: canvas 1c's 306 px rail, and canvas 1d's Status mode, which stacks the same blocks
**Rulings**: [reference-review.md](./reference-review.md), wave 11 A–C

The rail is the whole of feature 003's surface. Ruling B withdrew the separate wide Status capability,
so there is one status surface at every width and the compact arrangement is the same DOM reflowed.

## Information order

1. `BUILD STATUS`, the visible heading that names the region.
2. Every `ShipLoadout.validation` issue, once, in package order.
3. Power — feature 005.
4. The six metric cells — features 005–008.
5. `COST` and `MATERIALS` — feature 009, built.

Feature 003 owns 1 and 2. Items 3–5 are their owners' and are listed here only because the rail is
where the canvas puts them and the order is the canvas's.

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
  port and no pending state: `ShipLoadout.validation` is a field on the build that is already in
  memory, and reading it cannot fail or arrive late.
- Nothing here is interactive. Ruling A withdrew the per-issue slot action, and at both widths the
  slot ledger it would have reached is already on screen.
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
