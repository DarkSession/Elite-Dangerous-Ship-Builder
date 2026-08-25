import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import type { LocalRecordV1, StoredRecordEntry } from '../../domain/build/stored-build';
import { ActiveBuildStore } from '../../application/active-build/active-build.store';
import { BuildLibraryStore } from '../../application/build-library/build-library.store';
import { NamedRecordService } from '../../application/build-library/named-record.service';
import { RecordDuplicationService } from '../../application/build-library/record-duplication.service';
import { RecordInvalidationService } from '../../application/build-library/record-invalidation.service';
import { RecordOpenService } from '../../application/build-library/record-open.service';
import {
  SaveConflictService,
  type ConflictChoice,
} from '../../application/build-library/save-conflict.service';
import { RetentionService } from '../../application/build-library/retention.service';
import { ClockAdapter } from '../../platform/browser/clock.adapter';
import { LocalRecordRepository } from '../../platform/storage/local-record.repository';
import { Formatters } from '../../i18n/formatters/formatters';
import { GameTextPresenter } from '../../i18n/game-text.presenter';
import { MessageService } from '../../i18n/message.service';
import { ActionButton } from '../../ui/components/action/action-button';
import { ChoiceDialog, type DialogChoice } from '../../ui/components/choice-dialog/choice-dialog';
import { ConfirmDialog } from '../../ui/components/confirm-dialog/confirm-dialog';
import {
  RecordManager,
  type ManageableRecord,
} from '../../ui/components/record-manager/record-manager';
import { AnnouncementService } from '../../ui/announcements/announcement.service';
import {
  ResponsiveRecordList,
  type RecordColumns,
  type RecordListGroup,
  type UnavailableRecord,
} from '../../ui/components/record-list/responsive-record-list';
import { TextField } from '../../ui/components/text-field/text-field';
import { Layer } from '../../ui/components/layer/layer';
import type { SavedBuild } from '../../ui/components/saved-build-card/saved-build-card';
import { StatusNotice } from '../../ui/components/status/status-notice';
import { NAVIGATION_ROUTES } from '../shared/app-navigation';
import { SaveBuildDialog, type SaveRequest } from './save-build.dialog';

/**
 * One action the committing footer offers on the record that was chosen.
 *
 * The actions left the rows on 2026-08-25 and became shared: the reference
 * draws dense rows and commits from a footer, and four buttons repeated into
 * every row is what made the built version a wall of panels rather than a
 * library (build-library design, "The library is not built to the canvas").
 */
interface RecordAction {
  readonly id: string;
  readonly label: string;
  readonly emphasis: 'primary' | 'secondary' | 'quiet' | 'danger';
}

/** A record awaiting a delete confirmation. */
interface PendingDelete {
  readonly recordId: string;
  readonly title: string;
  readonly hull: string;
  readonly unnamed: boolean;
}

/**
 * Everything this browser is holding for the Commander.
 *
 * A route rather than a menu, so it can be opened directly, appears in
 * history, and is somewhere a screen reader can be told it has arrived at. At
 * wide widths it presents as a layer over the screen that opened it; at narrow
 * widths it is the whole screen. Both are the same address.
 *
 * Every destructive action on this screen is confirmed, names the exact record
 * it will remove, and removes only that one key. Nothing here deletes anything
 * to make room (FR-009, FR-013).
 */
