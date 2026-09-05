import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  type Route,
  RouteConfigLoadStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { CatalogueFacade } from '../../application/catalogue/catalogue.facade';
import { Formatters } from '../../i18n/formatters/formatters';
import { MessageService } from '../../i18n/message.service';
import { ScreenChrome } from '../shared/screen-chrome';
import { AnnouncementService } from '../../ui/announcements/announcement.service';
import type { Choice } from '../../ui/components/choice-group/choice-group';
import {
  CollectionToolbar,
  type ToolbarSort,
  type ToolbarSortOption,
} from '../../ui/components/collection-toolbar/collection-toolbar';
import {
  ResponsiveCatalogueView,
  type CatalogueColumn,
} from '../../ui/components/catalogue-view/responsive-catalogue-view';
import type { HullSummary } from '../../ui/components/hull-summary-card/hull-summary-card';
import type { CatalogueSortField } from '../../domain/ships/catalogue/catalogue-sort';
import { hullAddressForSymbol } from '../../domain/ships/catalogue/hull-address';
import type { HullSize } from '../../domain/ships/catalogue/hull-catalogue';
import { CatalogueAnchorRestorer } from './catalogue-anchor.restorer';
import { StatusNotice } from '../../ui/components/status/status-notice';
import { Skeleton } from '../../ui/components/waiting/skeleton';
import { StockBuildCreator } from '../../application/active-build/stock-build.creator';
import { NAVIGATION_ROUTES } from '../shared/app-navigation';
import { observeRestingReads } from '../../ui/wide-composition';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/** Every column the manifest shows, and the fact each one orders by. */
const COLUMNS: readonly { field: CatalogueSortField; labelKey: string; numeric?: boolean }[] = [
  { field: 'name', labelKey: 'catalogue.column.ship' },
  { field: 'manufacturer', labelKey: 'catalogue.column.manufacturer' },
  { field: 'size', labelKey: 'catalogue.column.size' },
  { field: 'hardpoints', labelKey: 'catalogue.column.hardpoints', numeric: true },
  { field: 'price', labelKey: 'catalogue.column.price', numeric: true },
];

const SIZES: readonly HullSize[] = ['small', 'medium', 'large'];

