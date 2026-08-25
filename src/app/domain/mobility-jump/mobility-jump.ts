import type { FrameShiftDriveParams } from '@elite-dangerous-almanac/core/ships/jump-range';
import type {
  BuildMass,
  ShipLoadout,
  StandardLoadInputs,
} from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type {
  CalculationIssue,
  CalculationResult,
} from '@elite-dangerous-almanac/core/ships/loadout-calculations';
import type { MobilityMetrics, ThrusterParams } from '@elite-dangerous-almanac/core/ships/mobility';
import { getShipBySymbol } from '@elite-dangerous-almanac/core/ships/ships';

/**
 * `DRIVES & MASS`: what moves the build, and what it has to move.
 *
 * Canvas 1c draws this as the `DRIVES` mode of the hull anatomy region — two
 * cards side by side, `THRUSTER LOAD` and `FRAME SHIFT DRIVE`. Canvas 1d stacks
 * the same two. This projector is the only place the package is asked those
 * questions; the component formats what comes back and does no arithmetic.
 *
 * ## The four readings the library was asked for
 *
 * Canvas 1c draws a headline loaded mass, a hull/modules/fuel decomposition, a
 * position on the thruster mass curve and an `SCO` badge. None had a result in
 * the version of `@elite-dangerous-almanac/core` this feature started against,
 * so all four were raised against the library rather than cut. It answers every
 * one of them:
 *
 * 1. `buildMass(load)` returns `{ hull, modules, unladen, fuel, cargo, total }`
 *    — the mass counterpart of `buildCost()`, so the headline is its `total`
 *    and the bar is its `hull`, `modules` and `fuel`;
 * 2. `MobilityMetrics.loadedMass` reports the mass the curve was evaluated at,
 *    and the `thrusters` getter documents reading it against that curve's
 *    `optMass` for where this build sits on it — the canvas's
 *    "% of optimal mass"; and
 * 3. `OutfittingModule.supercruiseOvercharge` is a real capability flag on the
 *    36 Overcharge drives, so the badge is a package fact rather than something
 *    inferred from a module symbol.
 *
 * So every figure on both cards is a package answer. The one arithmetic
 * operation in this file is the curve position's
 * `loadedMass / optMass`, which is the comparison the package's own `thrusters`
 * documentation prescribes; nothing else is derived here.
 */

/** The three loads the package publishes, in the order the canvas lists them. */
export const STANDARD_LOADS = ['maximum', 'unladen', 'laden'] as const;

/**
 * The load the headline mass and the speed envelope are both read at.
 *
 * The canvas's, taken from its arithmetic rather than its wording: the headline
 * `1,142` is exactly the three rows drawn under it — `400` hull, `662` modules,
 * `080` fuel — and there is no cargo row for a fourth part to appear in. A full
 * main tank over an empty hold is the package's `unladen` profile, so that is
 * what both readings are taken at and what the line under the headline names.
 * Read at `laden`, the headline would carry a hold the bar never accounts for:
 * a stock Anaconda would head 1,210 t over rows summing to 1,096 t.
 */
const ENVELOPE_LOAD = 'unladen' satisfies StandardLoad;

/**
 * The loads whose completeness gates every jump reading.
 *
 * All three, because `jumpRangeSummary()` requires all three: it resolves the
 * `maximum`, `unladen` and `laden` loads in turn and throws a `TypeError` on
 * the first it cannot. Guarding only one of them would leave the other two to
 * throw out of this projector and take the whole anatomy region down with them,
 * which is the failure FR-003's guard exists to prevent. The guard is the
 * package's own precondition rather than a locally invented one.
 */
const GUARD_LOADS = STANDARD_LOADS;

/** Shared empty tuple, so a complete reading allocates no issue array. */
const EMPTY_ISSUES: readonly CalculationIssue[] = Object.freeze([]);

/**
 * One of the package's three load profiles.
 *
 * The canvas names them `UNLADEN`, `FUELLED` and `FULL CARGO`; the package
 * calls the same three `maximum`, `unladen` and `laden`. They are the same
 * three readings and the mapping is exact — `maximum` carries one jump's fuel
 * and an empty hold, `unladen` a full main tank and an empty hold, `laden` a
 * full tank and a full hold. The canvas's fourth `CURRENT` row is a jump at
 * some arbitrary current fuel and cargo state — canvas 1d sets it at the figure
 * canvas 1c heads `JUMP LADEN`, not at its `FUELLED` — and this application
 * carries no current-load condition to read one at, so three is what it states.
 */
