import { Injectable, inject } from '@angular/core';
import { getBlueprintName } from '@elite-dangerous-almanac/core/i18n/blueprints';
import {
  getCalculationIssueMessage,
  getLoadoutEditErrorMessage,
  getLoadoutIssueMessage,
  getSlefDiagnosticMessage,
} from '@elite-dangerous-almanac/core/i18n/diagnostics';
import { getExperimentalEffectDescription } from '@elite-dangerous-almanac/core/i18n/experimental-effect-descriptions';
import { getExperimentalEffectName } from '@elite-dangerous-almanac/core/i18n/experimental-effects';
import { getMaterialName } from '@elite-dangerous-almanac/core/i18n/materials';
import { getMicroResourceName } from '@elite-dangerous-almanac/core/i18n/micro-resources';
import { getOutfittingFamilyName } from '@elite-dangerous-almanac/core/i18n/module-families';
import { getModuleName } from '@elite-dangerous-almanac/core/i18n/modules';
import { getPreEngineeredVariantName } from '@elite-dangerous-almanac/core/i18n/pre-engineered';
import {
  getLoadoutSlotName,
  getSlotRestrictionLabel,
} from '@elite-dangerous-almanac/core/i18n/slots';
import { getShipBySymbol } from '@elite-dangerous-almanac/core/ships/ships';
import { FALLBACK_LOCALE, type MessageKey } from './locale-registry';
import { LocaleStore } from './locale.store';

/**
 * The application's boundary onto Almanac game text.
 *
 * Game nouns — module names, blueprints, ship names, slot labels, package
 * diagnostics — belong to the Almanac and are never translated here (FR-020,
 * constitution II). This presenter asks the package for the active locale,
 * falls back to the package's own canonical text when the package has no
 * translation, and otherwise says the value is unavailable. It never invents a
 * string, never echoes a raw symbol as a display name, and keeps no private
 * game-text catalogue.
 *
 * Every package lookup shares one shape — `(identity, locale) => string | null`
 * — so one presentation rule covers all of them, and adding a family is one
 * line rather than a new policy. Most are the package's own i18n leaves. A hull
 * name and its manufacturer have no leaf, because the game translates neither,
 * so they are read off the ships catalogue in that same shape.
 */

/** How the presented text relates to the active locale. */
export type GameTextTranslationState = 'localized' | 'canonical' | 'unavailable';

/** One piece of package text, ready to render honestly. */
export interface GameTextPresentation {
  /** The package-returned string. `null` only in the unavailable state. */
  readonly text: string | null;
  /** The language the text is actually in, so `lang` can be accurate. */
  readonly language: string | null;
  readonly translationState: GameTextTranslationState;
  /**
   * The application message framing the provenance or the absence.
   *
   * It frames the value; it never translates it. `null` when the text is in the
   * language the reader asked for and needs no framing.
   */
  readonly disclosureKey: MessageKey | null;
}

/** A package leaf helper: an identity and a locale in, package text or nothing out. */
export type GameTextLookup<TIdentity> = (identity: TIdentity, locale: string) => string | null;

/**
 * Resolves one package lookup for one locale.
 *
 * Exported as a pure function so the rule can be tested against the installed
 * package without a `TestBed`, and so a caller with its own locale — a
 * preview, a fixture — can use exactly the same rule the application does.
 *
 * The active-locale miss and the unknown identity both surface as `null` from
 * the package. They are different inputs, and the contract keeps them distinct,
 * but they are not different *presentations*: in both cases the honest answer
 * is the canonical text if the package has one and an explicit unavailable
 * value if it does not. Guessing which of the two happened, from a `null` that
 * cannot tell us, is what this deliberately does not do.
 */
export function presentGameText<TIdentity>(
  lookup: GameTextLookup<TIdentity>,
  identity: TIdentity,
  locale: string,
): GameTextPresentation {
  const localized = lookup(identity, locale);
  if (localized !== null && localized.length > 0) {
    return {
      text: localized,
      language: locale,
      translationState: 'localized',
      disclosureKey: null,
    };
  }

  // The package's canonical text is its English entry. Requesting it after a
  // miss is what turns "no German name" into a readable name rather than a gap.
  const canonical = lookup(identity, FALLBACK_LOCALE);
  if (canonical !== null && canonical.length > 0) {
    return {
      text: canonical,
      language: FALLBACK_LOCALE,
      translationState: 'canonical',
      disclosureKey: 'game-text.untranslated.description',
    };
  }

  return {
    text: null,
    language: null,
    translationState: 'unavailable',
    disclosureKey: 'game-text.unavailable',
  };
}

