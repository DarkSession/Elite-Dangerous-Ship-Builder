import { Injectable, computed, inject, signal } from '@angular/core';
import type { OptionalRestriction } from '@elite-dangerous-almanac/core/ships/slots';
import { Formatters } from '../../i18n/formatters/formatters';
import { GameTextPresenter, type GameTextPresentation } from '../../i18n/game-text.presenter';
import type { MessageKey } from '../../i18n/locale-registry';
import { MessageService } from '../../i18n/message.service';
import { hullCapacity, type HullCapacity } from '../../domain/catalogue/hull-capacity';
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

/**
 * One chip in a slot group.
 *
 * A chip states a size, and a multiplier in front of it where more than one
 * mount shares that size. The two are separate fields because the reference
 * draws them at different weights. `description` says the same thing in words,
 * because a chip reading `3 \u00d7 6` is a notation rather than a sentence, and the
 * notation is not what a screen reader should be left with.
 */
export interface SlotChipView {
  readonly id: string;
  /** The multiplier and its sign, or `null` for a run of one. */
  readonly multiplier: string | null;
  readonly size: string;
  readonly description: string;
}

/** One of the hull's three unrestricted mount groups, with its total. */
export interface SlotGroupView {
  readonly id: 'utility' | 'core' | 'optional';
  readonly heading: string;
  readonly total: string;
  readonly chips: readonly SlotChipView[];
  /** The core group's chips carry the package's own name for each mount. */
  readonly named: readonly CoreMountView[];
}

/** One core mount: the package's name for it, and how big it is. */
export interface CoreMountView {
  readonly id: string;
  readonly name: GameTextPresentation;
  readonly size: string;
  readonly description: string;
}

/** The mounts one restriction holds, under the restriction's own name. */
export interface RestrictedGroupView {
  readonly id: string;
  /** The name of the group: the package's restriction identity, in words. */
  readonly name: string;
  readonly chips: readonly SlotChipView[];
}

/** What the hull can carry: the three open groups, then the restricted ones. */
export interface HullCapacityView {
  readonly groups: readonly SlotGroupView[];
  readonly restrictedHeading: string;
  readonly restrictedTotal: string;
  readonly restricted: readonly RestrictedGroupView[];
}

/** The screen's whole state for one hull, or the fact there is no such hull. */
export type HullDetailView =
  /**
   * `address` rather than `symbol`: what the screen was pointed at resolved to
   * no hull, so it is whatever was asked for and not an identity (001/FR-005).
   */
  | { readonly kind: 'unknown'; readonly address: string }
  | {
      readonly kind: 'populated';
      readonly entry: HullCatalogueEntry;
      readonly name: GameTextPresentation;
      readonly manufacturer: GameTextPresentation;
      readonly size: string | null;
      readonly factGroups: readonly FactGroupView[];
      /** `null` where the package publishes no layout for the hull. */
      readonly capacity: HullCapacityView | null;
      readonly artworkPath: string;
      readonly artworkLabel: string;
      readonly canCreate: boolean;
    };

const FACT_GROUP_ORDER: readonly HullFactGroup[] = ['performance', 'defence', 'mass', 'prices'];

/**
 * What the screen calls each restriction it states, and which it states.
 *
 * The name is the package's own restriction identity spelled for a reader, and
 * it names a group of mounts rather than describing what fits in them — the
 * same kind of string as the three group headings above it, and owned here
 * (001/FR-022). `getSlotRestrictionLabel` answers a different question: which
 * module families a mount accepts, in English alone.
 *
 * A restriction absent from this table is a restriction the screen does not
 * state. `planetaryApproachSuite` is the one such restriction: every hull the
 * package publishes has that mount and it takes the approach suite alone, so a
 * row for it separates no hull from another. The package still reports it, and
 * a release that added a restriction would land here as a missing name rather
 * than as a silent omission — `RESTRICTION_NAMES` is checked against the
 * package's own set in `hull-detail.facade.spec.ts`.
 */