@Component({
  selector: 'edsb-build-library-page',
  imports: [
    ActionButton,
    ChoiceDialog,
    ConfirmDialog,
    Layer,
    RecordManager,
    ResponsiveRecordList,
    SaveBuildDialog,
    StatusNotice,
    TextField,
  ],
  templateUrl: './build-library.page.html',
  styleUrl: './build-library.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildLibraryPage {
  readonly #library = inject(BuildLibraryStore);
  readonly #open = inject(RecordOpenService);
  readonly #named = inject(NamedRecordService);
  readonly #duplication = inject(RecordDuplicationService);
  readonly #conflicts = inject(SaveConflictService);
  readonly #invalidation = inject(RecordInvalidationService);
  readonly #records = inject(LocalRecordRepository);
  readonly #retention = inject(RetentionService);
  readonly #clock = inject(ClockAdapter);
  readonly #announcements = inject(AnnouncementService);
  readonly #active = inject(ActiveBuildStore);
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);
  readonly #gameText = inject(GameTextPresenter);
  readonly #router = inject(Router);

  readonly closeLabel = this.#messages.messageSignal('library.close');
  readonly emptyTitle = this.#messages.messageSignal('library.empty.title');
  readonly emptyDescription = this.#messages.messageSignal('library.empty.description');
  readonly unavailableLabel = this.#messages.messageSignal('library.unavailable.label');
  readonly listLabel = this.#messages.messageSignal('library.title');
  readonly dismissLabel = this.#messages.messageSignal('action.close');
  readonly deleteConfirmLabel = this.#messages.messageSignal('library.delete.confirm');
  readonly deleteCancelLabel = this.#messages.messageSignal('library.delete.cancel');
  readonly conflictTitle = this.#messages.messageSignal('library.conflict.title');
  readonly searchLabel = this.#messages.messageSignal('library.search.label');
  readonly searchDescription = this.#messages.messageSignal('library.search.description');
  readonly nothingChosen = this.#messages.messageSignal('library.chosen.none');

  readonly isEmpty = this.#library.isEmpty;
  readonly status = this.#library.status;

  readonly #search = signal('');
  readonly #chosen = signal<string | null>(null);
  readonly #pendingDelete = signal<PendingDelete | null>(null);
  readonly #saveOpen = signal(false);
  readonly #saveName = signal('');
  readonly #managing = signal(false);
  readonly #failure = signal<string | null>(null);

  readonly search = this.#search.asReadonly();
  readonly pendingDelete = this.#pendingDelete.asReadonly();
  readonly saveOpen = this.#saveOpen.asReadonly();
  readonly managing = this.#managing.asReadonly();
  readonly failure = this.#failure.asReadonly();

  /**
   * The count the header carries: how many are shown, and of how many.
   *
   * The reference draws it beside the search field, so it is the one number
   * that answers "did my search find anything" without a reader having to
   * count rows (canvas 1a, "Header row").
   */
  readonly countText = computed(() => {
    const total = this.#library.total();
    const shown = this.matchCount();
    return shown === total
      ? this.#messages.message('library.count', { count: this.#formatters.integer(total) })
      : this.#messages.message('library.count.matching', {
          count: this.#formatters.integer(shown),
          total: this.#formatters.integer(total),
        });
  });

  /** The reference's column headers, drawn once over the body. */
  readonly columns = computed<RecordColumns>(() => ({
    build: this.#messages.message('library.column.build'),
    hull: this.#messages.message('library.column.hull'),
    modified: this.#messages.message('library.column.modified'),
  }));

  /**
   * How many records the current search leaves listed.
   *
   * Records this version cannot open count too. They are listed, they occupy a
   * row, and a header that said "3 of 4" while four rows were on screen would be
   * counting something a Commander cannot see (FR-010).
   */
  readonly matchCount = computed(
    () =>
      this.groups().reduce((total, group) => total + group.builds.length, 0) +
      this.unavailable().length,
  );

  /** True when there are records but the search matches none of them. */
  readonly noMatch = computed(
    () => !this.#library.isEmpty() && this.matchCount() === 0 && this.#query().length > 0,
  );

  readonly noMatchText = computed(() =>
    this.#messages.message('library.no-match', { query: this.#search().trim() }),
  );

  /** The record the footer's actions act on, when one has been chosen. */
  readonly chosen = computed(() => {
    const chosen = this.#chosen() ?? this.#currentRecordId();
    return chosen !== null && this.#library.find(chosen) !== null ? chosen : null;
  });

  /** What each footer action would do, named for the record it would do it to. */
  readonly chosenActions = computed<readonly RecordAction[]>(() => {
    const record = this.chosen() === null ? null : this.#library.find(this.chosen()!);
    if (record === null) {
      return [];
    }

    const build = record.name ?? this.#derivedTitle(record);
    const unnamed = record.kind === 'working';
    return [
      {
        id: 'delete',
        label: this.#messages.message('library.action.delete', { build }),
        emphasis: 'danger' as const,
      },
      {
        id: unnamed ? 'name' : 'rename',
        label: this.#messages.message(unnamed ? 'library.action.name' : 'library.action.rename', {
          build,
        }),
        emphasis: 'quiet' as const,
      },
      {
        id: 'duplicate',
        label: this.#messages.message('library.action.duplicate', { build }),
        emphasis: 'quiet' as const,
      },
      {
        id: 'open',
        label: this.#messages.message('library.action.open', { build }),
        emphasis: 'primary' as const,
      },
    ];
  });

  readonly storageNotice = computed(() =>
    this.#library.status() === 'unavailable'
      ? this.#messages.message('persistence.unavailable')
      : null,
  );

  readonly groups = computed<readonly RecordListGroup[]>(() => [
    {
      id: 'working',
      label: this.#messages.message('library.group.unnamed'),
      builds: this.#listed(this.#library.working()),
      emptyLabel: this.#messages.message('library.empty.description'),
    },
    {
      id: 'named',
      label: this.#messages.message('library.group.named'),
      builds: this.#listed(this.#library.named()),
      emptyLabel: this.#messages.message('library.empty.description'),
    },
  ]);

  readonly unavailable = computed<readonly UnavailableRecord[]>(() => {
    const query = this.#query();
    return (
      this.#library
        .unavailable()
        .map((entry) => {
          if (entry.available) {
            return { id: 'unknown', explanation: '', detail: null };
          }
          return {
            id: entry.id,
            explanation: this.#messages.message(
              entry.reason === 'unsupported-version'
                ? 'library.unavailable.unsupported'
                : 'library.unavailable.malformed',
            ),
            detail: entry.name ?? entry.hullSymbol,
          };
        })
        // Narrowed over what its own row shows, the same as every other row: a
        // record that cannot be opened is still a record a Commander is looking
        // for by name or by hull.
        .filter((entry) => query.length === 0 || this.#contains(entry.detail, query))
    );
  });

  /** The record the Commander is being asked to keep, replace or duplicate. */
  readonly conflict = this.#conflicts.conflict;

  readonly conflictDescription = computed(() => {
    const conflict = this.#conflicts.conflict();
    return conflict === null
      ? null
      : this.#messages.message('library.conflict.description', {
          name: conflict.observed.name ?? conflict.observed.hullSymbol,
        });
  });

  readonly conflictChoices = computed<readonly DialogChoice[]>(() => {
    const choices: DialogChoice[] = [];

    if (this.#conflicts.canOverwrite) {
      choices.push({
        id: 'overwrite',
        label: this.#messages.message('library.conflict.overwrite'),
        outcome: this.#messages.message('library.conflict.overwrite.outcome'),
      });
    }
    choices.push({
      id: 'keep-both',
      label: this.#messages.message('library.conflict.keep-both'),
      outcome: this.#messages.message('library.conflict.keep-both.outcome'),
    });
    choices.push({
      id: 'cancel',
      label: this.#messages.message('library.conflict.cancel'),
      outcome: this.#messages.message('library.conflict.cancel.outcome'),
      emphasis: 'quiet',
    });

    return choices;
  });

  /** Shown when in-place replacement is impossible in this browser. */
  readonly overwriteUnavailable = computed(() =>
    this.#conflicts.canOverwrite
      ? null
      : this.#messages.message('library.conflict.locks-unavailable'),
  );

  readonly deleteTitle = computed(() => {
    const pending = this.#pendingDelete();
    if (pending === null) {
      return '';
    }
    return this.#messages.message(
      pending.unnamed ? 'library.discard.title' : 'library.delete.title',
      { name: pending.title },
    );
  });

  readonly deleteDescription = computed(() => {
    const pending = this.#pendingDelete();
    if (pending === null) {
      return null;
    }
    return this.#messages.message(
      pending.unnamed ? 'library.discard.description' : 'library.delete.description',
      { hull: pending.hull },
    );
  });

  readonly manageableRecords = computed<readonly ManageableRecord[]>(() =>
    this.#library
      .working()
      .map((entry) =>
        entry.available
          ? {
              id: entry.record.id,
              label: entry.record.name ?? this.#messages.message('library.record.unnamed'),
              detail: `${this.#hullName(entry.record.hullSymbol)} · ${this.#instant(entry.record.modifiedAt)}`,
            }
          : null,
      )
      .filter(present),
  );

  /**
   * Why the Commander is being offered the list to choose from.
   *
   * Only ever a full browser store. The count limit that also raised this was
   * withdrawn on 2026-08-25, and expiry never raises it: expiry is not a way out
   * of a full quota, and offering it as one would suggest the application had
   * removed something to make room (FR-013).
   */
  readonly manageReason = computed(() =>
    this.#active.persistence() === 'quota-full'
      ? this.#messages.message('persistence.quota-full')
      : null,
  );

  readonly #selectedForDiscard = signal<readonly string[]>([]);
  readonly selectedForDiscard = this.#selectedForDiscard.asReadonly();

  readonly saveName = computed(() => this.#saveName());
  readonly duplicateCount = computed(() => this.#library.countByName(this.#saveName()));
  readonly canOverwriteSource = computed(() => this.#active.sourceNamed() !== null);

  constructor() {
    // The count left the command bar on 2026-08-25: the reference draws it in
    // this surface's own header row, beside the search that changes it, and one
    // number in two places is one number that can disagree with itself (T158).
    //
    // The narrowed count is the one thing that changes without a Commander
    // looking at it, so it is the one thing announced — politely, and never on
    // the first run, where it is initial content already in reading order.
    let opened = false;
    effect(() => {
      const shown = this.matchCount();
      if (!opened) {
        opened = true;
        return;
      }
      this.#announcements.announce({
        kind: 'library.match-count',
        revision: shown,
        urgency: 'polite',
        messageKey: 'library.count.matching',
        params: {
          count: this.#formatters.integer(shown),
          total: this.#formatters.integer(this.#library.total()),
        },
      });
    });

    // Any change made by another page invalidates the listing, and the answer
    // is always to re-read storage rather than to patch what is on screen.
    inject(DestroyRef).onDestroy(this.#library.follow());

    effect(() => {
      this.#invalidation.revision();
      this.#library.refresh();
    });
  }

  close(): void {
    void this.#router.navigateByUrl(NAVIGATION_ROUTES.catalogue);
  }

  /** Narrows the list. Changes no record, no order and nothing stored. */
  changeSearch(query: string): void {
    this.#search.set(query);
  }

  /** Chooses the row the footer's actions act on. */
  chooseRecord(recordId: string): void {
    this.#chosen.set(recordId);
    this.#failure.set(null);
  }

  /** Commits one footer action on the record that was chosen. */
  commit(actionId: string): void {
    const recordId = this.chosen();
    if (recordId === null) {
      return;
    }
    void this.selectAction({ recordId, actionId });
  }

  async selectAction({
    recordId,
    actionId,
  }: {
    recordId: string;
    actionId: string;
  }): Promise<void> {
    this.#failure.set(null);
    const record = this.#library.find(recordId);

    switch (actionId) {
      case 'open': {
        const result = await this.#open.open(recordId);
        if (result.kind === 'failed') {
          this.#failure.set(
            this.#messages.message('library.open.failed', { reason: result.reason }),
          );
          return;
        }
        if (result.kind === 'committed') {
          void this.#router.navigateByUrl(NAVIGATION_ROUTES.build);
        }
        return;
      }

      case 'duplicate': {
        if (record === null) {
          return;
        }
        this.#duplication.duplicate(
          recordId,
          record.name ?? this.#messages.message('library.record.unnamed'),
          new Date().toISOString(),
        );
        this.#library.refresh();
        this.#invalidation.announceWrite(recordId, record.revisionId);
        return;
      }

      case 'rename':
      case 'name': {
        this.#saveName.set(record?.name ?? '');
        this.#saveOpen.set(true);
        return;
      }

      case 'delete': {
        if (record === null) {
          return;
        }
        this.#pendingDelete.set({
          recordId,
          title: record.name ?? this.#messages.message('library.record.unnamed'),
          hull: this.#hullName(record.hullSymbol),
          unnamed: record.kind === 'working',
        });
        return;
      }

      default:
        return;
    }
  }

  confirmDelete(): void {
    const pending = this.#pendingDelete();
    if (pending === null) {
      return;
    }

    const removed = this.#records.remove(pending.recordId);
    this.#pendingDelete.set(null);

    if (!removed.ok) {
      this.#failure.set(this.#messages.message('persistence.write-failed'));
      return;
    }

    // If that was the record this page is autosaving into, the workspace goes
    // back to holding no build. The library stays open on the rest of the list:
    // the current-record marker simply has nowhere to sit (FR-009).
    this.#active.clearIfHolding(pending.recordId);

    this.#invalidation.announceDelete(pending.recordId);
    this.#library.refresh();
  }

  cancelDelete(): void {
    this.#pendingDelete.set(null);
  }

  changeSaveName(name: string): void {
    this.#saveName.set(name);
  }

  async requestSave({ name, overwrite }: SaveRequest): Promise<void> {
    const snapshot = this.#active.snapshot();
    const validation = this.#active.validation();
    if (snapshot === null || validation === null) {
      this.#saveOpen.set(false);
      return;
    }

    const now = new Date().toISOString();
    const source = this.#active.sourceNamed();
    // The unnamed record these edits have been autosaved into, if any. Saving
    // consumes it: replacing a saved build removes it once that write has
    // succeeded, and naming the build promotes it in place (FR-008).
    const held = this.#active.autosaveRecordId();

    const result =
      overwrite && source !== null
        ? await this.#conflicts.save(
            {
              recordId: source.recordId,
              expectedRevisionId: source.baseRevisionId,
              name,
              note: null,
              build: snapshot,
              validation,
              now,
            },
            held,
          )
        : held !== null
          ? await this.#named.nameHeldRecord({
              recordId: held,
              name,
              note: null,
              build: snapshot,
              validation,
              now,
            })
          : await this.#named.createNamed({
              name,
              note: null,
              build: snapshot,
              validation,
              now,
            });

    this.#saveOpen.set(false);

    if (result.kind === 'saved') {
      this.#adoptSavedRecord(result.record.id, result.record.revisionId, held);
    }

    this.#library.refresh();
  }

  /**
   * Takes up the named record a save produced, and lets go of the unnamed one.
   *
   * Letting go is the part that matters. The page now holds a named record, and
   * autosave has no path to one — so the id it was writing to is cleared and the
   * next modelled edit forks a fresh unnamed record, rather than autosave
   * silently going idle against a record it is no longer allowed to touch
   * (FR-008, persistence contract, "Autosaved records").
   */
  #adoptSavedRecord(recordId: string, revisionId: string, held: string | null): void {
    this.#active.markSaved({ recordId, baseRevisionId: revisionId });
    this.#active.setAutosaveRecordId(null);
    this.#invalidation.announceWrite(recordId, revisionId);

    if (held !== null && held !== recordId) {
      // Consumed, not deleted by anyone: other pages listing it need to stop
      // showing it, and the page that had it open is this one.
      this.#invalidation.announceDelete(held);
    }
  }

  dismissSave(): void {
    this.#saveOpen.set(false);
  }

  async resolveConflict(choice: string): Promise<void> {
    const held = this.#active.autosaveRecordId();
    const result = await this.#conflicts.resolve(choice as ConflictChoice);

    if (result?.kind === 'saved') {
      this.#adoptSavedRecord(result.record.id, result.record.revisionId, held);
    }
    this.#library.refresh();
  }

  dismissConflict(): void {
    this.#conflicts.clear();
  }

  openManager(): void {
    this.#managing.set(true);
  }

  changeDiscardSelection(ids: readonly string[]): void {
    this.#selectedForDiscard.set(ids);
  }

  /** Removes exactly the records the Commander selected, and nothing else. */
  discardSelected(ids: readonly string[]): void {
    for (const id of ids) {
      const removed = this.#records.remove(id);
      if (removed.ok) {
        // Selected deliberately, one by one, so the same rule applies as to a
        // single confirmed deletion.
        this.#active.clearIfHolding(id);
        this.#invalidation.announceDelete(id);
      }
    }
    this.#selectedForDiscard.set([]);
    this.#managing.set(false);
    this.#library.refresh();
  }

  #toSavedBuild(entry: StoredRecordEntry): SavedBuild | null {
    if (!entry.available) {
      return null;
    }
    const record = entry.record;
    const title = record.name ?? this.#derivedTitle(record);

    return {
      id: record.id,
      title,
      named: record.name !== null,
      hull: this.#gameText.shipName(record.hullSymbol),
      modified: this.#instant(record.modifiedAt),
      validation: this.#validationOf(record.validation),
      issues: this.#issuesOf(record.validation),
      remaining: this.#remainingLife(record),
      current: record.id === this.#currentRecordId(),
      currentLabel: this.#messages.message('library.record.current'),
      chooseLabel: this.#messages.message('library.record.choose', { build: title }),
      note: this.#noteFor(record),
    };
  }

  /**
   * What the workspace is holding, as a record identity.
   *
   * Its own unnamed record where it has forked one; the named record it was
   * opened from where it has not. Both are "the build I am in", which is the
   * first question a Commander opening this list has (FR-010).
   */
  #currentRecordId(): string | null {
    return this.#active.autosaveRecordId() ?? this.#active.sourceNamed()?.recordId ?? null;
  }

  /**
   * A title for a record nobody has named.
   *
   * The build's own ship name, else its ident, else the hull — read from the
   * build each time the row is drawn and never written onto the record, so it
   * follows the build rather than becoming a stale name of its own. Set apart
   * from a Commander's name by the row rather than passed off as one (FR-010,
   * clarification 2026-08-25).
   */
  #derivedTitle(record: LocalRecordV1): string {
    const build = record.build;
    return (
      build.shipName?.trim() ||
      build.shipIdent?.trim() ||
      this.#hullName(record.hullSymbol) ||
      this.#messages.message('library.record.unnamed')
    );
  }

  /**
   * How long this record has left, in the reader's own words.
   *
   * Only an unnamed one has a deadline, and stating it on the row is the whole
   * of the notice: nothing announces the removal afterwards, because a message
   * about a build already gone offers nothing to act on (FR-010, FR-013).
   */
  #remainingLife(record: LocalRecordV1): string | null {
    const deadline = this.#retention.expiresAt(record);
    return deadline === null
      ? null
      : this.#messages.message('library.record.expires', {
          when: this.#formatters.relativeTime(deadline, this.#clock.now()),
        });
  }

  /**
   * The issue count the reference draws on its warm plate, with its own words.
   *
   * A count, not a colour, and never a count of nothing: a valid and complete
   * build carries no badge at all (FR-010).
   */
  #issuesOf(validation: { valid: boolean; complete: boolean }): SavedBuild['issues'] {
    const issues = (validation.valid ? 0 : 1) + (validation.complete ? 0 : 1);
    if (issues === 0) {
      return null;
    }
    const count = this.#formatters.integer(issues);
    return { count, label: this.#messages.message('library.record.issues', { count }) };
  }

  /** The rows one group contributes, narrowed by whatever is being searched for. */
  #listed(entries: readonly StoredRecordEntry[]): readonly SavedBuild[] {
    const query = this.#query();
    return entries
      .map((entry) => this.#toSavedBuild(entry))
      .filter(present)
      .filter((build) => query.length === 0 || this.#matches(build, query));
  }

  /** The search text, normalized once so every row is compared the same way. */
  #query(): string {
    return this.#search().trim().toLocaleLowerCase(this.#formatters.locale);
  }

  /**
   * Whether a row matches what is being searched for.
   *
   * Over the fields the row itself shows — its title, its one line of note and
   * its hull — because a search that matched something invisible would be a
   * list a Commander could not explain (build-library design, "Searched").
   */
  #matches(build: SavedBuild, query: string): boolean {
    return [build.title, build.note, build.hull.text].some((part) =>
      this.#contains(part ?? null, query),
    );
  }

  /** Whether one field a row shows contains what is being searched for. */
  #contains(value: string | null, query: string): boolean {
    return value !== null && value.toLocaleLowerCase(this.#formatters.locale).includes(query);
  }

  /**
   * The line beneath a row's name.
   *
   * A Commander's own note where they wrote one. Failing that, and only for an
   * unnamed record forked from a save, the save it came from: "unsaved edits to
   * X" is what that record is, and a row that did not say so would look like a
   * second copy of X (FR-010, T155).
   */
  #noteFor(record: LocalRecordV1): string | null {
    if (record.note !== null) {
      return record.note;
    }
    if (record.kind !== 'working' || record.sourceNamed === null) {
      return null;
    }

    const source = this.#records.read(record.sourceNamed.recordId);
    const name = source.ok && source.value.available ? source.value.record.name : null;
    return name === null ? null : this.#messages.message('library.record.forked-from', { name });
  }

  #validationOf(validation: { valid: boolean; complete: boolean }): SavedBuild['validation'] {
    if (!validation.valid) {
      return { label: this.#messages.message('library.record.invalid'), tone: 'error' };
    }
    if (!validation.complete) {
      return { label: this.#messages.message('library.record.incomplete'), tone: 'warning' };
    }
    return { label: this.#messages.message('library.record.valid'), tone: 'success' };
  }

  #instant(iso: string): string {
    return this.#formatters.dateTime(new Date(iso));
  }

  #hullName(symbol: string): string {
    return this.#gameText.shipName(symbol).text ?? symbol;
  }
}

/** Narrows away the entries a listing could not present. */
function present<T>(value: T | null): value is T {
  return value !== null;
}
