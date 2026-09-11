import { Injectable, computed, inject } from '@angular/core';
import { Formatters } from '../../i18n/formatters/formatters';
import { GameTextPresenter } from '../../i18n/game-text.presenter';
import { MessageService } from '../../i18n/message.service';
import type { MessageKey, MessageParams } from '../../i18n/locale-registry';
import type { DiagnosticEntry } from '../../ui/technical/diagnostic-list';
import type {
  JournalFailureView,
  JournalImportView,
  JournalPickView,
} from '../journal/journal-import.view';
import type {
  NormalizationRefusal,
  SlefImportFailure,
  SlefPackageDiagnostic,
} from '../../domain/ships/slef/slef-import.models';
import type { DeliveryAction, DeliveryOutcome } from '../../domain/ships/slef/slef-export.models';
import type { JournalFile } from '../../domain/journal/journal-scan';
import { AnnouncementService } from '../../ui/announcements/announcement.service';
import { ActiveBuildStore } from '../active-build/active-build.store';
import { SlefDeliveryCoordinator } from './slef-delivery.coordinator';
import { SlefExportCoordinator } from './slef-export.coordinator';
import { SlefImportCoordinator, type SlefImportSubmission } from './slef-import.coordinator';
import { SlefStore, type SlefExportMode } from './slef.store';

/**
 * What the import layer draws for the Ship Builder.
 *
 * The shape is the shared one: both tools draw one panel, so both fill one view
 * (`application/journal/journal-import.view`).
 */
export type SlefImportView = JournalImportView;
export type SlefPickView = JournalPickView;
export type SlefFailureView = JournalFailureView;

/** One format the export layer offers. */
export interface SlefExportModeView {
  readonly mode: SlefExportMode;
  readonly label: string;
  readonly description: string;
  readonly selected: boolean;
}

/** One delivery action, with whatever it last reported. */
export interface SlefDeliveryView {
  readonly action: DeliveryAction;
  readonly label: string;
  readonly status: string | null;
  readonly failed: boolean;
}

/** What the export layer draws in SLEF mode, already localized. */
export interface SlefExportView {
  readonly title: string;
  readonly modeLabel: string;
  readonly modes: readonly SlefExportModeView[];
  readonly fieldLabel: string;
  readonly payload: string;
  readonly metadata: string | null;
  /** The one preparing line, while it is being prepared. */
  readonly generating: string | null;
  /** Why the payload is gone: the build moved on since it was made. */
  readonly stale: string | null;
  /** The package's verdict, framed once, when it is not plainly valid. */
  readonly validation: string | null;
  readonly link: string | null;
  readonly actions: readonly SlefDeliveryView[];
}

/**
 * The one place feature 004's state becomes words.
 *
 * Components receive these view models and emit the intents below; they never
 * reach the store, the package, a byte counter or a browser API themselves
 * (contract `routes-and-ui.md`, "Intent boundary"). Everything a Commander
 * reads is resolved here — application framing through the message catalogue,
 * game nouns and package diagnostics through feature 011's package-text
 * presenter, and every number through a named formatter.
 *
 * There is no import-outcome view. The canvas draws no feature-004 report of an
 * accepted import, and both facts one would carry are already drawn by feature
 * 002's completion notice and feature 003's build-status rail
 * (`openspec/changes/archive/004-slef/design/import-outcome.md`, "Divergence").
 */
