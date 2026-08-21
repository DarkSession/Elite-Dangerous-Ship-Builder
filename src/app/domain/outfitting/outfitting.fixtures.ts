import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { LoadoutEvent } from '@elite-dangerous-almanac/core/ships/slef';
import {
  getPreEngineeredVariants,
  type PreEngineeredVariant,
} from '@elite-dangerous-almanac/core/ships/pre-engineered';

/**
 * The shared outfitting fixtures.
 *
 * Every value here is *evidence about the installed package*, not a mock of it.
 * A hull symbol, a slot key, a module symbol and a blueprint `fdname` are
 * identities the package either carries or does not; the constants below name
 * ones it carries at the pinned version, and the guards beside them fail loudly
 * when a release stops carrying one — which is the point. A fixture that
 * silently degrades into "no candidates" would make a suite pass by testing
 * nothing (constitution II, VIII).
 *
 * Nothing here fabricates a game value. Costs, stats, modifiers and menus are
 * never written down; every fixture builds a real `ShipLoadout` and lets the
 * package answer.
 */

/** The hull every ordinary fixture starts from: it has every mount kind. */
export const FIXTURE_HULL = 'Anaconda';

/** Exact package slot keys this feature's tests name, one per mount kind. */
export const FIXTURE_SLOTS = {
  armour: 'Armour',
  core: 'PowerPlant',
  frameShiftDrive: 'FrameShiftDrive',
  thrusters: 'MainEngines',
  hardpoint: 'HugeHardpoint1',
  /** A mount the hull's default build arrives with something fitted in. */
  fittedHardpoint: 'SmallHardpoint1',
  /** A fitted, removable optional internal. */
  fittedOptional: 'Slot03_Size6',
  utility: 'TinyHardpoint1',
  optional: 'Slot01_Size7',
  cargoHatch: 'CargoHatch',
} as const;

/**
 * The largest candidate list the installed package offers, for SC-002.
 *
 * Discovered by walking every hull's every slot and counting stock records plus
 * their pre-engineered variants. It is named rather than rediscovered at test
 * time because the walk takes seconds and the point of the measurement is the
 * chooser, not the search for it. `assertLargestChoiceSet` re-proves the claim.
 */
export const LARGEST_CHOICE_SET = {
  hull: 'PantherMkII',
  slot: 'Slot01_Size8',
  /** Stock records plus every variant, at the pinned package version. */
  approximateChoices: 478,
} as const;

/**
 * A fixed-reward article that is still re-engineerable.
 *
 * The regression this feature keeps returning to: adding, replacing and
 * removing only an experimental effect on a tech-broker article must leave the
 * package's own fixed modifier block and `preEngineeredVariant` identity
 * intact (FR-012, contract "Package acceptance" item 2).
 */
export const FIXED_REWARD_REGRESSION = {
  hull: 'Anaconda',
  slot: FIXTURE_SLOTS.frameShiftDrive,
  symbol: 'Int_Hyperdrive_Size5_Class5',
  blueprint: 'FSD_LongRange',
  acquisition: 'techBroker',
} as const;

/**
 * One module the package sells through two different routes.
 *
 * Route-distinct variants must stay distinct: they are two articles a Commander
 * acquires two different ways, and collapsing them would lose the acquisition
 * label the choice is chosen by (FR-006).
 */
export const ROUTE_DISTINCT_SYMBOL = 'Hpt_Slugshot_Gimbal_Small';

/** A hull symbol the package does not carry, for the refusal path. */
export const UNKNOWN_HULL = 'Nonexistent_Hull';

// ---------------------------------------------------------------------------
// Builds
// ---------------------------------------------------------------------------

/** The default build for the fixture hull: every mount kind, all fixed mounts filled. */
export function defaultBuild(hull: string = FIXTURE_HULL): ShipLoadout {
  return ShipLoadout.default(hull);
}

/** The largest-chooser build, for the SC-002 timing fixture. */
export function largestChoiceBuild(): ShipLoadout {
  return ShipLoadout.default(LARGEST_CHOICE_SET.hull);
}

/** A build carrying the re-engineerable fixed reward in its drive mount. */
export function fixedRewardBuild(): ShipLoadout {
  const build = ShipLoadout.default(FIXED_REWARD_REGRESSION.hull);
  build.setPreEngineeredVariant(FIXED_REWARD_REGRESSION.slot, fixedRewardVariant());
  return build;
}

