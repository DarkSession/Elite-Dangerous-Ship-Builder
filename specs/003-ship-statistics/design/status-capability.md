# Withdrawn: The Complete Status Capability

**Ruling**: [reference-review.md](./reference-review.md), wave 11 ruling B. Binding; do not
re-litigate.

This file described a wide-width Status mode added as a sixth peer in canvas 1c's central capability
selector, reached by a labelled action in the rail. **The canvas draws neither.**

Canvas 1c's selector, read at byte offset 349767, is five `.anat-tab`s — `MOUNTS`, `POWER`,
`DRIVES`, `DEFENCE`, `OFFENCE`. There is no Status tab and no control anywhere in the rail that would
open one. At wide width the rail _is_ the status surface, complete in itself.

Canvas 1d does draw a Status tab, as the sixth of six `.m-tab`s. That tab is the compact composition's
own arrangement of the same blocks, and it arrives with the capability navigation it belongs to —
feature 003 builds no tab bar, because at compact width the blocks stack and there is nothing to
switch between until features 005–008, 010 and their tabs exist.

Feature 010 has since built a strip, and it is not that navigation: it is canvas 1c's five-segment
strip inside the anatomy region, choosing which layer is drawn over the plates. Canvas 1d's six
segments switch whole compact screens, the anatomy being one of them and this block another, so
building them means the compact workspace switches rather than stacks — feature 002's composition
(`specs/010-hull-anatomy/design/hull-anatomy.md`, "Divergence from canvas 1d — the sixth segment").

**Built 2026-08-26, and this ruling still stands.** Feature 002's compact composition now hands
feature 010's strip a sixth segment and puts the status rail where that segment's panel would be
(`specs/002-module-outfitting/design/outfitting-workspace.md`, "The status segment"). Nothing here
changed: this feature builds no tab bar, publishes no Status capability, and draws the same blocks it
already drew — the compact workspace decided where they go, which is what this ruling said it would.
The wide-width Status mode is still withdrawn, and canvas 1c still draws five segments.

Withdrawn with the capability, and recorded in
[reference-review.md](./reference-review.md#what-these-rulings-withdraw): the structural-facts
definition list, the issue and qualification counts, the qualification summary, the none-reported
statements, the count announcer, and every detail and exact-slot action.

What survives is in [status-rail.md](./status-rail.md).
