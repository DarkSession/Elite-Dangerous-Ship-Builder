# Quickstart: Equipment Builder

Runnable checks that prove the feature works, in the order they become possible. Every command runs
from the repository root.

## Prerequisites

```bash
pnpm install --frozen-lockfile
```

The installed `@elite-dangerous-almanac/core` must be 0.2.9 or later — the release that publishes
the `equipment/` namespace, the three i18n leaves and `Suit.mounts`.

## 1. The link table and codec

The format change of [contracts/equipment-loadout-link.md](./contracts/equipment-loadout-link.md)
lands here first, because everything that saves or shares a loadout stands on it.

```bash
# `pnpm run … -- --overwrite` appends the flag to the prettier call, not to the
# generator; invoke the generator directly and let the script format after it.
node scripts/generate-equipment-link-codec-tables.mjs --overwrite
pnpm run codec:tables:equipment
pnpm exec ng test --include "**/equipment-link-codec.spec.ts"
```

Expected: the table gains `MOUNT_SLOTS`, the pinned content hash in the spec matches the
regenerated file, and a loadout holding a weapon on a mount the selected suit does not offer
encodes and decodes unchanged. A rifle on `secondary1` is still refused.

## 2. Domain figures, exhaustively

```bash
pnpm exec ng test --include "**/equipment/**/*.spec.ts"
```

A narrow run reports the coverage floor as unmet, which is the gate's measurement over the whole
suite rather than this one's. `pnpm run check` is what enforces it.

Expected, per SC-002's off-screen half: every suit at every grade it publishes, every weapon at
every grade it publishes, and every modification on every item it is offered for, each stated figure
equal to the package's own answer. Locked and held content contributes to none of them. No test
computes a sustained or headshot figure itself: every derived combat figure is compared against
`personalWeaponMetrics` for the same weapon, grade and modifiers, including the `reloadSpeed`
option when Reload Speed is fitted.

## 3. The bench, running

```bash
pnpm start
```

Open `/equipment` directly — not by way of another screen (FR-027).

| Do this                                                 | Expect                                                                                                                                                                       |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Select the Dominator, grade 1                           | one primary mount and one secondary; no open modification slot; the material requirement says there is nothing to gather                                                     |
| Raise it to grade 5                                     | two primary mounts and one secondary; four open modification slots; the material requirement states the climb with nothing fitted                                            |
| Fit a rifle on each primary, a sidearm on the secondary | each states its own grade ladder; the stats restate                                                                                                                          |
| Lower a weapon to grade 3                               | slots 3 and 4 lock, keeping their modifications; the material requirement shrinks                                                                                            |
| Switch to the Maverick                                  | `primary2` is unavailable, its weapon still named                                                                                                                            |
| Switch back to the Dominator                            | the weapon is on `primary2` again, with its grade and modifications                                                                                                          |
| Select the Flight Suit                                  | grade 1 only, no primary mount, and the modification region says it cannot be upgraded                                                                                       |
| Read the suit's resistance bars                         | each bar has a tick at its centre; a positive resistance fills towards the trailing edge, a negative one towards the leading edge, and the figure carries its sign           |
| Read the item view                                      | the eight figures the package publishes for a weapon: damage per shot, rate of fire, sustained DPS, headshot damage, magazine, reserve ammo, effective range and DPS         |
| Read the ledger's `SUIT TOOLS` rows                     | the Maverick names the Arc Cutter, the Artemis the Genetic Sampler, both name the Energylink and Profile Analyser, the header count matches the rows, and none is selectable |

## 4. Keeping and sharing

| Do this                                        | Expect                                                                       |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| Save under a name, reload, open from `/builds` | one list holding builds and loadouts; the loadout restores exactly           |
| Save again under the same name                 | asked to replace or keep both                                                |
| Copy the share link with a held weapon present | opening it restores the held weapon too (FR-018a, SC-005)                    |
| Open a link naming an unknown recipe           | told what could not be resolved, naming the mount in words; nothing replaced |
| Export the readable summary                    | names the suit, its grade, each weapon with its grade, and each modification |

## 5. The gates

```bash
pnpm run check
```

Which is format, typecheck, build, unit tests at the 80% floor, and the ten-project Playwright
matrix — three viewport classes in both orientations, in Chromium and Firefox — with the axe sweep
over every bench surface.

While iterating, run only this phase's specs:

```bash
pnpm run e2e equipment-builder.spec.ts
```

The full matrix is mandatory at the phase boundary, not during it.

## 6. Offline

```bash
pnpm run e2e:offline
```

Expected: after one completed load, assembling, saving, opening and sharing all work with the
network down (FR-026, SC-006). Nothing in this feature fetches anything at runtime.

## Known-absent, on purpose

A mount's name is English at every locale, because `getPersonalMountName` carries only `en-GB` in
0.2.9 ([#26](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/26)). It presents as canonical English with its provenance stated, the way a hull
name already does, and no check asserts a translated mount name. It becomes localised on the
release that carries the five values, with no change here.

No tool stat is stated anywhere, and no check asserts one: the library publishes them and neither
artboard draws them.