const RESTRICTION_NAMES: Partial<Record<OptionalRestriction, MessageKey>> = {
  military: 'hullDetail.slots.restriction.military',
  cargo: 'hullDetail.slots.restriction.cargo',
  limpetController: 'hullDetail.slots.restriction.limpetController',
  vesselHangar: 'hullDetail.slots.restriction.vesselHangar',
  passenger: 'hullDetail.slots.restriction.passenger',
};

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
      return { kind: 'unknown', address: symbol };
    }

    const name = this.#gameText.shipName(entry.symbol);
    return {
      kind: 'populated',
      entry,
      name,
      manufacturer: this.#gameText.shipManufacturer(entry.symbol),
      size: this.#sizeLabel(entry),
      factGroups: this.#factGroups(entry.symbol),
      capacity: entry.slots === null ? null : this.#capacity(hullCapacity(entry.slots)),
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

  /**
   * Points the screen at a hull.
   *
   * The package's own symbol wherever the address resolved to a hull, and the
   * address itself where it did not: the screen then says what was asked for.
   */
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

  /**
   * What the hull carries, as the reference's four ruled groups (FR-022).
   *
   * The three open groups come first — utility mounts, the seven core
   * internals, then the optional column — and the restricted mounts follow,
   * once per restriction. Every figure is the package's layout; nothing here is
   * counted from a build.
   */
  #capacity(capacity: HullCapacity): HullCapacityView {
    const stated = capacity.restricted.filter(
      (group) => RESTRICTION_NAMES[group.restriction] !== undefined,
    );

    return {
      groups: [
        {
          id: 'utility',
          heading: this.#messages.message('hullDetail.slots.group.utility'),
          total: this.#formatters.integer(capacity.utility),
          // Every utility mount is the same size, so there is no size to chip.
          chips: [],
          named: [],
        },
        {
          id: 'core',
          heading: this.#messages.message('hullDetail.slots.group.core'),
          total: this.#formatters.integer(capacity.core.length),
          chips: [],
          named: capacity.core.map((mount) => ({
            id: mount.core,
            name: this.#gameText.slotName(mount.slot),
            size: this.#formatters.integer(mount.size),
            description: this.#messages.message('hullDetail.slots.size', {
              size: this.#formatters.integer(mount.size),
            }),
          })),
        },
        {
          id: 'optional',
          heading: this.#messages.message('hullDetail.slots.group.optional'),
          total: this.#formatters.integer(capacity.optionalCount),
          chips: capacity.optional.map((run) => this.#sizeChip(run)),
          named: [],
        },
      ],
      restrictedHeading: this.#messages.message('hullDetail.slots.group.restricted'),
      restrictedTotal: this.#formatters.integer(
        stated.reduce((total, group) => total + group.count, 0),
      ),
      restricted: stated.map((group) => ({
        id: group.restriction,
        name: this.#messages.message(RESTRICTION_NAMES[group.restriction]!),
        chips: group.sizes.map((run) => this.#sizeChip(run)),
      })),
    };
  }

  /**
   * One size chip: the reference's `7` for a lone mount, `3 × 6` for three.
   *
   * A run of one carries no multiplier. `1 × 7` beside a figure says nothing
   * the figure did not. The words behind the chip differ with it: "one size 7
   * mount" and "three size 6 mounts" are two sentences rather than one with a
   * number substituted into it. The multiplier carries its own sign, so a
   * locale writes the notation its own way.
   */
  #sizeChip(run: { readonly size: number; readonly count: number }): SlotChipView {
    const size = this.#formatters.integer(run.size);
    const count = this.#formatters.integer(run.count);
    return {
      id: `${run.size}`,
      multiplier:
        run.count === 1
          ? null
          : this.#messages.message('hullDetail.slots.run.multiplier', { count }),
      size,
      description:
        run.count === 1
          ? this.#messages.message('hullDetail.slots.run.one', { size })
          : this.#messages.message('hullDetail.slots.run.many', { count, size }),
    };
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
