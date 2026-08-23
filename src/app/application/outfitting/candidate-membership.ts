import type { OutfittingFamilyId } from '@elite-dangerous-almanac/core/ships/module-families';
import type {
  ModuleMount,
  ModuleRating,
  OutfittingModule,
} from '@elite-dangerous-almanac/core/ships/modules';
import {
  getPreEngineeredVariants,
  type PreEngineeredVariant,
} from '@elite-dangerous-almanac/core/ships/pre-engineered';
import { getPreEngineeredStats } from '@elite-dangerous-almanac/core/ships/pre-engineered-stats';
import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { GameTextPresentation } from '../../i18n/game-text.presenter';
import {
  acquisitionLabels,
  acquisitionSection,
  catalogueSource,
  type AcquisitionLabel,
  type CandidateSection,
} from './acquisition-labels';
import { choiceKeyOf } from './choice-key';
import type { ModuleTextResolver } from './fitted-module-view';

/**
 * The package facts one chooser row shows.
 *
 * Exactly the columns canvas 1c draws that the Almanac actually publishes, and
 * `null` wherever it publishes none. There is no fallback to the stock record's
 * number for a variant that resolves to nothing: a reward's mass is the
 * reward's, and showing the stock module's in its place would be a figure
 * nobody measured (module-catalogue contract, "Candidate facts").
 */
export interface CandidateFacts {
  /** Damage per round, or per second on a continuous-fire weapon. */
  readonly damage: number | null;
  readonly mass: number | null;
  readonly powerDraw: number | null;
  /** The weapons capacitor draw canvas 1c heads `DRAW WEP`. */
  readonly distributorDraw: number | null;
  readonly cost: number | null;
}

/** One row's presentation values, all projected straight from the package. */
export interface ChoicePresentation {
  readonly name: GameTextPresentation;
  /**
   * The Almanac's own family for this choice, and the only grouping there is.
   *
   * Read off the `OutfittingModule` the row was expanded from, so a variant
   * takes the family of the module it is built on: canvas 1c draws
   * `Plasma Accelerator · Advanced` directly under `Plasma Accelerator · Fixed`,
   * and grouping by the displayed name — which is what the withdrawn
   * `CandidateGroup` did — splits that family in two (FR-020, decision 13).
   */
  readonly familyId: OutfittingFamilyId;
  /** That family's name for the reading language, from the package alone. */
  readonly family: GameTextPresentation;
  readonly class: number;
  readonly rating: ModuleRating;
  readonly mount: ModuleMount | null;
  /**
   * Whether the choice is a one-off reward, for its own row's label.
   *
   * Not a grouping and not an order: families are the only level the chooser
   * has, and a reward sits under the module it is built on with its
   * route icon beside its name (FR-024, decision 14).
   */
  readonly section: CandidateSection;
  readonly labels: readonly AcquisitionLabel[];
  /**
   * The grade a variant is *bought* at, never its current ordinary grade.
   *
   * The two are different numbers and confusing them is a real error: a
   * Mercenary article arrives at grade 1 and is upgraded from there, so
   * labelling that 1 as the module's engineering grade tells a Commander their
   * reward is worse than it is (module-catalogue contract, "Candidate facts").
   */
  readonly purchaseGrade: number | null;
  readonly facts: CandidateFacts;
}

/**
 * One thing a Commander can fit into the selected mount.
 *
 * The exact package object is retained — not a copy, not a reconstruction from
 * a symbol. `setModule` and `setPreEngineeredVariant` take the record the
 * package produced, and handing them something rebuilt from an identity would
 * be this application deciding what that identity means (module-catalogue
 * contract, "Membership" item 5).
 */
export type ModuleChoice =
  | {
      readonly kind: 'stock';
      readonly key: string;
      readonly module: OutfittingModule;
      readonly sourceOrdinal: number;
      readonly presentation: ChoicePresentation;
    }
  | {
      readonly kind: 'variant';
      readonly key: string;
      readonly module: OutfittingModule;
      readonly variant: PreEngineeredVariant;
      readonly sourceOrdinal: number;
      readonly variantOrdinal: number;
      readonly presentation: ChoicePresentation;
    };

/**
 * The exact article a mount currently carries, for matching it in the list.
 *
 * The whole variant record, never the symbol alone. A stock article and its
 * pre-engineered variants share a symbol, and the Almanac sells more than one
 * reward under one name, so anything less marks two rows as the one fitted
 * module (wave 4).
 */
export interface FittedArticle {
  readonly symbol: string;
  readonly variant: PreEngineeredVariant | null;
}

