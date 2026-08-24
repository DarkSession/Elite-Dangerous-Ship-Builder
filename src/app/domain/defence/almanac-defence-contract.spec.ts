import { getShipBySymbol } from '@elite-dangerous-almanac/core/ships/ships';
import {
  bankedBuild,
  DEFENCE_FIXTURE_HULL,
  disabledGeneratorBuild,
  disabledPlantBuild,
  fullyFittedBuild,
  noGeneratorBuild,
  readyBuild,
  shedGeneratorBuild,
  unpoweredBanksBuild,
} from './defence.fixtures';

const DAMAGE_KEYS = ['kinetic', 'thermal', 'explosive', 'caustic'] as const;

/**
 * The package contract this feature projects.
 *
 * Narrow on purpose. This is not a characterization of the Almanac — that is
 * the package's own suite's job. What is pinned here is the handful of shapes
 * feature 006 would silently misread if a release changed them: which fields
 * exist, which of them mean "there is no answer", which sentinel carries that
 * meaning, and which distinctions the four unavailable shield states are told
 * apart by. A screen that confused any two of them would say something the
 * package did not.
 */
describe('the Almanac contract for shields, recovery, cell banks and armour', () => {
  describe('shieldMetricsResult()', () => {
    it('publishes every strength, multiplier and resistance field on a complete result', () => {
      const result = fullyFittedBuild().shieldMetricsResult({ systemsPips: 2 });

      expect(result.complete).toBe(true);
      expect(result.issues).toEqual([]);
      const value = result.value!;
      expect(Number.isFinite(value.strength)).toBe(true);
      expect(Number.isFinite(value.generator)).toBe(true);
      expect(Number.isFinite(value.boosters)).toBe(true);
      expect(Number.isFinite(value.reinforcement)).toBe(true);
      expect(Number.isFinite(value.massCurveMultiplier)).toBe(true);
      expect(Number.isFinite(value.boostMultiplier)).toBe(true);
      expect(Number.isFinite(value.systemsResistance)).toBe(true);
      for (const key of DAMAGE_KEYS) {
        expect(typeof value.resistances[key]).toBe('number');
        expect(typeof value.effectiveHitPoints[key]).toBe('number');
      }
    });

    it('carries no value and at least one issue on an incomplete result', () => {
      const result = noGeneratorBuild().shieldMetricsResult({ systemsPips: 2 });

      expect(result.complete).toBe(false);
      expect(result.value).toBeNull();
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('tells the four unavailable states apart by field and reason', () => {
      const diagnosis = (build: ReturnType<typeof readyBuild>) =>
        build
          .shieldMetricsResult({ systemsPips: 2 })
          .issues.map((issue) => `${issue.field}/${issue.reason}`);

      expect(diagnosis(noGeneratorBuild())).toEqual(['shieldGenerator/missing']);
      expect(diagnosis(disabledGeneratorBuild())).toEqual(['shieldGenerator/disabled']);
      expect(diagnosis(shedGeneratorBuild())).toEqual(['shieldGenerator/shed']);
      // A plant issue stays a plant issue. It is the one the application must
      // never turn into a verdict about the generator.
      expect(diagnosis(disabledPlantBuild())).toEqual(['powerCapacity/disabled']);
    });

    it('names the exact slot and symbol of a fitted module it can name', () => {
      const issue = disabledGeneratorBuild().shieldMetricsResult({ systemsPips: 2 }).issues[0]!;

      expect(issue.slot).toBe('Slot03_Size6');
      expect(issue.symbol).toBe('Int_ShieldGenerator_Size6_Class1');
      expect(typeof issue.message).toBe('string');
    });

    it('answers a different allocation with different resistances', () => {
      const build = readyBuild();
      const none = build.shieldMetricsResult({ systemsPips: 0 }).value!;
      const full = build.shieldMetricsResult({ systemsPips: 4 }).value!;

      expect(full.systemsResistance).toBeGreaterThan(none.systemsResistance);
      expect(full.strength).toBe(none.strength);
    });
  });

  describe('shieldRecoveryResult()', () => {
    it('publishes both rates and both durations on a complete result', () => {
      const value = fullyFittedBuild().shieldRecoveryResult({ systemsPips: 2 }).value!;

      expect(Number.isFinite(value.regenRate)).toBe(true);
      expect(Number.isFinite(value.brokenRegenRate)).toBe(true);
      expect(Number.isFinite(value.recoveryTime)).toBe(true);
      expect(Number.isFinite(value.regenTime)).toBe(true);
    });

    it('returns positive infinity for a phase that cannot finish', () => {
      // With nothing in the SYS capacitor there is no energy to regenerate
      // with, and the package says so with `Infinity` rather than a very large
      // number of seconds.
      const value = readyBuild().shieldRecoveryResult({ systemsPips: 0 }).value!;

      expect(value.recoveryTime).toBe(Number.POSITIVE_INFINITY);
      expect(value.regenTime).toBe(Number.POSITIVE_INFINITY);
    });

    it('is diagnosed independently of the shield metrics', () => {
      const build = disabledGeneratorBuild();

      expect(build.shieldRecoveryResult({ systemsPips: 2 }).complete).toBe(false);
      expect(build.shieldRecoveryResult({ systemsPips: 2 }).issues[0]?.field).toBe(
        'shieldGenerator',
      );
    });
  });

  describe('cellBanks()', () => {
    it('is an empty list and zero totals when none is fitted', () => {
      const summary = readyBuild().cellBanks();

      expect(summary.banks).toEqual([]);
      expect(summary.totalRestorable).toBe(0);
      expect(summary.totalCells).toBe(0);
    });

    it('publishes every bank field, in slot order', () => {
      const summary = bankedBuild().cellBanks();

      expect(summary.banks.length).toBe(3);
      for (const bank of summary.banks) {
        expect(typeof bank.slot).toBe('string');
        expect(typeof bank.symbol).toBe('string');
        expect(Number.isFinite(bank.reinforcement)).toBe(true);
        expect(Number.isFinite(bank.cells)).toBe(true);
        expect(Number.isFinite(bank.spinUp)).toBe(true);
        expect(Number.isFinite(bank.duration)).toBe(true);
        expect(Number.isFinite(bank.heat)).toBe(true);
        expect(typeof bank.powered).toBe('boolean');
      }
    });

    it('keeps unpowered banks in the list while leaving both totals at zero', () => {
      const summary = unpoweredBanksBuild().cellBanks();

      expect(summary.banks).toHaveLength(3);
      expect(summary.banks.every((bank) => !bank.powered)).toBe(true);
      expect(summary.totalRestorable).toBe(0);
      expect(summary.totalCells).toBe(0);
    });
  });

  describe('armourMetrics()', () => {
    it('is never null, and publishes hull, module and resistance fields separately', () => {
      const metrics = fullyFittedBuild().armourMetrics();

      expect(Number.isFinite(metrics.hitPoints)).toBe(true);
      expect(Number.isFinite(metrics.bulkheads)).toBe(true);
      expect(Number.isFinite(metrics.reinforcement)).toBe(true);
      expect(Number.isFinite(metrics.moduleArmour)).toBe(true);
      expect(Number.isFinite(metrics.moduleProtection)).toBe(true);
      for (const key of DAMAGE_KEYS) {
        expect(typeof metrics.resistances[key]).toBe('number');
        expect(typeof metrics.effectiveHitPoints[key]).toBe('number');
      }
    });

    it('answers a build whose shield is unavailable', () => {
      expect(disabledGeneratorBuild().armourMetrics().hitPoints).toBeGreaterThan(0);
    });

    it('reports a negative resistance as a signed weakness', () => {
      // The stock lightweight alloy is kinetically and explosively weak.
      expect(readyBuild().armourMetrics().resistances.kinetic).toBeLessThan(0);
    });
  });

  describe('the hull record', () => {
    it('carries hardness as a rating of its own, outside the armour result', () => {
      const ship = getShipBySymbol(DEFENCE_FIXTURE_HULL);

      expect(Number.isFinite(ship?.hardness)).toBe(true);
      expect(readyBuild().armourMetrics()).not.toHaveProperty('hardness');
    });

    it('returns null for a symbol it does not carry', () => {
      expect(getShipBySymbol('Not_A_Hull')).toBeNull();
    });
  });

  describe('fitted module records', () => {
    it('classifies each defence role by its own engineering group', () => {
      const groups = new Map(
        fullyFittedBuild()
          .slots()
          .filter((slot) => slot.module !== null)
          .map((slot) => [slot.key, slot.module?.stats?.engineeringGroup ?? null]),
      );

      expect(groups.get('Slot03_Size6')).toBe('shieldGenerators');
      expect(groups.get('TinyHardpoint1')).toBe('shieldBoosters');
      expect(groups.get('Slot05_Size5')).toBe('shieldReinforcements');
      expect(groups.get('Slot07_Size5')).toBe('hullReinforcements');
      expect(groups.get('Slot06_Size5')).toBe('guardianHullReinforcements');
    });

    it('gives the armour mount its own kind, so a bulkhead needs no group', () => {
      const armour = fullyFittedBuild()
        .slots()
        .find((slot) => slot.kind === 'armour');

      expect(armour?.key).toBe('Armour');
      expect(armour?.module?.symbol).toBe('Anaconda_Armour_Grade3');
    });

    it('refuses to empty the armour mount, so a real build always has a bulkhead', () => {
      expect(() => readyBuild().removeModule('Armour')).toThrow();
    });
  });
});
