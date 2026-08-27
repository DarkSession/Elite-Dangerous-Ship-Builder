# Edit History Contract

## Model boundary

Feature 001 exposes canonical `BuildSnapshotV1` capture, package reconstruction and atomic active
swap operations. A history checkpoint retains every recognized application-modelled field: exact
slot/item identity, order and field absence, ordinary engineering, every identified pre-engineered
variant, name and ident. Unknown identities, historical purchase values, capture condition and
package calculations are not modelled or restored. Raw overlays and inverse commands are not
substitutes for package reconstruction.

## Scope

`SessionEditHistory<ModeledBuildCheckpoint>` is a framework-agnostic, in-memory tape attached to the
current active-build session. Only feature 001's active-build boundary can capture or reconstruct its
frames. It is not browser history and has no persistence/export codec.

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
package construction or transient ingress-normalisation state.

## Capacity and transitions

Capacity is exactly 100 retained decisions.

```text
successful changed edit:
  capture the prior modelled snapshot
  reconstruct and edit a detached package candidate
  append the prior snapshot to past
  drop oldest while past.length > 100
  future = []
  atomically install candidate

undo:
  if past empty -> unchanged
  capture current modelled snapshot at front of future
  reconstruct and atomically install newest past checkpoint

redo:
  if future empty -> unchanged
  capture current modelled snapshot in past
  reconstruct and atomically install first future checkpoint
```

Undo followed by a new successful edit clears the future branch. Moving frames does not increase the
retained decision path beyond 100.

## Restoration

Undo/redo reconstructs a detached `ShipLoadout` from the checkpoint through the package and swaps it
into the one active slot. All projections, validation, current catalogue cost and calculations are
re-read after one active-build revision. Restoration reproduces every application-modelled field and
does not restore historical purchase values.

An impossible restore is a blocking package/internal failure. Do not partially restore, skip a field
or consume either frame; current loadout and tape remain unchanged.

## Reset and normalization

Clear both directions after every successful active-build replacement: stock/hull creation, working
or named record open, URL load, SLEF import and reload restoration. A refused incoming candidate does
not reset history because it never replaces the build.

Package fixed-mount defaulting and supported partial-quality completion occur on the detached
incoming candidate before reset and are never undoable. Editing a defaulted mount later is an
ordinary Commander decision; undo restores build state but creates no source provenance.

## Boundary isolation

These types/APIs accept no history or checkpoint value:

- local record and `BuildSnapshotV1` serializers;
- compact build-link codec;
- SLEF serializer;
- Angular Router/History synchronization.

Autosave and fragment publication observe the active build after undo/redo just as after a normal
edit. They never serialize the tape, modelled checkpoints or summaries.

## UI and verification

Expose `canUndo`, `canRedo` and localized next-action summaries. Disable rather than hide a present
design-system control. Wide composition shows direct actions; compact composition places the same
actions in its named accessible overflow region.

Tests must prove:

- 101 successful decisions retain decisions 2–101 and restore all 100;
- every included edit restores exact modelled build state and recomputed package results;
- undo then new edit discards redo;
- no-op, refusal, cancel, viewing and normalization create no frame;
- accepted replacement clears both directions while refused ingress preserves them;
- no history tape reaches JSON, fragments, SLEF or browser navigation.
