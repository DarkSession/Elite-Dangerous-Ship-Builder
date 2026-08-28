import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import { PowerConditionsStore } from '../../../../application/power-heat/power-conditions.store';
import {
  projectDefence,
  type CalculationIssueView,
  type CellBankView,
  type Defence,
  type DamageDefenceValue,
  type DamageType,
  type DefenceRole,
  type DefenceRoleGroup,
  type ModuleIdentity,
} from '../../../../domain/defence/defence';
import { Formatters } from '../../../../i18n/formatters/formatters';
import { GameTextPresenter, type GameTextPresentation } from '../../../../i18n/game-text.presenter';
import type { MessageKey } from '../../../../i18n/locale-registry';
import { MessageService } from '../../../../i18n/message.service';
import { relationId } from '../../../../ui/a11y/text-equivalence';
import { GameText } from '../../../../ui/components/game-text/game-text';
import type { Metric } from '../../../../ui/components/metric-group/metric-group';
import { MetricGroup } from '../../../../ui/components/metric-group/metric-group';
import { UnavailableValue } from '../../../../ui/components/unavailable-value/unavailable-value';
import { ModuleIdentityBadge } from '../../../../ui/outfitting/module-identity-badge';

/** One damage line: `KINETIC`, its bar, `41%` and `3,122`, in that order. */
interface DamageRowView {
  readonly id: string;
  readonly label: string;
  /** The signed package resistance, formatted. A weakness keeps its minus. */
  readonly resistance: string;
  /** The pool at that resistance, or `null` where the package returned no bound. */
  readonly pool: string | null;
  /**
   * The same pool read at the standing SYS allocation, on the shield only.
   *
   * `undefined` on a table that has no such column — the hull, which pips do
   * not reach. `null` inside a table that has one carries the same meaning
   * {@link pool}'s `null` does: the package published no bound.
   */
  readonly poolAtPips?: string | null;
  /** The symbol drawn in place of an unbounded pool. */
  readonly unbounded: string;
  /** What that symbol stands for, in words. */
  readonly unboundedMeaning: string;
  /** Where the bar starts, in `[0, 1]` of the track. Decoration only. */
  readonly barStart: number;
  /** How far it runs from there, in `[0, 1]` of the track. Decoration only. */
  readonly barLength: number;
  /** A resistance below zero, which the canvas draws in the danger ink and hatched. */
  readonly weakness: boolean;
  /** That state in words, so the hatch is never the only thing that says it. */
  readonly weaknessLabel: string | null;
}

/**
 * One card's four damage lines and the scale they are all drawn on.
 *
 * The scale ends at `100%`, where the package stops publishing a bound, and
 * begins at whichever resistance in the table is lowest — `0%` where none of
 * them is a weakness, and below it where one is. That is what canvas 1c draws:
 * the shields, all positive, start their bars at the leading edge, and the hull,
 * with a weakness among them, carries a zero mark inside the track with the
 * weakness running back from it.
 */
interface DamageTableView {
  readonly rows: readonly DamageRowView[];
  /**
   * The fifth column's heading — `MJ × 2 SYS PIPS` — or `null` for a table
   * without one.
   *
   * The heading names the allocation it was read at, because a figure that
   * moves with a condition shown without that condition is the misleading
   * number constitution IV forbids (FR-002).
   */
  readonly pipColumn: string | null;
  /** Where zero sits on the track, in `[0, 1]`. `0` with nothing below it. */
  readonly zeroAt: number;
  /** Whether the scale reaches below zero at all, which draws the zero mark. */
  readonly signed: boolean;
  /** The scale's own ends, as the canvas prints them under the bars. */
  readonly floor: string;
  readonly ceiling: string;
  /**
   * Zero, printed at the mark on a scale that reaches below it.
   *
   * The canvas prints `0%` at the leading edge, which is where zero is on its
   * shield table and is not where zero is on its hull table. On a table that
   * reaches below zero it is printed where the mark actually stands, so the
   * end of the scale and the point the bars are measured from are two readings
   * rather than one that contradicts the drawing above it.
   */
  readonly zero: string;
}