/** The reference's leading segment: every pad class at once (canvas 1a/1b). */
const ALL_SIZES = 'all';

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
  selector: 'ednb-ship-catalogue-page',
  imports: [CollectionToolbar, ResponsiveCatalogueView, RouterOutlet, Skeleton, StatusNotice],
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
  readonly #chrome = inject(ScreenChrome);
  readonly #creator = inject(StockBuildCreator);

  /**
   * Whether a rested pointer on a manifest row reads the hull beside it.
   *
   * This screen's own question, because this screen is what draws the rail the
   * reading appears in: the manifest cannot see a rail beside itself, and the
   * device that can rest a pointer is only half of the answer
   * (`observeRestingReads`; `design/hull-catalogue.md`, "Resting reads a hull
   * only where the rail is drawn").
   */
  readonly restsToRead = observeRestingReads();

  readonly emptyDescription = this.#messages.messageSignal('catalogue.empty.description');
  readonly caption = this.#messages.messageSignal('catalogue.table.caption');
  readonly inspectorLabel = this.#messages.messageSignal('catalogue.inspector');
  readonly detailLoadingLabel = this.#messages.messageSignal('catalogue.inspector.loading');

  /**
   * Whether the hull's own screen is still on its way to the rail beside it.
   *
   * The hull screen is a chunk of its own, so opening a hull from the manifest
   * fetches it. The skeleton holds the hull's place for that fetch, so the rail
   * is never a named group with nothing in it (011/FR-029).
   *
   * Taken from the chunk the router asks for rather than from the child that
   * arrives. `detailOpen` reads a symbol the hull screen itself writes, so it
   * is false for the whole of the wait it would be describing. A hull whose
   * chunk is already fetched draws no skeleton at all, because the router asks
   * for nothing and reports nothing.
   *
   * Lowered when the navigation ends rather than when the chunk lands. The two
   * are not the same moment — the router reports the fetch, then creates the
   * screen, then ends the navigation — and a skeleton taken down at the end of
   * the fetch leaves the rail a named group with nothing in it for the gap
   * between them.
   */
  readonly #detailLoading = signal(false);

  readonly detailWaiting = this.#detailLoading.asReadonly();

  /**
   * Whether the hull's own screen was asked for and did not arrive.
   *
   * The rail is drawn for the wait, so it has to be drawn for the end of one
   * that produced no screen: a skeleton that appears and goes, over a region
   * the stylesheet then takes out of the layout, leaves a Commander back on the
   * manifest with nothing said (011/FR-029).
   *
   * The frame around this screen cannot say it instead. Its own notice speaks
   * only for a frame with no screen in it, and this screen is in it.
   */
  readonly #detailFailed = signal(false);

  readonly detailFailed = this.#detailFailed.asReadonly();

  /** What the rail says when the hull's own screen did not arrive. */
  readonly detailFailedLabel = this.#messages.messageSignal('route.failed.notice');

  /**
   * Whether a route the router is fetching is a child of this screen's own.
   *
   * Found in the router's configuration by the address this screen answers,
   * which the shell already holds. Matching the child's declared path here
   * instead would put a second copy of it beside the route table, free to
   * drift from it without anything failing.
   */
  #isDetailRoute(route: Route): boolean {
    const address = NAVIGATION_ROUTES.catalogue.replace(/^\//u, '');
    const catalogue = this.#router.config.find((entry) => entry.path === address);
    return catalogue?.children?.includes(route) ?? false;
  }

  readonly countText = this.#catalogue.countText;
  readonly search = computed(() => this.#catalogue.filters().query);

  readonly hulls = computed<readonly HullSummary[]>(() => {
    const selected = this.#restorer.selectedSymbol();
    return this.#catalogue.rows().map((row) => ({
      symbol: row.symbol,
      name: row.name,
      manufacturer: row.manufacturer,
      size: row.size,
      sizeText: row.sizeText,
      hardpoints: row.hardpoints,
      hardpointsText: row.hardpointsText,
      price: row.price,
      selected: row.symbol === selected,
    }));
  });

  /**
   * Whether the hull-detail child route is showing.
   *
   * At wide widths it is an inspector beside the manifest; at narrow widths it
   * takes the screen, and the manifest steps aside rather than sitting below it
   * as a second page of content.
   */
  readonly detailOpen = computed(() => this.#restorer.selectedSymbol() !== null);

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

  readonly sizeChoices = computed<readonly Choice[]>(() => [
    { value: ALL_SIZES, label: this.#messages.message('catalogue.size.all') },
    ...SIZES.map((size) => ({
      value: size,
      label: this.#messages.message(
        size === 'small'
          ? 'catalogue.size.small'
          : size === 'medium'
            ? 'catalogue.size.medium'
            : 'catalogue.size.large',
      ),
    })),
  ]);

  /**
   * The one segment in force. The reference's strip is exclusive: `ALL` or one
   * pad class, never two at once (canvas 1a/1b).
   */
  readonly selectedSizes = computed<readonly string[]>(() => {
    const sizes = this.#catalogue.filters().sizes;
    return sizes.length === 1 ? sizes : [ALL_SIZES];
  });

  readonly sortOptions = computed<readonly ToolbarSortOption[]>(() =>
    COLUMNS.map((column) => ({
      value: column.field,
      label: this.#messages.message(
        `catalogue.sort.field.${column.field}` as 'catalogue.sort.field.name',
      ),
      actionLabel: this.#catalogue.sortActionLabel(column.field),
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

  constructor() {
    // The hull screen's own chunk. The route it belongs to is recognised by
    // identity against this screen's own children rather than by its declared
    // path: a copy of that path here would drift from the route table without
    // anything failing.
    //
    // The router reports the end of a fetch that succeeded and says nothing
    // about one that failed, so every way a navigation can finish clears the
    // state as well.
    this.#router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof RouteConfigLoadStart && this.#isDetailRoute(event.route)) {
        this.#detailLoading.set(true);
        this.#detailFailed.set(false);
        // The rail draws the sentence for this fetch, so the shell does not
        // speak it. Said here rather than where the failure arrives, because the
        // shell reads it on that event and subscribes to the router first.
        this.#chrome.setOwnsRouteFailure(true);
      }
      // A failure belongs to this rail only where this rail was waiting for it.
      // Every other navigation that fails is some other screen's.
      if (event instanceof NavigationError && this.#detailLoading()) {
        this.#detailFailed.set(true);
      }
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.#detailLoading.set(false);
        // The claim lasts exactly as long as the wait it is about. A hull that
        // opened leaves the rail drawing a hull, so a later chunk refused
        // somewhere else is not this rail's to say — and a claim left standing
        // would keep it from being said anywhere.
        this.#chrome.setOwnsRouteFailure(false);
      }
      if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
        this.#detailFailed.set(false);
      }
    });

    // And a rail taken away mid-fetch never sees the event that would have
    // lowered it. A claim it left behind would keep every later failure from
    // being said at all.
    inject(DestroyRef).onDestroy(() => this.#chrome.setOwnsRouteFailure(false));

    // The reference carries the manifest's count in the command bar beside the
    // screen's own name, and nowhere else (canvas 1a "48 SHIPS", canvas 1b
    // "8 OF 48 SHIPS").
    effect((onCleanup) => {
      this.#chrome.setCount(this.countText());
      onCleanup(() => this.#chrome.setCount(null));
    });

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

  /** A column header or a sort chip: choose the field, or reverse it if it is
   * already the one in force. */
  changeSort(field: string): void {
    this.#catalogue.changeSort(field as CatalogueSortField);
  }

  /** Remembers where the Commander was, then opens the hull. */
  openHull(symbol: string): void {
    this.#catalogue.rememberPosition(symbol, this.#restorer.offsetOf(symbol));
    void this.#router.navigate(['/ships', this.#addressOf(symbol)]);
  }

  /**
   * The same navigation, without a history entry per hull.
   *
   * A pointer crossing the manifest rests on a dozen hulls on its way to one,
   * and each of those is the inspector's own address. Replacing the entry keeps
   * the address honest — the detail is still a real URL a Commander can share
   * or reload — while leaving the browser's back action pointing at wherever
   * they came into the shipyard from, rather than at the row above.
   */
  previewHull(symbol: string): void {
    if (symbol === this.#restorer.selectedSymbol()) {
      return;
    }
    this.#catalogue.rememberPosition(symbol, this.#restorer.offsetOf(symbol));
    void this.#router.navigate(['/ships', this.#addressOf(symbol)], { replaceUrl: true });
  }

  /**
   * The address one hull answers to, from the symbol the manifest carries.
   *
   * The rows are keyed by the package symbol, which is the identity, and the
   * address is the hull's name made URL-ready (001/FR-005). A symbol the package
   * does not carry cannot happen here — the rows come from the package — and if
   * it did, it addresses the screen that says so.
   */
  #addressOf(symbol: string): string {
    return hullAddressForSymbol(symbol) ?? symbol;
  }

  /**
   * Flies the hull: its stock build, straight from the manifest.
   *
   * The creator is the same one the detail screen's own action uses, so the
   * unsaved-work question and every refusal reason are asked and answered in
   * one place. A refusal leaves the Commander on the manifest with the hull
   * still open beside it, which is where the reason is already published.
   */
  async buildHull(symbol: string): Promise<void> {
    this.previewHull(symbol);
    const result = await this.#creator.create(symbol);
    if (result.kind === 'committed') {
      void this.#router.navigateByUrl(NAVIGATION_ROUTES.outfitting);
    }
  }
}

function isHullSize(value: string): value is HullSize {
  return value === 'small' || value === 'medium' || value === 'large';
}
