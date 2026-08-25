import { TestBed } from '@angular/core/testing';
import { BuildMetrics } from '@elite-dangerous-almanac/core/ships/build-metrics';
import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { BuildCandidate } from '../../../../application/active-build/active-build.models';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import { PowerConditionsStore } from '../../../../application/power-heat/power-conditions.store';
import {
  shedBandBuild,
  sustainedOverheatBuild,
  withinBudgetBuild,
} from '../../../../domain/power-heat/power-heat.fixtures';
import { provideLocalization } from '../../../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../../../i18n/testing/localization-harness';
import { PowerSummary } from './power-summary';

/**
 * The rail's two built contributions, from the outside.
 *
 * As much of this suite is about absence as about presence. The canvas draws
 * one sentence in this block and one `POWER` line under it, and — since its
 * 2026-08-25 revision — a pip control this feature has not built yet
 * (`specs/005-power-and-heat/tasks.md`, T074). What neither canvas draws is a
 * severity word or an all-clear line on a build whose plant covers everything.
 * The heat sentence is drawn — canvas 1d prints one — and is absent here
 * because wave 13 withdrew that tier, not because nothing drew it. Each of those comes back the moment somebody adds it, and each
 * has a test here that fails when it does; the pips are the one absence here
 * that is an open task rather than a rule.
 */
