import { Injectable, computed, inject, linkedSignal, signal } from '@angular/core';
import type { OutfittingFamilyId } from '@elite-dangerous-almanac/core/ships/module-families';
import {
  LoadoutEditError,
  type ShipLoadout,
} from '@elite-dangerous-almanac/core/ships/ship-loadout';
import {
  captureCheckpoint,
  restoreCheckpoint,
  type ModeledBuildCheckpoint,
} from '../../domain/build/modeled-build-checkpoint';
import {
  runEditTransaction,
  runSnapshotTransaction,
  type EditOperation,
  type TransactionOutcome,
} from '../../domain/outfitting/build-edit-transaction';
import {
  emptyHistory,
  recordDecision,
  redo,
  redoSummary,
  undo,
  undoSummary,
  type HistoryIntentSummary,
  type SessionEditHistory,
} from '../../domain/outfitting/session-edit-history';
import type { MessageKey } from '../../i18n/locale-registry';
import { ActiveBuildStore } from '../active-build/active-build.store';
import { ReplacementCoordinator } from '../active-build/replacement-coordinator';
import { Formatters } from '../../i18n/formatters/formatters';
import { GameTextPresenter } from '../../i18n/game-text.presenter';
import { MessageService } from '../../i18n/message.service';
import type { BuildEditIntent, BuildEditResult, EditFailure } from './build-edit-intent';
import {
  candidateMembership,
  resolveChoice,
  type CandidateMembership,
} from './candidate-membership';
import {
  applyQuery,
  openCandidateQuery,
  toggleFamily,
  type CandidateQueryState,
} from './candidate-query';
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
  readonly #messages = inject(MessageService);

  readonly #selectedSlotKey = signal<string | null>(null);
  readonly #surface = signal<OutfittingSurface>('workspace');
  readonly #lastEditFailure = signal<EditFailure | null>(null);
  readonly #query = signal('');

  /**
   * The session's decisions, oldest first, and the branch undo left behind.
   *
   * In memory and nowhere else. Nothing serializes it, nothing publishes it and
   * nothing restores it on reload: it is the record of what a Commander did in
   * this session, and a session is exactly how long it lives (edit-history
   * contract, "Boundary isolation").
   */
  readonly #history = signal<SessionEditHistory<ModeledBuildCheckpoint>>(emptyHistory());

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

  /**
   * The mount every read below is about.
   *
   * Neither canvas draws an outfitting screen with nothing selected: the wide
   * one opens on `FITTING · HARDPOINT 1` with that row marked and its bench
   * filled, and the compact one opens on the same row. So an unset selection is
   * the first mount rather than a state of its own — there is no screen to draw
   * for it (design-canvas rule).
   */
  readonly selectedSlotKey = computed<string | null>(
    () => this.#selectedSlotKey() ?? this.slots()[0]?.key ?? null,
  );
  readonly surface = this.#surface.asReadonly();
  readonly lastEditFailure = this.#lastEditFailure.asReadonly();
  readonly query = this.#query.asReadonly();

  readonly hasBuild = computed(() => this.#active.loadout() !== null);

  /** Whether there is a decision to step back to, and one to step forward to. */
  readonly canUndo = computed(() => this.#history().past.length > 0);
  readonly canRedo = computed(() => this.#history().future.length > 0);

  /**
   * What each direction would move through, in the Commander's language.
   *
   * Resolved when it is read rather than when it was recorded: the tape holds a
   * key and identities, so a Commander who changes language mid-session reads
   * their own history in the language they are reading now (edit-history
   * contract, "Included decisions").
   */
  readonly undoSummary = computed(() => this.#summaryText(undoSummary(this.#history())));
  readonly redoSummary = computed(() => this.#summaryText(redoSummary(this.#history())));

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
    const key = this.selectedSlotKey();
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
    const key = this.selectedSlotKey();
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
    if (membership === null) {
      return null;
    }
    // The exact article in the mount, so the chooser can open the family that
    // holds it and no other. The whole variant record, never the symbol, which
    // a stock module and every reward built on it share (FR-021).
    const fitted = this.selectedSlot()?.module ?? null;
    return openCandidateQuery(
      membership,
      this.#gameText.locale,
      this.#formatters.collator(),
      fitted,
    );
  });

  /**
   * The chooser as the Commander currently has it: filtered, and opened.
   *
   * A `linkedSignal` rather than a `computed`, and that is the whole mechanism
   * behind FR-021's reseeding. The open family set is view state a Commander can
   * change, so it has to be writable — but it must not outlive the presentation
   * it belongs to. Recomputing the source whenever the mount, the revision, the
   * reading language or the query changes throws the Commander's toggles away
   * and re-seeds from the fitted family, which is exactly what the requirement
   * asks for and is a lifetime nothing has to remember to invalidate
   * (decision 15).
   */
  readonly #candidateQuery = linkedSignal<CandidateQueryState | null>(() => {
    const open = this.#openQuery();
    return open === null ? null : applyQuery(open, this.#query());
  });

  readonly candidateQuery = this.#candidateQuery.asReadonly();

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

  /**
   * Opens or closes one module family.
   *
   * View state and nothing else: no revision is spent, no checkpoint is taken,
   * no undo becomes available and the ordered, folded index is not rebuilt —
   * the same state object is returned with one id added to or removed from its
   * open set (FR-021, FR-022).
   */
  toggleFamily(familyId: OutfittingFamilyId): void {
    this.#candidateQuery.update((state) => (state === null ? null : toggleFamily(state, familyId)));
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
    // Both directions, because the decisions on the tape were about a build
    // that is no longer the one on screen. A refused incoming candidate never
    // reaches here, so its history survives (edit-history contract, "Reset").
    this.#history.set(emptyHistory());
  }

  /**
   * Steps one decision back, or forward, or reports that there is none.
   *
   * Both directions are the same three moves: ask the tape where to go, rebuild
   * that state through the package, and install it in one write. A rebuild that
   * fails installs nothing and consumes no frame — the tape the store still
   * holds is the one it had, because the transition was only ever a proposal
   * (edit-history contract, "Restoration").
   */
  undo(): BuildEditResult {
    return this.#move(undo);
  }

  redo(): BuildEditResult {
    return this.#move(redo);
  }

  #move(
    step: (
      history: SessionEditHistory<ModeledBuildCheckpoint>,
      current: ModeledBuildCheckpoint,
    ) => {
      restore: ModeledBuildCheckpoint;
      next: SessionEditHistory<ModeledBuildCheckpoint>;
    } | null,
  ): BuildEditResult {
    const current = this.#active.loadout();
    const revision = this.#active.revision();
    if (current === null) {
      return { kind: 'unchanged', revision };
    }

    const transition = step(this.#history(), captureCheckpoint(current));
    if (transition === null) {
      // Nothing to step to. Not a refusal: the controls are disabled at the
      // ends, and pressing one anyway is not something to explain.
      return { kind: 'unchanged', revision };
    }

    const restored = restoreCheckpoint(transition.restore);
    if (!restored.ok) {
      return this.#refuse(
        {
          category: 'unexpectedPackageRefusal',
          slotKey: null,
          code: null,
          constraint: null,
          params: null,
          diagnostic: restored.reason,
          framingKey: 'outfitting.refusal.blocked',
        },
        revision,
      );
    }

    this.#lastEditFailure.set(null);
    this.#history.set(transition.next);
    this.#active.installEdited(restored.loadout);
    return { kind: 'committed', revision: this.#active.revision() };
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

    if (intent.kind === 'setShipName' || intent.kind === 'setShipIdent') {
      // Not a package operation: the package publishes both fields read-only,
      // so the edit is made where they are modelled and the build is rebuilt
      // from it (FR-019).
      const field = intent.kind === 'setShipName' ? 'shipName' : 'shipIdent';
      return this.#commitOutcome(
        runSnapshotTransaction(current, (snapshot) => ({ ...snapshot, [field]: intent.value })),
        intent,
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

    return this.#commitOutcome(outcome, intent);
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
  #commitOutcome(outcome: TransactionOutcome, intent: BuildEditIntent): BuildEditResult {
    const slotKey = slotKeyOf(intent);
    switch (outcome.kind) {
      case 'changed':
        this.#lastEditFailure.set(null);
        this.#recordDecision(outcome.previous, intent);
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
   * The tape hooks in here rather than around `dispatch`, so every route that
   * produces a changed candidate records exactly one frame and none of them can
   * forget — and a refusal, a no-op or an abandoned draft never reaches it,
   * because none of them produce one (edit-history contract, "Exclusions").
   */
  #recordDecision(previous: ModeledBuildCheckpoint, intent: BuildEditIntent): void {
    this.#history.set(recordDecision(this.#history(), previous, summaryOf(intent)));
  }

  /**
   * One retained summary, in the Commander's language.
   *
   * The mount is named the way the ledger names it. Its exact package key is
   * the identity on the tape and never the words: a key is what the application
   * edits by, not something a Commander reads (FR-002).
   */
  #summaryText(summary: HistoryIntentSummary | null): string | null {
    if (summary === null) {
      return null;
    }
    const slotKey = summary.params['slot'];
    const params =
      typeof slotKey === 'string'
        ? { ...summary.params, slot: this.#slotLabel(slotKey) }
        : summary.params;
    return this.#messages.message(summary.key as MessageKey, params);
  }

  /** The ledger's own label for one mount, or the package's canonical name. */
  #slotLabel(slotKey: string): string {
    const slot = this.slots().find((candidate) => candidate.key === slotKey);
    return slot?.displayName.text ?? slot?.canonicalName ?? slotKey;
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
      case 'clearEngineering':
      case 'restorePurchase': {
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

/**
 * What one decision was, as a key and scalars.
 *
 * Identities, never words: the mount is its exact package key and the group is
 * the number a Commander reads. Storing the resolved sentence instead would fix
 * a summary in the language it happened to be recorded in, and would put game
 * text on a tape that must not hold any (edit-history contract, "Included
 * decisions").
 */
function summaryOf(intent: BuildEditIntent): HistoryIntentSummary {
  switch (intent.kind) {
    case 'fitStock':
    case 'fitVariant':
      return { key: 'outfitting.history.fit', params: { slot: intent.slotKey } };
    case 'remove':
      return { key: 'outfitting.history.remove', params: { slot: intent.slotKey } };
    case 'applyEngineering':
      return {
        key: 'outfitting.history.engineer',
        params: { slot: intent.slotKey, grade: intent.grade },
      };
    case 'setExperimental':
      return { key: 'outfitting.history.effect', params: { slot: intent.slotKey } };
    case 'clearEngineering':
      return { key: 'outfitting.history.clear', params: { slot: intent.slotKey } };
    case 'restorePurchase':
      return { key: 'outfitting.history.restore', params: { slot: intent.slotKey } };
    case 'setEnabled':
      return {
        key: intent.enabled ? 'outfitting.history.powered' : 'outfitting.history.unpowered',
        params: { slot: intent.slotKey },
      };
    case 'setPriority':
      return {
        key: 'outfitting.history.priority',
        params: { slot: intent.slotKey, group: intent.priority + 1 },
      };
    case 'setShipName':
      return {
        key: intent.value === null ? 'outfitting.history.name.cleared' : 'outfitting.history.name',
        params: {},
      };
    case 'setShipIdent':
      return {
        key:
          intent.value === null ? 'outfitting.history.ident.cleared' : 'outfitting.history.ident',
        params: {},
      };
  }
}
