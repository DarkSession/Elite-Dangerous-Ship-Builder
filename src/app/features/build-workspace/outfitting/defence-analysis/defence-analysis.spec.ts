import { TestBed } from '@angular/core/testing';
import { BuildMetrics } from '@elite-dangerous-almanac/core/ships/build-metrics';
import { getModuleBySymbol } from '@elite-dangerous-almanac/core/ships/modules';
import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { BuildCandidate } from '../../../../application/active-build/active-build.models';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import { PowerConditionsStore } from '../../../../application/power-heat/power-conditions.store';
import {
  bankedBuild,
  DEFENCE_FIXTURE_HULL,
  disabledGeneratorBuild,
  fullyFittedBuild,
  resistantBuild,
  noGeneratorBuild,
  readyBuild,
  unpoweredBanksBuild,
} from '../../../../domain/defence/defence.fixtures';
import { provideLocalization } from '../../../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../../../i18n/testing/localization-harness';
import { DefenceAnalysis } from './defence-analysis';

/**
 * The two cards, from the outside.
 *
 * Every assertion is against the package's own answer for the same build,
 * never against a number written here: a suite that pinned `1,842 MJ` would
 * pass a release that changed what the Almanac says and fail one that did not.
 *
 * The other half of the suite is about meaning carried in words. The canvas
 * says a weakness with a red figure and a hatch, an unbounded pool with `∞` and
 * a bank with nothing switched on by dimming it; a reader who can see none of
 * that has to get the same facts, so the tests read text wherever the fact is
 * the point.
 */