export type StandardLoad = (typeof STANDARD_LOADS)[number];

/** One `RANGE BY LOAD` row, as the package reports it. */
export interface LoadProfile {
  readonly load: StandardLoad;
  /**
   * Single-jump range for this profile, in light years.
   *
   * The one figure the canvas puts on a `RANGE BY LOAD` row. The whole tank is
   * a separate reading it draws once, in the legend below — see
   * {@link FrameShiftDriveView.totalRange}.
   */
  readonly range: number;
}

/** The canvas's `Total range` legend row: a whole tank, and the jumps it makes. */
export interface TotalRange {
  /** Summed range on one full tank with an empty hold, in light years. */
  readonly range: number;
  /** Jumps made before that tank is empty. */
  readonly jumps: number;
}

/** The fitted module a reading is qualified by. */
export interface SourceModule {
  /** The package's exact slot key — `MainEngines`, `FrameShiftDrive`. */
  readonly slot: string;
  /** The package's module symbol, or `null` on an empty mount. */
  readonly symbol: string | null;
  /** `class` + `rating` as the package publishes them, e.g. `7` and `A`. */
  readonly rating: string | null;
  /**
   * Whether the module is switched on, or `undefined` where the package says
   * nothing — an empty mount, or a fitted one carrying no `on` at all. Absent
   * reads as on, which is what the package itself does.
   */
  readonly on: boolean | undefined;
  /** The applied blueprint's `fdname`, or `null` when the module is stock. */
  readonly blueprint: string | null;
  /** The blueprint's grade, or `null` when the module is stock. */
  readonly grade: number | null;
  /**
   * The applied experimental effect's journal name, or `null` when none is.
   *
   * The canvas names the drive's beside the optimal mass it changed —
   * `6A + MASS MANAGER` — which is the only place either card shows one.
   */
  readonly experimental: string | null;
}

/**
 * The thruster's post-engineering mass curve, as the package publishes it.
 *
 * `ShipLoadout.thrusters` is the thruster counterpart of `frameShiftDrive` and
 * answers `null` rather than throwing when no thrusters are fitted or the
 * fitted record carries no complete curve. It is the getter whose own
 * documentation prescribes the position reading below, so it is also the getter
 * that curve is taken from — reassembling one here from `effectiveStats` would
 * be this application deciding what a complete curve is.
 */
export type ThrusterCurve = ThrusterParams;

/** `THRUSTER LOAD`: what the build weighs and how well it moves. */
export interface ThrusterLoadView {
  readonly source: SourceModule;
  /** The load the envelope was read at — the canvas's, stated beside it. */
  readonly envelopeLoad: StandardLoad;
  /** The package's mobility answer, or its issues. */
  readonly mobility: MobilityMetrics | null;
  readonly issues: readonly CalculationIssue[];
  /** The thruster's own mass curve, where the module publishes one. */
  readonly curve: ThrusterCurve | null;
  /** The fitted bulkhead, which the canvas names beside the hull's mass. */
  readonly bulkhead: SourceModule;
  /** How many modules are fitted — the canvas's `22 FITTED`. A count, not a sum. */
  readonly fittedModuleCount: number;
  /**
   * What the build weighs at the envelope's load, broken down the way the
   * canvas's bar draws it — or `null` where the load could not be resolved.
   *
   * The package's own `{ hull, modules, unladen, fuel, cargo, total }`, copied
   * whole. Nothing here is summed: `total` is the canvas's headline and `hull`,
   * `modules` and `fuel` are its three bar segments.
   */
  readonly mass: BuildMass | null;
  /**
   * Main and reserve tank capacities, in tonnes.
   *
   * The canvas's `TANK 32 T + RESERVE` beside the fuel segment, which is the
   * only place either capacity appears on it.
   */
  readonly fuelCapacity: { readonly main: number; readonly reserve: number };
  /**
   * Where this build sits on the thruster curve — the canvas's
   * `91% OF OPTIMAL MASS` — as a fraction of the curve's optimal mass, or
   * `null` where either figure is missing.
   *
   * The one division in this projector, and the one the package's `thrusters`
   * documentation prescribes: "read `optMass` and `maxMass` against
   * `loadedMass` for where this build sits on the curve". Both operands are
   * package figures and the ratio is what the canvas labels.
   */
  readonly massCurvePosition: number | null;
}

