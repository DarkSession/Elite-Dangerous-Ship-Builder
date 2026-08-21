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
import { Formatters } from '../../i18n/formatters/formatters';
import { MessageService } from '../../i18n/message.service';
import { AnnouncementService } from '../../ui/announcements/announcement.service';
import { ActionButton } from '../../ui/components/action/action-button';
import { FactList, type Fact } from '../../ui/components/fact-list/fact-list';
import { GameText } from '../../ui/components/game-text/game-text';
import { HullArtwork } from '../../ui/components/hull-artwork/hull-artwork';
import { StatusNotice } from '../../ui/components/status/status-notice';
import { NAVIGATION_ROUTES } from '../shared/app-navigation';
import { CatalogueAnchorRestorer } from '../ship-catalogue/catalogue-anchor.restorer';
import { HullDetailUnknownSymbol } from './hull-detail-unknown-symbol';
import type { HullFactGroup } from '../../domain/catalogue/hull-facts';

/**
 * The five figures the reference rail carries, in its order: speed at four
 * pips, boost, shield, armour, hull mass (canvas 1a, "Metric grid"). Every
 * other published figure is one disclosure down rather than absent.
 */
const SUMMARY_FACTS: readonly string[] = [
  'maximum-speed',
  'boost',
  'base-shield',
  'base-armour',
  'hull-mass',
];

/** The mount classes the reference chips name, largest first. */
const MOUNT_LABELS = [
  'hullDetail.mount.huge',
  'hullDetail.mount.large',
  'hullDetail.mount.medium',
  'hullDetail.mount.small',
] as const;

/** One mount-class chip: how many of that class the hull carries. */
export interface MountCount {
  readonly count: string;
  readonly label: string;
}

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
    FactList,
    GameText,
    HullArtwork,
    HullDetailUnknownSymbol,
    RouterLink,
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
  readonly #formatters = inject(Formatters);
  readonly #announcements = inject(AnnouncementService);
  readonly #router = inject(Router);
  readonly #restorer = inject(CatalogueAnchorRestorer);

  /** The hull symbol, bound from the route's own parameter. */
  readonly symbol = input.required<string>();

  readonly catalogueRoute = NAVIGATION_ROUTES.catalogue;

  readonly backLabel = this.#messages.messageSignal('hullDetail.back');
  readonly specificationsHeading = this.#messages.messageSignal('hullDetail.specifications');
  readonly createLabel = this.#messages.messageSignal('hullDetail.create');
  readonly createUnavailable = this.#messages.messageSignal('hullDetail.create.unavailable');
  readonly manufacturerLabel = this.#messages.messageSignal('hullDetail.fact.manufacturer');
  readonly sizeLabel = this.#messages.messageSignal('hullDetail.fact.size');
  readonly moreSpecificationsHeading = this.#messages.messageSignal(
    'hullDetail.specifications.all',
  );
  readonly mountsHeading = this.#messages.messageSignal('hullDetail.slots.group.hardpoint');
  readonly priceLabel = this.#messages.messageSignal('hullDetail.price');

  readonly view = this.#detail.view;
  readonly artworkState = this.#detail.artworkState;
  readonly artworkAttempt = this.#artwork.attempt;

  /** Set when the package factory refuses. Cleared on the next attempt. */
  readonly #creationError = signal<string | null>(null);
  readonly creationError = this.#creationError.asReadonly();

  /** The reference rail's five figures, in the reference's order. */
  readonly summaryFacts = computed<readonly Fact[]>(() => {
    const view = this.view();
    const facts = view?.kind === 'populated' ? view.factGroups.flatMap((group) => group.facts) : [];
    return SUMMARY_FACTS.map((id) => facts.find((fact) => fact.id === id)).filter(
      (fact): fact is Fact => fact !== undefined,
    );
  });

  /**
   * The mount classes this hull carries, largest first. A class it has none of
   * is left out rather than shown as a zero — the chips are what it has.
   */
  readonly mounts = computed<readonly MountCount[]>(() => {
    const view = this.view();
    const profile = view?.kind === 'populated' ? view.entry.hardpoints : null;
    if (profile === null) {
      return [];
    }
    return profile
      .map((count, index) => ({ count, label: this.#messages.message(MOUNT_LABELS[index]!) }))
      .filter((mount) => mount.count > 0)
      .map((mount) => ({ count: this.#formatters.integer(mount.count), label: mount.label }));
  });

  /** The ready-to-fly price, as the reference's one headline number. */
  readonly retailPrice = computed(() => {
    const view = this.view();
    const price = view?.kind === 'populated' ? view.entry.retailPrice : null;
    return price === null ? null : this.#formatters.credits(price);
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
