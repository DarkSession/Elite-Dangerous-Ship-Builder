# Integration Ports Contract

Feature 005 owns the power semantics consumed by features 003, 007 and 010.
These ports expose owner projections, not alternate calculation APIs.

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
  readonly selectedDraw: number;
}

interface PowerStatusProvider extends StatusProvider<PowerStatusProjection, never> {}
```

The adapter:

1. calls/selects feature 005's power projection for the exact context;
2. returns selected state, exact `budget.available` and the exact selected package draw;
3. stamps `buildRevision` and `conditionsRevision`;
4. always returns
   `detailTarget: { kind: 'detail', capability: 'powerAndHeat' }`;
5. returns an empty `qualifiedSummaryIds`, because every figure `powerBudget()` returns is exact.

Zero capacity/draw remains an exact numeric summary. Retracted selection does
not create or require deployed-only summary fields. Feature 003 copies this
value unchanged.

An unexpected package/projection exception is allowed to propagate to feature
003's `projectionFailed` boundary. Package unavailable heat/distributor states
do not affect this power provider.

## Features 007 and 010 MountPowerObservationPort

```ts
interface MountPowerObservationRead {
  readonly buildRevision: number;
  readonly conditionsRevision: number;
  readonly slotKey: string;
  readonly deploymentState: 'deployed' | 'retracted';
  readonly observation: MountPowerObservation;
}

interface MountPowerObservationPort {
  observe(
    context: StatusRevisionContext,
    slotKey: string,
    deploymentState: 'deployed' | 'retracted',
  ): MountPowerObservationRead;
}
```

`slotKey` is any exact package slot key. Feature 010 observes hardpoint and
utility mounts and passes `context.conditions.hardpoints` as `deploymentState`;
feature 007 observes the power distributor's core slot and always passes
`deployed`, independently of the selected viewing state. The read repeats the
requested `deploymentState` so consumers can reject a mismatched observation.

The adapter uses the owner-private revision-keyed observation index projected
from the same `PowerBudget` call as the detail view. That index retains the exact
`PowerBudget.consumers` label and both verdicts from its matching returned band:

- absent consumer → `notApplicable`;
- disabled → `disabled`;
- requested retracted plus package `deployedOnly: true` →
  `inactiveRetracted`;
- otherwise the matching requested package band becomes `powered` or `shed`;
- the budget cannot answer for the requested key → `unavailable`.

Priority is the package-normalized one-based value.

Consumers own their own subject matter and pass an exact package slot key.
Feature 010 owns empty/fitted/engineering state and geometry; feature 007 owns
capacitor endurance. Neither reads raw `On`, `Priority`, modifiers or bands, and
neither infers a power cause from a capacitor or distributor value.

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
- Features 007 and 010 import only `MountPowerObservationPort` and observation
  types.
- Feature 007 additionally imports feature 002's type-only `HardpointCoverage`
  leaf; feature 002 owns and derives that value.
- Runtime instances are supplied through application composition/injection so
  no domain module forms a runtime circular dependency.

## Required verification

- Both ports receive and return the identical revision pair.
- Status selected draw and capacity exactly equal the detailed power projection.
- Exact hardpoint, utility and core-internal slot keys reach their corresponding
  consumer observations.
- A fixture whose matching band has different `poweredDeployed` and
  `poweredRetracted` verdicts proves the explicit requested state selects the
  correct boolean and is repeated on the read.
- Disabled, inactive, powered, shed and missing consumer states remain distinct.
- Feature 003, 007 and 010 tests prove they do not recalculate or reinterpret
  power; feature 007 specifically proves a selected retracted context still
  requests and receives the deployed distributor verdict.
