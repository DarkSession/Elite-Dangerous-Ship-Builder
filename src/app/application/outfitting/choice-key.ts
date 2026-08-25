import type { PreEngineeredVariant } from '@elite-dangerous-almanac/core/ships/pre-engineered';

/** What a key is being built for. */
export type ChoiceIdentity =
  | { readonly kind: 'stock'; readonly symbol: string; readonly sourceOrdinal: number }
  | {
      readonly kind: 'variant';
      readonly symbol: string;
      readonly sourceOrdinal: number;
      readonly variant: PreEngineeredVariant;
      readonly variantOrdinal: number;
    };

/**
 * The separator: an ASCII unit separator, written as an escape.
 *
 * A character no package symbol, `fdname` or acquisition token contains, so
 * two different tuples cannot join into the same string - which a hyphen or a
 * colon could, given an identity that happens to contain one.
 */
const SEPARATOR = '\u001f';

/** What an absent effect is written as, so it cannot collide with an fdname. */
const NO_EFFECT = '-';

/**
 * A stable view identity for one choice.
 *
 * This is view identity and nothing more. It is never exported, never encoded
 * into a link, never stored and never handed to the package — a fit passes the
 * retained package object, and this key only says which of the rendered rows
 * the Commander pressed (data model, "ModuleChoice").
 *
 * A variant's key carries its whole tuple because a module can appear more than
 * once: the same article through a Mercenary route and a community-goal route
 * is two rows, and two rows that share a key are one row as far as a rendering
 * loop is concerned. The package ordinal is the last component, so a future
 * release that publishes two otherwise identical route records still produces
 * two distinct rows rather than silently collapsing one (module-catalogue
 * contract, "Identity").
 */
export function choiceKeyOf(identity: ChoiceIdentity): string {
  if (identity.kind === 'stock') {
    return ['stock', identity.symbol, String(identity.sourceOrdinal)].join(SEPARATOR);
  }

  const variant = identity.variant;
  return [
    'variant',
    identity.symbol,
    variant.blueprintSymbol,
    String(variant.grade),
    variant.experimentalEffectSymbol ?? NO_EFFECT,
    variant.acquisition,
    String(identity.sourceOrdinal),
    String(identity.variantOrdinal),
  ].join(SEPARATOR);
}
