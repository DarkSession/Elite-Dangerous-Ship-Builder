# Visual Reference Review

## Reference

`.design/Ship Builder.dc.html` contains the relevant compositions in canvas 1c (wide Outfitting,
Defence Analysis selected) and canvas 1d (390px mobile Outfitting, Defence selected). It is a design
hierarchy reference, not source code, package data, a responsive implementation or an accessibility
contract.

## Reference observations

- Canvas 1c uses a fixed three-column shell: slot ledger, fluid analysis and Status rail. Defence
  replaces the anatomy center with equal shield/armour cards.
- Its shield card shows a headline, four damage rows, three recovery facts, grouped module bars and
  one terse bank row. Armour mirrors the headline/damage/source pattern and adds hardness,
  “module protection” and “integrity.”
- Canvas 1d is separately authored fixed-width markup, not a responsive transformation of 1c. It
  stacks shield then armour but removes resistance percentages, most recovery content, banks,
  hardness and module-protection detail. Status becomes a separate capability.

## Adopted direction

| Reference idea                                  | Planned adaptation                                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Defence is a first-class workspace mode         | Keep one `defenceProfile` capability inside `/build`; add no route.                              |
| Shield and armour are visual peers              | Use two complete fluid regions only while both remain legible; otherwise stack.                  |
| Resistance and EHP read together by damage type | Pair exact same-type package values in semantic rows/cards.                                      |
| Recovery sits with shields                      | Keep the recharge rate and the two phases adjacent to the shield profile.                        |
| Fitted modules sit near their aggregate         | Name each role group by what the package resolved and close it with the package's own aggregate. |
| Narrow content stacks                           | Preserve the same complete semantic order and every field in one stack.                          |
| Wide workspace retains surrounding context      | Compose with feature 002's ledger and feature 003's Status surfaces when space allows.           |

## Required departures

> **Rewritten at implementation, 2026-08-24.** The list below used to add a mass-curve multiplier, a
> boost multiplier, a SYS-resistance figure, the selected pip count, a broken regeneration rate, a
> per-bank collection with every returned field and an action apiece, three replacement armour
> concepts and a hardness explanation — none of which either canvas draws. They were inventions, and
> under the standing rule that the reference is the template they are withdrawn. Where they
> contradicted the specification, the specification was corrected rather than the canvas.

The reference is the template for everything a Commander sees. Nothing user-facing is added to it
here: a figure, a label, a control or a state the canvases do not draw is an invention, and an
invention is not this feature's to make. What follows are the only departures, and every one of them
is either an honest reading of a state the sample build does not happen to be in, or a rule about
how the drawn composition behaves outside the artboard's fixed width.

- Show the package's own total strength and hit points under the reference's `EFFECTIVE POOL`
  headline, and the package's own same-type effective value beside each of the four resistances.
  The mock's sample figures are illustrations, not data.
- Add the states the sample build is not in, and only those: a missing, disabled, shed, unresolved
  or invalid generator; a shield or recovery result the package refuses, stated as the reasons the
  package gave; no bank fitted; every bank unpowered; a zero, a negative and an unbounded value;
  a pending revision; a projection failure.
- Read shields and recovery independently. The canvas draws both in one card, and a card that lost
  its recovery figures because the strength was refused — or the reverse — would be answering a
  question the package answered separately.
- Keep every figure the canvases draw at every width. Canvas 1d's abbreviated footer is a second,
  smaller data model; the same complete composition stacks instead.
- Grouped role bars carry the package's own aggregate and nothing else. No row is given a share of
  an aggregate the package publishes whole.
- Bars are decoration over a stated scale, and every length they draw is set beside them as text.
  A negative resistance is hatched and says so in words, because a pattern alone names nothing.
- Draw one scale per damage table and print both of its ends. The canvas's armour table contradicts
  itself: its zero mark sits at 18% of the track, its `34%` is drawn at 27.88% — 0.82 of the track —
  and its `−12%` is drawn 12% wide from the leading edge, which is neither that scale nor a length
  reaching the zero mark it is supposed to be measured from. The drawn intent is unambiguous, so it
  is generalised rather than copied: the ceiling is `100%`, the floor is the lowest resistance in
  that table, the mark is drawn where zero falls between them, a weakness runs back from that mark
  and a resistance runs on from it. The legend states the floor it actually reaches rather than the
  canvas's `0%`, which its own 18% offset already contradicts, and prints `0%` a second time at the
  mark: the end of the scale and the point the bars are measured from are two readings on a signed
  table, and only the second says which of the bars above are weaknesses. On an unsigned table they
  are the same point and the canvas's single `0%` at the leading edge is what appears.
