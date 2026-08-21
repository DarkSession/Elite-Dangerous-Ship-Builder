import type { OutfittingModule } from '@elite-dangerous-almanac/core/ships/modules';
import {
  getPreEngineeredVariants,
  type PreEngineeredVariant,
} from '@elite-dangerous-almanac/core/ships/pre-engineered';
import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { choiceKeyOf } from './choice-key';

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
    }
  | {
      readonly kind: 'variant';
      readonly key: string;
      readonly module: OutfittingModule;
      readonly variant: PreEngineeredVariant;
      readonly sourceOrdinal: number;
      readonly variantOrdinal: number;
    };

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
): CandidateMembership {
  const choices: ModuleChoice[] = [];

  loadout.modulesForSlot(slotKey).forEach((module, sourceOrdinal) => {
    choices.push({
      kind: 'stock',
      key: choiceKeyOf({ kind: 'stock', symbol: module.symbol, sourceOrdinal }),
      module,
      sourceOrdinal,
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
      });
    });
  });

  return { slotKey, buildRevision, choices };
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
