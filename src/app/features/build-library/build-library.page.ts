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
import type { StoredRecordEntry } from '../../domain/build/stored-build';
import { ActiveBuildStore } from '../../application/active-build/active-build.store';
import { BuildLibraryStore } from '../../application/build-library/build-library.store';
import { NamedRecordService } from '../../application/build-library/named-record.service';
import { RecordDuplicationService } from '../../application/build-library/record-duplication.service';
import { RecordInvalidationService } from '../../application/build-library/record-invalidation.service';
import { RecordOpenService } from '../../application/build-library/record-open.service';
import {
  RetentionService,
  WORKING_RECORD_LIMIT,
} from '../../application/build-library/retention.service';
import {
  SaveConflictService,
  type ConflictChoice,
} from '../../application/build-library/save-conflict.service';
import { LocalRecordRepository } from '../../platform/storage/local-record.repository';
import { Formatters } from '../../i18n/formatters/formatters';
import { GameTextPresenter } from '../../i18n/game-text.presenter';
import { MessageService } from '../../i18n/message.service';
import { ScreenChrome } from '../shared/screen-chrome';
import { ActionButton } from '../../ui/components/action/action-button';
import { ChoiceDialog, type DialogChoice } from '../../ui/components/choice-dialog/choice-dialog';
import { ConfirmDialog } from '../../ui/components/confirm-dialog/confirm-dialog';
import {
  RecordManager,
  type ManageableRecord,
} from '../../ui/components/record-manager/record-manager';
import {
  ResponsiveRecordList,
  type RecordListGroup,
  type UnavailableRecord,
} from '../../ui/components/record-list/responsive-record-list';
import type { SavedBuild } from '../../ui/components/saved-build-card/saved-build-card';
import { StatusNotice } from '../../ui/components/status/status-notice';
import { NAVIGATION_ROUTES } from '../shared/app-navigation';
import { SaveBuildDialog, type SaveRequest } from './save-build.dialog';

/** A record awaiting a delete confirmation. */
interface PendingDelete {
  readonly recordId: string;
  readonly title: string;
  readonly hull: string;
  readonly working: boolean;
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
    RecordManager,
    ResponsiveRecordList,
    SaveBuildDialog,
    StatusNotice,
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
  readonly #retention = inject(RetentionService);
  readonly #records = inject(LocalRecordRepository);
  readonly #active = inject(ActiveBuildStore);
  readonly #messages = inject(MessageService);
  readonly #chrome = inject(ScreenChrome);
  readonly #formatters = inject(Formatters);
  readonly #gameText = inject(GameTextPresenter);
  readonly #router = inject(Router);

  readonly description = this.#messages.messageSignal('library.description');
  readonly closeLabel = this.#messages.messageSignal('library.close');
  readonly emptyTitle = this.#messages.messageSignal('library.empty.title');
  readonly emptyDescription = this.#messages.messageSignal('library.empty.description');
  readonly unavailableLabel = this.#messages.messageSignal('library.unavailable.label');
  readonly listLabel = this.#messages.messageSignal('library.title');
  readonly dismissLabel = this.#messages.messageSignal('action.close');
  readonly deleteConfirmLabel = this.#messages.messageSignal('library.delete.confirm');
  readonly deleteCancelLabel = this.#messages.messageSignal('library.delete.cancel');
  readonly conflictTitle = this.#messages.messageSignal('library.conflict.title');

  readonly isEmpty = this.#library.isEmpty;
  readonly status = this.#library.status;

  readonly #pendingDelete = signal<PendingDelete | null>(null);
  readonly #saveOpen = signal(false);
  readonly #saveName = signal('');
  readonly #managing = signal(false);
  readonly #failure = signal<string | null>(null);

  readonly pendingDelete = this.#pendingDelete.asReadonly();
  readonly saveOpen = this.#saveOpen.asReadonly();
  readonly managing = this.#managing.asReadonly();
  readonly failure = this.#failure.asReadonly();

