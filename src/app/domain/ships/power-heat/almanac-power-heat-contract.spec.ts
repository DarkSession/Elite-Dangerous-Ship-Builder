import { BuildMetrics } from '@elite-dangerous-almanac/core/ships/build-metrics';
import {
  divergentBandBuild,
  distributorOffBuild,
  noPlantOutputBuild,
  overheatingBuild,
  shedBandBuild,
  withinBudgetBuild,
} from './power-heat.fixtures';

/**
 * The package contract this feature projects.
 *
 * Narrow on purpose. This is not a characterization of the Almanac — that is
 * the package's own suite's job. What is pinned here is the handful of shapes
 * feature 005 would silently misread if a release changed them: which fields
 * exist, which of them mean "there is no answer", and which sentinel carries
 * that meaning. Each of the three is a different one — a `CalculationResult`
 * that is not `complete` for a whole result, `null` for one field, and
 * `Infinity` for another — and a screen that confused any two of them would say
 * something the package did not. Feature 005 reads only the `value`, but the
 * shape it is read off is pinned whole: an incomplete result is the one carrier
 * of "there is no answer" since Almanac 0.2.2 withdrew the nullable twins, so
 * `complete` and a non-empty `issues` are pinned beside the `null` here.
 */
describe('the Almanac contract for power, distributor and heat', () => {
  describe('powerBudget()', () => {
    it('publishes the plant, both totals and the three deployed summaries', () => {
      const budget = BuildMetrics.of(withinBudgetBuild()).powerBudget();

      expect(Number.isFinite(budget.available)).toBe(true);
      expect(Number.isFinite(budget.deployed)).toBe(true);
      expect(Number.isFinite(budget.retracted)).toBe(true);
      expect(Number.isFinite(budget.headroom)).toBe(true);
      expect(typeof budget.utilisation).toBe('number');
      expect(typeof budget.withinBudget).toBe('boolean');
    });

    it('publishes five bands carrying both draws, both totals and both verdicts', () => {
      const bands = BuildMetrics.of(withinBudgetBuild()).powerBudget().bands;

      expect(bands).toHaveLength(5);
      expect(bands.map((band) => band.priority)).toEqual([1, 2, 3, 4, 5]);
      for (const band of bands) {
        expect(Number.isFinite(band.deployed)).toBe(true);
        expect(Number.isFinite(band.retracted)).toBe(true);
        expect(Number.isFinite(band.deployedTotal)).toBe(true);
        expect(Number.isFinite(band.retractedTotal)).toBe(true);
        expect(typeof band.poweredDeployed).toBe('boolean');
        expect(typeof band.poweredRetracted).toBe('boolean');
      }
    });

    it('publishes one consumer per drawing module, with its exact slot key', () => {
      const consumers = BuildMetrics.of(withinBudgetBuild()).powerBudget().consumers;

      expect(consumers.length).toBeGreaterThan(0);
      for (const consumer of consumers) {
        expect(typeof consumer.label).toBe('string');
        expect(Number.isFinite(consumer.draw)).toBe(true);
        expect(typeof consumer.enabled).toBe('boolean');
        expect(consumer.priority).toBeGreaterThanOrEqual(1);
        expect(consumer.priority).toBeLessThanOrEqual(5);
        expect(typeof consumer.deployedOnly).toBe('boolean');
      }
      // The exact journal slot key, which is the whole basis of the mount
      // overlay and of every row's slot action.
      expect(consumers.map((consumer) => consumer.label)).toContain('MainEngines');
    });

    it('keeps a switched-off module in the list, with its own draw', () => {
      const consumer = BuildMetrics.of(distributorOffBuild())
        .powerBudget()
        .consumers.find((entry) => entry.label === 'PowerDistributor');

      expect(consumer?.enabled).toBe(false);
      expect(consumer?.draw).toBeGreaterThan(0);
    });

    it('reports a band that a small plant sheds in both states', () => {
      const band = BuildMetrics.of(shedBandBuild()).powerBudget().bands[4];

      expect(band.poweredDeployed).toBe(false);
      expect(band.poweredRetracted).toBe(false);
    });

    it('reports a band whose two verdicts disagree', () => {
      const band = BuildMetrics.of(divergentBandBuild()).powerBudget().bands[4];

      expect(band.poweredRetracted).toBe(true);
      expect(band.poweredDeployed).toBe(false);
    });

    it('reports infinite utilisation, not a large number, with no plant output', () => {
      const budget = BuildMetrics.of(noPlantOutputBuild()).powerBudget();

      expect(budget.available).toBe(0);
      expect(budget.deployed).toBeGreaterThan(0);
      expect(budget.utilisation).toBe(Infinity);
      expect(budget.withinBudget).toBe(false);
    });
  });

  describe('distributorMetricsResult()', () => {
    it('returns three capacitors and echoes the allocation it used', () => {
      const metrics = BuildMetrics.of(withinBudgetBuild()).distributorMetricsResult({
        systemsPips: 2,
        enginesPips: 2,
        weaponsPips: 2,
      }).value;

      expect(metrics).not.toBeNull();
      expect(metrics?.pips).toEqual({ systems: 2, engines: 2, weapons: 2 });
      for (const bank of [metrics?.systems, metrics?.engines, metrics?.weapons]) {
        expect(Number.isFinite(bank?.capacity)).toBe(true);
        expect(Number.isFinite(bank?.ratedRecharge)).toBe(true);
        expect(Number.isFinite(bank?.rechargeRate)).toBe(true);
      }
    });

    it('accepts every whole allocation the artboard draws, including none', () => {
      const metrics = BuildMetrics.of(withinBudgetBuild()).distributorMetricsResult({
        systemsPips: 0,
        enginesPips: 4,
        weaponsPips: 2,
      }).value;

      // A genuine zero, which is a real recharge rate and not an absent one.
      expect(metrics?.systems.rechargeRate).toBe(0);
      expect(metrics?.systems.capacity).toBeGreaterThan(0);
    });

    it('leaves capacity alone when the allocation changes', () => {
      const build = withinBudgetBuild();
      const four = BuildMetrics.of(build).distributorMetricsResult({ systemsPips: 4 }).value;
      const none = BuildMetrics.of(build).distributorMetricsResult({ systemsPips: 0 }).value;

      expect(none?.systems.capacity).toBe(four?.systems.capacity);
      expect(none?.systems.ratedRecharge).toBe(four?.systems.ratedRecharge);
      expect(none?.systems.rechargeRate).not.toBe(four?.systems.rechargeRate);
    });

    it('values null — not zeroed capacitors — for a distributor it cannot resolve', () => {
      for (const build of [distributorOffBuild(), noPlantOutputBuild()]) {
        const result = BuildMetrics.of(build).distributorMetricsResult();

        // The three halves of one absence: the result object is always there,
        // `complete` is what says there is no answer, and the reasons are never
        // an empty list standing in for one.
        expect(result.complete).toBe(false);
        expect(result.value).toBeNull();
        expect(result.issues.length).toBeGreaterThan(0);
      }
    });

    it('carries no issue beside a complete distributor', () => {
      const result = BuildMetrics.of(withinBudgetBuild()).distributorMetricsResult();

      expect(result.complete).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.value).not.toBeNull();
    });
  });

  describe('heatMetricsResult()', () => {
    it('publishes three profile facts and exactly five scenarios', () => {
      const heat = BuildMetrics.of(withinBudgetBuild()).heatMetricsResult().value;

      expect(heat).not.toBeNull();
      expect(Number.isFinite(heat?.heatEfficiency)).toBe(true);
      expect(Number.isFinite(heat?.hullHeatCapacity)).toBe(true);
      expect(Number.isFinite(heat?.hullHeatDissipation)).toBe(true);
      for (const state of [
        heat?.idle,
        heat?.thrusters,
        heat?.fsdCharging,
        heat?.firingSustained,
        heat?.firingDrained,
      ]) {
        expect(Number.isFinite(state?.thermalLoad)).toBe(true);
        expect(typeof state?.overheats).toBe('boolean');
      }
    });

    it('reports a settling scenario as a level that never reaches the gauge', () => {
      const idle = BuildMetrics.of(withinBudgetBuild()).heatMetricsResult().value?.idle;

      expect(Number.isFinite(idle?.heatLevel)).toBe(true);
      expect(idle?.overheats).toBe(false);
      expect(idle?.secondsToOverheat).toBeNull();
    });

    it('reports a non-settling scenario as infinity, and times its climb', () => {
      const heat = BuildMetrics.of(overheatingBuild()).heatMetricsResult().value;

      expect(heat?.firingDrained.heatLevel).toBe(Infinity);
      expect(heat?.firingDrained.gauge).toBe(Infinity);
      expect(heat?.firingDrained.overheats).toBe(true);
      expect(Number.isFinite(heat?.firingDrained.secondsToOverheat)).toBe(true);

      // The same build's sustained fire settles, so the two sentinels are
      // properties of a scenario rather than of a build.
      expect(Number.isFinite(heat?.firingSustained.heatLevel)).toBe(true);
      expect(heat?.firingSustained.secondsToOverheat).toBeNull();
    });

    it('values null — not a zeroed profile — with no powered plant', () => {
      const result = BuildMetrics.of(noPlantOutputBuild()).heatMetricsResult();

      expect(result.complete).toBe(false);
      expect(result.value).toBeNull();
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('carries no issue beside a complete profile', () => {
      const result = BuildMetrics.of(withinBudgetBuild()).heatMetricsResult();

      expect(result.complete).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.value).not.toBeNull();
    });

    it('still returns five scenarios for a build with no weapons fitted', () => {
      const build = withinBudgetBuild();
      for (const slot of ['SmallHardpoint1', 'SmallHardpoint2']) {
        build.removeModule(slot);
      }
      const heat = BuildMetrics.of(build).heatMetricsResult().value;

      expect(heat).not.toBeNull();
      expect(heat?.firingSustained.thermalLoad).toBeGreaterThanOrEqual(0);
      expect(heat?.firingDrained.thermalLoad).toBeGreaterThanOrEqual(0);
    });
  });
});
