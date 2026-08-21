import { Injectable, computed, inject } from '@angular/core';
import { Formatters } from '../../i18n/formatters/formatters';
import { GameTextPresenter, type GameTextPresentation } from '../../i18n/game-text.presenter';
import { MessageService } from '../../i18n/message.service';
import {
  activeConstraints,
  matchCount,
  withoutConstraint,
  type ActiveConstraint,
} from '../../domain/catalogue/catalogue-constraints';
import {
  filterCatalogue,
  manufacturersIn,
  type CatalogueFilters,
} from '../../domain/catalogue/catalogue-query';
import {
  sortCatalogue,
  type CatalogueSort,
  type CatalogueSortField,
} from '../../domain/catalogue/catalogue-sort';
import {
  hullCatalogue,
  type HullCatalogueEntry,
  type HullSize,
} from '../../domain/catalogue/hull-catalogue';
import { CatalogueSessionStore } from './catalogue-session.store';

/** One hull as the catalogue screen renders it: text, already localized. */
export interface HullRowView {
  readonly symbol: string;
  readonly name: GameTextPresentation;
  readonly manufacturer: GameTextPresentation;
  /** The size in the Commander's language, or `null` when the package has none. */
  readonly size: string | null;
  /** The hardpoint layout as a sentence, never as an unlabelled tuple. */
  readonly hardpoints: string;
  /** The formatted retail price, or `null` when the package reports none. */
  readonly price: string | null;
  readonly artworkPath: string;
}

/** One removable constraint, with the words that name it. */
export interface ConstraintView {
  readonly id: string;
  readonly label: string;
  readonly removeLabel: string;
}

/**
 * Everything the catalogue screen renders, and every intent it can emit.
 *
 * The screen receives immutable localized view models and calls the methods
 * below; it never reaches for `SHIPS`, a store or a browser API of its own
 * (routes-and-ui contract, "Intent boundary").
 *
 * Filtering and ordering both run over the *displayed* text, which is why they
 * live here rather than in the domain: the domain does the comparing, this
 * decides what is being compared, and the answer depends on the locale.
 */
@Injectable({ providedIn: 'root' })
export class CatalogueFacade {
  readonly #session = inject(CatalogueSessionStore);
  readonly #messages = inject(MessageService);
  readonly #gameText = inject(GameTextPresenter);
  readonly #formatters = inject(Formatters);

  /** The whole installed catalogue, read once. */
  readonly #entries = hullCatalogue();

  readonly filters = this.#session.filters;
  readonly sort = this.#session.sort;
  readonly anchor = this.#session.anchor;

  readonly total = this.#entries.length;

