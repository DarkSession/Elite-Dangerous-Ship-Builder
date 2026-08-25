import { getPreEngineeredVariants } from '@elite-dangerous-almanac/core/ships/pre-engineered';
import {
  FIXTURE_SLOTS,
  defaultBuild,
  fixedRewardBuild,
  fixedRewardVariant,
} from '../../domain/outfitting/outfitting.fixtures';
import { MESSAGE_KEYS } from '../../i18n/locale-registry';
import {
  acquisitionLabels,
  acquisitionSection,
  catalogueSource,
  type AcquisitionLabel,
} from './acquisition-labels';
import { fittedModuleView } from './fitted-module-view';

/**
 * Restrictions are projections of package values, and they stack.
 *
 * Every assertion here is against the installed Almanac rather than against a
 * hand-written variant: what a route means and which modules carry an
 * entitlement are the package's facts, and a fixture that restated them would
 * pass while the projection was wrong.
 */

/** A resolver that reads nothing: these tests are about identity, not prose. */
const NO_TEXT = {
  moduleName: () => ({
    text: null,
    language: null,
    translationState: 'unavailable' as const,
    disclosureKey: null,
  }),
  preEngineeredVariantName: () => ({
    text: null,
    language: null,
    translationState: 'unavailable' as const,
    disclosureKey: null,
  }),
  outfittingFamilyName: () => ({
    text: null,
    language: null,
    translationState: 'unavailable' as const,
    disclosureKey: null,
  }),
};

function kinds(labels: readonly AcquisitionLabel[]): readonly string[] {
  return labels.map((label) => label.kind);
}

/** One package variant per acquisition route the installed Almanac publishes. */
function variantsByRoute(): ReadonlyMap<string, ReturnType<typeof getPreEngineeredVariants>[0]> {
  const found = new Map<string, ReturnType<typeof getPreEngineeredVariants>[0]>();
  const loadout = defaultBuild();

  for (const module of loadout.modulesForSlot(FIXTURE_SLOTS.hardpoint)) {
    for (const variant of getPreEngineeredVariants(module.symbol)) {
      if (!found.has(variant.acquisition)) {
        found.set(variant.acquisition, variant);
      }
    }
  }

  return found;
}