/** One source row: what is fitted in a role, and what the package credits the role with. */
interface SourceRowView {
  readonly id: string;
  /** The package's name for the module, where every mount in the row holds one. */
  readonly name: GameTextPresentation | null;
  /** The role, named, where the mounts in the row hold different modules. */
  readonly roleLabel: string | null;
  /** The canvas's `×4`, on a row standing for more than one mount. */
  readonly count: string | null;
  /** The canvas's `7C`, drawn from the package's own class and rating. */
  readonly moduleClass: number | null;
  readonly rating: string | null;
  /** What has been done to it: `THERMAL RESIST G5`, `PRE-ENGINEERED`. */
  readonly detail: string | null;
  /** The package aggregate for the whole role, formatted. */
  readonly contribution: string;
  /** How far the bar runs, in `[0, 1]` of the row carrying the most. Decoration only. */
  readonly fill: number;
}

/** The canvas's bank line: the reserve, and the banks it is made of. */
interface BankReserveView {
  readonly label: string;
  /** Megajoules the package says every powered cell aboard restores. */
  readonly restorable: string;
  /** The reserve on the block's own scale, in `[0, 1]`. `null` with nothing to scale by. */
  readonly fill: number | null;
  /** Whether nothing aboard is switched on, which the canvas hatches. */
  readonly unpowered: boolean;
  /** One line per kind of bank aboard, in the package's own slot order. */
  readonly banks: readonly BankLineView[];
}

/**
 * One kind of bank aboard: the module, how many of it, and what each holds.
 *
 * Banks are listed apart when they differ in anything a Commander would act on
 * — the module fitted, what one activation restores, how many cells it carries,
 * whether it is switched on — because a reserve summed over a powered 5A and a
 * dead 3D describes neither of them. Identical banks in the same state collapse
 * into one line with the canvas's own `×4`.
 */
interface BankLineView {
  readonly id: string;
  readonly name: GameTextPresentation;
  /** The canvas's `5A`, drawn from the fitted record's own class and rating. */
  readonly moduleClass: number | null;
  readonly rating: string | null;
  /** The canvas's `×4`, where the line stands for more than one bank. */
  readonly count: string | null;
  /**
   * What follows the code on the bank's own line: `4 cells · UNPOWERED`.
   *
   * The state is inside the line rather than beside it because that is where
   * the canvas writes it, and because a word inside the line is read out with
   * the bank it belongs to instead of arriving as a loose label after it.
   */
  readonly detail: string;
  /** What one activation of this bank restores, formatted. The bar's own figure. */
  readonly reinforcement: string;
  /** That figure on the block's own scale, in `[0, 1]`. `null` with nothing to scale by. */
  readonly fill: number | null;
  /** Whether the plant does not feed this bank, which hatches its bar. */
  readonly unpowered: boolean;
}

/** One package issue, in the package's own words. */
interface IssueView {
  readonly id: string;
  readonly message: GameTextPresentation;
}

/** The role names, written out: `MessageKey` is the catalogue's own key union. */
const ROLE_LABELS = {
  shieldGenerator: 'defence.source.shield-generator',
  shieldBooster: 'defence.source.shield-booster',
  shieldReinforcement: 'defence.source.shield-reinforcement',
  bulkhead: 'defence.source.bulkhead',
  hullReinforcement: 'defence.source.hull-reinforcement',
} as const satisfies Record<DefenceRole, MessageKey>;

/** The damage-type names, likewise. */
const DAMAGE_LABELS = {
  kinetic: 'defence.damage.kinetic',
  thermal: 'defence.damage.thermal',
  explosive: 'defence.damage.explosive',
  caustic: 'defence.damage.caustic',
} as const satisfies Record<DamageDefenceValue['type'], MessageKey>;

/** Megajoules and hull points whole, as the canvas sets every pool figure. */
const POOL_DIGITS = 0;
/** Rates to one place, as the canvas sets `2.4 MJ/s`. */
const RATE_DIGITS = 1;
/**
 * The heading's allocation, whole where the allocation is whole.
 *
 * The canvas heads the column `4 SYS PIPS`, not `4.0`. The game moves pips half
 * a step at a time, though, so a half allocation keeps its place rather than
 * being rounded to a whole one the build is not standing at.
 */
const pipDigits = (pips: number): number => (Number.isInteger(pips) ? 0 : 1);
/** Where every damage scale ends: the resistance at which a pool stops being bounded. */
const RESISTANCE_CEILING = 1;

