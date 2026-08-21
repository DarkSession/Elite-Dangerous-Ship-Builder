import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CatalogueFacade } from '../../application/catalogue/catalogue.facade';
import { Formatters } from '../../i18n/formatters/formatters';
import { MessageService } from '../../i18n/message.service';
import { AnnouncementService } from '../../ui/announcements/announcement.service';
import type { Choice } from '../../ui/components/choice-group/choice-group';
import {
  CollectionToolbar,
  type ToolbarSort,
} from '../../ui/components/collection-toolbar/collection-toolbar';
import {
  ResponsiveCatalogueView,
  type CatalogueColumn,
} from '../../ui/components/catalogue-view/responsive-catalogue-view';
import type { HullSummary } from '../../ui/components/hull-summary-card/hull-summary-card';
import type { SelectOption } from '../../ui/components/select-field/select-field';
import { StatusNotice } from '../../ui/components/status/status-notice';
import type { CatalogueSortField } from '../../domain/catalogue/catalogue-sort';
import type { HullSize } from '../../domain/catalogue/hull-catalogue';
import { CatalogueAnchorRestorer } from './catalogue-anchor.restorer';

/** Every column the manifest shows, and the fact each one orders by. */
const COLUMNS: readonly { field: CatalogueSortField; labelKey: string; numeric?: boolean }[] = [
  { field: 'name', labelKey: 'catalogue.column.ship' },
  { field: 'manufacturer', labelKey: 'catalogue.column.manufacturer' },
  { field: 'size', labelKey: 'catalogue.column.size' },
  { field: 'hardpoints', labelKey: 'catalogue.column.hardpoints' },
  { field: 'price', labelKey: 'catalogue.column.price', numeric: true },
];

const SIZES: readonly HullSize[] = ['small', 'medium', 'large'];
const HARDPOINT_CLASSES = [4, 3, 2, 1] as const;

/**
 * The shipyard: every hull the Almanac carries.
 *
 * Opening a hull is a navigation into a child route, so the detail screen is a
 * real address with its own history entry — an inspector beside the manifest
 * where there is room, a full-screen layer where there is not. The manifest
 * stays mounted either way, which is what makes returning to the same scroll
 * position possible rather than merely approximated.
 *
 * The screen renders and emits intent. It reads no catalogue, no store and no
 * browser API: the facade hands it localized view models, and it hands back
 * what the Commander did (routes-and-ui contract, "Intent boundary").
 */
