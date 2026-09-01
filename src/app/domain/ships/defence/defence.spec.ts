import { BuildMetrics } from '@elite-dangerous-almanac/core/ships/build-metrics';
import type { CalculationIssue } from '@elite-dangerous-almanac/core/ships/loadout-calculations';
import { getShipBySymbol } from '@elite-dangerous-almanac/core/ships/ships';
import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { DAMAGE_TYPES, projectDefence, type Defence, type DamageType } from './defence';
import {
  ARMOUR_SLOT,
  bankedBuild,
  DEFENCE_FIXTURE_HULL,
  disabledGeneratorBuild,
  disabledPlantBuild,
  fullyFittedBuild,
  GENERATOR_SLOT,
  noGeneratorBuild,
  readyBuild,
  shedGeneratorBuild,
  unpoweredBanksBuild,
} from './defence.fixtures';

/** The four allocations FR-002 names: none, a half step, the default and full. */
const PIP_SETTINGS = [0, 1.5, 2, 4] as const;

function project(build: ShipLoadout, systemsPips = 2): Defence {
  return projectDefence(build, { systemsPips });
}

function completeShield(defence: Defence) {
  if (defence.shield.kind !== 'complete') {
    throw new Error('expected a complete shield');
  }
  return defence.shield.value;
}

function completeCapacitor(defence: Defence) {
  if (defence.capacitor.kind !== 'complete') {
    throw new Error('expected a complete capacitor');
  }
  return defence.capacitor.value;
}

function completeRecovery(defence: Defence) {
  if (defence.recovery.kind !== 'complete') {
    throw new Error('expected a complete recovery');
  }
  return defence.recovery.value;
}

function fittedBanks(defence: Defence) {
  if (defence.cellBanks.kind !== 'fitted') {
    throw new Error('expected fitted banks');
  }
  return defence.cellBanks;
}