/** The package's own record for the fixed-reward regression article. */
export function fixedRewardVariant(): PreEngineeredVariant {
  const variant = getPreEngineeredVariants(FIXED_REWARD_REGRESSION.symbol).find(
    (candidate) =>
      candidate.acquisition === FIXED_REWARD_REGRESSION.acquisition &&
      candidate.blueprint === FIXED_REWARD_REGRESSION.blueprint,
  );
  if (variant === undefined) {
    throw new Error(
      `The installed Almanac no longer carries a ${FIXED_REWARD_REGRESSION.acquisition} ` +
        `"${FIXED_REWARD_REGRESSION.blueprint}" variant of ${FIXED_REWARD_REGRESSION.symbol}. ` +
        'Pick a new regression subject from the package rather than writing one here.',
    );
  }
  return variant;
}

/** Every package variant of the two-route module, in package order. */
export function routeDistinctVariants(): readonly PreEngineeredVariant[] {
  const variants = getPreEngineeredVariants(ROUTE_DISTINCT_SYMBOL);
  const routes = new Set(variants.map((variant) => variant.acquisition));
  if (routes.size < 2) {
    throw new Error(
      `${ROUTE_DISTINCT_SYMBOL} no longer has variants from more than one acquisition route.`,
    );
  }
  return variants;
}

// ---------------------------------------------------------------------------
// Ingress payloads
//
// These are `LoadoutEvent` values — what a decoder hands the ingress pipeline —
// rather than built loadouts, because what is under test is what the package
// does with them.
// ---------------------------------------------------------------------------

/** A payload naming no modules at all: every fixed mount is absent. */
export const OMITTED_FIXED_MOUNTS: LoadoutEvent = {
  event: 'Loadout',
  Ship: FIXTURE_HULL,
  Modules: [],
};

/**
 * A payload naming a module a fixed mount cannot hold.
 *
 * A pulse laser in the power-plant mount. The package refuses the article and
 * installs the hull's own default; the application neither classifies the slot
 * nor chooses the replacement (FR-010).
 */
export const UNUSABLE_FIXED_MOUNT: LoadoutEvent = {
  event: 'Loadout',
  Ship: FIXTURE_HULL,
  Modules: [{ Slot: FIXTURE_SLOTS.core, Item: 'Hpt_PulseLaser_Fixed_Small' }],
};

/**
 * A payload whose partial engineering the package can complete losslessly.
 *
 * Dirty drives at grade 5 and a quality below 1: the package identifies the
 * recipe, so `completeEngineeringGrade` returns `normalized` and the modelled
 * build becomes a true 100% grade (FR-013).
 */
export const SUPPORTED_PARTIAL_QUALITY: LoadoutEvent = {
  event: 'Loadout',
  Ship: FIXTURE_HULL,
  Modules: [
    {
      Slot: FIXTURE_SLOTS.thrusters,
      Item: 'Int_Engine_Size7_Class5',
      Engineering: { BlueprintName: 'Engine_Dirty', Level: 5, Quality: 0.37 },
    },
  ],
};

/** The quality the supported payload arrives with, for the notice assertion. */
export const SUPPORTED_PARTIAL_SOURCE_QUALITY = 0.37;

/**
 * A payload whose partial engineering the package cannot complete.
 *
 * A grade-5 `FSD_LongRange` drive at a partial quality: at full grade that
 * article is a pre-engineered reward, so a partial roll of it is a state the
 * package declines to identify. `completeEngineeringGrade` answers
 * `unsupported`, and the whole candidate is refused before activation.
 */
export const UNSUPPORTED_PARTIAL_QUALITY: LoadoutEvent = {
  event: 'Loadout',
  Ship: FIXTURE_HULL,
  Modules: [
    {
      Slot: FIXTURE_SLOTS.frameShiftDrive,
      Item: 'Int_Hyperdrive_Size6_Class5',
      Engineering: { BlueprintName: 'FSD_LongRange', Level: 5, Quality: 0.42 },
    },
  ],
};

/** The quality the unsupported payload arrives with, for the refusal assertion. */
export const UNSUPPORTED_PARTIAL_SOURCE_QUALITY = 0.42;

/** A payload naming a hull the package does not carry. */
export const UNKNOWN_HULL_PAYLOAD: LoadoutEvent = {
  event: 'Loadout',
  Ship: UNKNOWN_HULL,
  Modules: [],
};

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/**
 * Re-proves that the named largest chooser is still the largest.
 *
 * Called from the acceptance characterization rather than from every suite: it
 * walks the whole installed catalogue, which is worth doing once.
 */
export function assertLargestChoiceSet(): { hull: string; slot: string; choices: number } {
  const build = largestChoiceBuild();
  const stock = build.modulesForSlot(LARGEST_CHOICE_SET.slot);
  const choices = stock.reduce(
    (total, module) => total + 1 + getPreEngineeredVariants(module.symbol).length,
    0,
  );
  return { hull: LARGEST_CHOICE_SET.hull, slot: LARGEST_CHOICE_SET.slot, choices };
}
