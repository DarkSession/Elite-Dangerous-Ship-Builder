# Slot Targeting and Integration Contract

## Shared slot identity

Feature 010 owns no editor selection. It consumes feature 002's generic exact slot selection and
emits the same intent used by the complete ledger:

```ts
interface OpenSlotIntent {
  readonly kind: 'openSlot';
  readonly slotKey: string;
  readonly source: 'anatomyGeometry' | 'anatomyList';
}
```

Feature 002 validates/opens the exact package slot, selects the appropriate ledger category/row and
opens its existing narrow exact-slot surface. Feature 010 never calls `ShipLoadout` mutation methods.

## Geometry and list activation

Activating a valid hardpoint or utility occurrence, or its unique text item, emits one
`OpenSlotIntent`. The intent uses only the canonical item key. SVG ids, element order, module
identity, node labels and coordinates never form a target.

If feature 002 refuses a stale/missing key, anatomy refreshes from the current revision and presents
the owner-localized failure. It never redirects to a similarly named slot.

## Ledger-to-anatomy reveal

When feature 002 selects a hardpoint or utility that has a known occurrence:

- wide composition identifies every top/bottom occurrence;
- narrow composition keeps the current side when it contains the slot;
- otherwise narrow composition chooses top, then bottom;
- the nearest rendered occurrence uses native `scrollIntoView`; and
- selected facts and the unique text item reference the same selected key.

If the selected slot is pending, temporarily unavailable or defective, keep the current side and
state that location cannot currently be revealed. If an internal/unlocated slot is selected, no
geometry is falsely selected; the complete ledger/editor remains active.

Side choice and internal scroll position are memory-only. They do not enter build state, storage,
history, URL, SLEF or undo/redo.

## Generalized mount-power observation

Feature 005 must replace its hardpoint-only contribution with a generic located-mount boundary:

```ts
interface MountPowerObservationRead {
  readonly buildRevision: number;
  readonly conditionsRevision: number;
  readonly slotKey: string;
  readonly observation: MountPowerObservation;
}

interface MountPowerObservationPort {
  observe(context: StatusRevisionContext, slotKey: string): MountPowerObservationRead;
}
```

The owner accepts exact hardpoint and utility keys, derives state from one
`ShipLoadout.powerBudget()` consumer/band result and returns normalized priority plus current state.
Feature 010 requires exact revision equality and copies the observation unchanged. It does not
inspect raw fitted `on`/`priority`, consumers, bands, modifiers or module families.

This generalization is a blocking feature 005 contract update. Almanac 0.1.2 already supplies
utility consumers; no local fallback or upstream fix is required.

## Complete-ledger fallback

Feature 002's complete slot ledger remains mounted and usable while:

- either/both schematics load or fail;
- a document is rejected as unsafe/invalid;
- an annotation key is unknown, wrong-kind or duplicated;
- package geometry is missing; or
- anatomy projection reports an unexpected failure.

Every core, optional, armour, cargo-hatch and unlocated/defective slot remains available only through
the ledger. Feature 010 never invents geometry for it.

## Provenance and package defects

The anatomy heading exposes a contextual intent to feature 012's accepted in-place modal:

```ts
interface OpenAnatomyProvenanceIntent {
  readonly kind: 'openHelpModal';
  readonly context: 'packageArtworkAndData';
}
```

It does not hard-code a `/help` route. The modal remains build-independent and preserves the current
capability. Any package-defect issue-tracker navigation remains owned by feature 012, is deliberate,
is labelled as leaving the app and contains no build/hull/slot/module/storage data.

## Accessibility and feedback

- SVG occurrences expose localized mount name, kind, selected state and complete current state;
  each relates to the selected facts when selected.
- The unique HTML list uses native semantic controls with independent 44 CSS-pixel targets.
- Geometry and list activation produce one coalesced selected-slot announcement for the matching
  revision; repeated occurrences do not announce twice.
- Side failure/recovery and package defects use visible localized status plus one revision-keyed
  announcement. Initial/unchanged state is silent.
- Nothing essential depends on hover, smooth motion, custom drag or geometry alone.

## Verification

Contract and E2E tests cover geometry-to-ledger and ledger-to-geometry movement for both mount kinds,
cross-side repeats, narrow deterministic reveal, internal/unlocated selection, stale-key refusal,
fragment/storage stability, missing-art fallback, generalized power observations and in-place modal
provenance without data-bearing external URLs.