@Component({
  selector: 'edsb-ship-catalogue-page',
  imports: [CollectionToolbar, ResponsiveCatalogueView, RouterOutlet, StatusNotice],
  templateUrl: './ship-catalogue.page.html',
  styleUrl: './ship-catalogue.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipCataloguePage {
  readonly #catalogue = inject(CatalogueFacade);
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);
  readonly #announcements = inject(AnnouncementService);
  readonly #router = inject(Router);
  readonly #restorer = inject(CatalogueAnchorRestorer);

  readonly heading = this.#messages.messageSignal('catalogue.title');
  readonly description = this.#messages.messageSignal('catalogue.description');
  readonly emptyTitle = this.#messages.messageSignal('catalogue.empty.title');
  readonly emptyDescription = this.#messages.messageSignal('catalogue.empty.description');
  readonly caption = this.#messages.messageSignal('catalogue.table.caption');
  readonly unavailableFactsNotice = this.#messages.messageSignal('catalogue.facts-unavailable');

  readonly totalText = computed(() =>
    this.#messages.message('catalogue.total', {
      count: this.#formatters.integer(this.#catalogue.total),
    }),
  );

  readonly countText = this.#catalogue.countText;
  readonly constraints = this.#catalogue.constraints;
  readonly search = computed(() => this.#catalogue.filters().query);

  readonly hulls = computed<readonly HullSummary[]>(() => {
    const selected = this.#restorer.selectedSymbol();
    return this.#catalogue.rows().map((row) => ({
      symbol: row.symbol,
      name: row.name,
      manufacturer: row.manufacturer,
      size: row.size,
      hardpoints: row.hardpoints,
      price: row.price,
      selected: row.symbol === selected,
    }));
  });

  readonly isEmpty = computed(() => this.hulls().length === 0);

  /**
   * Whether the hull-detail child route is showing.
   *
   * At wide widths it is an inspector beside the manifest; at narrow widths it
   * takes the screen, and the manifest steps aside rather than sitting below it
   * as a second page of content.
   */
  readonly detailOpen = computed(() => this.#restorer.selectedSymbol() !== null);

  /**
   * Whether any shown hull has a fact the package does not supply.
   *
   * Surfaced once above the list rather than only inside the cell that lacks
   * it, so a Commander comparing a column knows the gaps are absences rather
   * than zeroes before they start reading (FR-002).
   */
  readonly hasUnavailableFacts = computed(() =>
    this.hulls().some((hull) => hull.size === null || hull.price === null),
  );

  readonly columns = computed<readonly CatalogueColumn[]>(() =>
    COLUMNS.map((column) => {
      const sort = this.#catalogue.sort();
      return {
        field: column.field,
        label: this.#messages.message(column.labelKey as 'catalogue.column.ship'),
        sortActionLabel: this.#catalogue.sortActionLabel(column.field),
        sorted: sort.field === column.field,
        direction: sort.direction,
        numeric: column.numeric ?? false,
      };
    }),
  );

  readonly sizeChoices = computed<readonly Choice[]>(() =>
    SIZES.map((size) => ({
      value: size,
      label: this.#messages.message(
        size === 'small'
          ? 'catalogue.size.small'
          : size === 'medium'
            ? 'catalogue.size.medium'
            : 'catalogue.size.large',
      ),
    })),
  );

  readonly selectedSizes = computed<readonly string[]>(() => this.#catalogue.filters().sizes);

  readonly manufacturerOptions = computed<readonly SelectOption[]>(() => [
    { value: '', label: this.#messages.message('catalogue.filter.any') },
    ...this.#catalogue.manufacturers().map((name) => ({ value: name, label: name })),
  ]);

  readonly selectedManufacturer = computed(() => this.#catalogue.filters().manufacturers[0] ?? '');

  readonly hardpointOptions = computed<readonly SelectOption[]>(() => [
    { value: '', label: this.#messages.message('catalogue.filter.any') },
    ...HARDPOINT_CLASSES.map((size) => ({
      value: String(size),
      label: this.#messages.message('catalogue.hardpoint.class', {
        class: this.#formatters.integer(size),
      }),
    })),
  ]);

  readonly selectedHardpointClass = computed(() => {
    const chosen = this.#catalogue.filters().hardpointClasses[0];
    return chosen === undefined ? '' : String(chosen);
  });

  readonly priceMin = computed(() => textOfBound(this.#catalogue.filters().price.min));
  readonly priceMax = computed(() => textOfBound(this.#catalogue.filters().price.max));

  readonly sortOptions = computed<readonly SelectOption[]>(() =>
    COLUMNS.map((column) => ({
      value: column.field,
      label: this.#messages.message(
        `catalogue.sort.field.${column.field}` as 'catalogue.sort.field.name',
      ),
    })),
  );

  readonly sort = computed<ToolbarSort>(() => {
    const sort = this.#catalogue.sort();
    return {
      field: sort.field,
      direction: sort.direction,
      text: this.#catalogue.sortText(),
      toggleLabel: this.#catalogue.sortActionLabel(sort.field),
    };
  });

  /** The label of the action opening one hull, named after that hull. */
  readonly openLabel = computed(
    () => (hull: HullSummary) =>
      this.#messages.message('catalogue.open-hull', { hull: hull.name.text ?? hull.symbol }),
  );

  constructor() {
    // Returning from hull detail puts the Commander back where they were —
    // whether they used the named back action or the browser's own, because
    // both close the child route and nothing else does.
    effect((onCleanup) => {
      if (!this.detailOpen()) {
        return;
      }
      onCleanup(() => this.#restorer.restoreWhenSettled());
    });

    // The count is the one thing that changes without the Commander looking at
    // it, so it is the one thing announced — politely, once per revision, and
    // only when a constraint actually changed it.
    //
    // The first run is deliberately silent. The opening count is initial
    // content: it is already in reading order above the manifest, and
    // announcing it would start every visit by talking over the reader before
    // they have asked for anything (announcement policy, "initial content").
    let opened = false;
    effect(() => {
      const shown = this.#catalogue.count().shown;
      if (!opened) {
        opened = true;
        return;
      }
      this.#announcements.announce({
        kind: 'catalogue.match-count',
        revision: shown,
        urgency: 'polite',
        messageKey: 'catalogue.match-count',
        params: {
          count: this.#formatters.integer(shown),
          total: this.#formatters.integer(this.#catalogue.total),
        },
      });
    });
  }

  changeSearch(query: string): void {
    this.#catalogue.changeSearch(query);
  }

  changeSizes(sizes: readonly string[]): void {
    this.#catalogue.changeSizes(sizes.filter(isHullSize));
  }

  changeManufacturer(manufacturer: string): void {
    this.#catalogue.changeManufacturers(manufacturer.length > 0 ? [manufacturer] : []);
  }

  changeHardpointClass(value: string): void {
    const parsed = Number.parseInt(value, 10);
    this.#catalogue.changeHardpointClasses(Number.isInteger(parsed) ? [parsed] : []);
  }

  changePriceMin(value: string): void {
    this.#catalogue.changePrice(parseBound(value), this.#catalogue.filters().price.max);
  }

  changePriceMax(value: string): void {
    this.#catalogue.changePrice(this.#catalogue.filters().price.min, parseBound(value));
  }

  /** A column header: choose the field, or reverse it if it is already chosen. */
  changeSort(field: string): void {
    this.#catalogue.changeSort(field as CatalogueSortField);
  }

  /** The toolbar's field select: choose what to order by, nothing more. */
  selectSortField(field: string): void {
    this.#catalogue.selectSortField(field as CatalogueSortField);
  }

  toggleSortDirection(): void {
    this.#catalogue.toggleSortDirection();
  }

  removeConstraint(id: string): void {
    this.#catalogue.removeConstraint(id);
  }

  clearConstraints(): void {
    this.#catalogue.clearConstraints();
  }

  /** Remembers where the Commander was, then opens the hull. */
  openHull(symbol: string): void {
    this.#catalogue.rememberPosition(symbol, this.#restorer.offsetOf(symbol));
    void this.#router.navigate(['/ships', symbol]);
  }
}

function isHullSize(value: string): value is HullSize {
  return value === 'small' || value === 'medium' || value === 'large';
}

/** An empty bound is "no limit", not zero. */
function parseBound(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const parsed = Number(trimmed.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function textOfBound(value: number | null): string {
  return value === null ? '' : String(value);
}
