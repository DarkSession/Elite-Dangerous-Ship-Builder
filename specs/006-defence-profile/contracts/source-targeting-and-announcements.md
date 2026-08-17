# Source Targeting and Announcements Contract

## Source boundary

The source projector reads only resolved `LoadoutSlot`/`FittedModule` snapshots from the same active
build revision as the metrics. It classifies a source through package-declared fixed slots,
capabilities and resolved stat fields. It never parses module symbols, display names, array positions
or engineering modifiers.

Allowed roles are:

- shield generator;
- shield booster;
- shield reinforcement;
- fitted bulkhead;
- hull reinforcement;
- module reinforcement.

Unresolved modules are not guessed into a role. Cell banks are supplied separately by
`cellBanks().banks` and use those returned identities.

## Aggregate boundary

Metric contributions stay in the owning shield/armour aggregate:

- shield `generator`, `boosters`, `reinforcement`;
- armour `bulkheads`, `reinforcement`, `moduleArmour`, `moduleProtection`.

A source entry receives no share, percentage or inferred contribution from these aggregates. It may
show package-owned module identity, size/rating, directly observed enabled state and qualified power
context. Per-bank reinforcement is allowed only because `CellBankMetrics` returns it.

## Exact-slot intent

```ts
type DefenceIntent = { kind: 'openSlot'; slotKey: string };
```

Rules:

1. `slotKey` is copied from the package snapshot/result in the build's own spelling.
2. Feature 002 receives the exact key and reveals/selects that slot in one interaction.
3. The intent changes no build metric, viewing condition, persistence or edit history.
4. Duplicate symbols remain independent actions.
5. A missing/unresolved slot identity creates no guessed target.

## Ordering

Source manifests preserve package/fitted order within their semantic groups. Presentation may group
by the stable role sequence above, using source ordinal as the tie break. It may not rank sources by
an inferred contribution.

## Announcements

- A settled build/pip revision emits at most one concise localized summary of material availability,
  power or total changes.
- Missing, disabled, shed and indeterminate generator transitions are distinguished when the
  package/build state authorizes them.
- A change from no banks to fitted banks, or from fitted to all-unpowered, is announced as the
  matching semantic state rather than only a zero total.
- Opening a source delegates to feature 002's slot-selection announcement and is not duplicated.
- A blocking projection failure uses the shared alert behavior once.
- Unchanged tables and source lists are not reread after a pip-only update.

## Accessibility and localization

- Every source action includes localized role/module/slot context in its accessible name.
- Enabled/power context is text and programmatic state; icon/color never carries it alone.
- Package game names use Almanac localization/canonical fallback. Application role/state/intent text
  uses message keys.
- Actions use the shared touch-target token and work by pointer and touch with no hover dependency.

## Required verification

- Every recognized fitted source appears exactly once with exact slot and symbol.
- Unknown modules are not classified through name/symbol parsing.
- No aggregate field is divided or attached to a source.
- Duplicate modules keep independent slot actions.
- Wide, narrow and zoomed presentations dispatch the same exact key.
- Rapid revisions never target a source from the prior build.
- Announcements are coalesced, localized and state-specific.