describe('PowerSummary', () => {
  let active: ActiveBuildStore;

  function candidateFor(loadout: ShipLoadout): BuildCandidate {
    return {
      loadout,
      hullName: 'Anaconda',
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
    const fixture = TestBed.createComponent(PowerSummary);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideLocalization(), ...provideIsolatedLocaleEnvironment()],
    });
    active = TestBed.inject(ActiveBuildStore);
  });

  it('draws nothing at all without a build', () => {
    const element = render(null);

    expect(element.textContent?.trim()).toBe('');
  });

  it('draws the POWER line with the lit draw against the plant output', () => {
    const build = withinBudgetBuild();
    const budget = BuildMetrics.of(build).powerBudget();
    const element = render(build);

    const figures = element.querySelector('.rail-power__figures')?.textContent ?? '';
    expect(figures).toContain(budget.deployed.toFixed(2));
    expect(figures).toContain(budget.available.toFixed(2));
    expect(element.querySelector('.rail-power__label')?.textContent?.trim()).toBe('Power');
  });

  it('names the unpowered remainder after the plant output, as the canvas does', () => {
    const build = shedBandBuild();
    const budget = BuildMetrics.of(build).powerBudget();
    const shed = budget.bands
      .filter((band) => !band.poweredDeployed)
      .reduce((total, band) => total + band.deployed, 0);
    const element = render(build);

    // The canvas's `29.64 / 31.20 MW · 7.80 OFF`: the first figure is the draw
    // the plant keeps lit rather than the whole demand, and the last is what is
    // left dark.
    const figures = element.querySelector('.rail-power__figures')?.textContent ?? '';
    expect(shed).toBeGreaterThan(0);
    expect(figures).toContain((budget.deployed - shed).toFixed(2));
    expect(figures).toContain(shed.toFixed(2));
  });

  it('states no remainder on a build with nothing dark', () => {
    const element = render(withinBudgetBuild());

    // A zero the artboard never draws is not printed in its place.
    expect(element.querySelector('.rail-power__figures')?.textContent?.toLowerCase()).not.toContain(
      'off',
    );
  });

  it('draws the bar the canvas draws, over the whole demand', () => {
    const build = shedBandBuild();
    const budget = BuildMetrics.of(build).powerBudget();
    const element = render(build);

    // The artboard's `79%`, `21%` and `83.3%` are the same figures as the line
    // above divided by the whole demand, so a build that sheds a group scales
    // the track to its demand and marks where the plant runs out.
    const bar = element.querySelector('.rail-bar');
    const width = (selector: string) =>
      Number.parseFloat(
        (bar?.querySelector(selector) as HTMLElement | null)?.style.inlineSize ?? '0',
      );
    const start = (selector: string) =>
      Number.parseFloat(
        (bar?.querySelector(selector) as HTMLElement | null)?.style.insetInlineStart ?? '0',
      );

    expect(bar).not.toBeNull();
    expect(width('.rail-bar__powered') + width('.rail-bar__unpowered')).toBeCloseTo(100, 6);
    expect(start('.rail-bar__unpowered')).toBeCloseTo(width('.rail-bar__powered'), 6);
    expect(start('.rail-bar__plant')).toBeCloseTo((budget.available / budget.deployed) * 100, 6);
  });

  it('marks the plant at the end of a track a covered build cannot overrun', () => {
    const element = render(withinBudgetBuild());

    // Scaled to the plant rather than the demand where the plant is the larger,
    // so the mark stays on the track instead of running off the end of it.
    const plant = element.querySelector('.rail-bar__plant') as HTMLElement | null;
    expect(Number.parseFloat(plant?.style.insetInlineStart ?? '0')).toBeCloseTo(100, 6);
  });

  it('names the bar rather than leaving it a shape to guess at', () => {
    const element = render(shedBandBuild());

    const bar = element.querySelector('.rail-bar');
    expect(bar?.getAttribute('role')).toBe('img');
    expect(bar?.getAttribute('aria-label')).toMatch(/%/u);
  });

  it('says nothing about a build whose plant covers every group', () => {
    const element = render(withinBudgetBuild());

    // Not an all-clear line and not a zero count: neither canvas draws such a
    // state, and silence claims strictly less than an all-clear would.
    expect(element.querySelector('.statements')).toBeNull();
    expect(element.querySelector('.rail-power')).not.toBeNull();
  });

  it('states one sentence per shed group, naming it and its own draw', () => {
    const build = shedBandBuild();
    const shed = BuildMetrics.of(build)
      .powerBudget()
      .bands.filter((band) => !band.poweredDeployed);
    const element = render(build);

    const statements = [...element.querySelectorAll('.statement')];
    expect(statements).toHaveLength(shed.length);
    expect(statements.length).toBeGreaterThan(0);
    for (const band of shed) {
      const sentence = statements.find((node) =>
        (node.textContent ?? '').includes(`Priority group ${band.priority}`),
      );
      expect(sentence?.textContent).toContain(band.deployed.toFixed(2));
    }
  });

  it('draws no sentence the canvas does not print in this block', () => {
    const build = sustainedOverheatBuild();
    expect(BuildMetrics.of(build).heatMetrics()?.firingSustained.overheats).toBe(true);
    const element = render(build);

    // A build that cooks itself under sustained fire says so in the heat
    // profile, which is the block that draws it. The rail's block holds the
    // unpowered sentence and nothing else, however hot the build gets.
    const statements = [...element.querySelectorAll('.statement')];
    const shed = BuildMetrics.of(build)
      .powerBudget()
      .bands.filter((band) => !band.poweredDeployed);
    expect(statements).toHaveLength(shed.length);
  });

  it('names no severity, because the canvas draws none here', () => {
    const element = render(shedBandBuild());

    // The sentence says the group is unpowered; a word standing beside it to
    // grade that is a word the design does not draw.
    const text = element.textContent ?? '';
    expect(text).not.toContain('Danger');
    expect(text).not.toContain('Caution');
    expect(element.querySelector('.visually-hidden')).toBeNull();
  });

  it('reads the deployed state whatever the dashboard is showing', () => {
    const build = shedBandBuild();
    TestBed.inject(PowerConditionsStore).showHardpoints('retracted');
    const element = render(build);

    // The rail states what this build does, not what the dashboard is set to:
    // a group shed with the hardpoints out is shed whether or not a Commander
    // is currently reading the stowed figures.
    const shed = BuildMetrics.of(build)
      .powerBudget()
      .bands.filter((band) => !band.poweredDeployed);
    expect(element.querySelectorAll('.statement')).toHaveLength(shed.length);
    expect(element.querySelector('.rail-power__figures')?.textContent).toContain(
      BuildMetrics.of(build).powerBudget().available.toFixed(2),
    );
  });

  it('holds no control of any kind', () => {
    const element = render(shedBandBuild());

    // None is built here yet. The canvas draws one — the pip control of its
    // 2026-08-25 revision — and this feature has not reached it (T074), so this
    // holds until that task and is the assertion it has to update. Until then
    // the dashboard these sentences describe is one segment away at both
    // widths.
    expect(element.querySelectorAll('button, a, input, select, textarea')).toHaveLength(0);
  });
});