  readonly countText = computed(() =>
    this.#messages.message('library.count', {
      count: this.#formatters.integer(this.#library.total()),
    }),
  );

  readonly storageNotice = computed(() =>
    this.#library.status() === 'unavailable'
      ? this.#messages.message('persistence.unavailable')
      : null,
  );

  readonly groups = computed<readonly RecordListGroup[]>(() => [
    {
      id: 'working',
      label: this.#messages.message('library.group.working'),
      builds: this.#library
        .working()
        .map((entry) => this.#toSavedBuild(entry))
        .filter(present),
      emptyLabel: this.#messages.message('library.empty.description'),
    },
    {
      id: 'named',
      label: this.#messages.message('library.group.named'),
      builds: this.#library
        .named()
        .map((entry) => this.#toSavedBuild(entry))
        .filter(present),
      emptyLabel: this.#messages.message('library.empty.description'),
    },
  ]);

  readonly unavailable = computed<readonly UnavailableRecord[]>(() =>
    this.#library.unavailable().map((entry) => {
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
    }),
  );

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
      pending.working ? 'library.discard.title' : 'library.delete.title',
      { name: pending.title },
    );
  });

  readonly deleteDescription = computed(() => {
    const pending = this.#pendingDelete();
    if (pending === null) {
      return null;
    }
    return this.#messages.message(
      pending.working ? 'library.discard.description' : 'library.delete.description',
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
              label: entry.record.name ?? this.#messages.message('library.record.working'),
              detail: `${this.#hullName(entry.record.hullSymbol)} · ${this.#instant(entry.record.modifiedAt)}`,
            }
          : null,
      )
      .filter(present),
  );

  readonly manageReason = computed(() =>
    this.#active.persistence() === 'quota-full'
      ? this.#messages.message('persistence.quota-full')
      : this.#retention.workingCount() >= WORKING_RECORD_LIMIT
        ? this.#messages.message('persistence.retention-limit', {
            limit: this.#formatters.integer(WORKING_RECORD_LIMIT),
          })
        : null,
  );

  readonly #selectedForDiscard = signal<readonly string[]>([]);
  readonly selectedForDiscard = this.#selectedForDiscard.asReadonly();

  readonly saveName = computed(() => this.#saveName());
  readonly duplicateCount = computed(() => this.#library.countByName(this.#saveName()));
  readonly canOverwriteSource = computed(() => this.#active.sourceNamed() !== null);

  constructor() {
    // The command bar carries this screen's count, as it does the shipyard's.
    effect((onCleanup) => {
      this.#chrome.setCount(this.countText());
      onCleanup(() => this.#chrome.setCount(null));
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
          record.name ?? this.#messages.message('library.record.working'),
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
          title: record.name ?? this.#messages.message('library.record.working'),
          hull: this.#hullName(record.hullSymbol),
          working: record.kind === 'working',
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

    const result =
      overwrite && source !== null
        ? await this.#conflicts.save({
            recordId: source.recordId,
            expectedRevisionId: source.baseRevisionId,
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
      this.#active.markSaved({
        recordId: result.record.id,
        baseRevisionId: result.record.revisionId,
      });
      this.#invalidation.announceWrite(result.record.id, result.record.revisionId);
    }

    this.#library.refresh();
  }

  dismissSave(): void {
    this.#saveOpen.set(false);
  }

  async resolveConflict(choice: string): Promise<void> {
    const result = await this.#conflicts.resolve(choice as ConflictChoice);

    if (result?.kind === 'saved') {
      this.#active.markSaved({
        recordId: result.record.id,
        baseRevisionId: result.record.revisionId,
      });
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
    const working = record.kind === 'working';
    const label = record.name ?? this.#messages.message('library.record.working');

    return {
      id: record.id,
      name: record.name,
      hull: this.#gameText.shipName(record.hullSymbol),
      modified: this.#instant(record.modifiedAt),
      validation: this.#validationOf(record.validation),
      note: record.note,
      actions: [
        {
          id: 'open',
          label: this.#messages.message('library.action.open', { build: label }),
          emphasis: 'secondary' as const,
        },
        {
          id: working ? 'name' : 'rename',
          label: this.#messages.message(working ? 'library.action.name' : 'library.action.rename', {
            build: label,
          }),
        },
        {
          id: 'duplicate',
          label: this.#messages.message('library.action.duplicate', { build: label }),
        },
        {
          id: 'delete',
          label: this.#messages.message('library.action.delete', { build: label }),
          emphasis: 'danger' as const,
        },
      ],
    };
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
