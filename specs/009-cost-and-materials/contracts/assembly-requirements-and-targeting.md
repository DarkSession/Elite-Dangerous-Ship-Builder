# Assembly Requirements and Targeting Contract

## Ownership

Feature 009 owns the committed whole-build cost/material snapshot and implements feature 003's
planned `AssemblyRequirementsPort` with that exact projection type. Feature 003 may select compact
fields and preserve their semantic states; it may not re-call price/material functions, add totals,
reclassify evidence or turn Mercenary absence into zero.

Feature 002 owns editor drafts, the shared cost classifier and exact-slot navigation. No feature owns
or presents historical purchase provenance. Feature 011 owns shared components, locale/formatting,
announcements and accessibility infrastructure.

## Revision transaction

1. Capture feature 001's `{ loadout, buildRevision }` atomically.
2. Project retail, fitted recognition, engineering sources and consolidated material rows from that
   captured loadout.
3. Cache/publish the immutable result under that exact revision.
4. Return it only for a matching feature-003 requested context; a mismatched result is never
   restamped or shown as current.
5. Build detail and Assembly Requirements summary from the same snapshot.

The package projection is synchronous. Locale-only changes rebuild presentation, not domain
quantities. Feature 003 viewing conditions do not affect this capability. If the owning integration
boundary exposes pending/failure, stale figures are replaced rather than labelled with the requested
revision.

## Targets

```text
CostMaterialsTarget =
  | { kind: 'detail'; capability: 'costAndMaterials' }
  | { kind: 'slot'; slotKey: string }
  | { kind: 'materialTrace'; materialSymbol: string }
```

- `slot` exists only from an exact package key on unpriced, Mercenary or engineering-source
  records and dispatches to feature 002.
- `detail` reveals the complete build-workspace capability; it adds no route or URL fragment.
- `materialTrace` expands/collapses local presentation evidence and mutates no build.
- No target is inferred from list position, localized text or approximate identity.

Target/disclosure state is memory-only and excluded from build state, edit history, storage, links,
URLs and SLEF.

## Assembly Requirements summary

The adapter may expose:

- retail hull/modules/rebuy semantic values plus unpriced evidence count/targets;
- Mercenary `absent` or present package total with lower-bound evidence;
- materials `none`, complete, incomplete or failure state plus detail target;
- qualified summary ids exactly from feature 003's accepted
  `retailCredits | mercCoin | materials` vocabulary.

It may not expose a combined credit total, total material units, blueprint count, exchange/comparison
or readiness judgement. `mercCoin` is omitted from qualified ids while the owner state is absent.

## Contextual editor integration

Canvas 1c/1d places current-selection recipe facts near the Engineer action. Feature 002 presents that
draft/selection view through the same shared package-cost boundary, while feature 009 reads only the
committed active build. An uncommitted draft never changes the whole-build snapshot, Status summary,
storage or URL.

## Announcements and failure

After a matching revision settles, compare the prior announced semantic summary and use feature 011
to coalesce meaningful qualification/requirement changes into one polite localized announcement.
Initial content, unchanged results, locale-only representation and discarded stale work are silent.
A projection failure uses one prompt error treatment and leaves the active build intact.

## Verification

Contract tests prove one shared snapshot/revision reaches detail and summary, mismatched contexts
cannot publish, locale-only changes do not reproject, editor drafts do not alter committed totals,
targets retain exact identities, summary ids follow owner states, and no derived/disclosure value
crosses a storage, URL or export boundary.
