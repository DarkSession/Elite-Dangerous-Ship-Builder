# Assembly Requirements and Targeting Contract

## Ownership

Feature 009 owns the detailed cost/material snapshot and implements feature 003's
`AssemblyRequirementsPort` over that snapshot. Feature 003 may select compact fields and preserve
their semantic states; it cannot re-call package methods, add totals, reclassify a qualification or
collapse Merc Coin absence to zero.

Feature 002 owns fitted-module editing and exact-slot navigation. Feature 011 owns shared components,
locale state, formatting and accessibility infrastructure.

## Revision transaction

1. Capture feature 001's `{ loadout, buildRevision }` atomically.
2. Project all retail, Merc Coin, engineering-source and consolidated material records from that
   exact tuple.
3. Confirm the active build revision still matches.
4. Publish one complete snapshot, or discard it as stale.
5. Adapt feature 003 summary and detailed presentation from that same snapshot.

Locale changes only rebuild presentation. Viewing conditions from feature 003 do not affect this
capability. A current-context pending/error state may replace stale figures; old values cannot receive
the new revision stamp.

## Targets

```text
CostMaterialsTarget =
  | { kind: 'detail'; capability: 'costAndMaterials' }
  | { kind: 'slot'; slotKey: string }
  | { kind: 'materialTrace'; materialSymbol: string }
```

- `slot` targets exist only from exact package slot keys on unpriced, Mercenary or engineering-source
  records and are dispatched to feature 002.
- `detail` opens/reveals the full build-workspace capability without adding a route or fragment.
- `materialTrace` expands a presentation disclosure and performs no build mutation/navigation.
- No target is inferred from list position, module/material name, symbol-only search or message text.

Target/disclosure selection is memory-only. It is excluded from active build snapshots, undo/redo,
local storage, links, URLs and SLEF.

## Summary contract

The feature 003 adapter may expose:

- hull/modules/rebuy semantic values and unpriced count/targets;
- Merc Coin `absent` or present total with its lower-bound evidence;
- materials `none`, complete count/list summary, incomplete evidence or unavailable;
- one detail target and exact actionable records.

It may not calculate a combined credit total, total material units, blueprint count, currency
comparison or readiness judgment.

## Announcements and failure

After a matching revision settles, compare the prior announced semantic summary with the new one and
coalesce rapid changes into one polite localized announcement. Initial content, unchanged results and
discarded stale work are silent. A projection error uses feature 011's prompt error treatment without
destroying the active build or presenting stale figures as current.

## Verification

Contract tests prove the same snapshot/revision reaches detail and summary, stale work is discarded,
locale-only changes do not reproject, all targets retain exact identities, and no storage/URL/export
boundary includes derived or disclosure state.
