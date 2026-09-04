# Contract: saved loadouts in the shared record library

Feature 001 owns browser persistence, and
[`docs/persistence-and-links.md`](../../../docs/persistence-and-links.md) is its record. This
contract freezes what this feature adds to it and what it may not touch.

## One key space, two kinds of record

A loadout is stored under `ednb:record:<uuid>` — the same key space, the same prefix filter, the
same absence of an index. The envelope gains a discriminator:

```text
ednb.local-record v2
├── tool: "ship"       → hullSymbol, validation, build
└── tool: "equipment"  → suitFamily, loadout
```

Shared by both: `format`, `version`, `id`, `kind`, `revisionId`, `createdAt`, `modifiedAt`, `name`,
`note`, `sourceNamed`.

## Version 1 records

A version 1 record has no `tool` field, and its absence means `"ship"`. It migrates to version 2 on
**open** and never on enumeration, which is the existing rule: decode, migrate, reconstruct through
the package and re-serialise all succeed before the record's own key is replaced, and any failure
leaves the original bytes authoritative. A version this release does not know is listed as
unopenable with whatever metadata could be read without guessing, and left byte-for-byte alone
(FR-019).

## Enumeration reads the discriminator, not the payload

The library lists both kinds together, each row naming the tool that made it. A row's summary comes
from fields already in the envelope — for a loadout, its name, its `suitFamily` and its
modification count — so listing never reconstructs a loadout and never asks the package anything.

## What this feature may not do

- **No second key prefix.** A shared list assembled from two enumerations would need feature 001's
  retention, quota, lock and cross-tab rules implemented twice.
- **No index.** The reason is unchanged: an index is a second source of truth that can disagree
  with the records it lists.
- **No new removal path.** Exactly three things remove a record — a confirmed deletion, the manual
  save that consumes the unnamed record it saved from, and the seven-day expiry of an unnamed
  record. A loadout is subject to all three on the same terms as a build.
- **No calculated value in storage.** Stated figures, the material requirement and catalogue facts
  are recomputed on open. The record is assembled field by field, never by spread.
- **No change to autosave, tab ownership or the BroadcastChannel handshake.** A loadout is a
  record; those rules already cover records.

## Save, overwrite and open

- Saving under the name of an existing record asks whether to replace it or keep both, through the
  existing save-conflict service (FR-017). A loadout and a build may share a name: they are
  different rows, and the conflict question is asked per tool.
- Opening a loadout writes nothing. The first modelled edit forks an unnamed record carrying
  `sourceNamed`, exactly as a build does.
- A stored loadout this version cannot rebuild — an unknown suit family, weapon symbol or recipe —
  is reported as unopenable, and the stored record is left exactly as it was (FR-019). Nothing
  partial is opened, and the open loadout is not replaced.

## Held content survives

A saved loadout carries every mount the catalogue offers and every modification slot, held or
locked or neither, on the same terms as the link (FR-018a). Saving is never destructive of a
choice the Commander made.

## Offline

Saving, listing, opening and deleting are `localStorage` and Web Locks, and work with no network
after first load (FR-026). Nothing in this contract fetches anything.
