import { Injectable, computed, inject } from '@angular/core';
import { Formatters } from '../../i18n/formatters/formatters';
import { GameTextPresenter } from '../../i18n/game-text.presenter';
import { MessageService } from '../../i18n/message.service';
import type { MessageKey } from '../../i18n/locale-registry';
import type { DiagnosticEntry } from '../../ui/technical/diagnostic-list';
import type {
  NormalizationRefusal,
  SlefImportFailure,
  SlefPackageDiagnostic,
} from '../../domain/slef/slef-import.models';
import type { DeliveryAction, DeliveryOutcome } from '../../domain/slef/slef-export.models';
import { AnnouncementService } from '../../ui/announcements/announcement.service';
import { ActiveBuildStore } from '../active-build/active-build.store';
import { SlefDeliveryCoordinator } from './slef-delivery.coordinator';
import { SlefExportCoordinator } from './slef-export.coordinator';
import { SlefImportCoordinator, type SlefImportSubmission } from './slef-import.coordinator';
import { SlefStore, type SlefExportMode } from './slef.store';

/** What the import layer draws, already localized. */
export interface SlefImportView {
  readonly title: string;
  readonly description: string;
  readonly accepted: string;
  readonly fieldLabel: string;
  readonly draft: string;
  /** The one status line the canvas draws, whatever it currently says. */
  readonly status: string;
  readonly busy: boolean;
  readonly failure: SlefFailureView | null;
  readonly submitLabel: string;
  /** The canvas draws Cancel, not Clear: closing is what it does. */
  readonly cancelLabel: string;
  readonly canSubmit: boolean;
}

/** A refusal, in the same three parts every refusal has. */
export interface SlefFailureView {
  /** The application's framing of what happened. Never a package sentence. */
  readonly message: string;
  /** The package's own diagnostics, unaltered. Empty when it raised none. */
  readonly diagnostics: readonly DiagnosticEntry[];
  readonly diagnosticsLabel: string;
  /** One line per refused partial roll, in exact source identities. */
  readonly refusals: readonly string[];
}

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
 * (`specs/004-slef/design/import-outcome.md`, "Divergence").
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
  readonly exportAvailable = this.#export.available;

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

    return {
      title: this.#messages.message('slef.import.title'),
      description: this.#messages.message('slef.import.description'),
      accepted: this.#messages.message('slef.import.accepted'),
      fieldLabel: this.#messages.message('slef.import.field.label'),
      draft: draft.text,
      status: this.#importStatus(),
      busy: status !== 'editing',
      failure: failure === null ? null : this.#failureView(failure),
      submitLabel: this.#messages.message('slef.import.action.submit'),
      cancelLabel: this.#messages.message('action.cancel'),
      canSubmit: status === 'editing' && draft.text.trim().length > 0,
    };
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

  openImport(): void {
    this.#store.openLayer('import');
  }

  /**
   * Opens the export layer, on a named format or on the one it already holds.
   *
   * The format is optional because the store's is sticky: a Commander who moved
   * to the link finds the link. A default here would look like the same
   * behaviour and be the opposite of it — every open would reset the choice.
   *
   * Nothing in the product calls this, or `openImport` above it. Both are the
   * presenter's statement of the two intents; the shell and the refusal seam
   * reach `SlefStore` directly instead, because opening a layer must not pull
   * this presenter — and the Almanac, the serializer and the delivery ports
   * behind it — into the bundle that draws the control
   * (`slef-fallback.adapter.ts`).
   */
  openExport(mode?: SlefExportMode): void {
    if (mode !== undefined) {
      this.#store.selectExportMode(mode);
    }
    this.#store.openLayer('export');
    this.prepareExport();
  }

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

  async submit(): Promise<SlefImportSubmission> {
    const submission = await this.#import.submit();
    if (submission.kind === 'committed') {
      this.#announcements.announce({
        kind: 'slef.import',
        revision: this.#active.revision(),
        urgency: 'polite',
        messageKey: 'slef.import.announce.imported',
        params: { hull: this.#active.hullName() ?? '' },
      });
    } else if (submission.kind === 'failed') {
      // Bounded on purpose: never the draft, never a whole diagnostic list.
      // What a reader needs from an outlet is that something happened; the
      // detail is on the screen, to be read at their own pace.
      this.#announcements.announce({
        kind: 'slef.import',
        revision: this.#store.requestToken,
        urgency: 'polite',
        messageKey: 'slef.import.announce.failed',
      });
    }
    return submission;
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
   * Says what an action reported, once per artifact.
   *
   * Deduplicated on the artifact's revision, so a Commander who copies the same
   * payload twice is not told twice, and an outcome that arrives after the
   * build moved on is not announced against the build that replaced it. Never
   * the payload, never a filename taken from a Commander's own text, never a
   * raw DOM exception.
   */
  #announceDelivery(outcome: DeliveryOutcome): DeliveryOutcome {
    if (outcome.status === 'working') {
      return outcome;
    }
    this.#announcements.announce({
      kind: `slef.delivery.${outcome.action}`,
      revision: this.#store.artifact()?.revision ?? 0,
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
   * The one status line, in priority order.
   *
   * The canvas draws exactly one place for this. A refusal is said by the
   * failure block below it, so the status line stays what it was rather than
   * saying the same thing a second time.
   */
  #importStatus(): string {
    const draft = this.#store.draft();
    if (this.#store.importStatus() !== 'editing') {
      return this.#messages.message('slef.import.status.inspecting');
    }
    const ending = this.#store.importEnding();
    if (ending !== null) {
      return this.#messages.message(`slef.import.status.${ending}` as MessageKey);
    }
    if (draft.text.length === 0) {
      return this.#messages.message('slef.import.status.awaiting');
    }
    return this.#messages.message('slef.import.status.bytes', {
      bytes: this.#formatters.bytes(draft.utf8Bytes),
      limit: this.#formatters.bytes(draft.limitBytes),
    });
  }

  #failureView(failure: SlefImportFailure): SlefFailureView {
    return {
      message: this.#failureMessage(failure),
      diagnostics: this.diagnostics('diagnostics' in failure ? failure.diagnostics : []),
      diagnosticsLabel: this.#messages.message('slef.diagnostic.title'),
      refusals: 'failures' in failure ? failure.failures.map((one) => this.#refusal(one)) : [],
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

  #link(): string | null {
    const artifact = this.#store.artifact();
    if (artifact === null) {
      return null;
    }
    return artifact.linkOmission === null
      ? this.#messages.message('slef.export.link.included')
      : this.#messages.message(`slef.export.link.omitted.${artifact.linkOmission}` as MessageKey);
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
