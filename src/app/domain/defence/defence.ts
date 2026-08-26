import type { ArmourMetrics } from '@elite-dangerous-almanac/core/ships/armour';
import { BuildMetrics } from '@elite-dangerous-almanac/core/ships/build-metrics';
import type { EngineeringGroupId } from '@elite-dangerous-almanac/core/ships/engineering-options';
import type { CalculationIssue } from '@elite-dangerous-almanac/core/ships/loadout-calculations';
import type { CalculationResult } from '@elite-dangerous-almanac/core/ships/loadout-calculations';
import type {
  CellBankMetrics,
  ShieldRecovery,
} from '@elite-dangerous-almanac/core/ships/shield-recovery';
import type { ShieldCapacitorMetrics } from '@elite-dangerous-almanac/core/ships/shield-capacitor';
import type { ShieldMetrics } from '@elite-dangerous-almanac/core/ships/shields';
import type {
  FittedModule,
  LoadoutSlot,
  ShipLoadout,
} from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { getShipBySymbol } from '@elite-dangerous-almanac/core/ships/ships';

/**
 * What the shields hold, what the hull takes, and what either of them is worth
 * against each kind of damage — as canvases 1c and 1d draw it in `DEFENCE`.
 *
 * One pure synchronous read of five `BuildMetrics` methods and one hull record,
 * and nothing else. There is no store, no cache, no revision key and no
 * lifecycle: the loadout is already in memory, the calls are synchronous, and
 * the signal graph memoises the whole thing for the surfaces that read it. That
 * is the shape features 009 and 005 already ship, and the shape feature 003's
 * ruling named for features 005 to 008
 * (`specs/006-defence-profile/design/reference-review.md`, "Departures from the
 * plan").
 *
 * Nothing below is computed. Every number is a package field copied whole, and
 * the only reshaping is pairing each damage type's resistance with its own
 * effective hit points — two records the package returns side by side and the
 * canvas draws on one line. Where the package says `null` or `Infinity`, that
 * meaning is carried through as its own state rather than flattened into a
 * number (constitution II and IV).
 */
export interface Defence {
  /** The SYS allocation the capacitor and recovery below were read at, in `[0, 4]`. */
  readonly systemsPips: number;
  /**
   * The complete `ShieldMetrics`, or every package issue that prevented it.
   *
   * The **bare** shield: since Almanac 0.2.0 `shieldMetrics()` is pip-free, so
   * its resistances and pools are the base figures an outfitting screen shows
   * and they do not move when a pip does. What the allocation is worth is
   * {@link capacitor}.
   */
  readonly shield: CalculationView<ShieldSnapshot>;
  /**
   * What {@link systemsPips} is worth to the bare shield above.
   *
   * A second package call, `shieldCapacitorMetrics()`, over the same build. It
   * carries the resistance the pips contribute on their own and the effective
   * pool behind them, and it is the only thing on the damage table that moves
   * with the allocation (FR-002's 2026-08-25 second column). The recovery below
   * moves with it too; the bare shield above does not.
   */
  readonly capacitor: CalculationView<CapacitorSnapshot>;
  /** Independently complete or unavailable: a shield may be one and this the other. */
  readonly recovery: CalculationView<RecoverySnapshot>;
  readonly cellBanks: CellBankCollection;
  /** Non-nullable for a constructed known hull, so never an unavailable view. */
  readonly armour: ArmourSnapshot;
  /** The hull's own rating, beside the armour rather than inside it. */
  readonly hardness: number;
  /**
   * The shield's source rows: generator, boosters and reinforcement.
   *
   * Empty while the shield is unavailable, because the aggregates those rows
   * carry are fields of a `ShieldMetrics` the package did not produce.
   */
  readonly shieldRoles: readonly DefenceRoleGroup[];
  /** The hull's source rows: the fitted bulkhead and the hull reinforcement. */
  readonly armourRoles: readonly DefenceRoleGroup[];
}

/** Everything the projection needs that is not the build. */
export interface DefenceConditions {
  /**
   * Pips to the systems capacitor, `0`–`4`.
   *
   * Feature 005's store already holds the ship's own allocation on the half
   * step, in the units the package takes, so there is nothing to convert: the
   * value it holds is handed to the package unchanged — to the capacitor and
   * the recovery, which are the two calls that take an allocation at all.
   */
  readonly systemsPips: number;
}