- Keep the scale the bar column's own width, as the canvas's `padding-left: 83px` and
  `padding-right: 111px` make it. A scale that started at the card's edge would not be the thing the
  lengths above it are read against.
- Keep the canvas's 46px and 56px figure columns as minimums rather than fixed widths. They are what
  holds a short figure off the end of the bar beside it; fixed, they would clip a longer number in
  another locale.
- List every bank aboard under the reserve, each on its own canvas row. The mock's sample build
  carries one bank, so its single `5A · 4 × 340 MJ · UNPOWERED` line is a list of one; a reserve
  summed over a powered 5A and a dead 3D and written on one such line would describe neither of
  them. Banks alike in every field the canvas writes collapse into one row carrying the canvas's own
  `×4`, exactly as its `Shield Boosters ×4` row does.
- Give those rows the bar and the figure column every other source row in the canvas has, which
  moves the megajoules out of the code line and leaves it the cells and the state. The mock's bank
  line has a bar of its own already; once there are several such lines, one per bank, they are
  source rows and are drawn as source rows.
- Scale the whole reserve block against the largest figure in it, which is the rule the canvas
  itself follows in the rows above: its `+144` row is 13% of a track its `1,090` row fills. The
  mock's own `88%` reserve bar matches neither its pool nor its rows, so the rule the canvas is
  consistent about is the one that is kept.
- Draw the metric grid as cells over a ground showing through one-pixel gaps, with no border around
  the grid itself. The canvas's `display: grid; gap: 1px; background: var(--amber-a12)` has no
  border, and the one the shared mixin added put a box around every metric group in the product.
- Replace the fixed 1560/390 widths, the tiny and ellipsised text, the ~30px tab targets, the
  clickable `div`s, the hover and `title` dependence and the colour-only meaning with feature 011's
  primitives and tokens.
- Do not copy inline colours, spacing, type or motion literals, hard-coded English, `en-US`
  formatting, external Google Fonts or cross-origin asset links.

## Responsive conclusion

The canvases are two compositional endpoints, not breakpoints. Available inline size decides whether
the two complete regions sit side by side. Tablet, landscape, text expansion and zoom are independent
constraints. A separate abbreviated mobile data model is prohibited.

## Source-of-truth conclusion

Adopt the reference's capability hierarchy, peer defence regions, damage relationship and stacked
order. Reject its sample values, arithmetic implications, incomplete state set and implementation
literals wherever they conflict with FR-001–FR-009, Almanac or the constitution. Repository tokens,
components and these plan-time screen definitions remain authoritative.

## Canvas revision, 2026-08-25

One change reaches this feature, and it is an addition rather than a correction.

**The shield table gained a fifth column, `MJ × N SYS PIPS`.** `N` is the SYS allocation the column
was read at; the canvas happens to sample four, and by the rule stated above — "the mock's sample
figures are illustrations, not data" — four is the sample and `N` is the column. The sampled cell reads
`7,805` against the kinetic row's `3,122`, which is `1,842 / (1 − 0.764)` where `0.764` stacks the
row's own `41%` with the package's systems resistance at four pips. So the canvas is drawing the
same effective pool twice: bare, and at the SYS allocation.

That resolves what the `RESIST` and `MJ` columns are, which the previous drawing left open and this
feature had read at the standing allocation — they are the **bare** shield at zero pips, the
package's own documented default, and the standing allocation moves to the new column alone. The
resistance percentages are therefore base values; nothing on the table except the fifth column moves
when a pip moves.

Note the canvas sample is internally inconsistent — its distributor and rail stand at SYS 2 while
this heading reads `4`. The sample is not the requirement, and the heading follows the allocation.

Two package calls, one per column. Almanac 0.2.0 split them for us: `shieldMetrics()` is the bare
shield by construction — it takes no allocation at all — and `shieldCapacitorMetrics({ systemsPips })`
is the separate reading the fifth column draws, with `systemsResistance` among its returned fields.
Nothing is scaled, blended or apportioned here.

**Everything else on canvas 1d caught up to canvas 1c** — the `RESIST` column, the source rows with
their module identities, `RECHARGE` / `0→100%` / `BROKEN RESET`, `HARDNESS` / `MODULE PROT.` /
`INTEGRITY`, and `ARMOUR · 3,914 HP EFFECTIVE` in place of `ARMOUR · 2,784 INTEGRITY`. All of it is
already built: one DOM at both widths was this feature's answer, and the drawing now agrees with it.
No change follows from that half of the revision.
