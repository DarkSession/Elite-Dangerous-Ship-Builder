# Status Integration Contract

## Ownership and staging

Feature 003 first exports the generic `StatusRevisionContext`, `ViewingConditions`,
`StatusProvider<T, I>`, summary-ID and workspace-target contracts. Feature 008 then exports its
concrete mobility projection/provider. Feature 003 may assemble its final provider bundle only after
that owner contract exists.

Feature 008 does not wait for feature 003's final Status UI and feature 003 does not interpret raw
Almanac mobility/jump/mass results.

## Provider shape

```ts
interface MobilityStatusProjection {
  readonly selectedLoad: ViewingConditions['load'];
  readonly jumpRange: SemanticNumber;
  readonly topSpeed: SemanticNumber;
  readonly unladenMass: SemanticNumber;
}

interface MobilityStatusProvider extends StatusProvider<
  MobilityStatusProjection,
  'jumpRange' | 'topSpeed' | 'unladenMass'
> {}
```

The provider is synchronous over the exact context passed by feature 003. It invokes the shared pure
feature 008 projector with that context; it never reads an independently settled store.

## Exact summary mapping

| Status field  | Owner source                                                                         |
| ------------- | ------------------------------------------------------------------------------------ |
| selected jump | `maximumJump -> summary.max`, `unladen -> summary.unladen`, `laden -> summary.laden` |
| top speed     | selected-load/ENG `mobilityMetricsResult().value.speed`                              |
| unladen mass  | exact `unladenMassResult.value`, independent of selected load                        |

Each field retains feature 008's ready/unavailable semantic state and exact package issues. Feature
003 may format/place it but may not reclassify it.

## Envelope and qualifications

A successful provider read:

- stamps the input `buildRevision` and `conditionsRevision` unchanged;
- returns detail target `{ kind: 'detail', capability: 'mobilityAndJump' }`;
- includes `jumpRange` exactly once when the selected jump is unavailable;
- includes `topSpeed` exactly once when selected mobility is blocked/incomplete;
- includes `unladenMass` exactly once when that aggregate is incomplete; and
- excludes every ready field, including numeric zero, from `qualifiedSummaryIds`.

Nested issues never add extra identities. The provider returns a ready envelope for package
incomplete/unavailable values; those are owner-authored semantic values, not pending work. An
unexpected projector throw propagates to feature 003's `projectionFailed` path.

## Viewing-condition and workspace boundaries

- Feature 008 receives `load` and ENG half-pips from the context and never owns/edit/persists them.
- The Drives & Mass capability shows read-only selected load and ENG context. Apply/Reset controls
  remain solely in feature 003's complete Status capability.
- A module-mass action emits feature 003's shared `{ kind: 'slot', slotKey }` target using the exact
  package key; feature 002 owns the resulting reveal/edit behavior.
- Feature 008 owns no route or free-form fragment/anchor.

## Verification

Contract tests prove exact revision stamps, exact three-field mappings, selected-load behavior,
ready-zero behavior, one qualification ID per unavailable field, fixed detail target, exact-slot
intent and unexpected-error propagation. A test also proves the provider reads the passed context,
not a store snapshot from another revision.
