# Quickstart walk: Equipment Builder

Required by T078: walk [quickstart.md](../quickstart.md) against a running build and record any
divergence as a defect rather than as a documentation edit. Section 5 is T079's gate, so the two
together cover the document.

Walked 2026-09-03 against `b359e46` plus the uncommitted Phase 7 work, on the container this
repository builds in.

## Result by section

| Section                | Outcome | Note                                                                       |
| ---------------------- | ------- | -------------------------------------------------------------------------- |
| Prerequisites          | pass    | `@elite-dangerous-almanac/core` 0.2.9 installed                            |
| 1. The link table      | pass\*  | two commands as written do not run; the product is correct — findings 1, 2 |
| 2. Domain figures      | pass\*  | 25 files, 209 tests green once the command is corrected — finding 2        |
| 3. The bench, running  | pass\*  | every row walked; one row over-counted the attributes — finding 3          |
| 4. Keeping and sharing | pass    | all five rows walked                                                       |
| 6. Offline             | pass    | covered by T079's `pnpm run e2e:offline`, with the bench's own two tests   |

## Findings

### 1. `pnpm run codec:tables:equipment -- --overwrite` cannot pass the flag — corrected

**The document was wrong, not the product.** The script is a pair —

```
node scripts/generate-equipment-link-codec-tables.mjs && prettier --write …equipment-link-table-1.json
```

— and pnpm appends `-- --overwrite` to the **end** of that string, so the flag reaches prettier
rather than the generator:

```
Equipment codec table 1 written: 4 suits, 3 mounts, 11 weapons, 31 modifications (7e7b425b9eb8…).
[error] No files matching the pattern were found: "--overwrite".
```

The generator does take `--overwrite`; it just cannot be reached that way. The quickstart and
[contracts/equipment-loadout-link.md](../contracts/equipment-loadout-link.md) now name the generator
directly and let the script format after it. The regenerated table is byte-identical to the one in
the tree, and its content hash still matches the one pinned in
`src/app/domain/equipment/loadout-link/equipment-link-codec.spec.ts`.

### 2. `pnpm test -- --run <name>` is not this repository's unit runner — corrected

Sections 1 and 2 both used it. The `test` script is `ng test`, so `pnpm test --` inserts a second
`--` and `--run` is not an option of `@angular/build:unit-test` either way:

```
Option '--' has been specified multiple times. The value 'equipment-link-codec' will be used.
Error: Schema validation failed with the following errors:
  Data path "" must NOT have additional properties().
```

`pnpm exec ng test --include "<glob>"` is what runs a subset, and both sections now say so. Run that
way, section 1 is 24 tests green and section 2 is 209 across 25 files. A narrow run reports the
80% coverage floor as unmet — that measurement is over the whole suite, and the quickstart now says
so rather than leaving a reader to think the feature is under-covered.

### 3. Section 3 listed nine item-view figures where the package publishes eight — corrected

The row asked for "damage, rate of fire, magazine, reserve, range, damage per shot, headshot damage,
DPS and sustained DPS". `damage` and `damage per shot` are the same figure counted twice. What the
item view actually states for a weapon, read back off the page:

```
["Damage per shot","Rate of fire","Sustained DPS","Headshot damage","Magazine","Reserve ammo","Effective range","DPS"]
```

Eight, all of them the package's. The row now names those eight in that order.

## Section 3, row by row

| Row                          | Walked by                                                                                                                                                                                         | Outcome |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Dominator at grade 5         | three mounts in the ledger and four unlocked modification slots, read off the page                                                                                                                | pass    |
| A weapon on each mount       | `e2e/equipment-builder.spec.ts`, "fits a weapon on a mount and counts it in the firepower"                                                                                                        | pass    |
| Lower a weapon to grade 3    | same file, "a slot the grade no longer opens" — held, uncounted, and given back at grade 5                                                                                                        | pass    |
| Switch to the Maverick       | same file, "keeps the weapon, and says the mount is held rather than dropping it"                                                                                                                 | pass    |
| Switch back to the Dominator | same test, which returns to the suit that carries the mount and finds the weapon with its grade and modifications                                                                                 | pass    |
| Select the Flight Suit       | one grade only, and `This suit takes no modifications at any grade.` — read off the page                                                                                                          | pass    |
| Read the item view           | the eight figures above — see finding 3                                                                                                                                                           | pass\*  |
| Read the `SUIT TOOLS` rows   | Maverick `Energylink, Profile Analyser, Arc Cutter`; Artemis `…, Genetic Sampler`; Dominator and Flight Suit the two shared; the rule's count equal to the rows every time; no control among them | pass    |

## Section 4, row by row

| Row                               | Walked by                                                                                                  | Outcome |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------- |
| Save, reload, open from `/builds` | `e2e/equipment-library.spec.ts`, "saves it, finds it in the one library, and opens it back onto the bench" | pass    |
| Save again under the same name    | same file, "asks which version survives when a name is already taken (FR-017)"                             | pass    |
| Copy the link with a held weapon  | `e2e/equipment-link.spec.ts`, "keeps a weapon on a mount the worn suit does not offer (FR-018a)"           | pass    |
| Open an unreadable link           | same file, "says so where the Commander is, and leaves the bench as it was"                                | pass    |
| Export the readable summary       | read off the page: `Dominator Suit · G1` then one line per mount, named or `Empty mount`                   | pass    |

All 28 equipment tests pass on `chromium-desktop`; the ten-project matrix is T079's.
