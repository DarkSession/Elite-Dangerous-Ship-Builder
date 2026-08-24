import { getModuleBySymbol } from '@elite-dangerous-almanac/core/ships/modules';
import type { OutfittingModule } from '@elite-dangerous-almanac/core/ships/modules';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { defaultBuild } from '../outfitting/outfitting.fixtures';

/**
 * Builds that reach the states this feature has to tell apart.
 *
 * Every one of them is a real `ShipLoadout` the package answers for. Nothing
 * here writes down a megajoule, a hull point, a resistance or a duration: the
 * fixtures put a build into a state and let `shieldMetricsResult()`,
 * `shieldRecoveryResult()`, `cellBanks()` and `armourMetrics()` say what that
 * state means (constitution II).
 *
 * The module symbols below are identities the installed package either carries
 * or does not, and `packageModule` fails loudly when one stops being carried —
 * a fixture that silently degraded into "the default build again" would make a
 * suite pass while testing nothing.
 */

/** The fixture hull: every mount kind, a shield generator and a stock bulkhead. */
export const DEFENCE_FIXTURE_HULL = 'Anaconda';

/** The mount the fixture hull carries its shield generator in. */
export const GENERATOR_SLOT = 'Slot03_Size6';

/** The mount every hull carries its bulkhead in. */
export const ARMOUR_SLOT = 'Armour';

/**
 * The journal's `Priority` is zero-based, and `setModulePriority` takes it that
 * way: `4` here is the outfitting panel's group 5.
 */
const JOURNAL_PRIORITY_GROUP_5 = 4;

/** The stock build: a complete shield, a complete recovery and no cell banks. */
export function readyBuild(): ShipLoadout {
  return defaultBuild(DEFENCE_FIXTURE_HULL);
}

/**
 * A build carrying one of every source row both headlines draw.
 *
 * Two boosters rather than one, so a role row aggregating several modules is
 * covered, and a non-stock bulkhead so the fitted armour row is a real module
 * rather than the package's stock-alloy calculation.
 */
export function fullyFittedBuild(): ShipLoadout {
  return readyBuild()
    .setModule('TinyHardpoint1', packageModule('Hpt_ShieldBooster_Size0_Class1'))
    .setModule('TinyHardpoint2', packageModule('Hpt_ShieldBooster_Size0_Class3'))
    .setModule('Slot05_Size5', packageModule('Int_GuardianShieldReinforcement_Size5_Class1'))
    .setModule('Slot07_Size5', packageModule('Int_HullReinforcement_Size5_Class1'))
    .setModule('Slot06_Size5', packageModule('Int_GuardianHullReinforcement_Size5_Class1'))
    .setModule(ARMOUR_SLOT, packageModule('Anaconda_Armour_Grade3'));
}

/** No generator at all: `shieldGenerator` / `missing`, with no slot to reach. */
export function noGeneratorBuild(): ShipLoadout {
  return readyBuild().removeModule(GENERATOR_SLOT);
}

/** A generator switched off in the panel: `shieldGenerator` / `disabled`. */
export function disabledGeneratorBuild(): ShipLoadout {
  return readyBuild().setModuleEnabled(GENERATOR_SLOT, false);
}

/**
 * A generator the plant cannot keep lit: `shieldGenerator` / `shed`.
 *
 * A small plant under the stock draw, with the generator dropped to the last
 * priority group so the budget runs out above it.
 */
export function shedGeneratorBuild(): ShipLoadout {
  return readyBuild()
    .setModule('PowerPlant', packageModule('Int_Powerplant_Size2_Class1'))
    .setModulePriority(GENERATOR_SLOT, JOURNAL_PRIORITY_GROUP_5);
}

/**
 * A plant switched off: `powerCapacity` / `disabled`.
 *
 * The fixture that catches a reader turning any incomplete shield into a
 * verdict about the generator — this build's generator is fitted and switched
 * on, and the package says so by naming the plant instead.
 */
export function disabledPlantBuild(): ShipLoadout {
  return readyBuild().setModuleEnabled('PowerPlant', false);
}

/** Two powered banks, the smaller one repeating the larger one's symbol. */
export function bankedBuild(): ShipLoadout {
  return readyBuild()
    .setModule('Slot04_Size6', packageModule('Int_ShieldCellBank_Size6_Class1'))
    .setModule('Slot08_Size4', packageModule('Int_ShieldCellBank_Size4_Class1'))
    .setModule('Slot09_Size4', packageModule('Int_ShieldCellBank_Size4_Class1'));
}

/**
 * Every fitted bank switched off: a `fitted` collection with zero totals.
 *
 * The state that must never collapse into "no banks fitted" — the banks are
 * aboard, and the package reports exactly that with both totals at zero.
 */
export function unpoweredBanksBuild(): ShipLoadout {
  return bankedBuild()
    .setModuleEnabled('Slot04_Size6', false)
    .setModuleEnabled('Slot08_Size4', false)
    .setModuleEnabled('Slot09_Size4', false);
}

/** The package's own record for one symbol, or a loud failure. */
function packageModule(symbol: string): OutfittingModule {
  const module = getModuleBySymbol(symbol);
  if (module === null) {
    throw new Error(`The installed package no longer carries ${symbol}.`);
  }
  return module;
}