describe('DefenceAnalysis', () => {
  let active: ActiveBuildStore;
  let conditions: PowerConditionsStore;

  function candidateFor(loadout: ShipLoadout): BuildCandidate {
    return {
      loadout,
      hullName: DEFENCE_FIXTURE_HULL,
      provenance: 'stock',
      qualityNotices: [],
      sourceNamed: null,
      baseline: null,
    };
  }

  function render(loadout: ShipLoadout | null) {
    if (loadout !== null) {
      active.commit(candidateFor(loadout));
    }
    const fixture = TestBed.createComponent(DefenceAnalysis);
    fixture.detectChanges();
    return {
      element: fixture.nativeElement as HTMLElement,
      component: fixture.componentInstance,
      detect: () => fixture.detectChanges(),
    };
  }

  /**
   * Every body row of one card's damage table, cell by cell.
   *
   * The bar's cell is left out: it holds no text at all, by design, and a
   * reader who cannot see it is owed the same three readings without it.
   */
  function damageCells(element: HTMLElement, card: string): string[][] {
    return [...element.querySelectorAll(`.${card} .damage tbody tr`)].map((row) =>
      [...row.querySelectorAll('th, td:not(.damage__bar)')].map((cell) =>
        (cell.textContent ?? '').trim(),
      ),
    );
  }

  function text(element: HTMLElement, selector: string): string {
    return (element.querySelector(selector)?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideLocalization(), ...provideIsolatedLocaleEnvironment()],
    });
    active = TestBed.inject(ActiveBuildStore);
    conditions = TestBed.inject(PowerConditionsStore);
  });

  it('draws nothing at all without a build', () => {
    expect(render(null).element.textContent?.trim()).toBe('');
  });

  it('has nothing to say about a workspace with no build in it', () => {
    // The template asks once and draws nothing, so every group is checked here
    // instead: an absent build is an empty list rather than a zero, an
    // exception or a row of dashes.
    const { component } = render(null);

    expect(component.shown()).toBe(false);
    expect(component.shieldPool()).toBeNull();
    expect(component.armourPool()).toBeNull();
    expect(component.shieldDamage().rows).toEqual([]);
    expect(component.armourDamage().rows).toEqual([]);
    expect(component.recoveryFacts()).toEqual([]);
    expect(component.armourFacts()).toEqual([]);
    expect(component.shieldSources()).toEqual([]);
    expect(component.armourSources()).toEqual([]);
    expect(component.bankRow()).toBeNull();
  });

  describe('the shield card', () => {
    it('heads the pool with the package strength at the standing allocation', () => {
      const build = fullyFittedBuild();
      const { component } = render(build);
      const expected = BuildMetrics.of(build).shieldMetricsResult().value!;

      expect(component.shieldPool()).toBe(
        new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(expected.strength),
      );
    });

    it('names the fitted generator and its code beside the heading', () => {
      const { component } = render(fullyFittedBuild());
      const identity = component.shieldIdentity();

      expect(identity?.name.text).toBe('Shield Generator');
      expect(identity?.code).toBe('6E');
    });

    it('holds the bare resistances still and moves only the pip column', () => {
      // FR-002, as the 2026-08-25 revision settles it: `RESIST` and `MJ` are
      // the shield at zero pips and do not move; the allocation is a second
      // package call and shows up in the fifth column alone.
      const build = fullyFittedBuild();
      const { component, detect } = render(build);
      const before = component.shieldDamage();

      conditions.setPips('systems', 4);
      detect();
      const after = component.shieldDamage();

      expect(after.rows.map((row) => row.resistance)).toEqual(
        before.rows.map((row) => row.resistance),
      );
      expect(after.rows.map((row) => row.pool)).toEqual(before.rows.map((row) => row.pool));
      expect(after.rows.map((row) => row.poolAtPips)).not.toEqual(
        before.rows.map((row) => row.poolAtPips),
      );
    });

    it('heads the fifth column with the allocation it was read at', () => {
      const { component, detect } = render(fullyFittedBuild());

      conditions.setPips('systems', 4);
      detect();
      expect(component.shieldDamage().pipColumn).toBe('MJ × 4 SYS PIPS');

      conditions.setPips('systems', 1.5);
      detect();
      expect(component.shieldDamage().pipColumn).toBe('MJ × 1.5 SYS PIPS');
    });

    it('repeats the bare pool in the fifth column at no pips', () => {
      // The package's own guarantee: at no pips the effective figures are the
      // bare ones. It is what makes the column safe to draw at any allocation.
      const { component, detect } = render(fullyFittedBuild());

      conditions.setPips('systems', 0);
      detect();
      const rows = component.shieldDamage().rows;

      expect(rows.map((row) => row.poolAtPips)).toEqual(rows.map((row) => row.pool));
    });

    it('gives the hull no such column, because pips do not reach it', () => {
      const { component } = render(fullyFittedBuild());

      expect(component.armourDamage().pipColumn).toBeNull();
      expect(component.armourDamage().rows.every((row) => row.poolAtPips === undefined)).toBe(true);
    });

    it('pairs every damage type with the package resistance and both pools it returned', () => {
      const build = fullyFittedBuild();
      const { element } = render(build);
      const bare = BuildMetrics.of(build).shieldMetricsResult().value!;
      const atPips = BuildMetrics.of(build).shieldCapacitorMetricsResult({
        systemsPips: conditions.pips().systems,
      }).value!;
      const percent = new Intl.NumberFormat('en', {
        style: 'percent',
        maximumFractionDigits: 0,
      });
      const whole = new Intl.NumberFormat('en', { maximumFractionDigits: 0 });
      const weakness = (resistance: number) => (resistance < 0 ? ' Weakness' : '');

      expect(damageCells(element, 'card--shield')).toEqual(
        (['kinetic', 'thermal', 'explosive', 'caustic'] as const).map((type) => [
          `${type[0]!.toUpperCase()}${type.slice(1)}`,
          `${percent.format(bare.resistances[type])}${weakness(bare.resistances[type])}`,
          whole.format(bare.effectiveHitPoints[type]),
          whole.format(atPips.effectiveHitPoints[type]),
        ]),
      );
    });

    it('says why there is no shield, in the package’s own words and order', () => {
      const build = noGeneratorBuild();
      const { component, element } = render(build);
      const issues = BuildMetrics.of(build).shieldMetricsResult().issues;

      expect(component.shieldAvailable()).toBe(false);
      expect(component.shieldPool()).toBeNull();
      expect(component.shieldIssues()).toHaveLength(issues.length);
      expect(text(element, '.card--shield .issue')).toBe(issues[0]!.message);
    });

    it('draws no damage table and no source rows for a shield the package refused', () => {
      const { component, element } = render(disabledGeneratorBuild());

      expect(component.shieldDamage().rows).toEqual([]);
      expect(component.shieldSources()).toEqual([]);
      expect(element.querySelector('.card--shield .damage')).toBeNull();
    });

    it('keeps the hull card whole while the shield is unavailable', () => {
      const { component } = render(disabledGeneratorBuild());

      expect(component.armourPool()).not.toBeNull();
      expect(component.armourDamage().rows).toHaveLength(4);
      expect(component.armourSources().length).toBeGreaterThan(0);
    });
  });

  describe('recovery', () => {
    it('draws the recharge rate and both durations the package returned', () => {
      const build = fullyFittedBuild();
      const { component } = render(build);
      const expected = BuildMetrics.of(build).shieldRecoveryResult({
        systemsPips: conditions.pips().systems,
      }).value!;

      const facts = component.recoveryFacts();
      expect(facts.map((fact) => fact.id)).toEqual(['rate', 'regen', 'broken']);
      expect(facts[0]?.value).toContain(
        new Intl.NumberFormat('en', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(expected.regenRate),
      );
      expect(facts[1]?.value).not.toBeNull();
      expect(facts[2]?.value).not.toBeNull();
    });

    it('states a phase that never finishes rather than drawing it as seconds', () => {
      // With nothing in the SYS capacitor the package answers `Infinity`, which
      // is a phase that does not complete rather than a very large number.
      const { component, detect } = render(readyBuild());
      conditions.setPips('systems', 0);
      detect();

      const facts = component.recoveryFacts();
      expect(facts[1]?.value).toBeNull();
      expect(facts[1]?.unavailableLabel).toBe('∞');
      expect(facts[1]?.description).toBe('Does not finish at this systems allocation');
      expect(facts[2]?.value).toBeNull();
    });

    it('is diagnosed on its own when the package cannot read it', () => {
      const { component } = render(disabledGeneratorBuild());

      expect(component.recoveryFacts()).toEqual([]);
      expect(component.recoveryIssues().length).toBeGreaterThan(0);
    });
  });

  describe('the armour card', () => {
    it('heads the pool with the package hull points and names the bulkhead', () => {
      const build = fullyFittedBuild();
      const { component } = render(build);

      expect(component.armourPool()).toBe(
        new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(
          BuildMetrics.of(build).armourMetrics().hitPoints,
        ),
      );
      expect(component.armourIdentity()?.name.text).toBe('Military Grade Composite');
      // A bulkhead has no size or rating a Commander outfits by, and the canvas
      // draws none beside the heading.
      expect(component.armourIdentity()?.code).toBeNull();
    });

    it('carries a negative resistance as a signed figure and as a word', () => {
      // The stock lightweight alloy is kinetically weak, and the package says so
      // with a resistance below zero.
      const { component } = render(readyBuild());
      const kinetic = component.armourDamage().rows[0]!;

      expect(BuildMetrics.of(readyBuild()).armourMetrics().resistances.kinetic).toBeLessThan(0);
      expect(kinetic.weakness).toBe(true);
      expect(kinetic.weaknessLabel).toBe('Weakness');
      expect(kinetic.resistance).toContain('-');
    });

    it('draws a weakness back from the zero mark and a resistance on from it', () => {
      // The bar is decoration over a figure that is stated anyway, but it has to
      // be honest decoration: a scale that drew a weakness rightwards from the
      // leading edge would say the hull resists what it is worst against.
      const { component } = render(readyBuild());
      const table = component.armourDamage();
      const weak = table.rows.filter((row) => row.weakness);
      const strong = table.rows.filter((row) => !row.weakness);

      expect(table.signed).toBe(true);
      expect(table.zeroAt).toBeGreaterThan(0);
      expect(weak.length).toBeGreaterThan(0);
      for (const row of weak) {
        expect(row.barStart + row.barLength).toBeCloseTo(table.zeroAt, 6);
      }
      for (const row of strong) {
        expect(row.barStart).toBeCloseTo(table.zeroAt, 6);
      }
    });

    it('states the ends of the scale the bars are drawn on', () => {
      const { component } = render(readyBuild());
      const table = component.armourDamage();
      const lowest = Math.min(
        ...Object.values(BuildMetrics.of(readyBuild()).armourMetrics().resistances),
      );

      // The canvas prints both ends under the bars, and a table reaching below
      // zero has to print the floor it actually reaches rather than `0%`.
      expect(table.floor).toBe(new Intl.NumberFormat('en', { style: 'percent' }).format(lowest));
      expect(table.ceiling).toBe(new Intl.NumberFormat('en', { style: 'percent' }).format(1));
    });

    it('prints zero at the mark on a table that reaches below it', () => {
      const { component, element } = render(readyBuild());
      const zero = element.querySelector<HTMLElement>('.card--armour .scale__zero');

      // The end of the scale and the point the bars are measured from are two
      // readings on a signed table, and the second one is the one that says
      // which bars are resistances and which are weaknesses.
      expect(component.armourDamage().zero).toBe('0%');
      expect(zero?.textContent?.trim()).toBe('0%');
      expect(zero?.style.insetInlineStart).toBe(`${component.armourDamage().zeroAt * 100}%`);
    });

    it('starts every bar at the leading edge on a table with no weakness in it', () => {
      // Every stock generator is weak to thermal, so the unsigned table is an
      // engineered one. Both branches of the scale are covered: this, and the
      // signed hull table above it.
      const { component, element } = render(resistantBuild());
      const table = component.shieldDamage();

      expect(table.rows.every((row) => row.resistance.startsWith('-'))).toBe(false);
      expect(table.signed).toBe(false);
      expect(table.zeroAt).toBe(0);
      expect(table.rows.every((row) => row.barStart === 0)).toBe(true);
      // Zero is the start of the scale here, so the canvas's own `0%` at the
      // leading edge already says it and a second mark would be a duplicate.
      expect(table.floor).toBe(table.zero);
      expect(element.querySelector('.card--shield .scale__zero')).toBeNull();
    });

    it('draws hardness, module protection and integrity as three separate facts', () => {
      const build = fullyFittedBuild();
      const { component } = render(build);
      const facts = component.armourFacts();
      const metrics = BuildMetrics.of(build).armourMetrics();

      expect(facts.map((fact) => fact.label)).toEqual(['Hardness', 'Module prot.', 'Integrity']);
      expect(facts[1]?.value).toBe(
        new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 0 }).format(
          metrics.moduleProtection,
        ),
      );
      expect(facts[2]?.value).toBe(
        new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(metrics.moduleArmour),
      );
    });
  });

  describe('the source rows', () => {
    it('carries the package aggregate for each role, the first without a sign', () => {
      const build = fullyFittedBuild();
      const { component } = render(build);
      const shield = BuildMetrics.of(build).shieldMetricsResult().value!;
      const whole = new Intl.NumberFormat('en', { maximumFractionDigits: 0 });

      const rows = component.shieldSources();
      expect(rows.map((row) => row.id)).toEqual([
        'shieldGenerator',
        'shieldBooster',
        'shieldReinforcement',
      ]);
      expect(rows[0]?.contribution).toBe(`${whole.format(shield.generator)} MJ`);
      expect(rows[1]?.contribution).toBe(`+${whole.format(shield.boosters)} MJ`);
    });

    it('names a row after the module every mount in it holds, and counts them', () => {
      const booster = getModuleBySymbol('Hpt_ShieldBooster_Size0_Class1')!;
      const { component } = render(
        readyBuild().setModule('TinyHardpoint1', booster).setModule('TinyHardpoint2', booster),
      );
      const boosters = component.shieldSources().find((row) => row.id === 'shieldBooster');

      expect(boosters?.name?.text).toBe('Shield Booster');
      expect(boosters?.count).toBe('×2');
      expect(boosters?.roleLabel).toBeNull();
    });

    it('names a row after the role when its mounts hold different modules', () => {
      // Two boosters of different ratings: no one module names the row, so what
      // the row does names it instead.
      const { component } = render(fullyFittedBuild());
      const boosters = component.shieldSources().find((row) => row.id === 'shieldBooster');

      expect(boosters?.name).toBeNull();
      expect(boosters?.roleLabel).toBe('Shield boosters');
      expect(boosters?.count).toBe('×2');
    });

    it('draws no size or rating on the bulkhead row', () => {
      const { component } = render(fullyFittedBuild());
      const bulkhead = component.armourSources().find((row) => row.id === 'bulkhead');

      expect(bulkhead?.moduleClass).toBeNull();
      expect(bulkhead?.rating).toBeNull();
    });

    it('gathers Guardian and ordinary hull reinforcement into the package aggregate', () => {
      const build = fullyFittedBuild();
      const { component } = render(build);
      const reinforcement = component.armourSources().find((row) => row.id === 'hullReinforcement');

      expect(reinforcement?.contribution).toBe(
        `+${new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(
          BuildMetrics.of(build).armourMetrics().reinforcement,
        )} HP`,
      );
    });
  });

  describe('the cell bank reserve', () => {
    it('draws no line at all when no bank is aboard', () => {
      expect(render(readyBuild()).component.bankRow()).toBeNull();
    });

    it('states the package total and names every bank aboard', () => {
      const build = bankedBuild();
      const { component } = render(build);
      const summary = BuildMetrics.of(build).cellBanks();
      const row = component.bankRow();

      expect(row?.restorable).toBe(
        `${new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(
          summary.totalRestorable,
        )} MJ`,
      );
      expect(row?.unpowered).toBe(false);
      // Three banks aboard, two of them the same module in the same state: the
      // pair is one line carrying the canvas's `×2`, and the odd one is its own.
      expect(summary.banks).toHaveLength(3);
      expect(row?.banks).toHaveLength(2);
      expect(row?.banks.map((bank) => bank.count)).toEqual([null, '×2']);
    });

    it('lists banks of different sizes apart from each other', () => {
      const { component } = render(bankedBuild());
      const banks = component.bankRow()?.banks ?? [];

      // A size-4 bank and a size-6 bank restore different amounts, and a line
      // summing them would state neither.
      expect(banks.map((bank) => bank.moduleClass).sort()).toEqual([4, 6]);
      expect(new Set(banks.map((bank) => bank.detail)).size).toBe(banks.length);
    });

    it('lists a bank the plant does not feed apart from an identical one it does', () => {
      const { component } = render(bankedBuild().setModuleEnabled('Slot09_Size4', false));
      const banks = component.bankRow()?.banks ?? [];

      // The two size-4 banks are the same module, so only their power tells
      // them apart — and it has to, because one of them restores nothing.
      expect(banks).toHaveLength(3);
      expect(banks.filter((bank) => bank.detail.endsWith('Unpowered'))).toHaveLength(1);
      expect(banks.every((bank) => bank.count === null)).toBe(true);
    });

    it('draws every bar in the block on the block’s own scale', () => {
      const build = bankedBuild();
      const { component } = render(build);
      const reserve = component.bankRow()!;
      const summary = BuildMetrics.of(build).cellBanks();
      const largest = Math.max(...summary.banks.map((bank) => bank.reinforcement));

      // The reserve is the largest figure in the block, so it fills the track
      // and every bank is the share of it one activation puts back — the rule
      // the source rows above already follow.
      expect(reserve.fill).toBe(1);
      for (const bank of reserve.banks) {
        expect(bank.fill).toBeGreaterThan(0);
        expect(bank.fill).toBeLessThan(1);
      }
      expect(Math.max(...reserve.banks.map((bank) => bank.fill ?? 0))).toBeCloseTo(
        largest / summary.totalRestorable,
        6,
      );
    });

    it('states the figure every bank bar was drawn from beside it', () => {
      const build = bankedBuild();
      const { component } = render(build);
      const banks = component.bankRow()?.banks ?? [];
      const restored = BuildMetrics.of(build)
        .cellBanks()
        .banks.map((bank) => `${new Intl.NumberFormat('en').format(bank.reinforcement)} MJ`);

      // A bar carries no reading of its own, so what it was drawn from is on
      // the same row as a figure.
      for (const bank of banks) {
        expect(restored).toContain(bank.reinforcement);
      }
    });

    it('hatches the bar of a bank the plant does not feed', () => {
      const { element } = render(bankedBuild().setModuleEnabled('Slot09_Size4', false));
      const rows = [...element.querySelectorAll('.reserve__banks .source')];

      // The hatch is supplemental: the same row says the word in its code line.
      expect(rows).toHaveLength(3);
      expect(rows.filter((row) => row.classList.contains('source--off'))).toHaveLength(1);
    });

    it('keeps the line and says so in a word when nothing aboard is switched on', () => {
      // Fitted banks with both totals at zero are not the same state as no banks
      // fitted, and the line has to keep saying which one this is.
      const { component } = render(unpoweredBanksBuild());
      const row = component.bankRow();

      expect(row).not.toBeNull();
      expect(row?.unpowered).toBe(true);
      expect(row?.banks.length).toBeGreaterThan(0);
      expect(row?.banks.every((bank) => bank.detail.endsWith('Unpowered'))).toBe(true);
    });
  });
});