/** `FRAME SHIFT DRIVE`: how far the build gets on what it carries. */
export interface FrameShiftDriveView {
  readonly source: SourceModule;
  /** Post-engineering optimised mass, or `null` on an unusable drive. */
  readonly optMass: number | null;
  /** Maximum fuel drawn for one jump, or `null` on an unusable drive. */
  readonly maxFuel: number | null;
  /** The three load profiles, or empty when the guard is incomplete. */
  readonly profiles: readonly LoadProfile[];
  /**
   * The canvas's `Total range` / `8 JUMPS ON A FULL TANK`, or `null` when the
   * guard is incomplete.
   *
   * `totalUnladen` and not one of the other two totals: the canvas's qualifier
   * says a full tank and says nothing about cargo, and the package words that
   * summary "on one full tank, empty hold". Drawn once, as the canvas draws it,
   * rather than per load — the rows carry one figure each.
   */
  readonly totalRange: TotalRange | null;
  /** The package's own reasons there are no profiles. Empty when there are. */
  readonly issues: readonly CalculationIssue[];
  /**
   * How strongly the hull impedes a smaller ship's drive, or `null` for a hull
   * the catalogue does not carry. A catalogue fact.
   */
  readonly massLock: number | null;
  /**
   * Whether the fitted drive is a Supercruise Overcharge drive — the canvas's
   * `SCO` badge — or `null` where the package states nothing.
   *
   * The catalogue's own sparse capability flag, never inferred from the module
   * symbol. Absent on an ordinary hyperdrive, which is `false` rather than
   * unknown; `null` only where there is no fitted record to ask.
   */
  readonly supercruiseOvercharge: boolean | null;
}

/** One settled reading of the active build. */
export interface MobilityAndJump {
  readonly thrusters: ThrusterLoadView;
  readonly drive: FrameShiftDriveView;
}

/** The package's own key for the thruster mount. The game's, not ours. */
const THRUSTER_SLOT = 'MainEngines';
/** The package's own key for the drive mount. */
const DRIVE_SLOT = 'FrameShiftDrive';
/** The package's own key for the bulkhead, which the canvas names by the hull. */
const BULKHEAD_SLOT = 'Armour';

/**
 * Read one revision of the active build.
 *
 * Every figure is a package answer, and a reading the package could not resolve
 * is `null` here rather than a stand-in.
 *
 * @param loadout - The active build. Read, never mutated.
 * @param enginesPips - ENG pips in `[0, 4]`, passed to the package unchanged.
 */
export function projectMobilityAndJump(loadout: ShipLoadout, enginesPips: number): MobilityAndJump {
  const hull = getShipBySymbol(loadout.shipSymbol);

  return Object.freeze({
    thrusters: readThrusters(loadout, enginesPips),
    drive: readDrive(loadout, hull),
  });
}

/**
 * `THRUSTER LOAD`, read independently of the drive.
 *
 * Independently on purpose: the two cards are separate readings of separate
 * modules, and the design requires every group that is available to stay
 * available. An unusable drive must not take the speed envelope down with it.
 */
function readThrusters(loadout: ShipLoadout, enginesPips: number): ThrusterLoadView {
  // Passed rather than left to default even though `mobilityMetrics()` happens
  // to default to the same profile: the card names the load beside the figure,
  // and a default is documented rather than promised. At 2 ENG pips a stock
  // Anaconda differs by two thirds of a metre per second between this profile
  // and `laden`, so a default that moved would leave the card naming one load
  // while showing another.
  const carried = readStandardLoad(loadout, ENVELOPE_LOAD);
  const mobility = carried?.complete
    ? loadout.mobilityMetricsResult({ ...carried.value, enginesPips })
    : carried;
  // The mass counterpart of `buildCost()`, weighed at the same load the
  // envelope was read at, so the headline and the bar describe one ship.
  const mass = carried?.complete ? loadout.buildMass(carried.value) : null;
  const curve = loadout.thrusters;

  return Object.freeze({
    source: readSource(loadout, THRUSTER_SLOT),
    bulkhead: readSource(loadout, BULKHEAD_SLOT),
    // The canvas's `22 FITTED`, which is how many rows the package returns and
    // not a total of anything they weigh.
    fittedModuleCount: loadout.fittedModules().length,
    envelopeLoad: ENVELOPE_LOAD,
    // A load the package could not resolve is its own reason the envelope is
    // unavailable, and is carried as the package worded it rather than
    // rephrased here.
    mobility: mobility?.complete ? mobility.value : null,
    // No reasons at all where the package threw: it gives its own or it gives
    // none, and an empty list is what "none" looks like here.
    issues: mobility?.issues ?? EMPTY_ISSUES,
    curve,
    mass: mass ? Object.freeze({ ...mass }) : null,
    fuelCapacity: Object.freeze({ ...loadout.fuelCapacity }),
    massCurvePosition: readCurvePosition(mobility?.complete ? mobility.value : null, curve),
  });
}