/**
 * Whether one offered choice is the article already in the mount.
 *
 * One rule, two readers: the row that says `FITTED` and the family that opens
 * on it. Two copies of this comparison is two chances for the chooser to open a
 * family the marked row is not in (FR-021).
 */
export function isFittedChoice(choice: ModuleChoice, fitted: FittedArticle | null): boolean {
  if (fitted === null || choice.module.symbol !== fitted.symbol) {
    return false;
  }
  if (choice.kind !== 'variant') {
    return fitted.variant === null;
  }
  return (
    fitted.variant !== null &&
    choice.variant.name === fitted.variant.name &&
    choice.variant.blueprint === fitted.variant.blueprint &&
    choice.variant.grade === fitted.variant.grade
  );
}

/** Everything the chooser holds for one mount at one build revision. */
export interface CandidateMembership {
  readonly slotKey: string;
  /** The revision these choices were read at. A stale one is discarded whole. */
  readonly buildRevision: number;
  readonly choices: readonly ModuleChoice[];
}

/**
 * Everything the package offers for one mount, and nothing else.
 *
 * The expansion is exactly two steps and has no third: one stock choice per
 * `modulesForSlot` record, then every `getPreEngineeredVariants` row for that
 * record's symbol, emitted immediately after it. There is no `ALL_MODULES`
 * query, no deduplication of routes and no invented candidate — a module the
 * package sells through both a Mercenary and a community-goal route is two
 * articles a Commander acquires two different ways, and merging them would lose
 * the label the choice is made on (FR-004, FR-006).
 *
 * `modulesForSlot` is called once. It is the package's own fittability answer
 * for the *current* build, so it already accounts for exclusive families and
 * count limits, and calling it again per candidate would be asking the same
 * question repeatedly and getting a slower answer.
 */
export function candidateMembership(
  loadout: ShipLoadout,
  slotKey: string,
  buildRevision: number,
  text: ModuleTextResolver,
): CandidateMembership {
  const choices: ModuleChoice[] = [];

  loadout.modulesForSlot(slotKey).forEach((module, sourceOrdinal) => {
    choices.push({
      kind: 'stock',
      key: choiceKeyOf({ kind: 'stock', symbol: module.symbol, sourceOrdinal }),
      module,
      sourceOrdinal,
      presentation: presentationOf(module, null, text),
    });

    getPreEngineeredVariants(module.symbol).forEach((variant, variantOrdinal) => {
      choices.push({
        kind: 'variant',
        key: choiceKeyOf({
          kind: 'variant',
          symbol: module.symbol,
          sourceOrdinal,
          variant,
          variantOrdinal,
        }),
        module,
        variant,
        sourceOrdinal,
        variantOrdinal,
        presentation: presentationOf(module, variant, text),
      });
    });
  });

  return { slotKey, buildRevision, choices };
}

/**
 * One row's values, read from the package and nowhere else.
 *
 * A variant is named as the article it is and measured as the article it is:
 * `getPreEngineeredStats` resolves the hand-set changes a reward arrives with,
 * so its mass and power are its own. When the package cannot resolve them the
 * facts are unavailable, which is the honest answer and the one the interface
 * is built to show.
 */
function presentationOf(
  module: OutfittingModule,
  variant: PreEngineeredVariant | null,
  text: ModuleTextResolver,
): ChoicePresentation {
  const article = variant === null ? module : getPreEngineeredStats(variant);

  return {
    name:
      variant === null ? text.moduleName(module.symbol) : text.preEngineeredVariantName(variant),
    familyId: module.familyId,
    family: text.outfittingFamilyName(module.familyId),
    // Class, rating and mount identify the *mount fit*, which a variant shares
    // with its base module: a reward is that module, already modified.
    class: module.class,
    rating: module.rating,
    mount: module.mount ?? null,
    section: acquisitionSection(variant),
    labels: acquisitionLabels(catalogueSource(module, variant)),
    purchaseGrade: variant?.grade ?? null,
    facts: {
      damage: article?.damage ?? null,
      mass: article?.mass ?? null,
      powerDraw: article?.powerDraw ?? null,
      distributorDraw: article?.distributorDraw ?? null,
      cost: article?.cost ?? null,
    },
  };
}

/**
 * The choice a view key names, at the revision the membership was read at.
 *
 * A key from a stale revision resolves to nothing. That is the whole reason
 * membership carries its revision: the alternative is fitting a record that was
 * fittable a moment ago, which the package would refuse anyway — but only after
 * the Commander had been offered it.
 */
export function resolveChoice(
  membership: CandidateMembership,
  choiceKey: string,
  buildRevision: number,
): ModuleChoice | null {
  if (membership.buildRevision !== buildRevision) {
    return null;
  }
  return membership.choices.find((choice) => choice.key === choiceKey) ?? null;
}
