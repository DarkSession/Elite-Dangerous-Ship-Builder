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
import { Formatters } from '../../i18n/formatters/formatters';
import { GameTextPresenter } from '../../i18n/game-text.presenter';
import type { BuildEditIntent, BuildEditResult, EditFailure } from './build-edit-intent';
import {
  candidateMembership,
  resolveChoice,
  type CandidateMembership,
} from './candidate-membership';
import { applyQuery, openCandidateQuery, type CandidateQueryState } from './candidate-query';
import { engineeringOperation } from './engineering-draft';
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
  readonly #formatters = inject(Formatters);

  readonly #selectedSlotKey = signal<string | null>(null);
  readonly #surface = signal<OutfittingSurface>('workspace');
  readonly #lastEditFailure = signal<EditFailure | null>(null);
  readonly #query = signal('');

  /**
   * The package's structured refusal from the operation that just ran.
   *
   * `setExperimentalEffect` refuses by *returning* rather than by throwing, so
   * a refused effect edit reaches the transaction as an operation that changed
   * nothing — indistinguishable from a Commander re-selecting the effect they
   * already had. This carries the package's own code and parameters back out of
   * the closure so the two stay distinguishable (contract, "Refusals").
   */
  #structuredRefusal: { readonly code: string; readonly params: unknown } | null = null;

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
    return loadout === null || key === null
      ? null
      : candidateMembership(loadout, key, revision, this.#gameText);
  });

  /**
   * The chooser, ordered and indexed, for the current mount at this revision.
   *
   * Split from `candidateQuery` on purpose. This recomputes only when the
   * mount, the build revision or the reading language changes; the query
   * signal is read one step later. Collapsing the two would sort and fold every
   * choice again on each character typed, which is the whole difference between
   * a chooser that keeps up on a phone and one that does not (SC-002).
   */
  readonly #openQuery = computed<CandidateQueryState | null>(() => {
    const membership = this.membership();
    return membership === null
      ? null
      : openCandidateQuery(membership, this.#gameText.locale, this.#formatters.collator());
  });

  /** The chooser as the Commander currently has it filtered. */
  readonly candidateQuery = computed<CandidateQueryState | null>(() => {
    const open = this.#openQuery();
    return open === null ? null : applyQuery(open, this.#query());
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

  /** Restores every choice without touching selection or the build. */
  clearQuery(): void {
    this.#query.set('');
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

    this.#takeStructuredRefusal();
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

    const outcome = runEditTransaction(current, operation, slotKeyOf(intent));

    // Checked before the outcome, because a structured refusal reaches here as
    // an unchanged build and "nothing needed doing" is the wrong thing to tell
    // a Commander whose edit the Almanac declined.
    const refusal = this.#takeStructuredRefusal();
    if (refusal !== null) {
      return this.#refuse(
        {
          category: 'packageResult',
          slotKey: slotKeyOf(intent),
          code: refusal.code,
          constraint: null,
          params: null,
          diagnostic: refusal.params,
          framingKey: 'outfitting.refusal.packageResult',
        },
        this.#active.revision(),
      );
    }

    return this.#commitOutcome(outcome, slotKeyOf(intent));
  }

  /** Reads the last structured refusal and clears it, so it is never read twice. */
  #takeStructuredRefusal(): { readonly code: string; readonly params: unknown } | null {
    const refusal = this.#structuredRefusal;
    this.#structuredRefusal = null;
    return refusal;
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

      case 'applyEngineering':
      case 'setExperimental':
      case 'clearEngineering': {
        // Re-read now rather than remembered from when the editor drew its
        // menus. A mount whose module has since been replaced offers a
        // different menu, and the package is the one that knows.
        if (current.fittedModuleAt(intent.slotKey) === null) {
          return null;
        }
        return engineeringOperation(intent, (code, params) => {
          this.#structuredRefusal = { code, params };
        });
      }

      case 'setEnabled':
      case 'setPriority': {
        // Power belongs to whatever is fitted — including the cargo hatch,
        // which is the one mount that offers this and nothing else (FR-009).
        // The module stays fitted either way: its mass and its catalogue cost
        // are still in the build (contract, "Power and recalculation").
        const fitted = current.fittedModuleAt(intent.slotKey);
        if (fitted === null) {
          return null;
        }

        // Switching on a module that never said it was off changes nothing a
        // Commander can see, but it does write `On: true` where the source said
        // nothing — which the modelled snapshot records as a different build.
        // The package documents an absent field as on, so this asks for the
        // state it is already in, and asking for that is not a decision: it
        // would spend a revision and a history frame on undo doing nothing
        // (build-edit transaction, "the no-op check").
        if (intent.kind === 'setEnabled' && (fitted.on ?? true) === intent.enabled) {
          return () => {};
        }

        return intent.kind === 'setEnabled'
          ? (candidate) => {
              candidate.setModuleEnabled(intent.slotKey, intent.enabled);
            }
          : (candidate) => {
              // The package's own zero-based group. The interface presents
              // 1–5; the translation happens once, at the control, and never
              // here (contract, "Operations").
              candidate.setModulePriority(intent.slotKey, intent.priority);
            };
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
