import { Injectable, inject } from '@angular/core';
import { getDefaultLoadout } from '@elite-dangerous-almanac/core/ships/default-loadouts';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { getShipBySymbol } from '@elite-dangerous-almanac/core/ships/ships';
import { emptyFixedMounts } from '../../domain/build/fixed-mounts';
import { GameTextPresenter } from '../../i18n/game-text.presenter';
import {
  ReplacementCoordinator,
  type CandidateOutcome,
  type ReplacementResult,
} from './replacement-coordinator';

/**
 * Creating a stock build, as one transaction.
 *
 * Four things happen before anything can be replaced, and all four can say no:
 * the symbol must resolve, the package must actually carry a default loadout
 * for it, the factory must produce a build, and that build must arrive with
 * every fixed mount populated. Only then is the candidate handed to the shared
 * replacement coordinator, which decides whether the Commander is asked first.
 *
 * The illustration is not among those four. Artwork is decoration with a text
 * equivalent; a hull whose picture failed to load can still be flown (FR-006).
 */
@Injectable({ providedIn: 'root' })
export class StockBuildCreator {
  readonly #coordinator = inject(ReplacementCoordinator);
  readonly #gameText = inject(GameTextPresenter);

  /** Whether a stock build can be created for this hull at all. */
  canCreate(symbol: string): boolean {
    return getShipBySymbol(symbol) !== null && getDefaultLoadout(symbol) !== null;
  }

  /** Creates the build, asking about unsaved work first where there is any. */
  async create(symbol: string): Promise<ReplacementResult> {
    return this.#coordinator.replace(() => this.#construct(symbol));
  }

  #construct(symbol: string): CandidateOutcome {
    const ship = getShipBySymbol(symbol);
    if (ship === null) {
      return { ok: false, reason: `This installation carries no hull "${symbol}".` };
    }
    if (getDefaultLoadout(ship.symbol) === null) {
      return {
        ok: false,
        reason: `This installation carries no default loadout for "${ship.symbol}".`,
      };
    }

    let loadout: ShipLoadout;
    try {
      loadout = ShipLoadout.default(ship.symbol);
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : String(error) };
    }

    const empty = emptyFixedMounts(loadout);
    if (empty.length > 0) {
      // The package guarantees this; checking it means a release that stopped
      // guaranteeing it is caught here rather than becoming a build a Commander
      // saves and shares (FR-014).
      return {
        ok: false,
        reason: `The stock build for "${ship.symbol}" arrived with an empty fixed mount: ${empty.join(', ')}.`,
      };
    }

    return {
      ok: true,
      candidate: {
        loadout,
        hullName: this.#gameText.shipName(ship.symbol).text ?? ship.symbol,
        provenance: 'stock',
        // A hull's own default build is the package's, at the package's own
        // quality. There is no source to have stated a partial roll, so the
        // ingress gate has nothing to complete and nothing to report.
        qualityNotices: [],
        sourceNamed: null,
        autosaveRecordId: null,
        // A build that exists only in this tab, with no copy anywhere: unsaved
        // by definition, so the next replacement asks before discarding it.
        baseline: null,
      },
    };
  }
}
