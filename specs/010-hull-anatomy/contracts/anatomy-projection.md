# Anatomy Projection Contract

## Boundary

The pure projector receives one captured revision context:

```ts
interface AnatomyProjectionInput {
  loadout: ShipLoadout;
  hullSymbol: string;
  buildRevision: number;
  conditionsRevision: number;
  hardpointState: 'deployed' | 'retracted';
  selectedSlotKey: string | null;
  top: SideState;
  bottom: SideState;
  power: HardpointPowerObservationPort;
}
```

It returns one immutable `AnatomySnapshot`. Components never query the package or retain fitted state.
The snapshot publishes only while both revision values and the hull remain current.

## Unique hardpoint collection

1. Read `loadout.slots('hardpoint')` once in returned order.
2. Emit one `HardpointItem` for every returned package hardpoint immediately.
3. Build valid occurrence membership from ready side documents by canonical slot key.
4. Attach every occurrence to that one item; never copy fitted/engineering/power state to an
   occurrence-owned model.
5. Derive each item's location as pending, located, temporarily unavailable or package defect without
   removing its text item.
6. A valid side with zero hardpoint occurrences is an available empty view, not an asset failure.

The current 0.1.1 cross-side fixtures are mandatory regression cases:

- `Federation_Corvette`: `MediumHardpoint1`, `MediumHardpoint2`;
- `MediumTransport01`: `MediumHardpoint1` through `MediumHardpoint4`.

Each must appear once in the text collection and twice in geometry with identical state.

## Slot and module facts

For every unique item:

- `slotKey`, kind, size and empty/fitted state come only from the package slot;
- module `symbol` and engineering presence come only from its package module view;
- localized name comes from the Almanac module-name helper for the active locale;
- a missing localized name uses the package canonical fallback plus feature 011's untranslated
  disclosure;
- an unresolved article keeps symbol and unavailable members;
- exact empty and unavailable are distinct.

The projector never parses key spelling, module symbol or raw modifiers to recover a fact.

## Engineering state

`engineering` is `engineered` only when the package fitted-module view carries engineering. It is
`stock` only for a resolved fitted article with no engineering block. If fitted identity/state is
unavailable, engineering is unavailable. The UI may name package blueprint/effect fields in selected
detail through existing feature 002 projections, but anatomy does not create a second engineering
projection.

## Current power state

Feature 010 consumes a feature 005 port for the same slot/revision/conditions. It must be able to
distinguish:

- empty/not applicable;
- disabled;
- inactive while hardpoints are retracted;
- powered;
- priority-shed;
- qualified/unavailable.

Priority is package-effective one-based `1..5` or unavailable. No observation is accepted when its
revision pair differs from the anatomy input. Pending or mismatched power is unavailable rather than
stale.

This boundary consumes Almanac 0.1.1's released #299 result through feature 005's adapter.
Anatomy does not read raw `on`/`priority`, effective-stat joins or aggregate bands as a substitute.

## State application

Every occurrence renders from its referenced item:

- fitted versus empty;
- engineered versus stock/unavailable;
- selected versus unselected;
- current power state and qualification.

All states have adjacent or associated text. CSS classes/data attributes are presentation outputs;
they are never read back to decide state. Color, fill, dash and halo may supplement text but never
carry meaning alone.

## Failures and defects

- One unavailable side contributes no occurrences, but every package hardpoint remains in the
  package-ordered list with qualified location state.
- An unknown/wrong-kind or contract-invalid duplicate annotation contributes a defect and no
  occurrence; valid repeated geometry always shares one item.
- An unexpected projector failure publishes the shared error state with no stale prior hull.
- The complete feature 002 slot ledger is never filtered by anatomy coverage or asset state.

## Required unit assertions

- Exact canonical slot keys survive case differences in package-authored annotations.
- Utilities are excluded by feature plus resolved kind, never key prefix.
- Unique item order equals package hardpoint order under permuted SVG traversal.
- Duplicate geometry reads one fitted/engineering/selected/power object.
- Empty, unresolved, engineered, disabled, inactive, powered, shed and qualified states remain
  distinct.
- Missing module names, priority and power are unavailable, never zero/default.
- Stale build/condition/asset results do not publish.
