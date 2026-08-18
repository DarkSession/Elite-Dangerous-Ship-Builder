# Integration Ports Contract

Feature 005 owns the power semantics consumed by features 003 and 010. These
ports expose owner projections, not alternate calculation APIs.

## Shared revision context

Both ports consume feature 003's exact context:

```ts
interface StatusRevisionContext {
  readonly loadout: ShipLoadout;
  readonly buildRevision: number;
  readonly conditions: ViewingConditions;
  readonly conditionsRevision: number;
}
```

Every ready result repeats the same revision pair. Consumers reject stale or
mismatched results rather than relabel them.

## Feature 003 PowerStatusProvider

```ts
interface PowerStatusProjection {
  readonly hardpointState: 'deployed' | 'retracted';
  readonly available: number;
  readonly selectedDraw: QualifiedValue<number>;
}

interface PowerStatusProvider extends StatusProvider<PowerStatusProjection, 'power'> {}
```

The adapter:

1. calls/selects feature 005's power projection for the exact context;
2. returns selected state, exact `budget.available` and exact selected package
   draw plus owner qualification;
3. stamps `buildRevision` and `conditionsRevision`;
4. always returns
   `detailTarget: { kind: 'detail', capability: 'powerAndHeat' }`;
5. returns `qualifiedSummaryIds: ['power']` exactly when enabled package
   unknown draws make the selected total a lower bound; otherwise `[]`.

Zero capacity/draw remains an exact numeric summary. Retracted selection does
not create or require deployed-only summary fields. Feature 003 copies this
value and qualification unchanged.

An unexpected package/projection exception is allowed to propagate to feature
003's `projectionFailed` boundary. Package unavailable heat/distributor states
do not affect this power provider.

## Feature 010 HardpointPowerObservationPort

```ts
interface HardpointPowerObservationRead {
  readonly buildRevision: number;
  readonly conditionsRevision: number;
  readonly slotKey: string;
  readonly observation: HardpointPowerObservation;
}

interface HardpointPowerObservationPort {
  observe(context: StatusRevisionContext, slotKey: string): HardpointPowerObservationRead;
}
```

The adapter uses the exact `PowerBudget.consumers` label and matching returned
band:

- absent consumer → `notApplicable`;
- disabled → `disabled`;
- selected retracted plus package `deployedOnly: true` →
  `inactiveRetracted`;
- null draw/deployment or missing band → `qualified`;
- enabled unknown draw → `qualified: unknownDraw`;
- another enabled unknown anywhere in the budget means an otherwise active
  band's verdict is `qualified: knownDrawsOnlyVerdict`;
- only a complete matching selected package band becomes `powered` or
  `shed`.

Priority is the package-normalized one-based value when valid; otherwise it is
unavailable. A qualified observation never carries a plausible powered/shed
verdict.

Feature 010 owns empty/fitted/engineering state and geometry. It passes an exact
package slot and renders this observation; it does not read raw `On`,
`Priority`, modifiers or bands.

## Identity rules

- Consumer `label` is the returned game slot identity and is preserved.
- Consumer `symbol` remains the returned package module identity.
- No array index, module name, symbol prefix, display string or SVG annotation
  becomes a power identity.
- Missing `ShipLoadout` labels/symbols are package regressions and cause
  projection failure; no local target is inferred.

## Dependency direction

- Feature 005 imports feature 003 provider/context contracts through type-only
  domain leaves.
- Feature 003's final provider bundle imports only feature 005's exported
  `PowerStatusProjection`/provider type, not components or internal
  projectors.
- Feature 010 imports only `HardpointPowerObservationPort` and observation
  types.
- Runtime instances are supplied through application composition/injection so
  no domain module forms a runtime circular dependency.

## Required verification

- Both ports receive and return the identical revision pair.
- Status selected draw/capacity/qualification exactly equal the detailed power
  projection.
- Status qualification identity is present once only when owner-qualified.
- Every exact hardpoint slot reaches the corresponding consumer observation.
- Disabled, inactive, powered, shed, unknown draw, unknown deployment,
  known-draw-only and missing consumer states remain distinct.
- Feature 003/010 tests prove they do not recalculate or reinterpret power.