/**
 * `DEFENCE ANALYSIS`: what the shields hold, what the hull takes, and against what.
 *
 * Canvas 1c draws this as the `DEFENCE` mode of the hull anatomy region — two
 * equal cards, `SHIELDS` and `ARMOUR`, each of them a head with the fitted
 * article named beside it, one headline pool, the four damage lines against a
 * `0%`–`100%` scale, three labelled facts, and the source rows underneath.
 * Canvas 1d stacks the same two cards. Same DOM at both widths; which
 * arrangement appears is decided in CSS from the space the region is given, so
 * a 400% zoom picks the stacked one for the same reason a phone does.
 *
 * Every figure is a package answer selected by `src/app/domain/defence/defence.ts`.
 * This component formats and names them and does no arithmetic of its own,
 * which is why each source row carries the package's aggregate for a whole role
 * rather than a share worked out per module: the Almanac publishes no such
 * split, and one divided out here would be this application's claim rather than
 * the Almanac's (constitution II and IV,
 * `specs/006-defence-profile/design/reference-review.md`).
 *
 * Two package sentinels keep their own state and their own words rather than
 * being drawn as numbers: an unbounded effective pool is a resistance of 100%,
 * and an infinite recovery duration is a phase that never finishes at the
 * allocation being read.
 */
