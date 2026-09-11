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
      urgency: 'polite',
      messageKey: 'equipment.import.announce.scanning',
    });

    // Only the scan a Commander is still waiting for says how it ended. A scan
    // replaced by a newer one is a question nobody is asking (011/FR-009).
    if (!(await this.#import.scanFiles(files))) {
      return;
    }
    this.#announceScan();
  }

  /** Says how a scan ended, not only that one started (016/FR-004, FR-006). */
  #announceScan(): void {
    // A scan that settled on a refusal says what refused it, in the sentence
    // the panel states it in, rather than reporting the empty list the refusal
    // left behind. See the twin in `slef.presenter.ts`
    // (constitution IV, 016/FR-004).
    const failure = this.#store.failure();
    if (failure !== null) {
      this.#announcements.announce({
        kind: 'equipment.import.scan',
        urgency: 'polite',
        messageKey: 'equipment.import.announce.scanFailed',
        params: { reason: this.#failureMessage(failure) },
      });
      return;
    }

    // The same as the ship tool's: a scan that came back with nothing came back
    // with a refusal, which the branch above answered.
    const found = this.#store.entries().length;
    this.#announcements.announce({
      kind: 'equipment.import.scan',
      urgency: 'polite',
      messageKey:
        found === 1
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
      this.#announceBatch(submission.stored, submission.refused.length);
    } else if (submission.kind === 'failed') {
      this.#announce('equipment.import.announce.failed');
    }

    return submission;
  }

  /**
   * What a batch of several loadouts did, in one sentence.
   *
   * One sentence and not two, because the polite outlet holds one event: a
   * second announcement published in the same tick writes over the first, and
   * the reader hears only what was said last. A batch that stored some
   * loadouts and refused others reports two outcomes, and both are owed
   * (011/FR-009, "One request reports two outcomes").
   *
   * Both counts, and never a count and a word standing in for the other one. A
   * batch where every chosen loadout was refused must not say the rest were
   * saved — nothing was.
   */
  #announceBatch(stored: number, refused: number): void {
    const saved: { messageKey: MessageKey; params: Record<string, string> } = {
      messageKey:
        stored === 1
          ? 'equipment.import.announce.stored.one'
          : 'equipment.import.announce.stored.many',
      params: { count: this.#formatters.integer(stored) },
    };
    const notSaved: { messageKey: MessageKey; params: Record<string, string> } = {
      messageKey:
        refused === 1
          ? 'equipment.import.announce.notSaved.one'
          : 'equipment.import.announce.notSaved.many',
      params: { count: this.#formatters.integer(refused) },
    };

    if (stored > 0 && refused > 0) {
      this.#announce('equipment.import.announce.batch', {
        saved: this.#messages.message(saved.messageKey, saved.params),
        notSaved: this.#messages.message(notSaved.messageKey, notSaved.params),
      });
      return;
    }

    // A batch is at least two loadouts and each of them is either stored or
    // refused, so exactly one of the two halves is left here.
    const only = refused > 0 ? notSaved : saved;
    this.#announce(only.messageKey, only.params);
  }

  #announce(messageKey: MessageKey, params: Record<string, string> = {}): void {
    this.#announcements.announce({
      kind: 'equipment.import',
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