  /** The hulls currently shown, constrained and ordered. */
  readonly results = computed<readonly HullCatalogueEntry[]>(() => {
    const filtered = filterCatalogue(this.#entries, this.#session.filters(), (entry) =>
      this.#searchableText(entry),
    );
    return sortCatalogue(filtered, this.#session.sort(), this.#formatters.collator(), (entry) => ({
      name: this.#gameText.shipName(entry.symbol).text ?? entry.name,
      manufacturer: this.#gameText.shipManufacturer(entry.symbol).text ?? entry.manufacturer,
    }));
  });

  readonly rows = computed<readonly HullRowView[]>(() =>
    this.results().map((entry) => this.rowFor(entry)),
  );

  readonly count = computed(() =>
    matchCount(this.results().length, this.total, this.#session.constrained()),
  );

  /** The count as the one sentence the live region announces. */
  readonly countText = computed(() =>
    this.#messages.message('catalogue.match-count', {
      count: this.#formatters.integer(this.count().shown),
      total: this.#formatters.integer(this.count().total),
    }),
  );

  readonly constraints = computed<readonly ConstraintView[]>(() =>
    activeConstraints(this.#session.filters()).map((constraint) => {
      const label = this.#describe(constraint);
      return {
        id: constraint.id,
        label,
        removeLabel: this.#messages.message('catalogue.constraints.remove', { constraint: label }),
      };
    }),
  );

  /** Every manufacturer the package carries, ordered for the active locale. */
  readonly manufacturers = computed(() => {
    const collator = this.#formatters.collator();
    return [...manufacturersIn(this.#entries)].sort(collator.compare);
  });

  /** The order, in words, for the sort control's own visible state. */
  readonly sortText = computed(() =>
    this.#messages.message('catalogue.sort.current', {
      field: this.#sortFieldLabel(this.#session.sort().field),
      direction: this.#directionLabel(this.#session.sort().direction),
    }),
  );

  /** One row's presentation. Exposed so a caller can render a single hull. */
  rowFor(entry: HullCatalogueEntry): HullRowView {
    return {
      symbol: entry.symbol,
      name: this.#gameText.shipName(entry.symbol),
      manufacturer: this.#gameText.shipManufacturer(entry.symbol),
      size: this.#sizeLabel(entry.size),
      hardpoints: this.#hardpointsLabel(entry),
      price: entry.retailPrice === null ? null : this.#formatters.credits(entry.retailPrice),
      artworkPath: entry.artworkPath,
    };
  }

  /** The visible label and direction of one sortable column header. */
  sortActionLabel(field: CatalogueSortField): string {
    return this.#messages.message('catalogue.sort.action', {
      field: this.#sortFieldLabel(field),
      direction: this.#directionLabel(this.nextDirectionFor(field)),
    });
  }

  /**
   * The direction activating a header would produce.
   *
   * A new field starts ascending; the current field flips. Anything else makes
   * a Commander press twice to find out which way they are going.
   */
  nextDirectionFor(field: CatalogueSortField): 'ascending' | 'descending' {
    const sort = this.#session.sort();
    if (sort.field !== field) {
      return 'ascending';
    }
    return sort.direction === 'ascending' ? 'descending' : 'ascending';
  }

  // --- Intents -----------------------------------------------------------

  changeSearch(query: string): void {
    this.#session.setFilters({ ...this.#session.filters(), query });
  }

  changeSizes(sizes: readonly HullSize[]): void {
    this.#session.setFilters({ ...this.#session.filters(), sizes });
  }

  changeManufacturers(manufacturers: readonly string[]): void {
    this.#session.setFilters({ ...this.#session.filters(), manufacturers });
  }

  changeHardpointClasses(hardpointClasses: readonly number[]): void {
    this.#session.setFilters({ ...this.#session.filters(), hardpointClasses });
  }

  changePrice(min: number | null, max: number | null): void {
    this.#session.setFilters({ ...this.#session.filters(), price: { min, max } });
  }

  /**
   * Flips the order, the way activating a column header does.
   *
   * A new field starts ascending; the current field reverses.
   */
  changeSort(field: CatalogueSortField): void {
    this.#session.setSort({ field, direction: this.nextDirectionFor(field) });
  }

  /**
   * Chooses which fact the list is ordered by, without reversing it.
   *
   * The toolbar separates the two decisions — a select for the field, a button
   * for the direction — so choosing the field a list is already ordered by
   * must not silently reverse it.
   */
  selectSortField(field: CatalogueSortField): void {
    const sort = this.#session.sort();
    if (sort.field === field) {
      return;
    }
    this.#session.setSort({ field, direction: 'ascending' });
  }

  /** Reverses the current order, leaving the field alone. */
  toggleSortDirection(): void {
    const sort = this.#session.sort();
    this.#session.setSort({
      field: sort.field,
      direction: sort.direction === 'ascending' ? 'descending' : 'ascending',
    });
  }

  setSort(sort: CatalogueSort): void {
    this.#session.setSort(sort);
  }

  removeConstraint(id: string): void {
    const constraint = activeConstraints(this.#session.filters()).find(
      (candidate) => candidate.id === id,
    );
    if (constraint === undefined) {
      return;
    }
    this.#session.setFilters(withoutConstraint(this.#session.filters(), constraint));
  }

  clearConstraints(): void {
    this.#session.clearFilters();
  }

  /** Remembers where the Commander was before they opened a hull. */
  rememberPosition(symbol: string, offsetWithinItem: number): void {
    this.#session.setAnchor({ symbol, offsetWithinItem });
  }

  // --- Presentation helpers ---------------------------------------------

  /** Every string one hull shows, which is exactly what search matches. */
  #searchableText(entry: HullCatalogueEntry): readonly (string | null)[] {
    const row = this.rowFor(entry);
    return [
      row.name.text,
      row.manufacturer.text,
      row.size,
      row.hardpoints,
      row.price,
      entry.symbol,
    ];
  }

  #sizeLabel(size: HullSize | null): string | null {
    if (size === null) {
      return null;
    }
    return this.#messages.message(
      size === 'small'
        ? 'catalogue.size.small'
        : size === 'medium'
          ? 'catalogue.size.medium'
          : 'catalogue.size.large',
    );
  }

  #hardpointsLabel(entry: HullCatalogueEntry): string {
    const profile = entry.hardpoints;
    if (profile === null || profile.every((count) => count === 0)) {
      return this.#messages.message('catalogue.hardpoint.none');
    }
    const [huge, large, medium, small] = profile;
    return this.#messages.message('catalogue.hardpoint.summary', {
      huge: this.#formatters.integer(huge),
      large: this.#formatters.integer(large),
      medium: this.#formatters.integer(medium),
      small: this.#formatters.integer(small),
    });
  }

  #sortFieldLabel(field: CatalogueSortField): string {
    switch (field) {
      case 'name':
        return this.#messages.message('catalogue.sort.field.name');
      case 'manufacturer':
        return this.#messages.message('catalogue.sort.field.manufacturer');
      case 'size':
        return this.#messages.message('catalogue.sort.field.size');
      case 'hardpoints':
        return this.#messages.message('catalogue.sort.field.hardpoints');
      case 'price':
        return this.#messages.message('catalogue.sort.field.price');
    }
  }

  #directionLabel(direction: 'ascending' | 'descending'): string {
    return this.#messages.message(
      direction === 'ascending'
        ? 'catalogue.sort.direction.ascending'
        : 'catalogue.sort.direction.descending',
    );
  }

  #describe(constraint: ActiveConstraint): string {
    switch (constraint.kind) {
      case 'query':
        return this.#messages.message('catalogue.constraint.search', {
          value: String(constraint.value),
        });
      case 'size':
        return this.#messages.message('catalogue.constraint.size', {
          value: this.#sizeLabel(constraint.value as HullSize) ?? String(constraint.value),
        });
      case 'manufacturer':
        return this.#messages.message('catalogue.constraint.manufacturer', {
          value: String(constraint.value),
        });
      case 'hardpoint':
        return this.#messages.message('catalogue.constraint.hardpoint', {
          value: this.#messages.message('catalogue.hardpoint.class', {
            class: this.#formatters.integer(constraint.value as number),
          }),
        });
      case 'price-min':
        return this.#messages.message('catalogue.constraint.price-min', {
          value: this.#formatters.credits(constraint.value as number),
        });
      case 'price-max':
        return this.#messages.message('catalogue.constraint.price-max', {
          value: this.#formatters.credits(constraint.value as number),
        });
    }
  }
}
