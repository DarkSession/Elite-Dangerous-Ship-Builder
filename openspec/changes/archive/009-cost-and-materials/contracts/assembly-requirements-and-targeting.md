# Assembly Requirements and Targeting Contract — WITHDRAWN

Withdrawn by the wave 10 ruling ([../design/reference-review.md](../design/reference-review.md),
ruling F). Retained as a record so the withdrawal is not mistaken for an omission.

## What this contract used to freeze

A compact "Assembly Requirements" summary published through feature 003's
`AssemblyRequirementsPort<T>`, a revision-keyed `StatusRevisionContext`, a
`retailCredits | mercCoin | materials` qualified-summary vocabulary, a `costAndMaterials` detail
target, exact-slot targets from unpriced evidence and material traces, and the pending / stale /
mismatched-context coherence rules that a two-surface publication needs.

## Why it is withdrawn

Every surface it served is drawn nowhere on canvases 1c or 1d:

- There is no second, compact projection of these figures. The canvas draws one `COST` block and one
  `MATERIALS` block, in the status rail at wide width and in the Status stack at narrow width. They
  are the same blocks, and they are the whole capability.
- There is no detail capability to target, so there is no detail target.
- There is no unpriced evidence list and no material trace, so there are no exact-slot targets.
- With one synchronous projection and one consumer, there is no revision coherence problem to solve:
  the blocks read the active loadout directly, and there is no interval in which one surface could
  disagree with another.

## What replaces it

Nothing. Feature 009 contributes two blocks to the rail that feature 003 owns, as siblings of
feature 003's own blocks. It holds no port, adapter, summary vocabulary, target union or revision
cache.

Feature 003 must not recompute a price, a Merc Coin total or a material quantity of its own; the
blocks above are where those figures are presented.