/**
 * The canvas's `91% OF OPTIMAL MASS`, as a fraction.
 *
 * `null` rather than a fraction wherever either operand is missing — a build
 * whose mobility the package declined to state, or a thruster publishing no
 * curve. A zero optimal mass would make the ratio meaningless, so it is treated
 * the same way rather than divided by.
 */
function readCurvePosition(
  mobility: MobilityMetrics | null,
  curve: ThrusterCurve | null,
): number | null {
  if (!mobility || !curve || curve.optMass <= 0) {
    return null;
  }
  return mobility.loadedMass / curve.optMass;
}

/**
 * `FRAME SHIFT DRIVE`, guarded before the package is asked to jump.
 *
 * `jumpRangeSummary()` throws a `TypeError` on a build with no usable drive and
 * `frameShiftDrive` throws when the fitted drive's record is missing any of its
 * jump constants. Neither is reachable from today's catalogue — every hyperdrive
 * record it carries is complete — but FR-003 requires the guard rather than the
 * absence of a trigger, and an exception here would take out the whole anatomy
 * region rather than one card.
 *
 * The guard is the package's own: `jumpRangeSummary()` resolves all three
 * standard loads and throws on the first it cannot, so all three are asked here
 * first. When any cannot be resolved the drive reports no profiles and the
 * issues of the loads that failed, in the package's own order, and nothing is
 * guessed in their place.
 *
 * A missing jump constant is the other way in, and it arrives earlier than it
 * looks: settling a load costs a jump, so `standardLoadResult()` reaches the
 * same getter and throws there first — which is why the guard is around that
 * call rather than only around `frameShiftDrive`. A throw is not a
 * `CalculationResult`, so it has no issues to report: the card is unavailable
 * with no list beside it rather than with an empty one, because there is no
 * package reason to show and this application does not write one.
 */
function readDrive(
  loadout: ShipLoadout,
  hull: ReturnType<typeof getShipBySymbol>,
): FrameShiftDriveView {
  const blocked = readBlockedLoads(loadout);
  const drive = blocked.blocked ? null : readDriveParams(loadout);
  const jumps = drive ? readJumps(loadout) : null;

  return Object.freeze({
    source: readSource(loadout, DRIVE_SLOT),
    optMass: drive?.optMass ?? null,
    maxFuel: drive?.maxFuel ?? null,
    profiles: Object.freeze(jumps?.profiles ?? []),
    totalRange: jumps?.totalRange ?? null,
    issues: drive ? EMPTY_ISSUES : blocked.issues,
    massLock: hull?.masslock ?? null,
    supercruiseOvercharge: readOvercharge(loadout),
  });
}

/**
 * One standard load, or `null` where the package threw instead of answering.
 *
 * Settling a load can cost a jump — the `maximum` load is fuel for one — so
 * `standardLoadResult()` reaches the drive, and a record missing its jump
 * constants makes it throw rather than answer. Unguarded, that throw leaves the
 * projector and takes the whole anatomy region rather than one card.
 *
 * Applied at both call sites even though only the drive card asks for a load
 * that jumps today. The envelope's load is chosen by what the card names, and a
 * guard that holds only while that choice stays put is not a guard.
 *
 * `null` rather than an incomplete `CalculationResult`, because the package's
 * own type will not have one: an incomplete result carries at least one issue,
 * which is the package promising a reason whenever it declines. A throw is not
 * a reason and this application does not write one, so what a caught throw
 * becomes is the absence of an answer rather than a refusal with empty words.
 */
