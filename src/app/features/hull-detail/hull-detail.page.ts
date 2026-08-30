import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
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
import { ScreenChrome } from '../shared/screen-chrome';
import { CatalogueAnchorRestorer } from '../ship-catalogue/catalogue-anchor.restorer';
import { HullDetailUnknownSymbol } from './hull-detail-unknown-symbol';

/**
 * The eight figures the reference's metric grid carries, in its order (canvas
 * 1a, "Metric grid").
 */
const SUMMARY_FACTS: readonly string[] = [
  'maximum-speed',
  'boost',
  'base-shield',
  'base-armour',
  'hull-mass',
  'hardness',
  'crew',
  'masslock',
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
  imports: [ActionButton, FactList, GameText, HullArtwork, HullDetailUnknownSymbol, StatusNotice],
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
  readonly #chrome = inject(ScreenChrome);

  /** The hull symbol, bound from the route's own parameter. */
  readonly symbol = input.required<string>();

  readonly backLabel = this.#messages.messageSignal('hullDetail.back');
  readonly specificationsHeading = this.#messages.messageSignal('hullDetail.specifications');
  readonly createLabel = this.#messages.messageSignal('hullDetail.create');
  readonly createUnavailable = this.#messages.messageSignal('hullDetail.create.unavailable');
  readonly manufacturerLabel = this.#messages.messageSignal('hullDetail.fact.manufacturer');
  readonly sizeLabel = this.#messages.messageSignal('hullDetail.fact.size');
  readonly mountsHeading = this.#messages.messageSignal('hullDetail.slots.group.hardpoint');
  readonly priceLabel = this.#messages.messageSignal('hullDetail.price');

  readonly view = this.#detail.view;

  /**
   * Whether the command bar is carrying this hull's name at compact width.
   *
   * When it is, the body does not draw it again; when the package could supply
   * no name there is nothing in the bar to draw, and the body's own identity
   * block — which says what it could not name — is what a Commander reads.
   */
  readonly barCarriesName = computed(() => this.#layerBar()?.title != null);
  readonly artworkState = this.#detail.artworkState;
  readonly artworkAttempt = this.#artwork.attempt;

  /** Set when the package factory refuses. Cleared on the next attempt. */
  readonly #creationError = signal<string | null>(null);
  readonly creationError = this.#creationError.asReadonly();

  /** The reference rail's figures, in the reference's order. */
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

  /**
   * What the hull carries: utility mounts, core internals, the optional column
   * and the restricted mounts (FR-022).
   *
   * `null` where the package publishes no layout for the hull — the groups are
   * then drawn as nothing at all rather than as four empty rules.
   */
  readonly capacity = computed(() => {
    const view = this.view();
    return view?.kind === 'populated' ? view.capacity : null;
  });

  /** The ready-to-fly price, as the reference's one headline number. */
  readonly retailPrice = computed(() => {
    const view = this.view();
    const price = view?.kind === 'populated' ? view.entry.retailPrice : null;
    return price === null ? null : this.#formatters.credits(price);
  });

  /**
   * The bar canvas 1b draws over the shipyard's while the sheet is up: the way
   * back, the hull's name where the screen's name goes, and its manufacturer
   * and pad size under that.
   *
   * Published rather than drawn here, for the reason the workspace publishes
   * its own identity: the bar belongs to the shell, and a second one inside the
   * page would be a second bar. The frame decides where it is drawn at all —
   * canvas 1a's wide inspector has the manifest beside it and keeps the
   * shipyard's bar, so this is a compact composition and the frame owns that.
   */
  readonly #layerBar = computed(() => {
    const view = this.view();
    if (view?.kind !== 'populated') {
      return null;
    }
    const manufacturer = view.manufacturer.text;
    const size = view.size;
    return {
      back: {
        id: 'catalogue',
        label: this.backLabel(),
        href: NAVIGATION_ROUTES.catalogue,
        current: false,
      },
      title: view.name.text,
      detail:
        manufacturer === null
          ? size
          : size === null
            ? manufacturer
            : this.#messages.message('hullDetail.bar.detail', { manufacturer, size }),
    };
  });

  constructor() {
    // The sheet's own bar, for as long as the sheet is up. Cleared on the way
    // out so the shipyard's bar is the shipyard's again — whichever way the
    // Commander left, including the browser's own back.
    effect((onCleanup) => {
      this.#chrome.setReturn(this.#layerBar());
      onCleanup(() => this.#chrome.setReturn(null));
    });

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
