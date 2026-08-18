# Edit History Contract

## Upstream gate

This contract cannot be implemented with `@elite-dangerous-almanac/core@0.1.1`. Feature 001 must
first expose a package-backed, lossless `ActiveLoadoutCheckpoint` boundary using released Almanac
clone/checkpoint and ship-name/ident update APIs. `BuildSnapshotV1` is a persistence/publication DTO
and is not an active-session checkpoint.

The release gate must prove that cloning while a source purchase value is temporarily invalid does
not erase the private provenance needed to restore that value after a later edit. It must also retain
exact slot/item spelling, order and field absence, unresolved records, ordinary engineering, every
pre-engineered variant, name, ident and package calculation state. Public event reconstruction, raw
overlays, inverse commands and app-owned provenance are not substitutes.

## Scope

`SessionEditHistory<ActiveLoadoutCheckpoint>` is a framework-agnostic, in-memory tape attached to the
current active-build session. Only feature 001's active-build boundary can create, own or restore its
opaque frames. It is not browser history and has no persistence/export codec.

## Included decisions

One successful, changed Commander confirmation creates exactly one frame for:

- stock or variant fit/replace;
- module removal;
- blueprint + grade + optional effect application;
- effect add/replace/remove-only;
- clear ordinary engineering;
- enabled state;
- zero-based priority;
- ship name;
- ship ident.

Blueprint, grade and effect confirmed together are one decision. A package-reported no-op creates no
frame. History summaries retain an application message key and scalar parameters, never formatted or
game-text strings.

## Exclusions

No frame is created for slot selection, category/anatomy/status mode, chooser search, editor draft,
open/close/cancel, failed/stale/refused commands, calculation reads, autosave, link publication,
ingress normalization or provenance-notice changes.

## Capacity and transitions

Capacity is exactly 100 retained decisions.

```text
successful changed edit:
  edit a lossless package clone
  append ownership of the prior active loadout to past
  drop oldest while past.length > 100
  future = []
  atomically install candidate

undo:
  if past empty -> unchanged
  move ownership of current loadout to front of future
  atomically install newest past checkpoint

redo:
  if future empty -> unchanged
  move ownership of current loadout to past
  atomically install first future checkpoint
```

Undo followed by a new successful edit clears the future branch. Moving frames does not increase the
retained decision path beyond 100.

## Restoration

Undo/redo swaps a package-owned aggregate/checkpoint into the one active slot; it does not reconstruct
through `BuildSnapshotV1` or `LoadoutEvent`. All projections, validation and calculations are re-read
after one active-build revision. Restoration reproduces every package-owned field and provenance.

An impossible restore is a blocking package/internal failure. Do not partially restore, skip a field
or consume either frame; current loadout and tape remain unchanged.

## Reset and normalization

Clear both directions after every successful active-build replacement: stock/hull creation, working
or named record open, URL load, SLEF import and reload restoration. A refused incoming candidate does
not reset history because it never replaces the build.

Fixed-mount repair and supported partial-quality completion occur on the detached incoming candidate
before reset and are never undoable. Editing a normalized mount later is an ordinary Commander
decision. That edit clears the slot's local fixed-normalization provenance; undo restores build state
but does not recreate the disclosure metadata.

## Boundary isolation

These types/APIs accept no history or checkpoint value:

- local record and `BuildSnapshotV1` serializers;
- compact build-link codec;
- SLEF serializer;
- Angular Router/History synchronization.

Autosave and fragment publication observe the active build after undo/redo just as after a normal
edit. They never serialize the tape, opaque checkpoints or summaries.

## UI and verification

Expose `canUndo`, `canRedo` and localized next-action summaries. Disable rather than hide a present
design-system control. Wide composition shows direct actions; compact composition places the same
actions in its named accessible overflow region.

Tests must prove:

- the upstream provenance regression before feature implementation;
- 101 successful decisions retain decisions 2–101 and restore all 100;
- every included edit restores exact package state/provenance;
- undo then new edit discards redo;
- no-op, refusal, cancel, viewing and normalization create no frame;
- accepted replacement clears both directions while refused ingress preserves them;
- no checkpoint/history data reaches JSON, fragments, SLEF or browser navigation.
