import { Injectable, computed, inject, signal } from '@angular/core';
import {
  LoadoutEditError,
  type ShipLoadout,
} from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { ModeledBuildCheckpoint } from '../../domain/build/modeled-build-checkpoint';
import {
  runEditTransaction,
  type EditOperation,
  type TransactionOutcome,
} from '../../domain/outfitting/build-edit-transaction';
import type { MessageKey } from '../../i18n/locale-registry';
import { ActiveBuildStore } from '../active-build/active-build.store';
import { ReplacementCoordinator } from '../active-build/replacement-coordinator';
import { GameTextPresenter } from '../../i18n/game-text.presenter';
import type { BuildEditIntent, BuildEditResult, EditFailure } from './build-edit-intent';
import {
  candidateMembership,
  resolveChoice,
  type CandidateMembership,
} from './candidate-membership';
import type { OutfittingSurface } from './outfitting-state';
import { slotCapabilities } from './slot-capabilities';
import { slotViews, type SlotView } from './slot-view';

/**
 * Everything the outfitting workspace knows that is not the build.
 *
 * The build itself stays where it has always been — feature 001's one active
 * slot — and this store never holds a second one. What it owns is the session:
 * which mount is selected, which surface is showing, what is typed into a
 * chooser, and why the last edit did not happen. None of that is ever
 * serialized, and none of it changes the build's revision, which is exactly why
 * a Commander can select a slot, search it, change their mind and close it
 * without having edited anything (FR-018).
 *
 * Edits go one way: an intent arrives, the transaction produces a candidate,
 * and a changed candidate is installed in one write. Components never see the
 * loadout being edited, because there is no moment at which it is.
 */
@Injectable({ providedIn: 'root' })
export class OutfittingStore {
  readonly #active = inject(ActiveBuildStore);
  readonly #coordinator = inject(ReplacementCoordinator);
  readonly #gameText = inject(GameTextPresenter);

  readonly #selectedSlotKey = signal<string | null>(null);
  readonly #surface = signal<OutfittingSurface>('workspace');
  readonly #lastEditFailure = signal<EditFailure | null>(null);
  readonly #query = signal('');

  /** Feature 001's revision. Changes once per committed edit or replacement. */
  readonly revision = this.#active.revision;
  readonly loadout = this.#active.loadout;

  readonly selectedSlotKey = this.#selectedSlotKey.asReadonly();
  readonly surface = this.#surface.asReadonly();
  readonly lastEditFailure = this.#lastEditFailure.asReadonly();
  readonly query = this.#query.asReadonly();

