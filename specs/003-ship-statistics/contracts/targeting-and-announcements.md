# Targeting, Announcements and Provenance Contract

## Exact targets

```ts
type WorkspaceTarget =
  | { kind: 'slot'; slotKey: string }
  | {
      kind: 'detail';
      capability: 'power' | 'defence' | 'offence' | 'mobility' | 'cost';
      anchor: string;
    }
  | null;
```

- A validation issue receives a slot target only from `issue.slot`.
- Symbol, message, params, constraint, array position and visual grouping never infer a target.
- Headline and assembly targets come from their owning feature 005–009 port.
- A diagnostic without a target remains complete and readable but is not rendered as an action.
- One activation selects/reveals the exact slot in the wide ledger or opens that exact slot's narrow
  outfitting surface.
- One activation selects the detailed owning capability and anchor. This is in-memory workspace
  state; the `/build` fragment remains reserved for `b.…` build payloads.

## Settled count announcements

The visible status surface is not a live region. `StatusAnnouncementCoordinator` observes only
published settled snapshots.

1. On initial content, record the counts and announce nothing.
2. Compare `{ issueCount, qualificationCount }` with the last announced settled pair.
3. If either count changes, coalesce rapid changes and enqueue one polite localized message containing
   both current counts.
4. Replace/discard pending messages when a newer revision settles before announcement.
5. Never announce unchanged figures, each diagnostic separately or a stale snapshot.

Count one qualified/incomplete summary result once, not every explanation or nested package issue.
No recognized Mercenary article is absence, not a qualification. Ordinary validation/calculation
issues do not use `role="alert"`; alert is reserved for a genuine application-blocking failure.

Issue kind and severity remain visible localized text. Colour, border, icon, shape and position may
reinforce but never carry them alone.

## Fixed-mount normalisation provenance

Feature 001 `LocalRecordV1.fixedMountNormalisation` stores readonly entries containing exact slot,
original identity/absence, replacement identity and a display-only ISO instant. It is local workflow
metadata, not a package issue or modelled build value.

Lifecycle:

1. Feature 002 creates an entry during successful ingress normalisation before the candidate becomes
   active.
2. The tab working record autosaves it with the matching build revision.
3. Explicit save and duplicate copy the entries to the new named record.
4. Opening a named record copies its entries into the tab working record; later working edits do not
   mutate the named source until explicit save.
5. A successful Commander-authored edit to the exact mount clears that entry. Fit/replace/remove,
   engineering, enabled-state and priority edits all count.
6. Refused, stale, cancelled or no-op commands, search, selection and viewing-condition changes do
   not clear it.
7. Undo/redo operates on `BuildSnapshotV1` only and never recreates cleared provenance.
8. Active-record replacement loads only the incoming record metadata. Deleting the record discards
   its entries.
9. Link/SLEF ingress carries no provenance but may create new entries if the incoming candidate
   itself requires package-backed normalisation.

The status surface lists provenance after package issues in a separate named region. Each entry may
target only its stored exact slot key. It is never counted as a package validation issue.

## Serialization boundary

Local persistence includes `fixedMountNormalisation` through an explicit record allowlist.
`BuildSnapshotV1`, history frames, link codecs and SLEF adapters have no field for it and cannot accept
the type. Save/open/duplicate tests compare record metadata separately from the modelled snapshot.

## Verification

Tests cover targeted and untargeted diagnostics, every headline/detail mapping, wide/narrow one-action
navigation, coalesced count changes, initial/unchanged/stale silence, textual kind/severity, and the
complete provenance create/copy/save/clear/undo/replacement/delete/export lifecycle.