describe('projectDefence', () => {
  // The calculations moved onto `BuildMetrics` in Almanac 0.2.0, so the seam
  // is its prototype rather than one build. A prototype stays mocked for
  // every later test in this file unless it is put back.
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('the shield', () => {
    it.each(PIP_SETTINGS)('equals the package result field for field at %s SYS pips', (pips) => {
      const build = fullyFittedBuild();
      const result = BuildMetrics.of(build).shieldMetricsResult();
      if (!result.complete) {
        throw new Error('the fixture is meant to raise a shield');
      }

      const shield = completeShield(project(build, pips));

      expect(shield.strength).toBe(result.value.strength);
      expect(shield.generator).toBe(result.value.generator);
      expect(shield.boosters).toBe(result.value.boosters);
      expect(shield.reinforcement).toBe(result.value.reinforcement);
      expect(shield.massCurveMultiplier).toBe(result.value.massCurveMultiplier);
      expect(shield.boostMultiplier).toBe(result.value.boostMultiplier);
    });

    it.each(PIP_SETTINGS)('carries the capacitor beside it at %s SYS pips', (pips) => {
      // The pips are their own package call since Almanac 0.2.0, so the shield
      // above stays still and this is the only thing on the damage table that
      // moves with the allocation (FR-002). The recovery moves with it as well,
      // but it is not on this table.
      const build = fullyFittedBuild();
      const result = BuildMetrics.of(build).shieldCapacitorMetricsResult({ systemsPips: pips });
      if (!result.complete) {
        throw new Error('the fixture is meant to raise a shield');
      }

      const capacitor = completeCapacitor(project(build, pips));

      expect(capacitor.systemsPips).toBe(result.value.systemsPips);
      expect(capacitor.capacity).toBe(result.value.capacity);
      expect(capacitor.rechargeRate).toBe(result.value.rechargeRate);
      expect(capacitor.systemsResistance).toBe(result.value.systemsResistance);
      for (const row of capacitor.damage) {
        expect(row.resistance).toBe(result.value.effectiveResistances[row.type]);
        expect(row.effectiveHitPoints).toBe(result.value.effectiveHitPoints[row.type]);
      }
    });

    it.each(PIP_SETTINGS)('leaves the bare shield still at %s SYS pips', (pips) => {
      const build = fullyFittedBuild();
      const bare = completeShield(project(build, 0)).damage;

      expect(completeShield(project(build, pips)).damage).toEqual(bare);
    });

    it.each(PIP_SETTINGS)('pairs each resistance with its own pool at %s SYS pips', (pips) => {
      const build = fullyFittedBuild();
      const result = BuildMetrics.of(build).shieldMetricsResult();
      if (!result.complete) {
        throw new Error('the fixture is meant to raise a shield');
      }

      const damage = completeShield(project(build, pips)).damage;

      expect(damage.map((row) => row.type)).toEqual([...DAMAGE_TYPES]);
      for (const row of damage) {
        expect(row.resistance).toBe(result.value.resistances[row.type]);
        expect(row.effectiveHitPoints).toBe(result.value.effectiveHitPoints[row.type]);
      }
    });

    it('reports the allocation it was read at, and reads every pip call at that one', () => {
      const build = readyBuild();
      const metrics = vi.spyOn(BuildMetrics.prototype, 'shieldMetricsResult');
      const capacitor = vi.spyOn(BuildMetrics.prototype, 'shieldCapacitorMetricsResult');
      const recovery = vi.spyOn(BuildMetrics.prototype, 'shieldRecoveryResult');

      expect(project(build, 1.5).systemsPips).toBe(1.5);
      // The bare shield takes no allocation at all; the two that do are read at
      // the one the screen names, because it shows them under one heading.
      expect(metrics).toHaveBeenCalledExactlyOnceWith();
      expect(capacitor).toHaveBeenCalledExactlyOnceWith({ systemsPips: 1.5 });
      expect(recovery).toHaveBeenCalledExactlyOnceWith({ systemsPips: 1.5 });
    });

    it('keeps a zero resistance a number rather than an absence', () => {
      const damage = completeShield(project(readyBuild())).damage;
      const caustic = damage.find((row) => row.type === 'caustic');

      expect(caustic?.resistance).toBe(
        BuildMetrics.of(readyBuild()).shieldMetricsResult().value?.resistances.caustic,
      );
      expect(Number.isFinite(caustic?.effectiveHitPoints)).toBe(true);
    });
  });

  describe('an unavailable shield', () => {
    const cases: readonly [string, () => ShipLoadout, string, string][] = [
      ['a generator that is not fitted', noGeneratorBuild, 'shieldGenerator', 'missing'],
      ['a generator switched off', disabledGeneratorBuild, 'shieldGenerator', 'disabled'],
      ['a generator the plant sheds', shedGeneratorBuild, 'shieldGenerator', 'shed'],
      ['a plant switched off', disabledPlantBuild, 'powerCapacity', 'disabled'],
    ];

    it.each(cases)('keeps %s as its own package diagnosis', (_name, make, field, reason) => {
      const defence = project(make());
      if (defence.shield.kind !== 'unavailable') {
        throw new Error('expected an unavailable shield');
      }

      expect(defence.shield.issues.map((issue) => `${issue.field}/${issue.reason}`)).toEqual([
        `${field}/${reason}`,
      ]);
    });

    it('preserves every issue in package order, with the original retained', () => {
      // The package's own issues, handed back from one call, so the identity
      // assertion is about what the projection did with them rather than about
      // two separate calls agreeing.
      const build = disabledGeneratorBuild();
      const first: CalculationIssue = {
        field: 'powerCapacity',
        reason: 'disabled',
        slot: 'PowerPlant',
        symbol: 'Int_Powerplant_Size8_Class1',
        message: 'the plant is switched off',
        params: { slot: 'PowerPlant' },
      };
      const second: CalculationIssue = {
        field: 'shieldGenerator',
        reason: 'shed',
        message: 'the generator is shed',
      };
      vi.spyOn(BuildMetrics.prototype, 'shieldMetricsResult').mockReturnValue({
        value: null,
        complete: false,
        issues: [first, second],
      });

      const defence = project(build);
      if (defence.shield.kind !== 'unavailable') {
        throw new Error('expected an unavailable shield');
      }

      // Two issues, in the package's order, neither collapsed, reordered,
      // deduplicated nor relabelled, and each still holding the package object
      // `getCalculationIssueMessage()` is given.
      expect(defence.shield.issues).toEqual([
        {
          field: 'powerCapacity',
          reason: 'disabled',
          slot: 'PowerPlant',
          symbol: 'Int_Powerplant_Size8_Class1',
          params: { slot: 'PowerPlant' },
          packageIssue: first,
        },
        {
          field: 'shieldGenerator',
          reason: 'shed',
          slot: undefined,
          symbol: undefined,
          params: undefined,
          packageIssue: second,
        },
      ]);
      expect(defence.shield.issues[0]?.packageIssue).toBe(first);
      expect(defence.shield.issues[1]?.packageIssue).toBe(second);
    });

    it('carries the exact package slot and symbol where the package names one', () => {
      const defence = project(disabledGeneratorBuild());
      if (defence.shield.kind !== 'unavailable') {
        throw new Error('expected an unavailable shield');
      }

      expect(defence.shield.issues[0]?.slot).toBe(GENERATOR_SLOT);
      expect(defence.shield.issues[0]?.symbol).toBe(
        readyBuild()
          .slots()
          .find((slot) => slot.key === GENERATOR_SLOT)?.module?.symbol,
      );
    });

    it('names no slot where the package names none', () => {
      const defence = project(noGeneratorBuild());
      if (defence.shield.kind !== 'unavailable') {
        throw new Error('expected an unavailable shield');
      }

      expect(defence.shield.issues[0]?.slot).toBeUndefined();
    });

    it('draws no source row, because the aggregates those rows carry do not exist', () => {
      expect(project(disabledGeneratorBuild()).shieldRoles).toEqual([]);
    });

    it('leaves the armour, hardness and banks whole', () => {
      const defence = project(disabledGeneratorBuild());
      const armour = BuildMetrics.of(disabledGeneratorBuild()).armourMetrics();

      expect(defence.armour.hitPoints).toBe(armour.hitPoints);
      expect(defence.hardness).toBe(getShipBySymbol(DEFENCE_FIXTURE_HULL)?.hardness);
      expect(defence.armourRoles.map((role) => role.role)).toContain('bulkhead');
    });
  });

  describe('the recovery', () => {
    it.each(PIP_SETTINGS)('equals the package result at %s SYS pips', (pips) => {
      const build = fullyFittedBuild();
      const result = BuildMetrics.of(build).shieldRecoveryResult({ systemsPips: pips });
      if (!result.complete) {
        throw new Error('the fixture is meant to raise a shield');
      }

      const recovery = completeRecovery(project(build, pips));

      expect(recovery.regenRate).toBe(result.value.regenRate);
      expect(recovery.brokenRegenRate).toBe(result.value.brokenRegenRate);
      expect(recovery.recoveryTime).toBe(result.value.recoveryTime);
      expect(recovery.regenTime).toBe(result.value.regenTime);
    });

    it('keeps a phase that never finishes infinite rather than clamped', () => {
      // The package's own answer for a shield the SYS capacitor cannot feed:
      // it returns `Infinity` rather than a very large number of seconds.
      const recovery = completeRecovery(project(readyBuild(), 0));

      expect(recovery.recoveryTime).toBe(Number.POSITIVE_INFINITY);
      expect(recovery.regenTime).toBe(Number.POSITIVE_INFINITY);
    });

    it('is asked and answered independently of the shield', () => {
      const build = readyBuild();
      const defence = project(build);

      expect(defence.shield.kind).toBe('complete');
      expect(defence.recovery.kind).toBe('complete');
      expect(completeRecovery(defence)).not.toBe(completeShield(defence));
    });
  });

  describe('the cell banks', () => {
    it('is a dedicated empty state only for an empty package list', () => {
      expect(BuildMetrics.of(readyBuild()).cellBanks().banks).toHaveLength(0);
      expect(project(readyBuild()).cellBanks).toEqual({ kind: 'noneFitted' });
    });

    it('copies both totals and every field of every bank, in package order', () => {
      const build = bankedBuild();
      const summary = BuildMetrics.of(build).cellBanks();
      const banks = fittedBanks(project(build));

      expect(banks.totalRestorable).toBe(summary.totalRestorable);
      expect(banks.totalCells).toBe(summary.totalCells);
      expect(banks.banks).toHaveLength(summary.banks.length);
      banks.banks.forEach((bank, index) => {
        const original = summary.banks[index]!;
        expect(bank.slotKey).toBe(original.slot);
        expect(bank.symbol).toBe(original.symbol);
        expect(bank.reinforcement).toBe(original.reinforcement);
        expect(bank.cells).toBe(original.cells);
        expect(bank.spinUp).toBe(original.spinUp);
        expect(bank.duration).toBe(original.duration);
        expect(bank.heat).toBe(original.heat);
        expect(bank.powered).toBe(original.powered);
      });
    });

    it('names each bank from the record fitted in the slot the package reported', () => {
      const build = bankedBuild();
      const banks = fittedBanks(project(build)).banks;

      // The summary carries what a bank restores; what a bank *is* — the
      // canvas's `5A` — is only on the fitted record, found by the exact key.
      for (const bank of banks) {
        const stats = build.slots().find((slot) => slot.key === bank.slotKey)
          ?.module?.effectiveStats;

        expect(stats).toBeDefined();
        expect(bank.identity?.size).toBe(stats!.class);
        expect(bank.identity?.rating).toBe(stats!.rating);
      }
      expect(new Set(banks.map((bank) => bank.identity?.size)).size).toBe(2);
    });

    it('keeps two banks of one symbol apart by their own slots', () => {
      const banks = fittedBanks(project(bankedBuild())).banks;
      const repeated = banks.filter((bank) => bank.symbol.includes('Size4'));

      expect(repeated).toHaveLength(2);
      expect(new Set(repeated.map((bank) => bank.slotKey)).size).toBe(2);
    });

    it('stays fitted when every bank is unpowered, beside exact zero totals', () => {
      const banks = fittedBanks(project(unpoweredBanksBuild()));

      expect(banks.banks).toHaveLength(3);
      expect(banks.banks.every((bank) => !bank.powered)).toBe(true);
      expect(banks.totalRestorable).toBe(0);
      expect(banks.totalCells).toBe(0);
    });
  });

  describe('the armour', () => {
    it('equals the package result field for field', () => {
      const build = fullyFittedBuild();
      const metrics = BuildMetrics.of(build).armourMetrics();
      const armour = project(build).armour;

      expect(armour.hitPoints).toBe(metrics.hitPoints);
      expect(armour.bulkheads).toBe(metrics.bulkheads);
      expect(armour.reinforcement).toBe(metrics.reinforcement);
      expect(armour.moduleArmour).toBe(metrics.moduleArmour);
      expect(armour.moduleProtection).toBe(metrics.moduleProtection);
      for (const row of armour.damage) {
        expect(row.resistance).toBe(metrics.resistances[row.type]);
        expect(row.effectiveHitPoints).toBe(metrics.effectiveHitPoints[row.type]);
      }
    });

    it('keeps a negative resistance signed', () => {
      // The stock lightweight alloy is kinetically and explosively weak, and
      // the package says so with a negative fraction.
      const kinetic = project(readyBuild()).armour.damage.find(
        (row: { type: DamageType }) => row.type === 'kinetic',
      );

      expect(kinetic?.resistance).toBeLessThan(0);
      expect(kinetic?.effectiveHitPoints).toBeLessThan(project(readyBuild()).armour.hitPoints);
    });

    it('keeps hardness beside the armour rather than inside it', () => {
      const defence = project(readyBuild());

      expect(defence.hardness).toBe(getShipBySymbol(DEFENCE_FIXTURE_HULL)?.hardness);
      expect(Object.keys(defence.armour).sort()).toEqual([
        'bulkheads',
        'damage',
        'hitPoints',
        'moduleArmour',
        'moduleProtection',
        'reinforcement',
      ]);
    });

    it('refuses a hull the package does not carry rather than standing one in', () => {
      const build = readyBuild();
      vi.spyOn(build, 'shipSymbol', 'get').mockReturnValue('Not_A_Hull');

      expect(() => project(build)).toThrow(/Not_A_Hull/u);
    });
  });

  describe('the source rows', () => {
    it('carries the package aggregate for each role, whole', () => {
      const build = fullyFittedBuild();
      const shield = BuildMetrics.of(build).shieldMetricsResult().value!;
      const armour = BuildMetrics.of(build).armourMetrics();
      const defence = project(build);

      expect(
        Object.fromEntries(defence.shieldRoles.map((row) => [row.role, row.contribution])),
      ).toEqual({
        shieldGenerator: shield.generator,
        shieldBooster: shield.boosters,
        shieldReinforcement: shield.reinforcement,
      });
      expect(
        Object.fromEntries(defence.armourRoles.map((row) => [row.role, row.contribution])),
      ).toEqual({
        bulkhead: armour.bulkheads,
        hullReinforcement: armour.reinforcement,
      });
    });

    it('draws the rows in the canvas order and keeps package slot order inside them', () => {
      const defence = project(fullyFittedBuild());

      expect(defence.shieldRoles.map((row) => row.role)).toEqual([
        'shieldGenerator',
        'shieldBooster',
        'shieldReinforcement',
      ]);
      expect(defence.armourRoles.map((row) => row.role)).toEqual(['bulkhead', 'hullReinforcement']);

      const boosters = defence.shieldRoles.find((row) => row.role === 'shieldBooster');
      expect(boosters?.modules.map((module) => module.slotKey)).toEqual([
        'TinyHardpoint1',
        'TinyHardpoint2',
      ]);
    });

    it('groups the Guardian and ordinary hull reinforcement into one package aggregate', () => {
      const reinforcement = project(fullyFittedBuild()).armourRoles.find(
        (row) => row.role === 'hullReinforcement',
      );

      // Two modules, two mounts, and one figure — the package publishes no
      // per-source breakdown, so neither does this.
      expect(reinforcement?.modules).toHaveLength(2);
      expect(reinforcement?.contribution).toBe(
        BuildMetrics.of(fullyFittedBuild()).armourMetrics().reinforcement,
      );
    });

    it('attaches no contribution, share or power verdict to any module', () => {
      const modules = project(fullyFittedBuild()).shieldRoles.flatMap((row) => row.modules);

      for (const module of modules) {
        expect(Object.keys(module).sort()).toEqual(['enabled', 'identity', 'slotKey', 'symbol']);
      }
    });

    it('reads a module switch straight from the journal, and says so when it is silent', () => {
      const disabled = project(
        fullyFittedBuild().setModuleEnabled('TinyHardpoint1', false),
      ).shieldRoles.find((row) => row.role === 'shieldBooster');

      expect(disabled?.modules[0]?.enabled).toBe(false);
      expect(project(fullyFittedBuild()).shieldRoles[0]?.modules[0]?.enabled).toBe('unspecified');
    });

    it('reads the bulkhead row off the armour mount itself', () => {
      const build = fullyFittedBuild();
      const bulkhead = project(build).armourRoles.find((row) => row.role === 'bulkhead');
      const mount = build.slots().find((slot) => slot.key === ARMOUR_SLOT);

      expect(bulkhead?.modules).toEqual([
        expect.objectContaining({ slotKey: ARMOUR_SLOT, symbol: mount?.module?.symbol }),
      ]);
    });

    it('draws no bulkhead row for an armour mount holding nothing', () => {
      // `armourMetrics()` calculates a stock lightweight alloy for a hull with
      // no fitted armour, and that calculation is not a module anybody can be
      // sent to. The package refuses to empty the mount on a real build, so the
      // state is reached by asking the projection about a slot snapshot that
      // has one — which is exactly the input the rule is about.
      const build = readyBuild();
      vi.spyOn(build, 'slots').mockReturnValue(
        build.slots().map((slot) => (slot.kind === 'armour' ? { ...slot, module: null } : slot)),
      );

      expect(BuildMetrics.of(build).armourMetrics().bulkheads).toBeGreaterThan(0);
      expect(project(build).armourRoles.map((row) => row.role)).not.toContain('bulkhead');
    });

    it('names no row for a mount whose record the package could not resolve', () => {
      // Nothing but a resolved `engineeringGroup` classifies a module: a stock
      // module reinforcement package has no engineering menu, so it has no
      // group, so it gets no row rather than a guessed one.
      const build = fullyFittedBuild();
      const roles = project(build).armourRoles.map((row) => row.role);

      expect(roles).toEqual(['bulkhead', 'hullReinforcement']);
    });
  });
});
