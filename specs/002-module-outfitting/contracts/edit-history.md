# Edit History Contract

## Scope

`SessionEditHistory<BuildSnapshotV1>` is a framework-agnostic, in-memory checkpoint tape attached to
the current active-build session. It is not browser history and has no persistence/export codec.

## Included decisions

One successful Commander confirmation creates exactly one checkpoint for:

- stock or variant fit/replace;
- module removal;
- blueprint + grade + optional effect application;
- effect add/replace/remove-only;
- clear ordinary engineering;
- enabled state;
- zero-based priority;
- ship name;
- ship ident.

Blueprint, grade and effect chosen in one apply action are one decision. Repeated intents producing an
identical canonical snapshot are no-ops and create no checkpoint.

## Exclusions

No checkpoint is created for slot selection, chooser search, editor draft changes, viewing conditions,
dialogs opened/canceled, failed/stale/refused commands, calculation reads, autosave, link publication,
normalization or provenance-notice changes.

## Capacity and transitions

Capacity is exactly 100 retained decisions, satisfying the required minimum. A frame contains the
exact pre-decision `BuildSnapshotV1` plus optional localized intent-summary identity; restoration uses
only the snapshot.

```text
successful changed edit:
  append current frame to past
  drop oldest while past.length > 100
  future = []
  current = committed candidate

undo:
  if past empty -> unchanged
  prepend current frame to future
  restore/remove newest past frame

redo:
  if future empty -> unchanged
  append current frame to past
  restore/remove first future frame
```

Undo followed by a new successful edit clears the entire future branch. Moving frames between past
and future does not increase the retained decision path beyond 100.

## Restoration

Undo/redo reconstructs a fresh `ShipLoadout` through feature 001's canonical snapshot adapter and
atomically replaces the active loadout. All package validation and calculations are then re-read.
Restoration must reproduce every modelled field, including original slot spelling, unresolved module
identity, variant identity, engineering, enabled/priority absence, name and ident.

An impossible reconstruction is a blocking internal/package error. Do not partially restore or skip a
field. The current build and tape remain unchanged.

## Reset

Clear `past` and `future` after every active-build replacement:

- stock build creation/hull replacement;
- working or named record open;
- URL build load;
- SLEF import;
- reload restoration.

Fixed-mount and quality normalization run on the detached incoming candidate before this reset and are
therefore never undoable. Editing a normalized mount later is an ordinary Commander decision.
That successful edit clears the mount's local fixed-normalisation provenance outside the tape; undo
restores only the modelled snapshot and does not recreate the disclosure.

## Boundary isolation

The following types/APIs accept no history value:

- local record and `BuildSnapshotV1` serializers;
- compact build-link codec;
- SLEF serializer;
- Angular Router/History API synchronization.

Autosave and fragment publication observe the restored active snapshot after undo/redo, just as after
a normal edit. They never serialize the checkpoint tape or intent summaries.

## UI state

Expose `canUndo`, `canRedo` and localized next-action summaries. Disable, do not hide, an unavailable
action where the design-system control remains present. State is textual/programmatic, not color
alone. Wide canvases show direct undo/redo actions; narrow canvases may place the same actions in the
accessible workspace action menu without reducing capability.

## Verification

- 101 successful decisions retain only decisions 2–101 and restore all 100.
- Undo/redo reproduces byte-equivalent canonical snapshots for every edit kind.
- Undo then new edit discards redo.
- No-op, refusal, cancel, search, viewing and normalization create no frame.
- Build replacement clears both directions.
- History cannot appear in local JSON, fragment, SLEF or browser navigation assertions.
