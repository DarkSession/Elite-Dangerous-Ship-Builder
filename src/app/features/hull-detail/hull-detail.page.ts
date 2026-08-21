import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StockBuildCreator } from '../../application/active-build/stock-build.creator';
import { ArtworkCoordinator } from '../../application/catalogue/artwork.coordinator';
import { HullDetailFacade } from '../../application/catalogue/hull-detail.facade';
import { MessageService } from '../../i18n/message.service';
import { AnnouncementService } from '../../ui/announcements/announcement.service';
import { ActionButton } from '../../ui/components/action/action-button';
import { ActionLink } from '../../ui/components/action/action-link';
import { FactList } from '../../ui/components/fact-list/fact-list';
import { GameText } from '../../ui/components/game-text/game-text';
import { HullArtwork } from '../../ui/components/hull-artwork/hull-artwork';
import { Panel } from '../../ui/components/panel/panel';
import { SlotLayout } from '../../ui/components/slot-layout/slot-layout';
import { StatusNotice } from '../../ui/components/status/status-notice';
import { NAVIGATION_ROUTES } from '../shared/app-navigation';
import { CatalogueAnchorRestorer } from '../ship-catalogue/catalogue-anchor.restorer';
import { HullDetailUnknownSymbol } from './hull-detail-unknown-symbol';
import type { HullFactGroup } from '../../domain/catalogue/hull-facts';

/** The heading each group of facts appears under. */
const GROUP_HEADINGS: Record<HullFactGroup, string> = {
  identity: 'hullDetail.specifications',
  performance: 'hullDetail.specifications',
  defence: 'hullDetail.specifications',
  'mass-and-heat': 'hullDetail.specifications',
  handling: 'hullDetail.specifications',
  prices: 'hullDetail.costs',
};

/**
 * One hull, in full.
 *
 * Every published fact with its unit, the whole slot layout with the game's own
 * keys, the illustration, and one action: create a stock build. Entering this
 * screen creates nothing and replaces nothing — that only happens when the
 * Commander asks, and then only after the shared coordinator has confirmed
 * anything unsaved would not be lost (FR-007, FR-009).
 *
 * At wide widths this is the inspector beside the manifest; at narrow widths it
 * is a full-screen layer with its own way back. Same route, same state, same
 * history entry: the breakpoint changes the composition, never the address.
 */
@Component({
  selector: 'edsb-hull-detail-page',
  imports: [
    ActionButton,
    ActionLink,
    FactList,
    GameText,
    HullArtwork,
    HullDetailUnknownSymbol,
    Panel,
    RouterLink,
    SlotLayout,
    StatusNotice,
  ],
  templateUrl: './hull-detail.page.html',
  styleUrl: './hull-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HullDetailPage {
  readonly #detail = inject(HullDetailFacade);
  readonly #artwork = inject(ArtworkCoordinator);
  readonly #creator = inject(StockBuildCreator);
  readonly #messages = inject(MessageService);
  readonly #announcements = inject(AnnouncementService);
  readonly #router = inject(Router);
  readonly #restorer = inject(CatalogueAnchorRestorer);

  /** The hull symbol, bound from the route's own parameter. */
  readonly symbol = input.required<string>();

  readonly catalogueRoute = NAVIGATION_ROUTES.catalogue;

  readonly backLabel = this.#messages.messageSignal('hullDetail.back');
  readonly specificationsHeading = this.#messages.messageSignal('hullDetail.specifications');
  readonly specificationsDescription = this.#messages.messageSignal(
    'hullDetail.specifications.description',
  );
  readonly costsHeading = this.#messages.messageSignal('hullDetail.costs');
  readonly costsDescription = this.#messages.messageSignal('hullDetail.costs.description');
  readonly slotsHeading = this.#messages.messageSignal('hullDetail.slots');
  readonly slotsDescription = this.#messages.messageSignal('hullDetail.slots.description');
  readonly slotsUnavailable = this.#messages.messageSignal('hullDetail.slots.unavailable');
  readonly createLabel = this.#messages.messageSignal('hullDetail.create');
  readonly createDescription = this.#messages.messageSignal('hullDetail.create.description');
  readonly createUnavailable = this.#messages.messageSignal('hullDetail.create.unavailable');
  readonly manufacturerLabel = this.#messages.messageSignal('hullDetail.fact.manufacturer');
  readonly sizeLabel = this.#messages.messageSignal('hullDetail.fact.size');

  readonly view = this.#detail.view;
  readonly artworkState = this.#detail.artworkState;
  readonly artworkAttempt = this.#artwork.attempt;

  /** Set when the package factory refuses. Cleared on the next attempt. */
  readonly #creationError = signal<string | null>(null);
  readonly creationError = this.#creationError.asReadonly();

  /** The fact groups that belong under "Hull specifications". */
  readonly specificationGroups = computed(() => {
    const view = this.view();
    return view?.kind === 'populated'
      ? view.factGroups.filter((group) => GROUP_HEADINGS[group.group] !== 'hullDetail.costs')
      : [];
  });

  /** The fact groups that belong under "Prices". */
  readonly priceGroups = computed(() => {
    const view = this.view();
    return view?.kind === 'populated'
      ? view.factGroups.filter((group) => GROUP_HEADINGS[group.group] === 'hullDetail.costs')
      : [];
  });

  constructor() {
    // The route parameter is the only input; everything else follows from it.
    // Leaving the route clears the selection, which is what tells the catalogue
    // the detail has closed — however it closed.
    effect((onCleanup) => {
      const symbol = this.symbol();
      this.#detail.setSymbol(symbol);
      this.#restorer.setSelected(symbol);
      this.#creationError.set(null);
      onCleanup(() => this.#restorer.setSelected(null));
    });

    // One assertive announcement per new blocking condition, and none for the
    // ordinary populated case, which is discoverable in reading order.
    effect(() => {
      const view = this.view();
      if (view?.kind !== 'unknown') {
        return;
      }
      this.#announcements.announce({
        kind: 'hullDetail.unknown',
        revision: 1,
        urgency: 'assertive',
        messageKey: 'hullDetail.unknown.title',
      });
    });
  }

  markArtworkAvailable(): void {
    this.#detail.markArtworkAvailable();
  }

  markArtworkUnavailable(): void {
    this.#detail.markArtworkUnavailable();
  }

  retryArtwork(): void {
    this.#detail.retryArtwork();
  }

  /**
   * Asks for a stock build.
   *
   * Everything that can refuse does so before anything is replaced. A failure
   * leaves both the build and this screen exactly as they were, and says why.
   */
  async createStockBuild(): Promise<void> {
    const view = this.view();
    if (view?.kind !== 'populated') {
      return;
    }

    this.#creationError.set(null);
    const result = await this.#creator.create(view.entry.symbol);

    if (result.kind === 'failed') {
      this.#creationError.set(
        this.#messages.message('hullDetail.create.failed', { reason: result.reason }),
      );
      return;
    }
    if (result.kind === 'committed') {
      void this.#router.navigateByUrl(NAVIGATION_ROUTES.build);
    }
  }
}
