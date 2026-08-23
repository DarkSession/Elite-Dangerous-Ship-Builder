# Anatomy Projection Contract

Three things this contract planned were withdrawn when the reference canvases were read against it,
and the design record says why: feature 005's generalized mount-power observation belongs to the
`POWER` mode, the unique located-mount list to a second text surface canvas 1c does not draw, and
the localized package-defect framing to a provenance control it does not publish
(design/hull-anatomy.md, "Divergence from FR-005 and the legend", "Divergence from FR-004 and
SC-003", "Divergence from FR-011"). They are absent below, because they are not built.

## Inputs

`projectAnatomy(slots, sides)` is a pure function of two values and nothing else — no signals, no
injection, no `ShipLoadout` (constitution III):

- feature 002's immutable exact slot views for the active build; and
- the two side states the store holds, each `loading`, `ready`, `temporarilyUnavailable` or
  `contractDefect`.

There is no revision argument. The store derives the projection from feature 002's own signal, so a
build edit reprojects and a stale pair cannot be published: there is no snapshot to hold. The one
selected key is feature 002's, read where the plate is drawn rather than joined in here. Locale is a
presentation input and never changes mount identity.

## Canonical items

One item per slot view whose exact package kind is `hardpoint` or `utility`, in the order those
views arrive, carrying:

- the exact package slot key, which is the only identity anything exchanges;
- feature 002's resolved display name, so the plate and the ledger row say the same word;
- the kind;
- feature 002's display ordinal as the canvas's `NODE NO.`;
- empty or fitted at this revision;
- engineering presence; and
- the sides whose annotations were admitted for that key.

No item is created from an annotation, and no package mount is removed because its geometry is
pending, unavailable or defective.

## Annotation admission

For every annotation the extract records:

1. its `data-journal-slot` must be the exact key of a canonical item;
2. its `data-feature` word must be the one the package uses for that item's kind — `hardpoint` for a
   hardpoint, `utility_mount` for a utility;
3. a key drawn twice on one side is dropped from that side entirely, rather than resolved by taking
   the first — choosing between two drawings by their order in the file is the positional identity
   FR-003 refuses; and
4. everything else the file draws stays inert artwork.

Key prefixes such as `TinyHardpoint`, translated or canonical labels, module symbols, ids, drawing
order, coordinates and model sockets never classify or resolve a mount.

Admission runs before the items are built, because `MountItem.sides` is a statement about which
occurrences were admitted: a wrong-kind annotation must not leave a side listed on the item it was
dropped from.

## Occurrences and duplicates

An occurrence is its canonical item by reference, the side, and that side's centre for the mount. It
owns no build state, so both drawings of a mount that appears top and bottom show the same fitted,
engineering and selected state from one place — there is no second copy that could disagree
(FR-007).

A package mount that no admitted annotation draws is not a defect and is not reported as one. Its
item is published with no sides, the ledger beside the plates still lists it, and it is still
selectable and editable there.

## State projection

| State              | Source and rule                                                        |
| ------------------ | ---------------------------------------------------------------------- |
| Mount kind/key     | Exact package slot view                                                |
| Name and node      | Feature 002's resolved display name and display ordinal                |
| Empty/fitted       | Feature 002's slot view for the current build                          |
| Engineering        | Package/feature 002 presence only                                      |
| Selected           | Feature 002's one `selectedSlotKey`, read at the plate                 |
| Geometry location  | The sides whose annotations were admitted                              |
| Priority and power | Not projected. The `POWER` mode is feature 005's and is not built here |

## Text equivalence

Every mount on a plate is a named button whose name carries, as words, everything its treatment
shows: the node number it draws, the mount, its kind, which side of the hull it is on, whether it is
fitted and whether it is engineered. Feature 002's complete ledger beside the plates is the stable
list of every slot, located or not, and this capability publishes no second one. Colour, stroke,
fill, dash and position are supplementary, and a cross-side repeat never becomes a second list item.

## Projection lifecycle

- No active build publishes no items and makes no asset request.
- A new active hull aborts the previous hull's requests, resets both sides to loading and starts
  both loads.
- A same-hull build edit reprojects item state and refetches nothing: the hull is read off the
  loadout rather than off a revision.
- Side completion publishes only while the per-side request counter still matches, so a stale
  response is dropped rather than relabelled.
- Selection changes reproject the selected mount without touching either side's state.
- A rejected or absent document leaves feature 002's complete ledger and editing untouched.

## Verification

`anatomy-projector.spec.ts` covers both mount kinds, empty and fitted mounts, engineering presence,
package order, cross-side repeats, wrong-kind, unknown-key and same-side-duplicate annotations, a
mount no side draws, and partial side readiness. `almanac-anatomy-contract.spec.ts` reads the pinned
package's own `schematic-*.svg` files directly, over every catalogued hull and both sides, and is
what reports a journal key absent from the hull's catalogue, one resolving to the wrong kind, one
repeated on a side, and a package mount no side draws — as a failed test rather than as anything a
Commander sees. It includes a hull with cross-side duplicates.
