import { Injectable, computed, inject, signal } from '@angular/core';
import { Formatters } from '../../i18n/formatters/formatters';
import { GameTextPresenter, type GameTextPresentation } from '../../i18n/game-text.presenter';
import { MessageService } from '../../i18n/message.service';
import { hullCatalogueEntry, type HullCatalogueEntry } from '../../domain/catalogue/hull-catalogue';
import {
  hullDetailFacts,
  type HullFact,
  type HullFactGroup,
} from '../../domain/catalogue/hull-facts';
import { ArtworkCoordinator } from './artwork.coordinator';

/** One fact, formatted and labelled for the active locale. */
export interface FactView {
  readonly id: string;
  readonly label: string;
  /** `null` when the package reports no value. Never a substituted zero. */
  readonly value: string | null;
  /** The unit, or empty where the reference draws a figure bare. */
  readonly unit: string;
}

/** One group of facts, with the heading it appears under. */
export interface FactGroupView {
  readonly group: HullFactGroup;
  readonly facts: readonly FactView[];
}

/** The screen's whole state for one hull, or the fact there is no such hull. */
export type HullDetailView =
  | { readonly kind: 'unknown'; readonly symbol: string }
  | {
      readonly kind: 'populated';
      readonly entry: HullCatalogueEntry;
      readonly name: GameTextPresentation;
      readonly manufacturer: GameTextPresentation;
      readonly size: string | null;
      readonly factGroups: readonly FactGroupView[];
      readonly artworkPath: string;
      readonly artworkLabel: string;
      readonly canCreate: boolean;
    };

const FACT_GROUP_ORDER: readonly HullFactGroup[] = ['performance', 'defence', 'mass', 'prices'];

/**
 * Everything the hull-detail screen renders.
 *
 * An unknown symbol is a first-class state rather than an error thrown at the
 * router: the screen has something honest to say about it, and says so without
 * guessing a hull or offering to create one (FR-005).
 */
@Injectable({ providedIn: 'root' })
export class HullDetailFacade {
  readonly #messages = inject(MessageService);
  readonly #gameText = inject(GameTextPresenter);
  readonly #formatters = inject(Formatters);
  readonly #artwork = inject(ArtworkCoordinator);

  readonly #symbol = signal<string | null>(null);

  /** The hull the route currently names. */
  readonly symbol = this.#symbol.asReadonly();

  readonly view = computed<HullDetailView | null>(() => {
    const symbol = this.#symbol();
    if (symbol === null) {
      return null;
    }

    const entry = hullCatalogueEntry(symbol);
    if (entry === null) {
      return { kind: 'unknown', symbol };
    }

    const name = this.#gameText.shipName(entry.symbol);
    return {
      kind: 'populated',
      entry,
      name,
      manufacturer: this.#gameText.shipManufacturer(entry.symbol),
      size: this.#sizeLabel(entry),
      factGroups: this.#factGroups(entry.symbol),
      artworkPath: entry.artworkPath,
      artworkLabel: this.#messages.message('hullDetail.artwork.label', {
        hull: name.text ?? entry.symbol,
      }),
      canCreate: entry.defaultAvailable,
    };
  });

  /** The state of this hull's illustration, as a signal. */
  readonly artworkState = computed(() => {
    const symbol = this.#symbol();
    this.#artwork.states();
    return symbol === null ? 'loading' : this.#artwork.stateOf(symbol);
  });

  /** Points the screen at a hull. Called from the route's own parameters. */
  setSymbol(symbol: string | null): void {
    this.#symbol.set(symbol);
  }

  markArtworkAvailable(): void {
    const symbol = this.#symbol();
    if (symbol !== null) {
      this.#artwork.markAvailable(symbol);
    }
  }

  markArtworkUnavailable(): void {
    const symbol = this.#symbol();
    if (symbol !== null) {
      this.#artwork.markUnavailable(symbol);
    }
  }

  retryArtwork(): void {
    this.#artwork.retryUnavailable();
  }

  #factGroups(symbol: string): readonly FactGroupView[] {
    const facts = hullDetailFacts(symbol);
    return FACT_GROUP_ORDER.map((group) => ({
      group,
      facts: facts.filter((fact) => fact.group === group).map((fact) => this.#factView(fact)),
    })).filter((group) => group.facts.length > 0);
  }

  #factView(fact: HullFact): FactView {
    return {
      id: fact.id,
      label: this.#messages.message(`hullDetail.fact.${fact.id}` as 'hullDetail.fact.boost'),
      value: this.#formatFact(fact),
      unit: this.#unitLabel(fact),
    };
  }

  /**
   * Formats one value, or reports that there is none.
   *
   * Credits go through the credits pattern; everything else is a whole number
   * with its unit named separately, because the unit is related to the value
   * programmatically rather than glued onto the front of it. The reference
   * draws every figure in the metric grid whole — `400`, not `400.0`.
   */
  #formatFact(fact: HullFact): string | null {
    if (fact.value === null) {
      return null;
    }
    return fact.unit === 'credits'
      ? this.#formatters.credits(fact.value)
      : this.#formatters.integer(fact.value);
  }

  #unitLabel(fact: HullFact): string {
    switch (fact.unit) {
      case 'speed':
        return this.#messages.message('hullDetail.unit.speed');
      case 'mass':
        return this.#messages.message('hullDetail.unit.mass');
      case 'shield':
        return this.#messages.message('hullDetail.unit.shield');
      case 'credits':
        // The credits pattern already carries the currency, so naming it again
        // beside the value would read as "12 CR CR".
        return '';
      case null:
        // The reference draws hardness, crew, mass lock and armour bare.
        return '';
    }
  }

  #sizeLabel(entry: HullCatalogueEntry): string | null {
    if (entry.size === null) {
      return null;
    }
    // The reference's identity line reads `LARGE LANDING PAD`, not `LARGE`:
    // the figure is a pad class, and the word for it says so (canvas 1a/1b).
    return this.#messages.message('hullDetail.landing-pad', {
      size: this.#messages.message(
        entry.size === 'small'
          ? 'catalogue.size.small'
          : entry.size === 'medium'
            ? 'catalogue.size.medium'
            : 'catalogue.size.large',
      ),
    });
  }
}