/**
 * A hull's name and its manufacturer, in the one language the game writes them.
 *
 * The package publishes no localized lookup for either, because the game does
 * not translate them: both are proper nouns, and every source that carries a
 * localized ship column carries the English spelling. So the catalogue answers
 * for the canonical locale and for no other, and the presentation rule above
 * then states the name as canonical wherever a Commander is reading something
 * else — which is what it is, and what a hull name has always been on screen.
 */
function shipCatalogueText(field: 'name' | 'manufacturer'): GameTextLookup<string> {
  return (symbol, locale) =>
    // A regional tag asks for its own language, which is the rule every package
    // lookup follows: `de-DE` is German and `en-GB` is English.
    locale.split('-')[0]?.toLowerCase() === FALLBACK_LOCALE
      ? (getShipBySymbol(symbol)?.[field] ?? null)
      : null;
}

/** A hull's name, as a lookup the presentation rule can take. */
export const shipNameLookup = shipCatalogueText('name');

/** A hull's manufacturer, as a lookup the presentation rule can take. */
export const shipManufacturerLookup = shipCatalogueText('manufacturer');

/**
 * The injectable presenter, bound to the committed locale.
 *
 * One method per package family. The identity types come from the package's own
 * signatures rather than being restated here, so a package change that alters
 * an identity is a compile error instead of a silent miss.
 */
@Injectable({ providedIn: 'root' })
export class GameTextPresenter {
  readonly #store = inject(LocaleStore);

  /** The locale package text is requested for: the committed effective locale. */
  get locale(): string {
    return this.#store.effectiveLocale();
  }

  /** Resolves any package leaf helper for the active locale. */
  present<TIdentity>(lookup: GameTextLookup<TIdentity>, identity: TIdentity): GameTextPresentation {
    return presentGameText(lookup, identity, this.locale);
  }

  moduleName(symbol: string): GameTextPresentation {
    return this.present(getModuleName, symbol);
  }

  /**
   * The Almanac's own name for one outfitting family.
   *
   * The package names all 77 families in English and 58 of them in each other
   * language, so the `canonical` arm of the rule above is the ordinary case
   * here rather than the exceptional one: nineteen families read as their
   * English name with the untranslated disclosure beside them, exactly as an
   * untranslated module name does. There is no local table for those nineteen —
   * a private id-to-name map would be game data owned outside the package
   * (constitution II, FR-020).
   */
  outfittingFamilyName(familyId: string): GameTextPresentation {
    return this.present(getOutfittingFamilyName, familyId);
  }

  blueprintName(fdname: string): GameTextPresentation {
    return this.present(getBlueprintName, fdname);
  }

  experimentalEffectName(fdname: string): GameTextPresentation {
    return this.present(getExperimentalEffectName, fdname);
  }

  experimentalEffectDescription(fdname: string): GameTextPresentation {
    return this.present(getExperimentalEffectDescription, fdname);
  }

  materialName(symbol: string): GameTextPresentation {
    return this.present(getMaterialName, symbol);
  }

  microResourceName(symbol: string): GameTextPresentation {
    return this.present(getMicroResourceName, symbol);
  }

  shipName(symbol: string): GameTextPresentation {
    return this.present(shipNameLookup, symbol);
  }

  shipManufacturer(symbol: string): GameTextPresentation {
    return this.present(shipManufacturerLookup, symbol);
  }

  slotName(slot: Parameters<typeof getLoadoutSlotName>[0]): GameTextPresentation {
    return this.present(getLoadoutSlotName, slot);
  }

  slotRestrictionLabel(
    restriction: Parameters<typeof getSlotRestrictionLabel>[0],
  ): GameTextPresentation {
    return this.present(getSlotRestrictionLabel, restriction);
  }

  preEngineeredVariantName(
    variant: Parameters<typeof getPreEngineeredVariantName>[0],
  ): GameTextPresentation {
    return this.present(getPreEngineeredVariantName, variant);
  }

  loadoutIssueMessage(issue: Parameters<typeof getLoadoutIssueMessage>[0]): GameTextPresentation {
    return this.present(getLoadoutIssueMessage, issue);
  }

  calculationIssueMessage(
    issue: Parameters<typeof getCalculationIssueMessage>[0],
  ): GameTextPresentation {
    return this.present(getCalculationIssueMessage, issue);
  }

  slefDiagnosticMessage(
    diagnostic: Parameters<typeof getSlefDiagnosticMessage>[0],
  ): GameTextPresentation {
    return this.present(getSlefDiagnosticMessage, diagnostic);
  }

  loadoutEditErrorMessage(
    error: Parameters<typeof getLoadoutEditErrorMessage>[0],
  ): GameTextPresentation {
    return this.present(getLoadoutEditErrorMessage, error);
  }
}
