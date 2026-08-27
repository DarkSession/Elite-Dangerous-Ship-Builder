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
import { RecordInvalidationService } from '../../application/build-library/record-invalidation.service';
import { RecordOpenService } from '../../application/build-library/record-open.service';
import { RetentionService } from '../../application/build-library/retention.service';
import { ClockAdapter } from '../../platform/browser/clock.adapter';
import { LocalRecordRepository } from '../../platform/storage/local-record.repository';
import { Formatters } from '../../i18n/formatters/formatters';
import { GameTextPresenter } from '../../i18n/game-text.presenter';
import { MessageService } from '../../i18n/message.service';
import { ActionButton } from '../../ui/components/action/action-button';
import { ConfirmDialog } from '../../ui/components/confirm-dialog/confirm-dialog';
import {
  RecordManager,
  type ManageableRecord,
} from '../../ui/components/record-manager/record-manager';
import { AnnouncementService } from '../../ui/announcements/announcement.service';
import {
  ResponsiveRecordList,
  type RecordColumns,
  type UnavailableRecord,
} from '../../ui/components/record-list/responsive-record-list';
import { TextField } from '../../ui/components/text-field/text-field';
import { Layer } from '../../ui/components/layer/layer';
import type { SavedBuild } from '../../ui/components/saved-build-card/saved-build-card';
import { StatusNotice } from '../../ui/components/status/status-notice';
import { NAVIGATION_ROUTES } from '../shared/app-navigation';

/**
 * One action the committing footer offers on the record that was chosen.
 *
 * The actions left the rows on 2026-08-25 and became shared: the reference
 * draws dense rows and commits from a footer, and a stack of buttons repeated
 * into every row is what made the built version a wall of panels rather than a
 * library (build-library design, "The library is not built to the canvas").
 * Two of them are left since 2026-08-27 — delete, and open in outfitting —
 * because naming, renaming and duplicating are the workspace's own `SAVE`
 * (FR-009, ruled 2026-08-27).
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
    ConfirmDialog,
    Layer,
    RecordManager,
    ResponsiveRecordList,
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
  readonly searchLabel = this.#messages.messageSignal('library.search.label');
  readonly searchDescription = this.#messages.messageSignal('library.search.description');
  readonly nothingChosen = this.#messages.messageSignal('library.chosen.none');

  readonly isEmpty = this.#library.isEmpty;
  readonly status = this.#library.status;

  readonly #search = signal('');
  readonly #chosen = signal<string | null>(null);
  readonly #pendingDelete = signal<PendingDelete | null>(null);
  readonly #managing = signal(false);
  readonly #failure = signal<string | null>(null);

  readonly search = this.#search.asReadonly();
  readonly pendingDelete = this.#pendingDelete.asReadonly();
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
  readonly matchCount = computed(() => this.builds().length + this.unavailable().length);

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

  /**
   * What each footer action would do, named for the record it would do it to.
   *
   * The canvas's two, and nothing else. Naming, renaming and saving a copy were
   * here until 2026-08-27 and are the workspace's own `SAVE` now: a library
   * answers "which of these builds", and what should become of one is asked
   * where a Commander is working in it. Nothing they could do is gone — a
   * record is renamed by opening it and saving it over the save it came from,
   * and copied by opening it and saving it as a new build (FR-009).
   */
  readonly chosenActions = computed<readonly RecordAction[]>(() => {
    const record = this.chosen() === null ? null : this.#library.find(this.chosen()!);
    if (record === null) {
      return [];
    }

    const build = record.name ?? this.#derivedTitle(record);
    return [
      {
        id: 'delete',
        label: this.#messages.message('library.action.delete', { build }),
        emphasis: 'danger' as const,
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

  /**
   * Every readable record the search leaves listed, newest first.
   *
   * One list. `Unnamed builds` and `Named builds` were two headings saying what
   * each row beneath them already says in its own title, and they split one
   * order into two — so the build edited most recently was not reliably the row
   * at the top (FR-010, clarification 2026-08-27).
   */
  readonly builds = computed<readonly SavedBuild[]>(() => this.#listed(this.#library.records()));

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

  /**
   * Dismisses the library, returning to the screen it was opened over.
   *
   * The canvas draws this surface as a layer over an inert originating screen,
   * and a layer that is dismissed puts a Commander back where they were. It
   * used to send everyone to the shipyard, which took a Commander who glanced
   * at their saved builds out of the build they were working in — a screen they
   * had chosen nothing to leave (Commander request 2026-08-27).
   *
   * The browser's own back does this already; this is the same journey under
   * the dismiss the canvas draws.
   */
  close(): void {
    void this.#router.navigateByUrl(this.#origin());
  }

  /**
   * Where dismissing goes.
   *
   * The address this navigation came from, whatever it was. A library reached
   * by its own address has no such screen behind it: then the build in hand is
   * the honest destination, and the shipyard where there is no build — which
   * is also where a Commander goes when the build they came from is the one
   * they have just deleted.
   *
   * Without its fragment. The router records an address as it was when it
   * navigated, and the workspace's link is written over it with `replaceState`
   * afterwards — so a remembered fragment is the build as it stood before the
   * edits that followed. The workspace publishes its own the moment it is back
   * (FR-020).
   */
  #origin(): string {
    const hasBuild = this.#active.loadout() !== null;
    const fallback = hasBuild ? NAVIGATION_ROUTES.build : NAVIGATION_ROUTES.catalogue;
    const previous = this.#router.lastSuccessfulNavigation()?.previousNavigation?.finalUrl;
    if (previous === undefined) {
      return fallback;
    }

    const url = this.#router.serializeUrl(previous).split('#')[0] ?? '';
    if (url === '' || url.startsWith(NAVIGATION_ROUTES.library)) {
      return fallback;
    }
    return url.startsWith(NAVIGATION_ROUTES.build) && !hasBuild ? fallback : url;
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
      modified: this.#howLongAgo(record.modifiedAt),
      modifiedExact: this.#messages.message('library.record.modified.exact', {
        instant: this.#instant(record.modifiedAt),
      }),
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

  /** The rows the library draws, narrowed by whatever is being searched for. */
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

  /**
   * How long ago the record was last edited, in the reader's own words.
   *
   * What the column is read for. `19 Aug 2026, 14:32` makes a reader do the
   * arithmetic on every row to find the build they were last in; `3 weeks ago`
   * is the answer, and the canvas draws exactly that (FR-010, clarification
   * 2026-08-27). The instant itself is kept beside it, unread by the eye and
   * available to a reader who needs it exactly.
   */
  #howLongAgo(iso: string): string {
    return this.#formatters.relativeTime(new Date(iso), this.#clock.now());
  }

  #hullName(symbol: string): string {
    return this.#gameText.shipName(symbol).text ?? symbol;
  }
}

/** Narrows away the entries a listing could not present. */
function present<T>(value: T | null): value is T {
  return value !== null;
}