/**
 * A package result, kept whole either way.
 *
 * `CalculationResult` already distinguishes a complete value from the ordered
 * reasons it could not be produced. This is that distinction with the issues
 * copied into a shape the surfaces can read, and nothing else: no issue is
 * collapsed, reordered, deduplicated, relabelled or parsed out of its English
 * `message`.
 */
export type CalculationView<T> =
  | { readonly kind: 'complete'; readonly value: T }
  | { readonly kind: 'unavailable'; readonly issues: readonly CalculationIssueView[] };

/** One package issue, with the original retained for the package's own wording. */
export interface CalculationIssueView {
  readonly field: CalculationIssue['field'];
  readonly reason: CalculationIssue['reason'];
  /** The exact package slot key, when the dependency belongs to a mount. */
  readonly slot: string | undefined;
  readonly symbol: string | undefined;
  readonly params: CalculationIssue['params'];
  /** Kept for `getCalculationIssueMessage()`; its `message` is never parsed. */
  readonly packageIssue: CalculationIssue;
}

/** Every scalar `ShieldMetrics` field, and the four damage lines the canvas draws. */
export interface ShieldSnapshot {
  readonly strength: number;
  readonly generator: number;
  readonly boosters: number;
  readonly reinforcement: number;
  readonly massCurveMultiplier: number;
  readonly boostMultiplier: number;
  readonly damage: readonly DamageDefenceValue[];
}

/**
 * Every `ShieldCapacitorMetrics` field, at one SYS allocation.
 *
 * The damage list is the same four rows as {@link ShieldSnapshot.damage} in the
 * same order, read at the allocation instead of bare, so a screen can put the
 * two side by side line for line.
 */
export interface CapacitorSnapshot {
  /** The allocation the package read this at, echoed back from its own result. */
  readonly systemsPips: number;
  readonly capacity: number;
  readonly rechargeRate: number;
  /** The resistance the pips contribute on their own, as a fraction. */
  readonly systemsResistance: number;
  readonly damage: readonly DamageDefenceValue[];
}

/** All four `ShieldRecovery` fields, kept apart. */
export interface RecoverySnapshot {
  readonly regenRate: number;
  readonly brokenRegenRate: number;
  /** Collapse to the 50% raise threshold, the package's own delay included. */
  readonly recoveryTime: number;
  /** 50% to full. Never added to {@link recoveryTime}. */
  readonly regenTime: number;
}

/** Every `ArmourMetrics` field. Hardness is not one of them. */
export interface ArmourSnapshot {
  readonly hitPoints: number;
  readonly bulkheads: number;
  readonly reinforcement: number;
  readonly damage: readonly DamageDefenceValue[];
  /** Hit points the module reinforcement adds to the modules, not to the hull. */
  readonly moduleArmour: number;
  /** A fraction of module damage absorbed. Never hit points. */
  readonly moduleProtection: number;
}

/** The four damage types, in the order the canvas lists them. */
export const DAMAGE_TYPES = ['kinetic', 'thermal', 'explosive', 'caustic'] as const;

export type DamageType = (typeof DAMAGE_TYPES)[number];

/**
 * One damage line: `KINETIC 41% 3,122`.
 *
 * The package returns the resistances and the effective hit points as two
 * records keyed the same way. The canvas reads them together, one line per
 * type, so they are paired here — same key to same key, nothing derived from
 * either.
 */
export interface DamageDefenceValue {
  readonly type: DamageType;
  /** A signed fraction. Negative is a weakness and stays negative. */
  readonly resistance: number;
  /** MJ for a shield, hull points for armour. `Infinity` at 100% resistance. */
  readonly effectiveHitPoints: number;
}

/**
 * The banks, and whether there are any.
 *
 * No banks and fitted banks whose powered totals are zero are different states,
 * and an empty list is the only thing that makes the first one.
 */
export type CellBankCollection =
  | { readonly kind: 'noneFitted' }
  | {
      readonly kind: 'fitted';
      readonly totalRestorable: number;
      readonly totalCells: number;
      readonly banks: readonly CellBankView[];
    };

/** One fitted bank, exactly as `cellBanks()` returned it. */
export interface CellBankView {
  readonly slotKey: string;
  readonly symbol: string;
  /** What the fitted mount holds, where the record resolved. The canvas's `5A`. */
  readonly identity: ModuleIdentity | null;
  /** MJ restored by one complete activation. Not a rate. */
  readonly reinforcement: number;
  readonly cells: number;
  readonly spinUp: number;
  readonly duration: number;
  readonly heat: number;
  /** The package's switched-on-and-fed verdict, with the hardpoints out. */
  readonly powered: boolean;
}