@Injectable({ providedIn: 'root' })
export class SlefPresenter {
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);
  readonly #gameText = inject(GameTextPresenter);
  readonly #store = inject(SlefStore);
  readonly #import = inject(SlefImportCoordinator);
  readonly #export = inject(SlefExportCoordinator);
  readonly #delivery = inject(SlefDeliveryCoordinator);
  readonly #announcements = inject(AnnouncementService);
  readonly #active = inject(ActiveBuildStore);

  readonly layer = this.#store.layer;
  /**
   * Which revision the payload on screen describes, or `null` for none.
   *
   * Published so the layer's own preparation can depend on it: an artifact that
   * was dropped underneath the layer has to be made again, and a host that
   * watched only "is the layer open" would never notice.
   */
  readonly exportArtifactRevision = computed(() => this.#store.artifact()?.revision ?? null);

  readonly importView = computed<SlefImportView>(() => {
    const draft = this.#store.draft();
    const status = this.#store.importStatus();
    const failure = this.#store.importFailure();

    const picks = this.#picks();
    const chosen = this.#store.selectedKeys().length;
    const scanning = this.#store.scanning();
    const scanned = this.#store.journalEntries().length > 0;

    return {
      title: this.#messages.message('slef.import.title'),
      description: this.#messages.message('slef.import.description'),
      accepted: this.#messages.message('slef.import.accepted'),
      fieldLabel: this.#messages.message('slef.import.field.label'),
      draft: draft.text,
      status: this.#importStatus(),
      busy: status !== 'editing' || scanning,
      failure: failure === null ? this.#batchFailureView() : this.#failureView(failure),
      submitLabel:
        chosen > 1
          ? this.#messages.message('slef.import.action.submit.several', {
              count: this.#formatters.integer(chosen),
            })
          : this.#messages.message('slef.import.action.submit'),
      cancelLabel: this.#messages.message('action.cancel'),
      canSubmit:
        status === 'editing' && !scanning && (scanned ? chosen > 0 : draft.text.trim().length > 0),
      dropLabel: this.#messages.message('slef.import.drop.label'),
      scanned: this.#scanned(),
      scanning,
      dividerLabel: this.#messages.message('slef.import.divider'),
      picks,
      picksLabel:
        picks.length === 0
          ? null
          : this.#messages.message('slef.import.picks.label', {
              found: this.#formatters.integer(picks.length),
              chosen: this.#formatters.integer(chosen),
            }),
    };
  });

  /**
   * What the library says when it opens on a batch import.
   *
   * `null` at every other moment, which is every moment a Commander opened the
   * library themselves. The records are the outcome; this names how many of them
   * arrived, because a list that grew by three says nothing about why.
   */
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

  readonly exportView = computed<SlefExportView>(() => {
    const artifact = this.#store.artifact();
    const snapshot = this.#export.snapshot();
    const hull = snapshot === null ? null : this.#gameText.shipName(snapshot.loadout.shipSymbol);

    return {
      title:
        hull?.text == null
          ? this.#messages.message('slef.export.title')
          : this.#messages.message('slef.export.title.named', { ship: hull.text }),
      modeLabel: this.#messages.message('slef.export.mode.label'),
      modes: this.#modes(),
      fieldLabel: this.#messages.message('slef.export.field.label'),
      payload: artifact?.payload ?? '',
      metadata:
        artifact === null
          ? null
          : this.#messages.message('slef.export.metadata', {
              modules: this.#formatters.integer(artifact.moduleCount),
              size: this.#formatters.bytes(artifact.utf8Bytes),
            }),
      generating: this.#store.generating()
        ? this.#messages.message('slef.export.generating')
        : null,
      stale:
        artifact === null && this.#store.artifactInvalidated()
          ? this.#messages.message('slef.export.stale')
          : null,
      validation: this.#validation(),
      link: this.#link(),
      actions: this.#actions(),
    };
  });

  // ---- intents -----------------------------------------------------------

  /**
   * Makes the layer ready to show what it is about to show.
   *
   * Called when the layer arrives on screen and whenever the format changes,
   * because the layer is loaded on demand: by the time it exists, the request
   * that opened it has already happened. Detection is a write and generation is
   * work, so neither belongs in the view that reads them.
   */
  prepareExport(): void {
    this.#delivery.refreshCapability();

    // Staleness first, and every time. An artifact outlives the layer that made
    // it, so the dangerous case is the ordinary one: export a build, close the
    // layer, edit the build, open the layer again. Without this the previous
    // revision's payload is still there, is not null, and therefore suppresses
    // the regeneration below — the Commander is shown a payload for a build
    // they have already changed, under the current build's own title
    // (export contract, "Artifact lifecycle").
    this.#export.invalidateStaleArtifact();

    if (this.#store.exportMode() === 'slef' && this.#store.artifact() === null) {
      this.#export.generate();
    }
  }

  closeLayer(): void {
    this.#import.abandon();
    this.#store.closeLayer();
  }

  edit(text: string): void {
    this.#store.setDraft(text);
  }

  /**
   * Reads the journal files a Commander chose.
   *
   * Announced as it starts rather than as it ends: a scan of several files is
   * the one thing here that takes long enough for a reader to wonder whether
   * anything happened.
   */
  async scanFiles(files: readonly JournalFile[]): Promise<void> {
    this.#announcements.announce({
      kind: 'slef.import.scan',
      urgency: 'polite',
      messageKey: 'slef.import.announce.scanning',
    });

    // Only the scan a Commander is still waiting for says how it ended. A scan
    // replaced by a newer one is a question nobody is asking, and announcing it
    // would state the abandoned reading and leave the current one unsaid
    // (011/FR-009).
    if (!(await this.#import.scanFiles(files))) {
      return;
    }
    this.#announceScan();
  }

  /**
   * Says how a scan ended, not only that one started.
   *
   * The list, the scanned line and the refusal all reach a Commander who is
   * looking at the panel. A Commander who is not gets one sentence: what came
   * back. Without it a screen reader hears "Reading journal files." and then
   * nothing at all, whether three builds arrived or the file held none
   * (016/FR-004, FR-006).
   */
  #announceScan(): void {
    const found = this.#store.journalEntries().length;
    this.#announcements.announce({
      kind: 'slef.import.scan',
      urgency: 'polite',
      messageKey:
        found === 0
          ? 'slef.import.announce.scanned.none'
          : found === 1
            ? 'slef.import.announce.scanned.one'
            : 'slef.import.announce.scanned.many',
      params: { count: this.#formatters.integer(found) },
    });
  }

  /** Records which of the builds a scan found the Commander wants. */
  chooseJournalPicks(keys: readonly string[]): void {
    this.#store.setSelection(keys);
  }

  async submit(): Promise<SlefImportSubmission> {
    const submission = await this.#import.submit();
    if (submission.kind === 'committed') {
      this.#announcements.announce({
        kind: 'slef.import',
        urgency: 'polite',
        messageKey: 'slef.import.announce.imported',
        params: { hull: this.#active.hullName() ?? '' },
      });
    } else if (submission.kind === 'stored') {
      this.#announceBatch(submission.stored, submission.refused.length);
    } else if (submission.kind === 'failed') {
      // Bounded on purpose: never the draft, never a whole diagnostic list.
      // What a reader needs from an outlet is that something happened; the
      // detail is on the screen, to be read at their own pace.
      this.#announcements.announce({
        kind: 'slef.import',
        urgency: 'polite',
        messageKey: 'slef.import.announce.failed',
      });
    }
    return submission;
  }

  /**
   * What a batch of several builds did, in one sentence.
   *
   * One sentence and not two, because the polite outlet holds one event: a
   * second announcement published in the same tick writes over the first, and
   * the reader hears only what was said last. A batch that stored some builds
   * and refused others reports two outcomes, and both are owed
   * (011/FR-009, "One request reports two outcomes").
   *
   * Both counts, and never a count and a word standing in for the other one.
   * 016/FR-010 requires the outcome to say how many builds were imported, and
   * a batch where every chosen build was refused must not say the rest were
   * saved — nothing was.
   */
  #announceBatch(stored: number, refused: number): void {
    const saved: { messageKey: MessageKey; params: MessageParams } = {
      messageKey:
        stored === 1 ? 'slef.import.announce.stored.one' : 'slef.import.announce.stored.many',
      params: { count: this.#formatters.integer(stored) },
    };
    const notSaved: { messageKey: MessageKey; params: MessageParams } = {
      messageKey:
        refused === 1 ? 'slef.import.announce.notSaved.one' : 'slef.import.announce.notSaved.many',
      params: { count: this.#formatters.integer(refused) },
    };

    if (stored > 0 && refused > 0) {
      this.#announcements.announce({
        kind: 'slef.import',
        urgency: 'polite',
        messageKey: 'slef.import.announce.batch',
        params: {
          saved: this.#messages.message(saved.messageKey, saved.params),
          notSaved: this.#messages.message(notSaved.messageKey, notSaved.params),
        },
      });
      return;
    }

    // A batch is at least two builds and each of them is either stored or
    // refused, so at most one of the two halves is missing here.
    const only = refused > 0 ? notSaved : stored > 0 ? saved : null;
    if (only === null) {
      return;
    }
    this.#announcements.announce({ kind: 'slef.import', urgency: 'polite', ...only });
  }

  selectMode(mode: SlefExportMode): void {
    this.#store.selectExportMode(mode);
    this.prepareExport();
  }

  generate(): void {
    this.#export.generate();
  }

  async copy(): Promise<DeliveryOutcome> {
    return this.#announceDelivery(await this.#delivery.copy());
  }

  download(): DeliveryOutcome {
    return this.#announceDelivery(this.#delivery.download());
  }

  async share(): Promise<DeliveryOutcome> {
    return this.#announceDelivery(await this.#delivery.share());
  }

  /**
   * Says what an action reported, every time one reports.
   *
   * A Commander who presses Copy a second time does so because they were unsure
   * of the first press, and the answer to that is the sentence — so two presses
   * are two announcements, even when the export has not changed and the words
   * are identical (011/FR-009). A press that fails and then succeeds says two
   * different things, and both are heard.
   *
   * Bounded on purpose: never the payload, never a filename taken from a
   * Commander's own text, never a raw DOM exception.
   */
  #announceDelivery(outcome: DeliveryOutcome): DeliveryOutcome {
    if (outcome.status === 'working') {
      return outcome;
    }
    this.#announcements.announce({
      kind: `slef.delivery.${outcome.action}`,
      urgency: 'polite',
      messageKey: 'slef.announce.delivery',
      params: {
        action: this.#messages.message(`slef.action.${outcome.action}` as MessageKey),
        result: this.#deliveryStatus(outcome),
      },
    });
    return outcome;
  }

  // ---- import wording ----------------------------------------------------

  /**
   * The one status line, in priority order — and empty while nothing has
   * happened yet.
   *
   * The canvas draws exactly one place for this. A refusal is said by the
   * failure block below it, so the status line stays what it was rather than
   * saying the same thing a second time.
   *
   * It used to say "Awaiting input" over an empty field and count the draft's
   * bytes while a Commander typed. Neither was news: an empty field is already
   * empty, and a byte count nobody is near the limit of is arithmetic about
   * something that has not gone wrong (Commander request 2026-08-26). The size
   * is still said at the one moment it decides anything — over the limit, where
   * `slef.import.failure.tooLarge` names the draft's size and the limit and the
   * field carries it as its own error. The line keeps its height either way, so
   * the field and the footer do not jump apart when a status does arrive.
   */
  #importStatus(): string {
    const reading = this.#store.scanningFiles();
    if (reading > 0) {
      return reading === 1
        ? this.#messages.message('slef.import.status.scanning.one')
        : this.#messages.message('slef.import.status.scanning.many', {
            files: this.#formatters.integer(reading),
          });
    }
    if (this.#store.importStatus() !== 'editing') {
      return this.#messages.message('slef.import.status.inspecting');
    }
    const ending = this.#store.importEnding();
    if (ending !== null) {
      return this.#messages.message(`slef.import.status.${ending}` as MessageKey);
    }
    // A file the bound refused while the rest were read. It is stated here
    // rather than as the panel's refusal, because the scan succeeded: the same
    // sentence the whole refusal uses, about the one file it is about
    // (016/FR-002, FR-004).
    const [refused] = this.#store.scanReport()?.refused ?? [];
    if (refused !== undefined) {
      return this.#messages.message('slef.import.failure.fileTooLarge', {
        file: refused.fileName,
        limit: this.#formatters.bytes(refused.limitBytes),
      });
    }
    return '';
  }

  /**
   * The rows the list draws, or none where there is nothing to choose between.
   *
   * The hull's name is the package's, resolved here where the locale is known.
   * Nothing in a row is derived from the symbol the file carried.
   */
  #picks(): readonly SlefPickView[] {
    const entries = this.#store.journalEntries();
    if (entries.length < 2) {
      return [];
    }
    const chosen = this.#store.selectedKeys();

    return entries.map((entry) => {
      const facts = entry.value;
      const hull = this.#gameText.shipName(facts.hullSymbol);
      const hullName = hull.text ?? facts.hullSymbol;
      return {
        key: entry.key,
        title:
          facts.shipName === null
            ? (facts.ident ?? hullName)
            : facts.ident === null
              ? facts.shipName
              : this.#messages.message('slef.import.pick.title', {
                  name: facts.shipName,
                  ident: facts.ident,
                }),
        detail: this.#messages.message('slef.import.pick.detail', {
          hull: hullName,
          modules: this.#formatters.integer(facts.moduleCount),
        }),
        meta: entry.timestamp === '' ? '' : this.#stamp(entry.timestamp),
        selected: chosen.includes(entry.key),
      };
    });
  }

  /** The instant the game wrote, in the active locale, or the text it wrote. */
  #stamp(timestamp: string): string {
    const instant = new Date(timestamp);
    return Number.isNaN(instant.getTime()) ? timestamp : this.#formatters.dateTime(instant);
  }

  /** What the last scan read: the file's name, or how many files there were. */
  #scanned(): string | null {
    const report = this.#store.scanReport();
    if (report === null) {
      return null;
    }
    const builds =
      report.eventCount === 1
        ? this.#messages.message('slef.import.scanned.builds.one')
        : this.#messages.message('slef.import.scanned.builds.many', {
            count: this.#formatters.integer(report.eventCount),
          });
    const source =
      report.fileName ??
      this.#messages.message('slef.import.scanned.files', {
        files: this.#formatters.integer(report.fileCount),
      });
    return this.#messages.message('slef.import.scanned', { source, builds });
  }

  /**
   * What a batch left behind, in the shape every refusal here has.
   *
   * One sentence saying how many were not saved, one line naming each of them
   * with the reason beside it, and the package's own diagnostics behind the
   * same control every other refusal puts them behind. `null` while a batch
   * either has not happened or took everything it was given.
   */
  #batchFailureView(): SlefFailureView | null {
    const outcome = this.#store.batchOutcome();
    if (outcome === null || outcome.refused.length === 0) {
      return null;
    }

    return {
      message:
        outcome.refused.length === 1
          ? this.#messages.message('slef.import.failure.batch.one')
          : this.#messages.message('slef.import.failure.batch.many', {
              count: this.#formatters.integer(outcome.refused.length),
            }),
      diagnostics: this.diagnostics(
        outcome.refused.flatMap((refusal) =>
          'diagnostics' in refusal.failure ? refusal.failure.diagnostics : [],
        ),
      ),
      diagnosticsLabel: this.#messages.message('slef.diagnostic.title'),
      refusals: outcome.refused.map((refusal) =>
        this.#messages.message('slef.import.failure.refused', {
          title: refusal.title,
          reason: this.#failureMessage(refusal.failure),
        }),
      ),
      advancedLabel: this.#messages.message('slef.import.advanced'),
    };
  }

  #failureView(failure: SlefImportFailure): SlefFailureView {
    return {
      message: this.#failureMessage(failure),
      diagnostics: this.diagnostics('diagnostics' in failure ? failure.diagnostics : []),
      diagnosticsLabel: this.#messages.message('slef.diagnostic.title'),
      refusals: 'failures' in failure ? failure.failures.map((one) => this.#refusal(one)) : [],
      advancedLabel: this.#messages.message('slef.import.advanced'),
    };
  }

  #failureMessage(failure: SlefImportFailure): string {
    switch (failure.kind) {
      case 'tooLarge':
        return this.#messages.message('slef.import.failure.tooLarge', {
          bytes: this.#formatters.bytes(failure.utf8Bytes),
          limit: this.#formatters.bytes(failure.limitBytes),
        });
      case 'cardinality':
        return this.#messages.message('slef.import.failure.cardinality', {
          observed: this.#formatters.integer(failure.observed),
        });
      case 'unknownHull':
        // The exact identity the payload named, and nothing resolved from it:
        // an unknown hull is by definition not in the package's catalogue, so
        // there is no name to present.
        return this.#messages.message('slef.import.failure.unknownHull', {
          hull: failure.sourceHull,
        });
      case 'fileTooLarge':
        return this.#messages.message('slef.import.failure.fileTooLarge', {
          file: failure.fileName,
          limit: this.#formatters.bytes(failure.limitBytes),
        });
      case 'noEvents':
        return this.#messages.message('slef.import.failure.noEvents', {
          files: failure.fileNames.join(', '),
        });
      case 'normalizationUnsupported':
        return this.#messages.message('slef.import.failure.normalizationUnsupported', {
          count: this.#formatters.integer(failure.failures.length),
        });
      default:
        return this.#messages.message(`slef.import.failure.${failure.kind}` as MessageKey);
    }
  }

  /** One refused roll: where it was, what it was, and what the package said. */
  #refusal(refusal: NormalizationRefusal): string {
    // The slot is the payload's own key rather than a resolved name: a refused
    // roll has no constructed slot behind it to name, and the key is what a
    // Commander searches their payload for anyway. The module symbol does
    // resolve, because the package knows the article even when it cannot
    // complete its engineering.
    const module = this.#gameText.moduleName(refusal.source.moduleSymbol);
    return this.#messages.message('slef.import.refusal.module', {
      slot: refusal.source.slotKey,
      module: module.text ?? refusal.source.moduleSymbol,
      quality: this.#formatters.percent(refusal.source.quality),
      code: refusal.code ?? '',
    });
  }

  /**
   * The package's diagnostics, ready to render.
   *
   * Exported as a method rather than folded into the failure view so the same
   * rule serves a preview and a test without a store behind it. Every field is
   * the package's; only the index is formatted, and only as a number.
   */
  diagnostics(diagnostics: readonly SlefPackageDiagnostic[]): readonly DiagnosticEntry[] {
    return diagnostics.map((diagnostic, position) => {
      const reason = this.#gameText.slefDiagnosticMessage(diagnostic);
      return {
        id: `${diagnostic.index}:${diagnostic.path}:${position}`,
        index: this.#formatters.integer(diagnostic.index),
        path: diagnostic.path,
        code: diagnostic.code,
        constraint: diagnostic.constraint,
        reason: reason.text ?? diagnostic.message,
        disclosure:
          reason.disclosureKey === null ? null : this.#messages.message(reason.disclosureKey),
        reasonLanguage: reason.language,
      };
    });
  }

  // ---- export wording ----------------------------------------------------

  #modes(): readonly SlefExportModeView[] {
    const selected = this.#store.exportMode();
    // The order the canvas lists them in: the payload first, the link beside it.
    return (['slef', 'link'] as const).map((mode) => ({
      mode,
      label: this.#messages.message(`slef.export.mode.${mode}` as MessageKey),
      description: this.#messages.message(`slef.export.mode.${mode}.description` as MessageKey),
      selected: mode === selected,
    }));
  }

  #validation(): string | null {
    const validation = this.#store.artifact()?.validation;
    if (validation === undefined) {
      return null;
    }
    if (!validation.valid) {
      return this.#messages.message('slef.export.validation.invalid');
    }
    if (!validation.complete) {
      return this.#messages.message('slef.export.validation.incomplete');
    }
    return null;
  }

  /**
   * Why the export carries no link — or nothing, where it carries one.
   *
   * An export that includes the link used to say so. It was the ordinary case
   * announcing itself: the canvas draws two formats and a payload, and a
   * sentence under them confirming that the one a Commander asked for is the
   * one they got is not news (Commander request 2026-08-26). The four omissions
   * stay, because each of those is a Commander expecting something that is not
   * in the file they are about to save.
   */
  #link(): string | null {
    const artifact = this.#store.artifact();
    if (artifact === null || artifact.linkOmission === null) {
      return null;
    }
    return this.#messages.message(
      `slef.export.link.omitted.${artifact.linkOmission}` as MessageKey,
    );
  }

  #actions(): readonly SlefDeliveryView[] {
    // Detection is a write, so it happens when the layer opens rather than
    // while the view is being computed. Until it has, the two actions the
    // canvas always draws are offered and Share is not: assuming a capability
    // nobody has checked is how a dead button gets drawn.
    const capability = this.#store.capability();
    const delivery = this.#store.delivery();
    const offered: DeliveryAction[] = ['download', 'copy'];
    if (capability?.share !== undefined && capability.share !== 'unavailable') {
      // Share is added by capability and never replaces Download (FR-004).
      offered.push('share');
    }
    if (capability?.clipboard === 'unavailable') {
      offered.splice(offered.indexOf('copy'), 1);
    }

    return offered.map((action) => {
      const outcome = delivery[action] ?? null;
      return {
        action,
        label: this.#messages.message(`slef.action.${action}` as MessageKey),
        status: outcome === null ? null : this.#deliveryStatus(outcome),
        failed: outcome?.status === 'failed' || outcome?.status === 'setupFailed',
      };
    });
  }

  #deliveryStatus(outcome: DeliveryOutcome): string {
    const key = `slef.delivery.${outcome.action}.${outcome.status}` as MessageKey;
    if (outcome.action === 'download' && outcome.status === 'dispatched') {
      return this.#messages.message(key, { filename: this.#store.artifact()?.filename ?? '' });
    }
    return this.#messages.message(key);
  }
}
