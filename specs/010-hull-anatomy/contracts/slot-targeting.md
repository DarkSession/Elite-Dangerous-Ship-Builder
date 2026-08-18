# Anatomy and Outfitting Slot-Targeting Contract

## Shared identity

Feature 002's `selectedSlotKey` is the only selected/focused slot state. Feature 010 neither persists
a second focus nor uses DOM focus as build identity. Comparison is case-insensitive for package/
journal interoperability; every emitted value is the canonical package key.

## UI intents

```ts
openSlot(slotKey: string): void;
selectAnatomySide(side: 'top' | 'bottom'): void;
retrySchematic(side: 'top' | 'bottom'): void;
openArtworkProvenance(): void;
reportPackageDefect(): void;
```

- `openSlot` accepts only a current `HardpointItem.slotKey`, delegates to feature 002 and reaches its
  existing inline selected detail or narrow selected-slot layer in one interaction.
- `selectAnatomySide` changes responsive presentation only; it never changes build, selection,
  history, storage or URL.
- `retrySchematic` delegates to the asset coordinator without changing slot state.
- `openArtworkProvenance` uses feature 012's same-origin help/legal target.
- `reportPackageDefect` uses feature 012's deliberate external navigation, visibly leaves the app
  and carries no hull, slot, module or build data in the URL.

## Outfitting-to-anatomy reveal

When feature 002 selects a slot:

1. find the canonical anatomy item for the selected hardpoint key;
2. if it has no ready occurrence, preserve feature 002/text selection and make no geometry claim;
3. if the current visible side contains it, retain that side;
4. otherwise choose top if it contains it, else bottom;
5. mark every occurrence of the key selected;
6. when the chosen side is rendered, call its occurrence's `scrollIntoView` with nearest alignment;
7. use non-smooth behavior when reduced motion is requested.

No `getBBox`, centre/coordinate calculation, pan matrix or stored scroll position identifies the
slot. Wide composition reveals both sides and scrolls the containing side nearest without hiding the
other occurrence.

## Anatomy-to-outfitting activation

Both a geometry occurrence and its unique text item invoke the same `openSlot` intent. The renderer
does not accept element id, occurrence ordinal, side index or visible label as a target. Duplicate
instances therefore reach the same selected slot and selected detail.

The complete feature 002 ledger remains the route to:

- every unlocated utility/internal/fixed slot;
- every slot while both assets are unavailable;
- every nearby hardpoint through an independent 44-pixel text control;
- all module editing operations.

## Responsive behavior

- Wide layouts present both sides where space allows and the complete unique text equivalent.
- Narrow layouts and 400% zoom present a labelled side selector, one bounded schematic container and
  the same unique text equivalent.
- Panning is native scrolling inside the container with visible affordance; the document does not
  scroll horizontally.
- Geometry interaction clones use exact package paths/circles and the shared non-scaling 44-pixel
  hit-width token. They do not move or measure source geometry.
- Target overlap never removes the independent canonical list control.

## Announcements

- Initial asset and selection state is not redundantly announced.
- A settled slot selection announces the localized slot/module and visible side once through the
  shared polite region.
- A side failure/recovery announces only that side and does not re-announce the slot ledger.
- A package schema failure uses shared alert behavior once and offers the fixed report action.
- Power/build changes coalesce into one settled summary and never announce every geometry instance.

## Verification

- Every current geometry occurrence emits its canonical key and reaches the matching feature 002
  slot in one interaction.
- Selecting each located feature 002 slot reveals a containing side deterministically.
- Both duplicate occurrences synchronize and reach one slot.
- Utility and unlocated slots remain reachable only through the complete ledger.
- Missing/malformed/offline assets leave slot inspection/editing unchanged.
- Provenance and issue navigation carry no build data and are named as same-origin/external
  respectively.