/**
 * The roles canvas 1c lists under each headline, in the order it lists them.
 *
 * `moduleReinforcement` is deliberately absent. The canvas draws no row for one
 * — module armour and module protection are already two of its own labelled
 * facts — and the package gives an ordinary module reinforcement package no
 * engineering group to classify it by
 * (`specs/006-defence-profile/design/reference-review.md`, "Departures from the
 * plan").
 */
export type DefenceRole =
  'shieldGenerator' | 'shieldBooster' | 'shieldReinforcement' | 'bulkhead' | 'hullReinforcement';

/**
 * One of the canvas's source rows: a role, what the package credits it with,
 * and the modules fitted in it.
 *
 * The value is the package's own aggregate for the whole role — `generator`,
 * `boosters`, `reinforcement`, `bulkheads` — and it stays whole. The package
 * publishes no per-source breakdown, so the modules below it carry no share of
 * it: they say what is fitted and in which mount, which is what the row's
 * actions are for (`specs/006-defence-profile/contracts/workspace-integration.md`,
 * "Fitted role boundary").
 */
export interface DefenceRoleGroup {
  readonly role: DefenceRole;
  /** The package aggregate this role is credited with, in MJ or hull points. */
  readonly contribution: number;
  readonly modules: readonly FittedDefenceModule[];
}

/**
 * One fitted module in a defence role: what it is, and where it is.
 *
 * A navigation record, not provenance. It carries no apportioned contribution,
 * no resistance share and no power verdict of this application's own.
 */
export interface FittedDefenceModule {
  readonly slotKey: string;
  readonly symbol: string;
  /** The journal's own switch. `'unspecified'` where the capture did not say. */
  readonly enabled: boolean | 'unspecified';
  /** Size, rating and engineering, or `null` where the record did not resolve. */
  readonly identity: ModuleIdentity | null;
}

/** What a fitted module is, in the parts the canvas names it by: `7C · THERMAL RESIST G5`. */
export interface ModuleIdentity {
  readonly size: number;
  readonly rating: string;
  readonly blueprint: string | null;
  readonly grade: number | null;
  readonly experimental: string | null;
}

/**
 * The engineering groups that name a defence role.
 *
 * Classification is the package's, not a reading of a symbol or a slot name: a
 * module's `engineeringGroup` is what the Almanac calls it, and a module whose
 * record does not resolve gets no row rather than a guessed one.
 *
 * The bulkhead is deliberately absent from both maps. `armourMetrics()` falls
 * back to the hull's stock lightweight alloy when nothing is fitted, so the
 * armour mount is read from the mount itself — a bulkhead row exists only where
 * a module does.
 */
const SHIELD_ROLE_GROUPS = {
  shieldGenerators: 'shieldGenerator',
  shieldBoosters: 'shieldBooster',
  shieldReinforcements: 'shieldReinforcement',
} as const satisfies Partial<Record<EngineeringGroupId, DefenceRole>>;

const ARMOUR_ROLE_GROUPS = {
  hullReinforcements: 'hullReinforcement',
  guardianHullReinforcements: 'hullReinforcement',
} as const satisfies Partial<Record<EngineeringGroupId, DefenceRole>>;

/** The order the rows are drawn in, inside which package slot order holds. */
const SHIELD_ROLE_ORDER = [
  'shieldGenerator',
  'shieldBooster',
  'shieldReinforcement',
] as const satisfies readonly DefenceRole[];

const ARMOUR_ROLE_ORDER = [
  'bulkhead',
  'hullReinforcement',
] as const satisfies readonly DefenceRole[];

/**
 * Reads one build's defence under one SYS allocation.
 *
 * `shieldMetricsResult()` takes no allocation at all since Almanac 0.2.0: it is
 * the bare shield, and the pips are a separate calculation over its result. The
 * capacitor and the recovery take the same explicit allocation, because a
 * screen showing them under one heading has to be showing one.
 *
 * @throws Whatever the package throws. A hull the package does not carry cannot
 * be active — feature 001's construction boundary refuses it long before this —
 * so a failed lookup here is an invariant break, not a game state, and it is
 * not answered with a fallback hull.
 */