describe('acquisition labels', () => {
  it('gives every route the package publishes a route label and a second one', () => {
    const routes = variantsByRoute();

    // The hull's largest hardpoint carries all four; if the package ever
    // publishes a fifth this is where it shows up unhandled.
    expect(routes.size).toBeGreaterThanOrEqual(4);

    for (const [route, variant] of routes) {
      const labels = acquisitionLabels({ entitlement: null, variant });

      expect(kinds(labels)[0]).toBe(route);
      expect(labels.length).toBe(2);
      expect(labels[0]!.packageValue).toBe(route);

      const second = kinds(labels)[1];
      if (route === 'communityGoal' || route === 'eventReward') {
        expect(second).toBe('uniqueReward');
        expect(acquisitionSection(variant)).toBe('uniqueReward');
      } else {
        expect(second).toBe('notOrdinarilyAvailable');
        expect(acquisitionSection(variant)).toBe('standard');
      }
    }
  });

  it('stacks an entitlement beside a route rather than replacing it', () => {
    const variant = variantsByRoute().get('mercenary')!;

    const labels = acquisitionLabels({
      entitlement: 'ELITE_HORIZONS_V_PLANETARY_LANDINGS',
      variant,
    });

    expect(kinds(labels)).toEqual(['mercenary', 'notOrdinarilyAvailable', 'entitlement']);
    expect(labels[2]!.packageValue).toBe('ELITE_HORIZONS_V_PLANETARY_LANDINGS');
    // The raw token is disclosed, not translated away.
    expect(labels[2]!.params).toEqual({ token: 'ELITE_HORIZONS_V_PLANETARY_LANDINGS' });
  });

  it('labels an entitlement on a stock module with no route at all', () => {
    const gated = defaultBuild()
      .modulesForSlot(FIXTURE_SLOTS.optional)
      .find((module) => module.entitlement !== undefined)!;

    const labels = acquisitionLabels(catalogueSource(gated, null));

    expect(kinds(labels)).toEqual(['entitlement']);
    expect(labels[0]!.packageValue).toBe(gated.entitlement);
    expect(acquisitionSection(null)).toBe('standard');
  });

  it('tells a Powerplay module apart from every other entitlement', () => {
    // Canvas 1c draws `Advanced Plasma Accelerator` with the Powerplay icon.
    // It is not one of the package's four pre-engineered routes — it is an
    // ordinary stock module whose entitlement names a power, which is why the
    // route projection alone never reached it (module-replacement design,
    // "Acquisition icons").
    const powerplay = defaultBuild()
      .modulesForSlot(FIXTURE_SLOTS.hardpoint)
      .find((module) => module.entitlement?.startsWith('ELITE_SPECIFIC_V_POWER_') === true)!;
    expect(powerplay).toBeDefined();

    const labels = acquisitionLabels(catalogueSource(powerplay, null));

    expect(kinds(labels)).toEqual(['powerplay']);
    // The package's own token, whole. The power's id inside it stays unread:
    // naming the twelve powers would be the local catalogue FR-007 forbids.
    expect(labels[0]!.packageValue).toBe(powerplay.entitlement);
    expect(labels[0]!.params).toBeNull();
  });

  it('leaves an entitlement that names no power as the generic one', () => {
    const horizons = defaultBuild()
      .modulesForSlot(FIXTURE_SLOTS.optional)
      .find(
        (module) =>
          module.entitlement !== undefined &&
          !module.entitlement.startsWith('ELITE_SPECIFIC_V_POWER_'),
      )!;

    expect(kinds(acquisitionLabels(catalogueSource(horizons, null)))).toEqual(['entitlement']);
  });

  it('says nothing about a stock module the package puts no restriction on', () => {
    const open = defaultBuild()
      .modulesForSlot(FIXTURE_SLOTS.core)
      .find((module) => module.entitlement === undefined)!;

    expect(acquisitionLabels(catalogueSource(open, null))).toEqual([]);
  });

  it('reads a fitted article from the package rather than from the chooser row', () => {
    const build = fixedRewardBuild();
    const fitted = build
      .slots()
      .find((slot) => slot.key === FIXTURE_SLOTS.frameShiftDrive)!.module!;
    const view = fittedModuleView(fitted, NO_TEXT);

    expect(view.variant).not.toBeNull();
    expect(view.variant!.blueprintSymbol).toBe(fixedRewardVariant().blueprintSymbol);

    const labels = acquisitionLabels({ entitlement: view.entitlement, variant: view.variant });
    expect(kinds(labels)).toContain('techBroker');
  });

  it('drops the route labels when the package stops identifying a fitted variant', () => {
    const build = fixedRewardBuild();
    build.clearEngineering(FIXTURE_SLOTS.frameShiftDrive);

    const fitted = build
      .slots()
      .find((slot) => slot.key === FIXTURE_SLOTS.frameShiftDrive)!.module!;
    const view = fittedModuleView(fitted, NO_TEXT);

    // Whatever the package now says the module is, the labels follow it. The
    // application never remembers that this mount once held a reward.
    expect(view.variant).toBeNull();
    expect(
      kinds(acquisitionLabels({ entitlement: view.entitlement, variant: view.variant })),
    ).not.toContain('techBroker');
  });

  it('keeps no private table of entitlement or route names', () => {
    const routes = variantsByRoute();
    const gated = defaultBuild()
      .modulesForSlot(FIXTURE_SLOTS.optional)
      .find((module) => module.entitlement !== undefined)!;

    const everyLabel = [
      ...[...routes.values()].flatMap((variant) =>
        acquisitionLabels({ entitlement: null, variant }),
      ),
      ...acquisitionLabels(catalogueSource(gated, null)),
    ];

    for (const label of everyLabel) {
      // Every explanation is an application-owned message key, so the wording
      // is reviewed and translated here and the game's own names stay with the
      // package (FR-007, localization contract).
      expect(MESSAGE_KEYS).toContain(label.messageKey);
      // And the only package string that reaches a Commander is the exact token
      // the Almanac published, passed through untouched.
      const disclosed = Object.values(label.params ?? {});
      expect(disclosed.every((value) => value === label.packageValue || value === '')).toBe(true);
    }
  });
});
