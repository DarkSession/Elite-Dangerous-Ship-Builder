import { Injectable, computed, inject } from '@angular/core';
import { CATALOGUE_MOUNTS } from '../../domain/equipment/loadout/loadout-mounts';
import type { JournalFile } from '../../domain/journal/journal-scan';
import { Formatters } from '../../i18n/formatters/formatters';
import { GameTextPresenter } from '../../i18n/game-text.presenter';
import { MessageService } from '../../i18n/message.service';
import type { MessageKey } from '../../i18n/locale-registry';
import { AnnouncementService } from '../../ui/announcements/announcement.service';
import type {
  JournalFailureView,
  JournalImportView,
  JournalPickView,
} from '../journal/journal-import.view';
import {
  LoadoutImportCoordinator,
  type LoadoutImportSubmission,
} from './loadout-import.coordinator';
import { LoadoutImportStore, type LoadoutImportFailure } from './loadout-import.store';

/**
 * The one place the bench's import becomes words.
 *
 * It fills the same view the Ship Builder's import fills, because both canvases
 * draw one panel. What differs is every word in it: a loadout is not a build,
 * and a suit is not a hull.
 */
@Injectable({ providedIn: 'root' })
export class LoadoutImportPresenter {
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);
  readonly #gameText = inject(GameTextPresenter);
  readonly #store = inject(LoadoutImportStore);
  readonly #import = inject(LoadoutImportCoordinator);
  readonly #announcements = inject(AnnouncementService);

  readonly open = this.#store.open;

  readonly view = computed<JournalImportView>(() => {
    const picks = this.#picks();
    const chosen = this.#store.selectedKeys().length;
    const scanning = this.#store.scanning();
    const working = this.#store.working();
    const scanned = this.#store.entries().length > 0;
    const failure = this.#store.failure();

    return {
      title: this.#messages.message('equipment.import.title'),
      description: this.#messages.message('equipment.import.description'),
      accepted: this.#messages.message('equipment.import.accepted'),
      fieldLabel: this.#messages.message('equipment.import.field.label'),
      draft: this.#store.draft(),
      status: this.#status(),
      busy: scanning || working,
      failure: failure === null ? null : this.#failureView(failure),
      submitLabel:
        chosen > 1
          ? this.#messages.message('equipment.import.action.submit.several', {
              count: this.#formatters.integer(chosen),
            })
          : this.#messages.message('equipment.import.action.submit'),
      cancelLabel: this.#messages.message('action.cancel'),
      canSubmit:
        !scanning && !working && (scanned ? chosen > 0 : this.#store.draft().trim().length > 0),
      dropLabel: this.#messages.message('equipment.import.drop.label'),
      scanned: this.#scanned(),
      scanning,
      dividerLabel: this.#messages.message('equipment.import.divider'),
      picks,
      picksLabel:
        picks.length === 0
          ? null
          : this.#messages.message('equipment.import.picks.label', {
              found: this.#formatters.integer(picks.length),
              chosen: this.#formatters.integer(chosen),
            }),
    };
  });

  /** What the saved records layer says when a batch import opened it. */
  readonly importNotice = computed(() => {
    const outcome = this.#store.batchOutcome();
    if (outcome === null || outcome.stored === 0) {
      return null;
    }
    return outcome.stored === 1
      ? this.#messages.message('library.imported.notice.one')
      : this.#messages.message('library.imported.notice.many', {
          count: this.#formatters.integer(outcome.stored),
        });
  });

  // ---- intents -----------------------------------------------------------

  openLayer(): void {
    this.#store.openLayer();
  }

  closeLayer(): void {
    this.#store.clear();
    this.#store.closeLayer();
  }

  edit(text: string): void {
    this.#store.setDraft(text);
  }

  choosePicks(keys: readonly string[]): void {
    this.#store.setSelection(keys);
  }

  /** Reads the journal files a Commander chose, saying so as it starts and as it ends. */
  async scanFiles(files: readonly JournalFile[]): Promise<void> {
    this.#announcements.announce({
      kind: 'equipment.import.scan',
      revision: this.#store.requestToken,
      urgency: 'polite',
      messageKey: 'equipment.import.announce.scanning',
    });
    await this.#import.scanFiles(files);
    this.#announceScan();
  }

  /**
   * Says how a scan ended, not only that one started (016/FR-004, FR-006).
   *
   * The revision is the store's own token, which only ever rises. A count would
   * not: `AnnouncementService` drops any request whose revision is below the
   * highest it has published for that kind, so announcing the second of two
   * scans at a lower number would silence it for the rest of the session.
   */
  #announceScan(): void {
    const found = this.#store.entries().length;
    this.#announcements.announce({
      kind: 'equipment.import.scan',
      revision: this.#store.requestToken,
      urgency: 'polite',
      messageKey:
        found === 0
          ? 'equipment.import.announce.scanned.none'
          : found === 1
            ? 'equipment.import.announce.scanned.one'
            : 'equipment.import.announce.scanned.many',
      params: { count: this.#formatters.integer(found) },
    });
  }

  async submit(): Promise<LoadoutImportSubmission> {
    const submission = await this.#import.submit();

    if (submission.kind === 'opened') {
      this.#announce('equipment.import.announce.opened');
    } else if (submission.kind === 'stored') {
      this.#announce(
        submission.stored === 1
          ? 'equipment.import.announce.stored.one'
          : 'equipment.import.announce.stored.many',
        { count: this.#formatters.integer(submission.stored) },
      );
    } else if (submission.kind === 'failed') {
      this.#announce('equipment.import.announce.failed');
    }

    return submission;
  }

  #announce(messageKey: MessageKey, params: Record<string, string> = {}): void {
    this.#announcements.announce({
      kind: 'equipment.import',
      // The store's monotonic token, never a measurement of the draft: a
      // revision that can fall is a mute switch for every later announcement of
      // this kind.
      revision: this.#store.requestToken,
      urgency: 'polite',
      messageKey,
      params,
    });
  }

  // ---- wording -----------------------------------------------------------

  #status(): string {
    const reading = this.#store.scanningFiles();
    if (reading > 0) {
      return reading === 1
        ? this.#messages.message('equipment.import.status.scanning.one')
        : this.#messages.message('equipment.import.status.scanning.many', {
            files: this.#formatters.integer(reading),
          });
    }
    if (this.#store.working()) {
      return this.#messages.message('equipment.import.status.working');
    }
    // A file the bound refused while the rest were read (016/FR-002, FR-004).
    const [refused] = this.#store.report()?.refused ?? [];
    return refused === undefined
      ? ''
      : this.#messages.message('equipment.import.failure.fileTooLarge', {
          file: refused.fileName,
          limit: this.#formatters.bytes(refused.limitBytes),
        });
  }

  #scanned(): string | null {
    const report = this.#store.report();
    if (report === null) {
      return null;
    }
    const loadouts =
      report.eventCount === 1
        ? this.#messages.message('equipment.import.scanned.loadouts.one')
        : this.#messages.message('equipment.import.scanned.loadouts.many', {
            count: this.#formatters.integer(report.eventCount),
          });
    const source =
      report.fileName ??
      this.#messages.message('equipment.import.scanned.files', {
        files: this.#formatters.integer(report.fileCount),
      });
    return this.#messages.message('equipment.import.scanned', { source, loadouts });
  }

  /**
   * The rows the list draws.
   *
   * The suit's name is the package's, resolved here where the locale is known.
   * The grade is the loadout's own, and the two counts are what the row tells
   * two loadouts of one suit apart by.
   */
  #picks(): readonly JournalPickView[] {
    const entries = this.#store.entries();
    if (entries.length < 2) {
      return [];
    }
    const chosen = this.#store.selectedKeys();

    return entries.map((entry) => {
      const value = entry.value;
      const family = value.loadout.suitFamily;
      const suit = this.#gameText.suitName(family).text ?? family;
      return {
        key: entry.key,
        title: value.name ?? suit,
        detail: this.#messages.message('equipment.import.pick.detail', {
          suit,
          grade: this.#formatters.integer(value.loadout.suitGrade),
          items: this.#formatters.integer(value.weaponCount),
          modifications: this.#formatters.integer(value.modificationCount),
        }),
        meta: entry.timestamp === '' ? '' : this.#stamp(entry.timestamp),
        selected: chosen.includes(entry.key),
      };
    });
  }

  #stamp(timestamp: string): string {
    const instant = new Date(timestamp);
    return Number.isNaN(instant.getTime()) ? timestamp : this.#formatters.dateTime(instant);
  }

  #failureView(failure: LoadoutImportFailure): JournalFailureView {
    return {
      message: this.#failureMessage(failure),
      diagnostics: [],
      diagnosticsLabel: this.#messages.message('slef.diagnostic.title'),
      refusals: this.#refusals(failure),
      advancedLabel: this.#messages.message('slef.import.advanced'),
    };
  }

  #failureMessage(failure: LoadoutImportFailure): string {
    switch (failure.kind) {
      case 'unknownSuit':
        return this.#messages.message('equipment.import.failure.unknownSuit', {
          suit: failure.sourceSuit,
        });
      case 'fileTooLarge':
        return this.#messages.message('equipment.import.failure.fileTooLarge', {
          file: failure.fileName,
          limit: this.#formatters.bytes(failure.limitBytes),
        });
      case 'noEvents':
        return this.#messages.message('equipment.import.failure.noEvents', {
          files: failure.fileNames.join(', '),
        });
      case 'partial': {
        const count = failure.outcomes.length + failure.heldBack.length;
        return count === 1
          ? this.#messages.message('equipment.import.outcome.one')
          : this.#messages.message('equipment.import.outcome.many', {
              count: this.#formatters.integer(count),
            });
      }
      default:
        return this.#messages.message(`equipment.import.failure.${failure.kind}` as MessageKey);
    }
  }

  /** One line per entry the package left out, in the identities it named. */
  #refusals(failure: LoadoutImportFailure): readonly string[] {
    if (failure.kind !== 'partial') {
      return [];
    }

    const lines = failure.outcomes.map((outcome) =>
      this.#messages.message('equipment.import.outcome.line', {
        where: this.#where(outcome.mount),
        symbol: outcome.sourceSymbol,
        reason: this.#messages.message(`equipment.import.outcome.${outcome.action}` as MessageKey),
      }),
    );

    return [
      ...lines,
      ...failure.heldBack.map((symbol) =>
        this.#messages.message('equipment.import.outcome.line', {
          where: this.#messages.message('equipment.import.outcome.suit'),
          symbol,
          reason: this.#messages.message('equipment.import.outcome.heldBack'),
        }),
      ),
    ];
  }

  /**
   * Where an entry the package refused sat.
   *
   * The mount's published name where it resolves, the event's own spelling
   * where it does not — an unknown mount has no name to present — and the suit
   * itself where the entry named no mount at all.
   */
  #where(mount: string | null): string {
    if (mount === null) {
      return this.#messages.message('equipment.import.outcome.suit');
    }
    const known = CATALOGUE_MOUNTS.find(
      (candidate) => candidate.key.toLowerCase() === mount.trim().toLowerCase(),
    );
    return known === undefined
      ? mount
      : (this.#gameText.personalMountName(known).text ?? known.key);
  }
}