export function projectDefence(loadout: ShipLoadout, conditions: DefenceConditions): Defence {
  const systemsPips = conditions.systemsPips;
  const ship = getShipBySymbol(loadout.shipSymbol);
  if (ship === null) {
    throw new Error(`The active hull ${loadout.shipSymbol} is not carried by the package.`);
  }

  const slots = loadout.slots();
  // Every calculation lives on `BuildMetrics`, which reads the build it is
  // handed rather than holding a copy of it (Almanac 0.2.0).
  const metrics = BuildMetrics.of(loadout);
  const shield = toCalculationView(metrics.shieldMetricsResult(), toShieldSnapshot);
  const armour = toArmourSnapshot(metrics.armourMetrics());

  return {
    systemsPips,
    shield,
    capacitor: toCalculationView(
      metrics.shieldCapacitorMetricsResult({ systemsPips }),
      toCapacitorSnapshot,
    ),
    recovery: toCalculationView(metrics.shieldRecoveryResult({ systemsPips }), toRecoverySnapshot),
    cellBanks: toCellBankCollection(metrics.cellBanks(), slots),
    armour,
    hardness: ship.hardness,
    // No shield, no shield aggregates: the three figures these rows carry are
    // fields of a result the package declined to produce, and a row saying
    // `0 MJ` about a generator the package would not read would be this
    // application answering in its place.
    shieldRoles:
      shield.kind === 'complete'
        ? classifyRoles(slots, SHIELD_ROLE_GROUPS, SHIELD_ROLE_ORDER, false, {
            shieldGenerator: shield.value.generator,
            shieldBooster: shield.value.boosters,
            shieldReinforcement: shield.value.reinforcement,
          })
        : [],
    armourRoles: classifyRoles(slots, ARMOUR_ROLE_GROUPS, ARMOUR_ROLE_ORDER, true, {
      bulkhead: armour.bulkheads,
      hullReinforcement: armour.reinforcement,
    }),
  };
}

/** Copies a complete value whole, and otherwise every issue in package order. */
function toCalculationView<TPackage, TSnapshot>(
  result: CalculationResult<TPackage>,
  snapshot: (value: TPackage) => TSnapshot,
): CalculationView<TSnapshot> {
  if (result.complete) {
    return { kind: 'complete', value: snapshot(result.value) };
  }

  return {
    kind: 'unavailable',
    issues: result.issues.map((issue) => ({
      field: issue.field,
      reason: issue.reason,
      slot: issue.slot,
      symbol: issue.symbol,
      params: issue.params,
      packageIssue: issue,
    })),
  };
}

function toShieldSnapshot(metrics: ShieldMetrics): ShieldSnapshot {
  return {
    strength: metrics.strength,
    generator: metrics.generator,
    boosters: metrics.boosters,
    reinforcement: metrics.reinforcement,
    massCurveMultiplier: metrics.massCurveMultiplier,
    boostMultiplier: metrics.boostMultiplier,
    damage: toDamageDefenceValues(metrics.resistances, metrics.effectiveHitPoints),
  };
}

function toCapacitorSnapshot(capacitor: ShieldCapacitorMetrics): CapacitorSnapshot {
  return {
    systemsPips: capacitor.systemsPips,
    capacity: capacitor.capacity,
    rechargeRate: capacitor.rechargeRate,
    systemsResistance: capacitor.systemsResistance,
    damage: toDamageDefenceValues(capacitor.effectiveResistances, capacitor.effectiveHitPoints),
  };
}

function toRecoverySnapshot(recovery: ShieldRecovery): RecoverySnapshot {
  return {
    regenRate: recovery.regenRate,
    brokenRegenRate: recovery.brokenRegenRate,
    recoveryTime: recovery.recoveryTime,
    regenTime: recovery.regenTime,
  };
}

function toArmourSnapshot(metrics: ArmourMetrics): ArmourSnapshot {
  return {
    hitPoints: metrics.hitPoints,
    bulkheads: metrics.bulkheads,
    reinforcement: metrics.reinforcement,
    damage: toDamageDefenceValues(metrics.resistances, metrics.effectiveHitPoints),
    moduleArmour: metrics.moduleArmour,
    moduleProtection: metrics.moduleProtection,
  };
}

/**
 * Pairs each damage type's resistance with its own effective hit points.
 *
 * Exactly four rows, in the canvas's order, and each one reads both of its
 * numbers off the same key. Nothing is added, scaled or inferred: a resistance
 * of zero is a row saying zero, and an unbounded pool stays `Infinity` for a
 * presenter that knows what the field means.
 */