function readStandardLoad(
  loadout: ShipLoadout,
  load: StandardLoad,
): CalculationResult<StandardLoadInputs> | null {
  try {
    return loadout.standardLoadResult(load);
  } catch {
    return null;
  }
}

/**
 * The package's reasons the loads the summary needs could not be settled.
 *
 * Empty when all three resolve, which is the only state the summary may be
 * asked in. The issues are the package's own, concatenated in the order it
 * resolves the loads, so a Commander reads why in the same order the package
 * would have failed.
 */
function readBlockedLoads(loadout: ShipLoadout): {
  readonly blocked: boolean;
  readonly issues: readonly CalculationIssue[];
} {
  const results = GUARD_LOADS.map((load) => readStandardLoad(loadout, load));
  const issues = results.flatMap((result) =>
    result?.complete === false ? [...result.issues] : [],
  );
  return Object.freeze({
    // A load the package threw on blocks the summary exactly as a load it
    // declined does, and says nothing about why. Counting the reasons instead
    // would read a silent throw as three loads that all resolved.
    blocked: results.some((result) => !result?.complete),
    issues: issues.length === 0 ? EMPTY_ISSUES : Object.freeze(issues),
  });
}

/**
 * Whether the fitted drive is an Overcharge drive, as the catalogue marks it.
 *
 * The flag is sparse — set on the 36 Overcharge records and absent everywhere
 * else — so an ordinary hyperdrive reads `false`, which is a stated capability
 * rather than a gap. `null` means there is no fitted record to ask at all. The
 * module symbol is never matched on: capability is the catalogue's to state.
 */
function readOvercharge(loadout: ShipLoadout): boolean | null {
  const stats = loadout.fittedModuleAt(DRIVE_SLOT)?.effectiveStats;
  return stats ? (stats.supercruiseOvercharge ?? false) : null;
}

/**
 * The drive's own post-engineering constants, or `null` where it cannot say.
 *
 * The getter throws rather than returning a result, so the guard is a `try`.
 * Catching is not swallowing: the caller draws the card unavailable, and the
 * package's own reason for the load it could not resolve is what is shown.
 */
function readDriveParams(loadout: ShipLoadout): FrameShiftDriveParams | null {
  try {
    return loadout.frameShiftDrive;
  } catch {
    return null;
  }
}

/**
 * The three load profiles and the whole tank, all from the package's one summary.
 *
 * One summary call for both, because the canvas draws both: three
 * `RANGE BY LOAD` rows of one figure each, and a single `Total range` legend
 * row under them. Asking twice would be two reads of the same answer.
 */
function readJumps(loadout: ShipLoadout): {
  readonly profiles: readonly LoadProfile[];
  readonly totalRange: TotalRange;
} {
  const summary = loadout.jumpRangeSummary();

  const profiles = STANDARD_LOADS.map((load): LoadProfile => {
    // The summary names the same three loads `max`, `unladen` and `laden`; the
    // pairing is written out rather than built from the load key so that a
    // rename upstream fails to compile instead of reading `undefined`.
    const single =
      load === 'maximum' ? summary.max : load === 'unladen' ? summary.unladen : summary.laden;
    return { load, range: single };
  });

  return {
    profiles,
    // The canvas's `8 JUMPS ON A FULL TANK` names a tank and no cargo, which is
    // the summary the package words "on one full tank, empty hold".
    totalRange: Object.freeze({
      range: summary.totalUnladen.range,
      jumps: summary.totalUnladen.jumps,
    }),
  };
}

/** The fitted module at one exact package slot key, reduced to what is drawn. */
function readSource(loadout: ShipLoadout, slotKey: string): SourceModule {
  const fitted = loadout.fittedModuleAt(slotKey);
  const stats = fitted?.effectiveStats ?? null;
  // The package carries engineering in the journal's own casing, because that
  // is what a `Loadout` event writes. The names are its, not ours.
  const engineering = fitted?.engineering ?? null;

  return Object.freeze({
    slot: slotKey,
    symbol: fitted?.symbol ?? null,
    rating: stats ? `${stats.class}${stats.rating}` : null,
    on: fitted?.on,
    blueprint: engineering?.BlueprintName ?? null,
    grade: engineering?.Level ?? null,
    // The journal's own key. Absent on a stock module and on an engineered one
    // carrying no experimental effect, which are both "no effect" rather than
    // an effect named nothing.
    experimental: engineering?.ExperimentalEffect ?? null,
  });
}