@Component({
  selector: 'edsb-defence-analysis',
  imports: [GameText, MetricGroup, ModuleIdentityBadge, NgTemplateOutlet, UnavailableValue],
  templateUrl: './defence-analysis.html',
  styleUrl: './defence-analysis.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefenceAnalysis {
  readonly #active = inject(ActiveBuildStore);
  readonly #conditions = inject(PowerConditionsStore);
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);
  readonly #gameText = inject(GameTextPresenter);

  readonly shieldHeadingId = relationId('defence-shield');
  readonly armourHeadingId = relationId('defence-armour');

  readonly shieldHeading = this.#messages.messageSignal('defence.shield.heading');
  readonly shieldPoolLabel = this.#messages.messageSignal('defence.shield.pool');
  readonly shieldUnavailableLabel = this.#messages.messageSignal('defence.shield.unavailable');
  readonly armourHeading = this.#messages.messageSignal('defence.armour.heading');
  readonly armourPoolLabel = this.#messages.messageSignal('defence.armour.pool');
  readonly armourFactsLabel = this.#messages.messageSignal('defence.armour.facts');
  readonly damageLabel = this.#messages.messageSignal('defence.damage.label');
  readonly typeColumn = this.#messages.messageSignal('defence.damage.column.type');
  readonly resistColumn = this.#messages.messageSignal('defence.damage.column.resist');
  readonly megajoulesColumn = this.#messages.messageSignal('defence.damage.column.megajoules');
  readonly hullPointsColumn = this.#messages.messageSignal('defence.damage.column.hull-points');
  readonly recoveryLabel = this.#messages.messageSignal('defence.recovery.label');
  readonly shieldSourceLabel = this.#messages.messageSignal('defence.source.shield');
  readonly armourSourceLabel = this.#messages.messageSignal('defence.source.armour');

  /**
   * The projection for the active build at the standing SYS allocation.
   *
   * `revision()` is read first because the loadout signal holds one mutable
   * package object: an edit changes what it contains without changing the
   * reference, so the revision is what actually says "this is different now".
   */
  readonly #projection = computed<Defence | null>(() => {
    this.#active.revision();
    const loadout = this.#active.loadout();
    return loadout === null
      ? null
      : projectDefence(loadout, { systemsPips: this.#conditions.pips().systems });
  });

  /** Nothing is drawn without a build. The workspace already says why it is empty. */
  readonly shown = computed(() => this.#projection() !== null);

  /** Whether the package produced a shield at all. Everything in the card follows it. */
  readonly shieldAvailable = computed(() => this.#projection()?.shield.kind === 'complete');

  /**
   * The article named beside `SHIELDS`, as the canvas names it: `BI-WEAVE 7C`.
   *
   * The generator's own row says the same thing a few lines below, and the
   * canvas draws both — the head names what is being read and the row is one
   * source among several.
   */
  readonly shieldIdentity = computed(() => this.#headIdentity('shieldGenerator', true));

  /** The article named beside `ARMOUR`. A bulkhead has no size or rating to draw. */
  readonly armourIdentity = computed(() => this.#headIdentity('bulkhead', false));

  /** The canvas's `1,842`, which is the package's own strength. */
  readonly shieldPool = computed(() => {
    const shield = this.#projection()?.shield;
    return shield === undefined || shield.kind !== 'complete'
      ? null
      : this.#formatters.decimal(shield.value.strength, POOL_DIGITS);
  });

  /** The canvas's `3,914`: the hull points the package totals for this build. */
  readonly armourPool = computed(() => {
    const armour = this.#projection()?.armour;
    return armour === undefined ? null : this.#formatters.decimal(armour.hitPoints, POOL_DIGITS);
  });

  /**
   * The shield table: the bare four columns, and the pip column beside them.
   *
   * The first four are `shieldMetricsResult()`, which is pip-free — the base
   * resistances an outfitting screen shows — and they do not move when a pip
   * moves. The fifth is `shieldCapacitorMetricsResult()` at the standing allocation,
   * and it is the only cell on the table that does (FR-002).
   */
  readonly shieldDamage = computed<DamageTableView>(() => {
    const projection = this.#projection();
    const shield = projection?.shield;
    const capacitor = projection?.capacitor;
    const table = this.#damageTable(
      shield === undefined || shield.kind !== 'complete' ? [] : shield.value.damage,
    );
    if (capacitor === undefined || capacitor.kind !== 'complete' || table.rows.length === 0) {
      return table;
    }

    // Paired by damage type rather than by position: two package records keyed
    // the same way, read key to key, with nothing derived from either.
    const atPips = new Map(capacitor.value.damage.map((row) => [row.type, row]));
    return {
      ...table,
      pipColumn: this.#messages.message('defence.damage.column.megajoules-at-pips', {
        pips: this.#formatters.decimal(
          capacitor.value.systemsPips,
          pipDigits(capacitor.value.systemsPips),
        ),
      }),
      rows: table.rows.map((row) => ({
        ...row,
        poolAtPips: this.#poolText(atPips.get(row.id as DamageType)?.effectiveHitPoints),
      })),
    };
  });

  readonly armourDamage = computed<DamageTableView>(() =>
    this.#damageTable(this.#projection()?.armour.damage ?? []),
  );

  /** Every ordered package reason the shield could not be read. */
  readonly shieldIssues = computed<readonly IssueView[]>(() => {
    const shield = this.#projection()?.shield;
    return shield === undefined || shield.kind !== 'unavailable' ? [] : this.#issues(shield.issues);
  });

  /**
   * The canvas's `RECHARGE` / `0→100%` / `BROKEN RESET`.
   *
   * A duration the package returns as `Infinity` is a phase that never finishes
   * at this allocation. It is drawn as the symbol for that with the meaning
   * beside it, never as a very large number of seconds.
   */
  readonly recoveryFacts = computed<readonly Metric[]>(() => {
    const recovery = this.#projection()?.recovery;
    if (recovery === undefined || recovery.kind !== 'complete') {
      return [];
    }

    const { regenRate, recoveryTime, regenTime } = recovery.value;
    return [
      {
        id: 'rate',
        label: this.#messages.message('defence.recovery.rate'),
        value: this.#messages.message('defence.format.megajoules-per-second', {
          value: this.#formatters.decimal(regenRate, RATE_DIGITS),
        }),
      },
      this.#duration('regen', 'defence.recovery.full', regenTime),
      this.#duration('broken', 'defence.recovery.broken', recoveryTime),
    ];
  });

  /** Every ordered package reason the recovery could not be read. */
  readonly recoveryIssues = computed<readonly IssueView[]>(() => {
    const recovery = this.#projection()?.recovery;
    return recovery === undefined || recovery.kind !== 'unavailable'
      ? []
      : this.#issues(recovery.issues);
  });

  /** The canvas's `HARDNESS` / `MODULE PROT.` / `INTEGRITY`. */
  readonly armourFacts = computed<readonly Metric[]>(() => {
    const projection = this.#projection();
    if (projection === null) {
      return [];
    }

    return [
      {
        id: 'hardness',
        label: this.#messages.message('defence.armour.hardness'),
        value: this.#formatters.integer(projection.hardness),
      },
      {
        id: 'module-protection',
        label: this.#messages.message('defence.armour.module-protection'),
        value: this.#formatters.percent(projection.armour.moduleProtection),
      },
      {
        id: 'integrity',
        label: this.#messages.message('defence.armour.integrity'),
        value: this.#formatters.decimal(projection.armour.moduleArmour, POOL_DIGITS),
      },
    ];
  });

  readonly shieldSources = computed<readonly SourceRowView[]>(() =>
    this.#sourceRows(this.#projection()?.shieldRoles ?? [], (value) => this.#megajoules(value)),
  );

  readonly armourSources = computed<readonly SourceRowView[]>(() =>
    this.#sourceRows(this.#projection()?.armourRoles ?? [], (value) => this.#hullPoints(value)),
  );

  /**
   * The canvas's bank line, drawn only where a bank is aboard, and the banks
   * behind it.
   *
   * The figure is the package's own `totalRestorable` — megajoules every
   * powered cell aboard puts back — and under it every kind of bank aboard is
   * named the way the canvas names the one it draws. A build with banks fitted
   * and none switched on keeps the line and says so in a word: the reserve is
   * aboard, and the package reporting zero is not the same state as carrying
   * nothing.
   *
   * Every bar in the block is drawn against the largest figure in it, which is
   * the rule the canvas's own source rows follow — its `+144` row is 13% of a
   * track its `1,090` row fills. That keeps the reserve and one activation of
   * one bank on one scale, and keeps them drawable on a build whose shield the
   * package refused.
   */
  readonly bankRow = computed<BankReserveView | null>(() => {
    const projection = this.#projection();
    if (projection === null || projection.cellBanks.kind === 'noneFitted') {
      return null;
    }

    const banks = projection.cellBanks;
    const largest = Math.max(
      banks.totalRestorable,
      ...banks.banks.map((bank) => bank.reinforcement),
    );

    return {
      label: this.#messages.message('defence.banks.label'),
      restorable: this.#megajoules(banks.totalRestorable),
      fill: this.#barLength(banks.totalRestorable, largest),
      unpowered: banks.banks.every((bank) => !bank.powered),
      banks: this.#bankLines(banks.banks, largest),
    };
  });

  /**
   * One card's damage lines, and the scale all four of them are drawn on.
   *
   * The scale is settled before any bar is: it runs to `100%`, where the
   * package stops publishing a bound, and back to the lowest resistance in the
   * table. With nothing below zero that is the leading edge and the canvas
   * draws no mark; with a weakness among them, zero moves inside the track and
   * the weakness runs back from it, which is the ground a negative bar needs to
   * be drawn on at all.
   */
  #damageTable(values: readonly DamageDefenceValue[]): DamageTableView {
    const lowest = Math.min(0, ...values.map((value) => value.resistance));
    const span = RESISTANCE_CEILING - lowest;
    const zeroAt = Math.abs(lowest) / span;

    return {
      rows: values.map((value) => this.#damageRow(value, span, zeroAt)),
      // Only the shield has one, and it adds its own after this.
      pipColumn: null,
      zeroAt,
      signed: lowest < 0,
      floor: this.#formatters.percent(lowest),
      ceiling: this.#formatters.percent(RESISTANCE_CEILING),
      zero: this.#formatters.percent(0),
    };
  }

  /** One damage line, with the bar beside it drawn to the resistance itself. */
  #damageRow(value: DamageDefenceValue, span: number, zeroAt: number): DamageRowView {
    const weakness = value.resistance < 0;
    const bar = this.#barSpan(value.resistance, span, zeroAt);

    return {
      id: value.type,
      label: this.#messages.message(DAMAGE_LABELS[value.type]),
      resistance: this.#formatters.percent(value.resistance),
      // A resistance of 100% leaves the package with no bound to publish. The
      // symbol for that is drawn instead of a number nobody could act on.
      pool: this.#poolText(value.effectiveHitPoints),
      unbounded: this.#messages.message('defence.damage.unbounded'),
      unboundedMeaning: this.#messages.message('defence.damage.unbounded.meaning'),
      barStart: bar.start,
      barLength: bar.length,
      weakness,
      weaknessLabel: weakness ? this.#messages.message('defence.damage.weakness') : null,
    };
  }

  /** One pool, or `null` where the package published no bound for it. */
  #poolText(hitPoints: number | undefined): string | null {
    return hitPoints !== undefined && Number.isFinite(hitPoints)
      ? this.#formatters.decimal(hitPoints, POOL_DIGITS)
      : null;
  }

  /**
   * Where one bar sits on the table's scale, in `[0, 1]` of the track.
   *
   * A resistance runs right from zero and a weakness runs left from it, which
   * is how the canvas draws the one weakness in its sample hull. Both are held
   * inside the track: the scale was built from these same values, so neither
   * can leave it, and the clamp is there for a package that one day publishes a
   * resistance past `100%` rather than for anything this table can produce.
   */
  #barSpan(
    resistance: number,
    span: number,
    zeroAt: number,
  ): { readonly start: number; readonly length: number } {
    const length = Math.max(0, Math.min(1, Math.abs(resistance) / span));
    return resistance < 0
      ? { start: Math.max(0, zeroAt - length), length: Math.min(length, zeroAt) }
      : { start: zeroAt, length: Math.min(length, 1 - zeroAt) };
  }

  /**
   * One row per role something is fitted in, and the bar each is drawn with.
   *
   * The first row carries the figure the rest add to — the generator, the
   * bulkhead — and the canvas writes the others with a leading `+` to say so.
   * The bars are measured against the largest figure in the same list, which is
   * what makes them comparable with each other and with nothing else.
   */
  #sourceRows(
    groups: readonly DefenceRoleGroup[],
    format: (value: number) => string,
  ): readonly SourceRowView[] {
    const largest = Math.max(0, ...groups.map((group) => group.contribution));

    return groups.map((group, index) => {
      const shared = this.#sharedIdentity(group);
      const symbol = this.#sharedSymbol(group);

      return {
        id: group.role,
        name: symbol === null ? null : this.#gameText.moduleName(symbol),
        // A row whose mounts hold different modules cannot be named after one of
        // them, so it is named after what they do instead.
        roleLabel: symbol === null ? this.#messages.message(ROLE_LABELS[group.role]) : null,
        count:
          group.modules.length > 1
            ? this.#messages.message('defence.source.count', {
                count: this.#formatters.integer(group.modules.length),
              })
            : null,
        // The armour mount has no size or rating a Commander outfits by — every
        // hull's bulkhead is class 1 rating I — so the canvas draws none there.
        moduleClass: group.role === 'bulkhead' ? null : (shared?.size ?? null),
        rating: group.role === 'bulkhead' ? null : (shared?.rating ?? null),
        detail: shared === null ? null : this.#engineering(shared),
        contribution:
          index === 0
            ? format(group.contribution)
            : this.#messages.message('defence.source.added', {
                value: format(group.contribution),
              }),
        fill: this.#barLength(group.contribution, largest) ?? 0,
      };
    });
  }

  /** The identity every mount in a row shares, or nothing where they differ. */
  #sharedIdentity(group: DefenceRoleGroup): ModuleIdentity | null {
    const [first, ...rest] = group.modules;
    if (first?.identity == null) {
      return null;
    }
    return rest.every((module) => this.#sameIdentity(module.identity, first.identity))
      ? first.identity
      : null;
  }

  /** The symbol every mount in a row shares, or nothing where they differ. */
  #sharedSymbol(group: DefenceRoleGroup): string | null {
    const [first, ...rest] = group.modules;
    if (first === undefined) {
      return null;
    }
    return rest.every((module) => module.symbol === first.symbol) ? first.symbol : null;
  }

  #sameIdentity(left: ModuleIdentity | null, right: ModuleIdentity | null): boolean {
    return (
      left !== null &&
      right !== null &&
      left.size === right.size &&
      left.rating === right.rating &&
      left.blueprint === right.blueprint &&
      left.grade === right.grade &&
      left.experimental === right.experimental
    );
  }

  /** The canvas's `THERMAL RESIST G5 · CORROSIVE`, in the package's own words. */
  #engineering(identity: ModuleIdentity): string | null {
    const parts: string[] = [];

    if (identity.blueprint !== null && identity.grade !== null) {
      parts.push(
        this.#messages.message('outfitting.slot.engineering', {
          blueprint: this.#gameText.blueprintName(identity.blueprint).text ?? identity.blueprint,
          grade: identity.grade,
        }),
      );
    }
    if (identity.experimental !== null) {
      parts.push(
        this.#gameText.experimentalEffectName(identity.experimental).text ?? identity.experimental,
      );
    }

    return parts.length === 0 ? null : parts.join(this.#separator());
  }

  /** The article named beside a card's heading: the module's name and its code. */
  #headIdentity(
    role: DefenceRole,
    withCode: boolean,
  ): {
    readonly name: GameTextPresentation;
    readonly code: string | null;
  } | null {
    const groups = [
      ...(this.#projection()?.shieldRoles ?? []),
      ...(this.#projection()?.armourRoles ?? []),
    ];
    const group = groups.find((candidate) => candidate.role === role);
    const symbol = group === undefined ? null : this.#sharedSymbol(group);
    if (group === undefined || symbol === null) {
      return null;
    }

    const identity = this.#sharedIdentity(group);
    return {
      name: this.#gameText.moduleName(symbol),
      code:
        !withCode || identity === null
          ? null
          : this.#messages.message('defence.module.code', {
              size: this.#formatters.integer(identity.size),
              rating: identity.rating,
            }),
    };
  }

  /**
   * One line per kind of bank aboard, in the package's own slot order.
   *
   * Banks are held apart by everything a Commander would act on: the module
   * fitted, what one activation restores, the cells it carries and whether it
   * is switched on. Two banks alike in all four are the same line, counted, as
   * the canvas counts its boosters; anything else is its own line, because one
   * line covering a powered 5A and a dead 3D describes neither of them.
   */
  #bankLines(banks: readonly CellBankView[], largest: number): readonly BankLineView[] {
    const lines = new Map<string, { readonly bank: CellBankView; count: number }>();

    for (const bank of banks) {
      const key = [bank.symbol, bank.cells, bank.reinforcement, bank.powered].join('|');
      const seen = lines.get(key);
      if (seen === undefined) {
        lines.set(key, { bank, count: 1 });
      } else {
        seen.count += 1;
      }
    }

    return [...lines].map(([key, { bank, count }]) => ({
      id: key,
      name: this.#gameText.moduleName(bank.symbol),
      moduleClass: bank.identity?.size ?? null,
      rating: bank.identity?.rating ?? null,
      count:
        count > 1
          ? this.#messages.message('defence.source.count', {
              count: this.#formatters.integer(count),
            })
          : null,
      detail: [
        this.#messages.message('defence.banks.detail', {
          cells: this.#formatters.integer(bank.cells),
        }),
        ...(bank.powered ? [] : [this.#messages.message('defence.banks.unpowered')]),
      ].join(this.#separator()),
      // One activation, on the block's own scale, so this length and the
      // reserve's above it can be read against each other. The package
      // publishes no per-bank restorable, and one worked out from the cells
      // here would be a figure it never gave.
      reinforcement: this.#megajoules(bank.reinforcement),
      fill: this.#barLength(bank.reinforcement, largest),
      unpowered: !bank.powered,
    }));
  }

  /** A recovery duration, or the symbol for a phase that never finishes. */
  #duration(id: string, label: MessageKey, seconds: number): Metric {
    const finished = Number.isFinite(seconds);
    return {
      id,
      label: this.#messages.message(label),
      value: finished ? this.#formatters.duration(seconds) : null,
      unavailableLabel: finished ? undefined : this.#messages.message('defence.recovery.never'),
      description: finished ? undefined : this.#messages.message('defence.recovery.never.meaning'),
    };
  }

  /** Every package issue in the order the package returned it, in its own words. */
  #issues(issues: readonly CalculationIssueView[]): readonly IssueView[] {
    return issues.map((issue, index) => ({
      id: `${issue.field}-${issue.reason}-${index}`,
      message: this.#gameText.calculationIssueMessage(issue.packageIssue),
    }));
  }

  #megajoules(value: number): string {
    return this.#messages.message('defence.format.megajoules', {
      value: this.#formatters.decimal(value, POOL_DIGITS),
    });
  }

  #hullPoints(value: number): string {
    return this.#messages.message('defence.format.hull-points', {
      value: this.#formatters.decimal(value, POOL_DIGITS),
    });
  }

  /**
   * How far a bar runs, in `[0, 1]` of what it is measured against.
   *
   * The one ratio this component takes, and it is decoration: every bar it
   * sizes has its own figure set beside it in words, and no length is ever read
   * as a value. `null` where there is nothing to measure against, which draws
   * no bar rather than an empty one a reader would take for zero.
   */
  #barLength(value: number, scale: number): number | null {
    return scale <= 0 ? null : Math.max(0, Math.min(1, value / scale));
  }

  #separator(): string {
    return this.#messages.message('defence.module.separator');
  }
}