function toDamageDefenceValues(
  resistances: Record<DamageType, number>,
  effectiveHitPoints: Record<DamageType, number>,
): readonly DamageDefenceValue[] {
  return DAMAGE_TYPES.map((type) => ({
    type,
    resistance: resistances[type],
    effectiveHitPoints: effectiveHitPoints[type],
  }));
}

function toCellBankCollection(
  summary: {
    readonly banks: readonly CellBankMetrics[];
    readonly totalRestorable: number;
    readonly totalCells: number;
  },
  slots: readonly LoadoutSlot[],
): CellBankCollection {
  if (summary.banks.length === 0) {
    return { kind: 'noneFitted' };
  }

  return {
    kind: 'fitted',
    totalRestorable: summary.totalRestorable,
    totalCells: summary.totalCells,
    banks: summary.banks.map((bank) => {
      // The bank's own mount, found by the exact key the package reported it
      // under. It is what says `5A`: the summary carries the figures a bank
      // restores, and the fitted record carries what the bank is.
      const module = slots.find((slot) => slot.key === bank.slot)?.module ?? null;

      return {
        slotKey: bank.slot,
        symbol: bank.symbol,
        identity: module === null ? null : moduleIdentity(module),
        reinforcement: bank.reinforcement,
        cells: bank.cells,
        spinUp: bank.spinUp,
        duration: bank.duration,
        heat: bank.heat,
        powered: bank.powered,
      };
    }),
  };
}

/**
 * The canvas's source rows for one headline: one row per role something is
 * fitted in, in the canvas's order, each carrying the package's own aggregate
 * for that role and the modules that sit in it.
 *
 * A module reaches a row only through its resolved record's `engineeringGroup`
 * — or, for the bulkhead, by sitting in the armour mount. A mount whose module
 * has no resolved record produces nothing: the package could not say what it
 * is, and neither can this. Inside a row the package's own slot order stands.
 */
function classifyRoles<TRole extends DefenceRole>(
  slots: readonly LoadoutSlot[],
  groups: Partial<Record<EngineeringGroupId, DefenceRole>>,
  order: readonly TRole[],
  includeBulkhead: boolean,
  contributions: Record<TRole, number>,
): readonly DefenceRoleGroup[] {
  const fitted = new Map<TRole, FittedDefenceModule[]>();

  for (const slot of slots) {
    const module = slot.module;
    if (module === null) {
      continue;
    }

    const role = roleOf(slot, groups, includeBulkhead);
    if (role === undefined || !order.includes(role as TRole)) {
      continue;
    }

    const modules = fitted.get(role as TRole) ?? [];
    modules.push({
      slotKey: slot.key,
      symbol: module.symbol,
      enabled: module.on ?? 'unspecified',
      identity: moduleIdentity(module),
    });
    fitted.set(role as TRole, modules);
  }

  return order.flatMap((role) => {
    const modules = fitted.get(role);
    return modules === undefined ? [] : [{ role, contribution: contributions[role], modules }];
  });
}

/** The role a fitted mount plays, or nothing where the package names none. */
function roleOf(
  slot: LoadoutSlot,
  groups: Partial<Record<EngineeringGroupId, DefenceRole>>,
  includeBulkhead: boolean,
): DefenceRole | undefined {
  // The armour mount is read from the mount, not from a group: the package
  // calculates a stock alloy for a hull with nothing fitted, and that
  // calculation is not a fitted module to send anyone to.
  if (includeBulkhead && slot.kind === 'armour') {
    return 'bulkhead';
  }

  const group = slot.module?.stats?.engineeringGroup ?? null;
  return group === null ? undefined : groups[group];
}

/**
 * What a fitted module is, in the parts the canvas names it by.
 *
 * `null` where the fitted record did not resolve — a size and a grade nobody
 * stated are not a size and a grade of zero.
 */
function moduleIdentity(module: FittedModule): ModuleIdentity | null {
  const stats = module.effectiveStats;
  if (stats === null) {
    return null;
  }

  const engineering = module.engineering;
  return {
    size: stats.class,
    rating: stats.rating,
    blueprint: engineering?.BlueprintName ?? null,
    grade: engineering?.Level ?? null,
    experimental: engineering?.ExperimentalEffect ?? null,
  };
}
