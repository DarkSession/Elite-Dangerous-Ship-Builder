import { getLoadoutIssueMessage } from '@elite-dangerous-almanac/core/i18n/diagnostics';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { LoadoutEvent } from '@elite-dangerous-almanac/core/ships/slef';
import { FIXTURE_HULL } from '../../../../domain/outfitting/outfitting.fixtures';

/**
 * The package contract the `BUILD STATUS` block reads.
 *
 * Narrow on purpose. Characterizing the Almanac is the package's own suite's
 * job; what is pinned here is the handful of shapes this block would silently
 * misread if a release changed them — the three severity values, the order of
 * `issues`, the parameter shapes a diagnostic can carry, and the `null` that
 * makes a locale miss indistinguishable from an unknown identity.
 *
 * Every fixture below builds a real `ShipLoadout` and lets the package answer.
 * Nothing here writes down a game value.
 */

/** A payload naming a mount the hull does not have. */
const UNKNOWN_SLOT: LoadoutEvent = {
  event: 'Loadout',
  Ship: FIXTURE_HULL,
  Modules: [{ Slot: 'NoSuchSlot99', Item: 'Int_CargoRack_Size5_Class1' }],
};

/** A payload putting a hardpoint article in an optional internal. */
const INCOMPATIBLE_MODULE: LoadoutEvent = {
  event: 'Loadout',
  Ship: FIXTURE_HULL,
  Modules: [{ Slot: 'Slot01_Size7', Item: 'Hpt_PulseLaser_Fixed_Small' }],
};

/** A payload whose thrusters are rated below the mass of the fit alone. */
const THRUSTERS_BELOW_DRY_MASS: LoadoutEvent = {
  event: 'Loadout',
  Ship: FIXTURE_HULL,
  Modules: [{ Slot: 'MainEngines', Item: 'Int_Engine_Size5_Class1' }],
};

/** A payload whose thrusters carry the fit and its fuel, but not a full hold. */
const THRUSTERS_BELOW_LADEN_MASS: LoadoutEvent = {
  event: 'Loadout',
  Ship: FIXTURE_HULL,
  Modules: [
    { Slot: 'MainEngines', Item: 'Int_Engine_Size6_Class1' },
    { Slot: 'Slot01_Size7', Item: 'Int_CargoRack_Size7_Class1' },
    { Slot: 'Slot02_Size6', Item: 'Int_CargoRack_Size6_Class1' },
    { Slot: 'Slot03_Size6', Item: 'Int_CargoRack_Size6_Class1' },
    { Slot: 'Slot04_Size6', Item: 'Int_CargoRack_Size6_Class1' },
    { Slot: 'Slot05_Size5', Item: 'Int_CargoRack_Size5_Class1' },
    { Slot: 'Slot06_Size5', Item: 'Int_CargoRack_Size5_Class1' },
    { Slot: 'Slot07_Size5', Item: 'Int_CargoRack_Size5_Class1' },
    { Slot: 'Slot08_Size4', Item: 'Int_CargoRack_Size4_Class1' },
    { Slot: 'Slot09_Size4', Item: 'Int_CargoRack_Size4_Class1' },
    { Slot: 'Slot10_Size4', Item: 'Int_CargoRack_Size4_Class1' },
  ],
};

/** A payload fitting two of a family the hull allows one of. */
const DUPLICATE_EXCLUSIVE: LoadoutEvent = {
  event: 'Loadout',
  Ship: FIXTURE_HULL,
  Modules: [
    { Slot: 'Slot01_Size7', Item: 'Int_ShieldGenerator_Size7_Class3' },
    { Slot: 'Slot02_Size6', Item: 'Int_ShieldGenerator_Size6_Class3' },
  ],
};

