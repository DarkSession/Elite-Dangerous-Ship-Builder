import { TestBed } from '@angular/core/testing';
import { BuildMetrics } from '@elite-dangerous-almanac/core/ships/build-metrics';
import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { BuildCandidate } from '../../../../application/active-build/active-build.models';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import { OutfittingStore } from '../../../../application/outfitting/outfitting.store';
import { PowerConditionsStore } from '../../../../application/power-heat/power-conditions.store';
import {
  distributorOffBuild,
  noPlantOutputBuild,
  overheatingBuild,
  shedBandBuild,
  withinBudgetBuild,
} from '../../../../domain/power-heat/power-heat.fixtures';
import { provideLocalization } from '../../../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../../../i18n/testing/localization-harness';
import { PowerThermals } from './power-thermals';

/**
 * The dashboard, from the outside.
 *
 * Every assertion below is against the package's own answer for the same build,
 * never against a number written here: a suite that pinned `11.78 MW` would
 * pass a release that changed what the Almanac says and fail one that did not.
 *
 * The other half of the suite is about meaning being carried by words. The
 * canvas says `OFFLINE` with a dimmed row, `WITHIN LIMIT` with a green tick and
 * a filled block for a pip; a reader who cannot see any of that has to get the
 * same facts, so the tests read text rather than classes wherever the fact is
 * the point.
 */
