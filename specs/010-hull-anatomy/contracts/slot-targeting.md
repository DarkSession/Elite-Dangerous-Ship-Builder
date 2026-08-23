# Slot Targeting and Integration Contract

Three boundaries this contract planned were withdrawn when the reference canvases were read against
it: an intent object of this capability's own, the unique located-mount list it would also have been
emitted from, and a provenance intent for a control the canvas does not draw. Feature 005's
generalized mount-power port is not consumed either, because the `POWER` mode that would read it is
not built here (design/hull-anatomy.md, "Divergence from FR-004 and SC-003", "Divergence from
FR-005 and the legend", "Divergence from FR-011").

## Shared slot identity

Feature 010 owns no selection. There is one selected key in the workspace, feature 002's, and a mount
on a plate selects it the same way a ledger row does:

```ts
this.#outfitting.select(slotKey);
```

The argument is the canonical item's exact package slot key and nothing else. There is no intent
object, no source discriminator and no second call: an anatomy activation and a ledger activation are
indistinguishable downstream, which is what makes them one selection rather than two that must be
kept in step. SVG ids, element order, module identity, node numbers and coordinates never form a
target. Feature 010 never calls a `ShipLoadout` mutation method.

## Geometry activation

Each admitted occurrence is a named button. Activating it selects its canonical item's key. Both
drawings of a mount that appears top and bottom carry the same item by reference, so either one
selects the same slot and the ledger row, the bench and every occurrence show it selected together.

A key that feature 002 does not have is never drawn: an item only exists because a slot view for it
does, so there is no stale key to refuse. When the build changes, the projection changes with it.

## Ledger-to-anatomy reveal

When feature 002's selection moves to a mount a plate draws, the store moves the shown side to one
that draws it — the current side if it already does, otherwise the first the item lists (FR-006).
The rule is bounded three ways:

- **once per selection, not per projection.** A side finishing its load changes the projection; the
  reveal must not undo a side the Commander chose while it was loading.
- **not on the first selection a hull sees.** Feature 002 opens a build on its first slot, which
  nobody chose; revealing it would flip the shown side on every hull whose first hardpoint is
  underneath. The first selection is recorded rather than acted on.
- **nothing to reveal moves nothing.** An internal, unlocated, pending or undrawn mount leaves the
  shown side alone: there is no side to choose, and changing to one would suggest the mount is there.

At the wide composition both plates are on screen and the reveal is only the selected treatment. No
scrolling is performed: the plates fit their own frames, and nothing pans, zooms or scrolls inside
one.

Side choice is memory-only. It does not enter build state, storage, history, the URL fragment, a
build link, SLEF or undo/redo.

## Complete-ledger fallback

Feature 002's complete slot ledger remains mounted and usable while:

- either or both sides load, fail to arrive, or arrive as a package defect;
- an annotation key is unknown, wrong-kind or duplicated on one side; or
- a mount has no geometry at all.

Every core, optional, armour, cargo-hatch and unlocated mount remains available only through the
ledger, and every located one remains available there too. Feature 010 never invents geometry for a
mount no side draws.

## Package provenance

The anatomy heading publishes no provenance control: neither canvas draws one, and feature 012 owns
where the application says what its data is made of. No external navigation, issue-tracker link or
`/help` route is introduced here.

## Accessibility and feedback

- Each occurrence is a named button, separately operable from the keyboard, whose name opens with the
  node number it draws and then states the mount, its kind, its side, its fitted state and its
  engineering (SC 2.5.3).
- Occurrences are drawn at the plate's own scale, below the 44-pixel baseline; feature 002's ledger
  beside them is the same targets at full size, which is SC 2.5.8's Equivalent exception and how the
  axe gate is configured to read them.
- A side failing and a side recovering each announce once, politely, keyed per side and numbered by
  transition rather than by build revision. The state a region already has when it is first read is
  not announced.
- Nothing essential depends on hover, smooth motion, custom drag or geometry alone.

## Verification

`hull-anatomy.spec.ts` and `e2e/hull-anatomy.spec.ts` cover geometry-to-ledger and ledger-to-geometry
movement for both mount kinds, cross-side repeats, the deterministic reveal and its three bounds, an
internal selection revealing nothing, missing-art fallback with editing intact, and side failure,
retry and recovery. No spec asserts an intent object, a provenance control or a power observation,
because none is built.
