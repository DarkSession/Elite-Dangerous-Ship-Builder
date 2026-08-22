import type { FittedModule } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { OutfittingModule } from '@elite-dangerous-almanac/core/ships/modules';
import type { PreEngineeredVariant } from '@elite-dangerous-almanac/core/ships/pre-engineered';
import type { ModuleEngineering } from '@elite-dangerous-almanac/core/ships/slef';
import type { GameTextPresentation } from '../../i18n/game-text.presenter';
import type { PowerPriority } from './build-edit-intent';

/**
 * One fitted module, as a screen sees it.
 *
 * The rule running through every field: absence is preserved. `on` and
 * `priority` come back `undefined` when the source never said, and `undefined`
 * is not `true` and not `0` — a Commander who switched a module off and finds
 * it back on is looking at a different build (data model, "FittedModuleView").
 *
 * `article` and `effectiveArticle` are the package's own records and may be
 * `null`. That is a fact worth carrying, not a gap worth filling: a module the
 * package cannot resolve stats for shows unavailable facts, never zeroes.
 */
export interface FittedModuleView {
  readonly slotKey: string;
  readonly symbol: string;
  readonly displayName: GameTextPresentation;
  /** `undefined` means the source never said. The package treats it as on. */
  readonly enabled: boolean | undefined;
  /** The package's zero-based group. Presented one-based. `undefined` is absent. */
  readonly priority: PowerPriority | undefined;
  /** The module as catalogued, before engineering. `null` when unresolved. */
  readonly article: OutfittingModule | null;
  /** The module as it currently performs. `null` when unresolved. */
  readonly effectiveArticle: OutfittingModule | null;
  /** Current engineering, exactly as the package holds it. */
  readonly engineering: ModuleEngineering | null;
  /**
   * The pre-engineered article the package recognises this as.
   *
   * The *only* route to variant identity. Recognising a reward from its
   * modifiers, its symbol or its grade would be an application-owned rule about
   * game data, which is precisely what FR-007 forbids.
   */
  readonly variant: PreEngineeredVariant | null;
  /** Frontier's entitlement token, when the fitted article carries one. */
  readonly entitlement: string | null;
}

/** How a module name is resolved for the active locale. */
export interface ModuleTextResolver {
  moduleName(symbol: string): GameTextPresentation;
  preEngineeredVariantName(variant: PreEngineeredVariant): GameTextPresentation;
}

/** Projects one package `FittedModule`, preserving every absence. */
export function fittedModuleView(module: FittedModule, text: ModuleTextResolver): FittedModuleView {
  const variant = module.preEngineeredVariant;

  return {
    slotKey: module.slot,
    symbol: module.symbol,
    // A recognised reward article has its own name; an ordinary module has the
    // catalogue's. Both come from the package.
    displayName:
      variant === null ? text.moduleName(module.symbol) : text.preEngineeredVariantName(variant),
    enabled: module.on,
    priority: priorityOf(module.priority),
    article: module.stats,
    effectiveArticle: module.effectiveStats,
    engineering: module.engineering ?? null,
    variant,
    // After fitting, the entitlement is the fitted article's, which is not
    // necessarily the stock record's (module-catalogue contract, "Acquisition").
    entitlement: module.stats?.entitlement ?? null,
  };
}

/** The package's priority, narrowed to the five groups it publishes. */
function priorityOf(priority: number | undefined): PowerPriority | undefined {
  if (priority === undefined) {
    return undefined;
  }
  // Anything outside 0–4 is not a group this application can present as one, so
  // it stays absent rather than being clamped into a group nobody chose.
  return priority >= 0 && priority <= 4 && Number.isInteger(priority)
    ? (priority as PowerPriority)
    : undefined;
}