describe('the Almanac validation contract', () => {
  describe('what a build reports', () => {
    it('reports nothing at all for a hull default', () => {
      const validation = ShipLoadout.default(FIXTURE_HULL).validation();

      // The reason the block is *absent* rather than showing an all-clear line:
      // a package with nothing to say returns an empty list, so drawing nothing
      // is a faithful rendering of it rather than a decision to stay quiet.
      expect(validation.valid).toBe(true);
      expect(validation.complete).toBe(true);
      expect(validation.issues).toEqual([]);
    });

    it('publishes valid and complete as two independent booleans', () => {
      const validation = ShipLoadout.fromLoadout(UNKNOWN_SLOT).validation();

      expect(typeof validation.valid).toBe('boolean');
      expect(typeof validation.complete).toBe('boolean');
    });

    it('cannot be made incomplete by emptying a mount', () => {
      const build = ShipLoadout.default(FIXTURE_HULL);
      const core = build.slots().find((slot) => slot.key === 'PowerPlant');

      // Every operational core mount refuses removal, which is why the block
      // never sees a `missingRequiredSlot`: the package fills fixed mounts from
      // the hull defaults and will not let a build empty them.
      expect(core?.removable).toBe(false);
      expect(build.validation().complete).toBe(true);
    });
  });

  describe('one issue', () => {
    it('carries a stable code, a severity and the build’s own slot spelling', () => {
      const [issue] = ShipLoadout.fromLoadout(UNKNOWN_SLOT).validation().issues;

      expect(issue?.code).toBe('unknownSlot');
      expect(issue?.severity).toBe('error');
      expect(issue?.slot).toBe('NoSuchSlot99');
      expect(issue?.symbol).toBe('Int_CargoRack_Size5_Class1');
      expect(typeof issue?.message).toBe('string');
    });

    it('carries language-neutral parameters, including named identities', () => {
      const [issue] = ShipLoadout.fromLoadout(DUPLICATE_EXCLUSIVE).validation().issues;

      // The parameters are what a consumer composing its own sentence would
      // need. This block composes none — it renders the package's — so what
      // matters here is only that they exist and stay language-neutral.
      expect(issue?.params).toMatchObject({
        exclusionGroup: expect.any(String),
        slot: expect.any(String),
        previousSlot: expect.any(String),
      });
    });

    it('states a machine-readable constraint behind an incompatible fit', () => {
      const [issue] = ShipLoadout.fromLoadout(INCOMPATIBLE_MODULE).validation().issues;

      expect(issue?.code).toBe('incompatibleModule');
      expect(issue?.params?.['constraint']).toBe('optionalInternalRequired');
    });

    it('publishes only the three severities the block draws', () => {
      const severities = [
        UNKNOWN_SLOT,
        INCOMPATIBLE_MODULE,
        DUPLICATE_EXCLUSIVE,
        THRUSTERS_BELOW_DRY_MASS,
        THRUSTERS_BELOW_LADEN_MASS,
      ].flatMap((event) =>
        ShipLoadout.fromLoadout(event)
          .validation()
          .issues.map((issue) => issue.severity),
      );

      // `error` and `warning` are both reachable from a build. `incomplete`
      // belongs to `missingRequiredSlot`, which a `ShipLoadout` never raises.
      // The block draws all three, because the union has three members and a
      // release that starts raising the third must not fall through to
      // nothing.
      expect(severities.length).toBeGreaterThan(0);
      expect(
        severities.every(
          (severity) => severity === 'error' || severity === 'warning' || severity === 'incomplete',
        ),
      ).toBe(true);
    });

    it('states a thruster overload at the lightest load that crosses the rating', () => {
      const [issue] = ShipLoadout.fromLoadout(THRUSTERS_BELOW_DRY_MASS).validation().issues;

      expect(issue?.code).toBe('thrusterMassExceeded');
      expect(issue?.severity).toBe('error');
      expect(issue?.params?.['load']).toBe('dry');
    });

    it('raises a warning, and leaves the build valid, for a hold-only overload', () => {
      const validation = ShipLoadout.fromLoadout(THRUSTERS_BELOW_LADEN_MASS).validation();
      const [issue] = validation.issues;

      // How much cargo to take is the pilot's decision, so the package reports
      // the overload without condemning the fit. This is the one severity that
      // stands beside `valid` and `complete`, and the reason the block draws a
      // third tier rather than reading a severity off `valid`.
      expect(issue?.code).toBe('thrusterMassExceeded');
      expect(issue?.severity).toBe('warning');
      expect(issue?.params?.['load']).toBe('laden');
      expect(validation.valid).toBe(true);
      expect(validation.complete).toBe(true);
    });
  });

  describe('order', () => {
    it('lists issues in one stable order across repeated reads', () => {
      const build = ShipLoadout.fromLoadout(DUPLICATE_EXCLUSIVE);

      const first = build.validation().issues.map((issue) => `${issue.code}:${issue.slot ?? ''}`);
      const second = build.validation().issues.map((issue) => `${issue.code}:${issue.slot ?? ''}`);

      // Package order is what the block preserves, so it has to be an order and
      // not an accident of iteration.
      expect(second).toEqual(first);
    });
  });

  describe('the diagnostic helper', () => {
    it('returns canonical English for English', () => {
      const [issue] = ShipLoadout.fromLoadout(UNKNOWN_SLOT).validation().issues;

      expect(issue).toBeDefined();
      expect(getLoadoutIssueMessage(issue!, 'en')).toBe(issue!.message);
    });

    it('returns null outside English', () => {
      const [issue] = ShipLoadout.fromLoadout(UNKNOWN_SLOT).validation().issues;

      // This is the reason every German reader sees the canonical sentence with
      // the untranslated disclosure beside it: the package ships no translated
      // diagnostics at this version, and `null` is how it says so. The
      // application does not translate one on its behalf.
      expect(getLoadoutIssueMessage(issue!, 'de')).toBeNull();
    });
  });
});