  readonly hasBuild = computed(() => this.#active.loadout() !== null);

  /**
   * Every mount, re-read once per revision.
   *
   * Recomputed rather than patched. The package's returned views are frozen
   * snapshots of the build as it was, so after a commit the only correct thing
   * to do with the previous set is throw it away (outfitting-editor contract,
   * "Slot and module reads").
   */
  readonly slots = computed<readonly SlotView[]>(() => {
    this.revision();
    const loadout = this.#active.loadout();
    return loadout === null ? [] : slotViews(loadout, this.#gameText);
  });

  readonly selectedSlot = computed<SlotView | null>(() => {
    const key = this.#selectedSlotKey();
    return key === null ? null : (this.slots().find((slot) => slot.key === key) ?? null);
  });

  /** What the package permits on the selected mount, at this revision. */
  readonly selectedCapabilities = computed(() => {
    const loadout = this.#active.loadout();
    const slot = this.selectedSlot();
    return loadout === null || slot === null ? null : slotCapabilities(loadout, slot);
  });

  /**
   * The chooser's contents for the selected mount, at this revision.
   *
   * Held as a computed rather than as a stored list, so a committed edit
   * invalidates it by construction: there is no retained set that could survive
   * a revision it was not read at.
   */
  readonly membership = computed<CandidateMembership | null>(() => {
    const revision = this.revision();
    const loadout = this.#active.loadout();
    const key = this.#selectedSlotKey();
    return loadout === null || key === null ? null : candidateMembership(loadout, key, revision);
  });

  constructor() {
    // A build that was *replaced* is a different build, so a slot key, a query
    // and a refusal about the previous one are all about something that is no
    // longer there. A build that was *refused* never arrived, so every one of
    // them still describes exactly what the Commander is looking at — which is
    // why this is wired to the commit sink and not to the attempt.
    this.#coordinator.addSink({ onCommitted: () => this.resetForReplacement() });
  }

  // -------------------------------------------------------------------------
  // Session state. None of this spends a revision.
  // -------------------------------------------------------------------------

  /** Selects a mount by its exact package slot key. */
  select(slotKey: string | null): void {
    this.#selectedSlotKey.set(slotKey);
    this.#query.set('');
    this.#surface.set('workspace');
  }

  showSurface(surface: OutfittingSurface): void {
    this.#surface.set(surface);
  }

  setQuery(query: string): void {
    this.#query.set(query);
  }

  dismissFailure(): void {
    this.#lastEditFailure.set(null);
  }

  /** Clears every editing field. Called after an accepted replacement. */
  resetForReplacement(): void {
    this.#selectedSlotKey.set(null);
    this.#surface.set('workspace');
    this.#lastEditFailure.set(null);
    this.#query.set('');
  }

  // -------------------------------------------------------------------------
  // Edits
  // -------------------------------------------------------------------------

  /**
   * Carries out one Commander decision, or none.
   *
   * The three outcomes are kept distinct all the way to the caller because they
   * mean three different things to a Commander: something changed, nothing
   * needed to change, or the Almanac said no and here is why.
   */
  dispatch(intent: BuildEditIntent): BuildEditResult {
    const current = this.#active.loadout();
    if (current === null) {
      return this.#refuse(
        {
          category: 'unavailableOperation',
          slotKey: slotKeyOf(intent),
          code: null,
          constraint: null,
          params: null,
          diagnostic: null,
          framingKey: 'outfitting.refusal.unavailableOperation',
        },
        this.#active.revision(),
      );
    }

    const operation = this.#operationFor(intent, current);
    if (operation === null) {
      return this.#refuse(
        {
          category: 'unavailableOperation',
          slotKey: slotKeyOf(intent),
          code: null,
          constraint: null,
          params: null,
          diagnostic: null,
          framingKey: 'outfitting.refusal.unavailableOperation',
        },
        this.#active.revision(),
      );
    }

    return this.#commitOutcome(
      runEditTransaction(current, operation, slotKeyOf(intent)),
      slotKeyOf(intent),
    );
  }

  /**
   * Installs a transaction outcome, spending at most one revision.
   *
   * Shared with the history transitions, which produce the same outcomes by a
   * different route and must land the same way.
   */
  #commitOutcome(outcome: TransactionOutcome, slotKey: string | null): BuildEditResult {
    switch (outcome.kind) {
      case 'changed':
        this.#lastEditFailure.set(null);
        this.#recordDecision(outcome.previous);
        this.#active.installEdited(outcome.candidate);
        return { kind: 'committed', revision: this.#active.revision() };

      case 'unchanged':
        this.#lastEditFailure.set(null);
        return { kind: 'unchanged', revision: this.#active.revision() };

      case 'refused':
        return this.#refuse(refusalOf(outcome.error, outcome.slotKey), this.#active.revision());

      case 'unexpected':
        return this.#refuse(
          {
            category: 'unexpectedPackageRefusal',
            slotKey: outcome.slotKey,
            code: null,
            constraint: null,
            params: null,
            diagnostic: outcome.error,
            framingKey: 'outfitting.refusal.unexpectedPackageRefusal',
          },
          this.#active.revision(),
        );

      default:
        return this.#refuse(
          {
            category: 'packageResult',
            slotKey,
            code: null,
            constraint: null,
            params: null,
            diagnostic: null,
            framingKey: 'outfitting.refusal.blocked',
          },
          this.#active.revision(),
        );
    }
  }

  /**
   * Called once per changed edit, before it is installed.
   *
   * The history tape hooks in here (T084) rather than wrapping `dispatch`, so
   * every route that produces a changed candidate records exactly one frame and
   * none of them can forget.
   */
  #recordDecision(_previous: ModeledBuildCheckpoint): void {
    // The history tape hooks in here (T084).
  }

  /**
   * The single package operation one intent performs.
   *
   * `null` means the package offers no such operation here, which is a refusal
   * before anything is attempted rather than an exception to catch.
   */
  #operationFor(intent: BuildEditIntent, current: ShipLoadout): EditOperation | null {
    switch (intent.kind) {
      case 'fitStock':
      case 'fitVariant': {
        const membership = this.membership();
        if (membership === null || membership.slotKey !== intent.slotKey) {
          return null;
        }
        const choice = resolveChoice(membership, intent.choiceKey, this.revision());
        if (choice === null) {
          return null;
        }

        // A stock fit and a variant fit are different package operations, and
        // the key says which one the Commander pressed. A mismatch between the
        // two is a refusal, not a guess.
        if (intent.kind === 'fitStock') {
          return choice.kind === 'stock'
            ? (candidate) => {
                candidate.setModule(intent.slotKey, choice.module);
              }
            : null;
        }
        return choice.kind === 'variant'
          ? (candidate) => {
              candidate.setPreEngineeredVariant(intent.slotKey, choice.variant);
            }
          : null;
      }

      case 'remove': {
        const slot = current.slots().find((candidate) => candidate.key === intent.slotKey);
        // Removability is the package's answer, re-read now rather than
        // remembered from when the card was drawn.
        if (slot === undefined || !slot.removable) {
          return null;
        }
        return (candidate) => {
          candidate.removeModule(intent.slotKey);
        };
      }

      default:
        return null;
    }
  }

  #refuse(failure: EditFailure, revision: number): BuildEditResult {
    this.#lastEditFailure.set(failure);
    return { kind: 'refused', failure, revision };
  }
}

/** The mount an intent is about, where it is about one. */
export function slotKeyOf(intent: BuildEditIntent): string | null {
  return 'slotKey' in intent ? intent.slotKey : null;
}

/** A package refusal, retained whole and framed by the application. */
function refusalOf(error: LoadoutEditError, slotKey: string | null): EditFailure {
  const framing: MessageKey = 'outfitting.refusal.packageEdit';
  return {
    category: 'packageEdit',
    slotKey,
    code: error.code,
    constraint: error.constraint ?? null,
    params: error.params,
    // The error object itself, so the game-text presenter can resolve the
    // package's own sentence for whichever locale is active when it is drawn.
    diagnostic: error,
    framingKey: framing,
  };
}
