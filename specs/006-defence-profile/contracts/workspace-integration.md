# Workspace, Status and Slot Integration Contract

## Ownership

- Feature 001 supplies one active `{ loadout, buildRevision }` and `/build` workspace.
- Feature 003 supplies `StatusRevisionContext`, settled viewing conditions, capability selection,
  provider lifecycle and the shared `WorkspaceTarget` union.
- Feature 006 produces `DefenceProjection`, the area-owned Status value and presentation intents.
- Feature 002 consumes exact-slot targets and owns reveal/edit behavior.
- Feature 011 supplies shared components, tokens, localization, game-text presentation,
  announcements, previews and accessibility verification.

There is no feature-006 route, active-build store, condition store, slot-selection store or persisted
field.

## Revision projection

One provider read captures the feature 003 context, projects the complete Defence value and returns
only under the same build/condition revision. A newer requested revision invalidates the prior
payload; it is never displayed with a new condition label.

Package-unavailable shield/recovery results remain inside a ready provider payload. Only an
unexpected thrown call, failed exact hull invariant or application projection failure uses feature
003's `failure` envelope.

## Status provider

Feature 006 exports the area-owned provider result:

```ts
interface DefenceStatusProjection {
  readonly shieldStrength:
    | { kind: 'ready'; value: number }
    | { kind: 'unavailable'; issues: readonly CalculationIssueView[] };
  readonly armour: { kind: 'ready'; value: number };
  readonly detailTarget: { kind: 'detail'; capability: 'defenceProfile' };
  readonly qualifiedSummaryIds: readonly 'shieldStrength'[];
}
```

The enclosing feature 003 `StatusProvider` adds exact revisions and lifecycle. Feature 006 owns all
value semantics; feature 003 does not call its package methods or reinterpret issues.
The detail target selects the complete Defence capability in one activation.

## Fitted role boundary

Allowed role records are shield generator, shield booster, shield reinforcement, actual bulkhead,
hull reinforcement and module reinforcement. They are derived only from the package armour slot or a
resolved package engineering group.

- Records retain exact package slot and `symbol` identities.
- They carry only directly observed fitted/enabled state.
- They never carry an apportioned contribution, inferred resistance share or local power verdict.
- They are described as fitted role records, not authoritative facade-input provenance.
- Only package-resolved role records are classified. Unavailable role/stat data is not recovered from
  symbol, display name, slot position or modifiers, and only package-resolved identities are accepted.
- Cell banks are not duplicated; their returned entries already own exact slot actions.

## Slot intent

```ts
type DefenceSlotIntent = { kind: 'slot'; slotKey: string };
```

The key comes only from `LoadoutSlot.key`, `FittedModule.slot`, `CellBankMetrics.slot` or an exact
`CalculationIssue.slot`. Feature 002 reveals/selects that slot in one interaction. Wide layouts use
the inline ledger/editor; narrow layouts use the existing selected-slot layer and retain return
context. The intent changes no build, conditions, revision, persistence, history, URL or SLEF.

## Announcements

- A settled build/condition revision emits at most one concise localized summary of changed defence
  availability, totals or qualifications.
- Missing, unresolved, disabled, shed and invalid issue reasons remain package-authored calculation
  distinctions; `unresolved` never means an unknown fitted identity is retained.
- No-banks, fitted banks and all-unpowered banks use distinct messages.
- Opening a slot delegates to feature 002's selection announcement and is not announced twice.
- A provider projection failure uses feature 011's assertive blocking-error channel once.
- Initial, unchanged, stale and unaffected rows are silent.

## Verification

- Provider payload and Status summary carry identical captured revisions.
- Shield/armour Status fields equal the Defence projection, and the detail target is exactly
  `defenceProfile`.
- An unavailable shield strength exports the `shieldStrength` identity once; a ready value exports none.
- Every role, bank and issue action sends the original exact slot key at wide/narrow layouts.
- Duplicate symbols in different slots never target one another.
- Rapid edits/condition changes never publish or target a stale source.
- Capability/slot selection changes no route fragment or build serialization.
- Announcements are coalesced, localized and state-specific.