describe('PowerThermals', () => {
  let active: ActiveBuildStore;
  let conditions: PowerConditionsStore;

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
    const fixture = TestBed.createComponent(PowerThermals);
    fixture.detectChanges();
    return {
      element: fixture.nativeElement as HTMLElement,
      component: fixture.componentInstance,
      detect: () => fixture.detectChanges(),
    };
  }

  function cells(element: HTMLElement, selector: string): string[][] {
    return [...element.querySelectorAll(`${selector} tbody tr`)].map((row) =>
      [...row.querySelectorAll('th, td')].map((cell) => (cell.textContent ?? '').trim()),
    );
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
    // exception or a row of dashes. The workspace's own empty state already
    // says why there is nothing.
    const { component } = render(null);

    expect(component.shown()).toBe(false);
    expect(component.bandRows()).toEqual([]);
    expect(component.summaryMetrics()).toEqual([]);
    expect(component.moduleRows()).toEqual([]);
    expect(component.heatFacts()).toEqual([]);
    expect(component.heatBars()).toEqual([]);
    expect(component.bankRows()).toEqual([]);
    expect(component.modulesTotal()).toBeNull();
    expect(component.heatAvailable()).toBe(false);
    expect(component.distributorAvailable()).toBe(false);
  });

  describe('the priority groups', () => {
    it('draws the groups the build uses, in the package’s order', () => {
      const build = withinBudgetBuild();
      const budget = BuildMetrics.of(build).powerBudget();
      // The game has five and the package returns five; a group nothing is
      // assigned to is not a reading of this build, so it is not a row.
      const used = new Set(budget.consumers.map((consumer) => consumer.priority));
      const bands = budget.bands.filter((band) => used.has(band.priority));
      const { element } = render(build);

      expect(bands.length).toBeGreaterThan(0);
      const rows = [...element.querySelectorAll('.power__block--bands .power__band')];
      expect(rows).toHaveLength(bands.length);
      expect(rows.map((row) => row.querySelector('.power__band-group')?.textContent)).toEqual(
        bands.map((band) => `Group ${band.priority}`),
      );
    });

    it('carries each group’s own draw and its running total', () => {
      const build = withinBudgetBuild();
      const first = BuildMetrics.of(build).powerBudget().bands[0];
      const { element } = render(build);

      const row = element.querySelector('.power__block--bands .power__band');
      expect(row?.querySelector('.power__band-draw')?.textContent).toBe(
        `${first.deployed.toFixed(2)} MW`,
      );
      // The canvas's third column is the running total as a share of plant
      // output, which the projection publishes and this reads back.
      const share = first.deployedTotal / BuildMetrics.of(build).powerBudget().available;
      expect(row?.querySelector('.power__band-share')?.textContent).toBe(
        `${Math.round(share * 100)}%`,
      );
    });

    it('states every group’s verdict in words, not only the shed one', () => {
      const build = shedBandBuild();
      const budget = BuildMetrics.of(build).powerBudget();
      const used = new Set(budget.consumers.map((consumer) => consumer.priority));
      const bands = budget.bands.filter((band) => used.has(band.priority));
      const { element } = render(build);

      // The canvas prints `OFFLINE` in place of a shed group's percentage, and
      // the percentage where the plant keeps the group lit. The word is the
      // reading rather than the bar's colour, so a reader who cannot see the
      // fill still gets it.
      const states = [...element.querySelectorAll('.power__block--bands .power__band')].map(
        (row) => row.querySelector('.power__band-state')?.textContent?.trim() ?? null,
      );
      expect(states).toEqual(bands.map((band) => (band.poweredDeployed ? null : 'Offline')));
      expect(states).toContain('Offline');
      expect(states.filter((state) => state === null).length).toBeGreaterThan(0);
    });
  });

  describe('the plant summary', () => {
    it('draws the canvas’s three tiles and nothing beside them', () => {
      const build = withinBudgetBuild();
      const budget = BuildMetrics.of(build).powerBudget();
      const { element } = render(build);

      const summary = element.querySelector('.power__summary')?.textContent ?? '';
      expect(summary).toContain(budget.available.toFixed(2));
      expect(summary).toContain(budget.deployed.toFixed(2));
      expect(summary).toContain('Plant output');
      expect(summary).toContain('Unpowered');
      // The canvas draws no headroom, no utilisation and no verdict beside
      // these, so neither does this.
      expect(summary).not.toContain('Headroom');
      expect(summary).not.toContain('Utilisation');
      expect(summary).not.toContain('Verdict');
    });

    it('states all three tiles in either hardpoint state', () => {
      const build = withinBudgetBuild();
      const budget = BuildMetrics.of(build).powerBudget();
      conditions.showHardpoints('retracted');
      const { element } = render(build);

      // Every tile the canvas draws holds with the hardpoints stowed, which is
      // why there is no sentence about figures that went missing: none did.
      const summary = element.querySelector('.power__summary')?.textContent ?? '';
      expect(summary).toContain(budget.retracted.toFixed(2));
      expect(summary).toContain('Plant output');
      expect(summary).toContain('Unpowered');
      expect(element.querySelector('.power__block--bands .power__note--inline')?.textContent).toBe(
        'Cumulative draw',
      );
    });

    it('states a shed group’s demand rather than a share of a plant not feeding it', () => {
      const build = noPlantOutputBuild();
      const { element } = render(build);

      const summary = element.querySelector('.power__summary')?.textContent ?? '';
      expect(summary).not.toContain('Infinity');
      expect(summary).not.toContain('∞');
      expect(summary).toContain(BuildMetrics.of(build).powerBudget().deployed.toFixed(2));
      // No plant output is no share to state: the groups say `Offline` where
      // the percentage would go, and no bar claims a fraction of nothing.
      const shares = element.querySelectorAll('.power__block--bands .power__band-share');
      expect(shares).toHaveLength(0);
      expect(element.querySelector('.power__plant')).toBeNull();
    });
  });

  describe('draw by module', () => {
    it('draws one line per kind of consumer, heaviest first', () => {
      const build = withinBudgetBuild();
      const consumers = BuildMetrics.of(build).powerBudget().consumers;
      const { element } = render(build);

      const rows = [...element.querySelectorAll('.module')];
      const heaviest = [...consumers].sort((left, right) => right.draw - left.draw)[0];

      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].textContent).toContain(heaviest.draw.toFixed(2));
    });

    it('gathers two mounts of one module onto one line, counted and added up', () => {
      const build = withinBudgetBuild();
      const repeated = BuildMetrics.of(build)
        .powerBudget()
        .consumers.filter((consumer) => consumer.symbol === 'Hpt_PulseLaser_Fixed_Small');
      const { element } = render(build);

      expect(repeated.length).toBeGreaterThan(1);
      const gathered = [...element.querySelectorAll('.module')].filter((node) =>
        node.textContent?.includes(`×${repeated.length}`),
      );
      const added = repeated.reduce((total, consumer) => total + consumer.draw, 0);

      expect(gathered).toHaveLength(1);
      expect(gathered[0]?.textContent).toContain(added.toFixed(2));
    });

    it('states the whole list’s draw beside the heading, dark groups included', () => {
      const build = withinBudgetBuild();
      const { element } = render(build);

      const note = element.querySelector('.power__block--modules .power__note');
      expect(note?.textContent).toContain(BuildMetrics.of(build).powerBudget().deployed.toFixed(2));
    });

    it('keeps a switched-off consumer on the list, at zero, and says it is off', () => {
      const build = distributorOffBuild();
      const consumer = BuildMetrics.of(build)
        .powerBudget()
        .consumers.find((entry) => entry.label === 'PowerDistributor');
      const { element } = render(build);

      // Listed rather than dropped, at the nothing it draws, and named as off
      // rather than left to be inferred from a zero.
      expect(consumer?.enabled).toBe(false);
      const off = [...element.querySelectorAll('.module')].filter((node) =>
        (node.textContent ?? '').includes('Off'),
      );
      expect(off.length).toBeGreaterThan(0);
      expect(off[0]?.querySelector('.module__draw')?.textContent).toContain('0.00');
    });

    it('lists a stowed hardpoint at zero rather than at what it would draw', () => {
      const build = withinBudgetBuild();
      const { component } = render(build);
      const deployed = component.moduleRows().length;

      TestBed.inject(PowerConditionsStore).showHardpoints('retracted');
      const retracted = component.moduleRows();

      // The same lines, and the weapons among them reading zero: a mount that
      // left the list when the hardpoints went in would be a mount a reader
      // could not account for.
      expect(retracted).toHaveLength(deployed);
      expect(retracted.some((row) => row.draw.includes('0.00'))).toBe(true);
    });

    it('names the group on the lines the plant leaves dark, and nowhere else', () => {
      const build = shedBandBuild();
      const dark = BuildMetrics.of(build)
        .powerBudget()
        .bands.filter((band) => !band.poweredDeployed);
      const { element } = render(build);

      const named = [...element.querySelectorAll('.module')].filter((node) =>
        node.querySelector('.module__group'),
      );

      expect(dark.length).toBeGreaterThan(0);
      expect(named.length).toBeGreaterThan(0);
      for (const node of named) {
        expect(node.classList).toContain('module--offline');
        expect(dark.some((band) => node.textContent?.includes(`Group ${band.priority}`))).toBe(
          true,
        );
      }
    });
  });

  describe('the heat profile', () => {
    it('draws the canvas’s bars, in its order, named as it names them', () => {
      const { element } = render(withinBudgetBuild());

      const names = [...element.querySelectorAll('.heat__name')].map((node) => node.textContent);
      // The five the package returns plus the cell-bank spike it declines to
      // publish as one, where a bank is fitted to spike.
      expect(names.slice(0, 5)).toEqual([
        'Idle · retracted',
        'Cruise · full throttle',
        'FSD charging',
        'Weapons alpha',
        'Sustained weapon fire',
      ]);
      expect(names.length).toBeLessThanOrEqual(6);
      if (names.length === 6) {
        expect(names[5]).toBe('Shield cell bank');
      }
    });

    it('reads each bar as the gauge reads it, beside the bar it drew', () => {
      const build = withinBudgetBuild();
      const idle = BuildMetrics.of(build).heatMetrics()?.idle;
      const { element } = render(build);

      const first = element.querySelector('.heat__bar');
      expect(first?.querySelector('.heat__level')?.textContent?.trim()).toBe(
        `${Math.round((idle?.gauge ?? 0) * 100)}%`,
      );
      // A level that settles is a number and carries no second reading beside
      // it: there is nothing standing in for it to explain.
      expect(first?.querySelector('.heat__level .visually-hidden')).toBeNull();
      expect(first?.classList).not.toContain('heat__bar--over');
    });

    it('reads a load that never settles as the symbol, worded beside it', () => {
      const build = overheatingBuild();
      const { element } = render(build);

      expect(BuildMetrics.of(build).heatMetrics()?.firingDrained.heatLevel).toBe(Infinity);
      const bar = [...element.querySelectorAll('.heat__bar')][3];
      const level = bar?.querySelector('.heat__level');

      // The symbol is what is drawn; the sentence it stands for is carried with
      // it, so the state is never a glyph a reader has to already know.
      expect(level?.firstChild?.textContent?.trim()).toBe('∞');
      expect(level?.querySelector('.visually-hidden')?.textContent).toBe('Never settles');
      expect(bar?.classList).toContain('heat__bar--over');
    });

    it('names the threshold and both fills in words, not by colour alone', () => {
      const { element } = render(withinBudgetBuild());

      expect(element.querySelector('.heat__threshold-label')?.textContent?.trim()).toBe(
        '100% module damage',
      );
      const keys = [...element.querySelectorAll('.heat__key')].map((node) =>
        node.textContent?.trim(),
      );
      expect(keys).toEqual(['Within limit', 'Over threshold']);
    });

    it('draws the canvas’s four tiles, the sinks counted from the build', () => {
      const build = withinBudgetBuild();
      const { element, component } = render(build);
      const launchers = build
        .fittedModules()
        .filter((module) => /heatsinklauncher/iu.test(module.symbol));

      expect(component.heatFacts().map((fact) => fact.label)).toEqual([
        'Resting heat',
        'Peak sustained',
        'Dissipation',
        'Heat sinks',
      ]);
      expect(component.heatFacts()[3]?.value).toBe(
        String(launchers.reduce((total, module) => total + (module.ammunition?.total ?? 0), 0)),
      );
      expect(element.querySelector('.power__block--heat .power__facts')).not.toBeNull();
    });

    it('states one unavailable group, with no hull figure standing in', () => {
      const { element } = render(noPlantOutputBuild());

      const block = element.querySelector('.power__block--heat');
      expect(block?.querySelector('edsb-unavailable-value')).not.toBeNull();
      expect(block?.querySelector('.heat')).toBeNull();
      // The rest of the dashboard is still readable.
      expect(element.querySelectorAll('.module').length).toBeGreaterThan(0);
    });
  });

  describe('the distributor', () => {
    it('draws the three banks with the package’s own figures and pips', () => {
      const build = withinBudgetBuild();
      const metrics = BuildMetrics.of(build).distributorMetrics({
        systemsPips: 2,
        enginesPips: 2,
        weaponsPips: 2,
      });
      const { element } = render(build);

      const rows = cells(element, '.distributor');
      expect(rows.map((row) => row[0])).toEqual(['SYS', 'ENG', 'WEP']);
      expect(rows[0][1]).toBe(`${metrics?.systems.capacity.toFixed(1)} MJ`);
      expect(rows[0][2]).toBe(`${metrics?.systems.ratedRecharge.toFixed(1)} MJ/s`);
      expect(rows[0][4]).toBe(`${metrics?.systems.rechargeRate.toFixed(1)} MJ/s`);
    });

    it('names the fitted distributor beside the heading', () => {
      const build = withinBudgetBuild();
      const distributor = build
        .fittedModules()
        .find((module) => /powerdistributor/iu.test(module.symbol));
      const { element } = render(build);

      const note = element.querySelector('.power__block--distributor .power__note')?.textContent;
      expect(note).toContain(
        `${distributor?.effectiveStats?.class}${distributor?.effectiveStats?.rating}`,
      );
    });

    it('draws four blocks per bank, filled to the allocation the package used', () => {
      const build = withinBudgetBuild();
      const { element } = render(build);

      const first = element.querySelector('.distributor tbody tr');
      const fills = [...(first?.querySelectorAll<HTMLElement>('.pips__fill') ?? [])].map(
        (node) => node.style.inlineSize,
      );
      // Two pips across four blocks: two full, two empty.
      expect(fills).toEqual(['100%', '100%', '0%', '0%']);
    });

    it('takes the pips it gives to one bank out of the other two', () => {
      const build = withinBudgetBuild();
      const { element, detect } = render(build);

      const before = cells(element, '.distributor');
      const rows = element.querySelectorAll('.distributor tbody tr');
      // The third block on systems: three pips there, and the other two banks
      // pay for it.
      rows[0]?.querySelectorAll<HTMLElement>('.pips__step')[2]?.click();
      detect();

      const after = cells(element, '.distributor');
      expect(after[0][4]).not.toBe(before[0][4]);
      expect(after[1][4]).not.toBe(before[1][4]);
      expect(after[2][4]).not.toBe(before[2][4]);
      // Capacity and rated recharge are properties of the fitted distributor.
      expect(after[0][1]).toBe(before[0][1]);
      expect(after[0][2]).toBe(before[0][2]);
    });

    it('shows the pips the package used rather than the ones pressed', () => {
      const build = withinBudgetBuild();
      const { element, detect, component } = render(build);

      const rows = element.querySelectorAll('.distributor tbody tr');
      rows[0]?.querySelectorAll<HTMLElement>('.pips__step')[3]?.click();
      detect();

      const used = BuildMetrics.of(build).distributorMetrics({
        systemsPips: 4,
        enginesPips: 1,
        weaponsPips: 1,
      })?.pips.systems;
      expect(component.bankRows()[0]?.pipsLabel).toContain(String(used));
    });

    it('steps a bank back when the block it already stands on is pressed', () => {
      const build = withinBudgetBuild();
      const { element, detect, component } = render(build);

      // Systems opens on two, so pressing its second block asks for one.
      const rows = element.querySelectorAll('.distributor tbody tr');
      rows[0]?.querySelectorAll<HTMLElement>('.pips__step')[1]?.click();
      detect();

      expect(component.bankRows()[0]?.pipsLabel).toContain('1');
    });

    it('states one unavailable group when the package publishes no distributor', () => {
      const { element } = render(distributorOffBuild());

      const block = element.querySelector('.power__block--distributor');
      expect(block?.querySelector('edsb-unavailable-value')).not.toBeNull();
      expect(block?.querySelector('.distributor')).toBeNull();
      // No diagnosis of which of the four reasons it was: the package gives none.
      expect(element.querySelector('.power__block--heat .heat')).not.toBeNull();
    });
  });

  describe('the conditions', () => {
    it('draws the two the canvas draws, and no draft, apply, reset or error', () => {
      const { element } = render(withinBudgetBuild());

      const segments = [...element.querySelectorAll('.power__hardpoints button')].map((node) =>
        (node.textContent ?? '').trim(),
      );
      expect(segments).toEqual(['Deployed', 'Retracted']);
      expect(element.textContent).not.toContain('Apply');
      expect(element.textContent).not.toContain('Reset');
      expect(element.querySelector('.field__error')).toBeNull();
    });

    it('switches every figure to the other state at once', () => {
      const build = withinBudgetBuild();
      const budget = BuildMetrics.of(build).powerBudget();
      const { element, detect } = render(build);

      element
        .querySelectorAll<HTMLElement>('.power__hardpoints button')[1]
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      detect();

      expect(element.querySelector('.power__block--bands .power__band-draw')?.textContent).toBe(
        `${budget.bands[0].retracted.toFixed(2)} MW`,
      );
      expect(element.querySelector('.power__summary')?.textContent).toContain(
        budget.retracted.toFixed(2),
      );
    });
  });

  it('draws every reading the canvas draws, by its own name', () => {
    const { element } = render(shedBandBuild());
    const text = element.textContent ?? '';

    // These five were argued out of the build as arithmetic this application
    // had no right to do. The canvas draws all of them, so the projection
    // publishes them and the panel says them.
    expect(text).toContain('Plant output');
    expect(text).toContain('Unpowered');
    expect(text).toContain('Priority groups');
    expect(text).toContain('Cumulative draw');
    // And none of the words the canvas has no place for, anywhere on the panel.
    expect(text).not.toContain('Headroom');
    expect(text).not.toContain('Utilisation');
    expect(text).not.toContain('Verdict');
    expect(text).not.toContain('Heat efficiency');
    expect(text).not.toContain('Heat capacity');
  });
});
