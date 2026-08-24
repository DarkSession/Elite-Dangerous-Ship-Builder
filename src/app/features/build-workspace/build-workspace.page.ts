import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActiveBuildStore } from '../../application/active-build/active-build.store';
import { BuildLinkCoordinator } from '../../application/build-link/build-link.coordinator';
import { FragmentPublisher } from '../../application/build-link/fragment-publisher';
import { LinkErrorMapper } from '../../application/build-link/link-error.mapper';
import { SLEF_FALLBACK } from '../../application/build-link/slef-fallback.port';
import { AutosaveService } from '../../application/build-library/autosave.service';
import { RecordInvalidationService } from '../../application/build-library/record-invalidation.service';
import { RecordOpenService } from '../../application/build-library/record-open.service';
import { TabOwnershipCoordinator } from '../../application/build-library/tab-ownership.coordinator';
import { MessageService } from '../../i18n/message.service';
import { HistoryLocationAdapter } from '../../platform/browser/history-location.adapter';
import { NAVIGATION_ROUTES } from '../shared/app-navigation';
import { ScreenChrome } from '../shared/screen-chrome';
import { ActionLink } from '../../ui/components/action/action-link';
import { StatusNotice } from '../../ui/components/status/status-notice';
import { OutfittingWorkspace } from './outfitting/outfitting-workspace/outfitting-workspace';
import { PersistenceStatus } from './persistence-status';

/**
 * The active build's home.
 *
 * Feature 001 owns the shell: which build is open, where it came from, whether
 * it is saved, and how it is shared. The module editors and statistics that
 * fill the capability outlet arrive with later features and compose into this
 * screen rather than owning a second copy of the build.
 *
 * Provenance is stated in words, not implied by an icon or a colour: "working
 * build" and "from the saved build X" lead to different expectations about what
 * happens when the tab is closed, and a Commander has to be able to tell which
 * one they are in (build-workspace design, "States").
 */
@Component({
  selector: 'edsb-build-workspace-page',
  imports: [ActionLink, OutfittingWorkspace, PersistenceStatus, StatusNotice, RouterLink],
  templateUrl: './build-workspace.page.html',
  styleUrl: './build-workspace.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // What persistence is doing is state, not decoration. Nothing on the canvas
  // draws it while it is working, so nothing here does either — and this is the
  // one thing a test can read to know a write has landed without reaching into
  // storage and re-deriving the rule it is checking (the same arrangement the
  // outfitting region's `data-composition` uses).
  host: {
    '[attr.data-persistence]': 'persistence()',
    '[attr.data-validation]': 'validationState()',
  },
})
export class BuildWorkspacePage {
  readonly #messages = inject(MessageService);
  readonly #active = inject(ActiveBuildStore);
  readonly #chrome = inject(ScreenChrome);
  readonly #ownership = inject(TabOwnershipCoordinator);
  readonly #autosave = inject(AutosaveService);
  readonly #open = inject(RecordOpenService);
  readonly #invalidation = inject(RecordInvalidationService);
  readonly #link = inject(BuildLinkCoordinator);
  readonly #publisher = inject(FragmentPublisher);
  readonly #linkErrors = inject(LinkErrorMapper);
  /**
   * How the workspace opens the exchange layer.
   *
   * The one seam feature 001 has onto feature 004, and the reason the layer's
   * own component is not imported here: the workspace says "export this build"
   * and knows nothing about which formats exist or how one is produced
   * (build-link contract, "Active-edit synchronization").
   */
  readonly #exchange = inject(SLEF_FALLBACK);
  readonly #location = inject(HistoryLocationAdapter);

  readonly catalogueRoute = NAVIGATION_ROUTES.catalogue;

  readonly emptyTitle = this.#messages.messageSignal('workspace.empty.title');
  readonly emptyDescription = this.#messages.messageSignal('workspace.empty.description');
  readonly emptyAction = this.#messages.messageSignal('workspace.empty.action');
  readonly shareLabel = this.#messages.messageSignal('workspace.actions.share');

  /** Whether the export layer is open. */

  readonly hasBuild = computed(() => this.#active.loadout() !== null);

  /** What persistence is doing, as the shared state name. */
  readonly persistence = computed(() => this.#active.persistence());

  /** The package's verdict as a state name, drawn or not. */
  readonly validationState = computed(() => {
    const verdict = this.#active.validation();
    if (verdict === null) {
      return null;
    }
    if (!verdict.valid) {
      return 'invalid';
    }
    return verdict.complete ? 'valid' : 'incomplete';
  });

  constructor() {
    // Ownership first, then restoration, then saving. The order is the one the
    // workspace contract states: this tab has to know which record is its own
    // before it can restore from it, and has to have restored before an
    // incoming link is treated as a replacement for something.
    const workingRecordId = this.#ownership.claim();
    this.#ownership.onFork(() => this.#autosave.adoptForkedRecord());

    const restored =
      this.#active.loadout() === null ? this.#open.open(workingRecordId) : Promise.resolve(null);

    const stopOwnership = this.#ownership.listen();
    const stopAutosave = this.#autosave.start();
    const stopInvalidation = this.#invalidation.listen();

    // The link comes last, and it comes in this order for a reason. This tab's
    // own build has to be restored before an incoming fragment can be offered
    // as a replacement for it — otherwise the question is asked about nothing —
    // and that fragment has to be read before publication starts, because
    // publishing the restored build would overwrite the link that arrived with
    // the page (build-link contract, "Ingress pipeline", step 6).
    let stopLink: (() => void) | null = null;
    let stopPublishing: (() => void) | null = null;
    let live = true;

    void restored
      .then(() => this.#link.ingest(this.#location.fragment()))
      .then(() => {
        if (!live) {
          return;
        }
        stopLink = this.#link.listen();
        stopPublishing = this.#publisher.start();
      });

    inject(DestroyRef).onDestroy(() => {
      // A last best-effort write on the way out, so leaving the workspace for
      // another screen cannot cost an edit.
      live = false;
      this.#autosave.flush();
      stopOwnership();
      stopAutosave();
      stopInvalidation();
      stopLink?.();
      stopPublishing?.();
    });

    // Canvas 1c draws `EXPORT` in the command bar's action row, after the
    // history pair the outfitting region publishes. It is published rather
    // than drawn in the page, for the reason the region's own pair is: the
    // frame already renders one list in both the wide row and the compact
    // menu, and a button inside the page would be a second placement neither
    // canvas has.
    effect((onCleanup) => {
      this.#chrome.setActions(
        this.hasBuild()
          ? [
              {
                action: { id: 'workspace.export', label: this.shareLabel() },
                perform: () => this.#exchange.export(),
              },
            ]
          : [],
      );
      onCleanup(() => this.#chrome.setActions([]));
    });

    // A record discarded in another tab pauses this tab's saving rather than
    // being silently recreated by the next autosave.
    effect(() => {
      const deleted = this.#invalidation.deleted();
      const mine = this.#ownership.workingRecordId();
      if (mine !== null && deleted.includes(mine)) {
        this.#autosave.pauseAfterExternalDelete();
        this.#invalidation.acknowledgeDeleted(mine);
      }
    });
  }

  /**
   * Why the last incoming build link was refused, in the Commander's language.
   *
   * Shown on the workspace rather than inside the export layer, because a link
   * that arrives refused is not something the Commander went looking for: they
   * pasted an address and nothing happened, and the reason has to be where they
   * are (FR-018).
   */
  readonly linkFailure = computed(() => {
    const failure = this.#link.failure();
    return failure === null ? null : this.#linkErrors.describe(failure);
  });

  /**
   * The package's own verdict, where it is a problem — never this application's.
   *
   * Two states rather than three: an incomplete build is one a Commander is
   * still assembling and an invalid one is a build the game would refuse, and
   * collapsing them would tell them the wrong thing about both. A valid build
   * says nothing at all, because the canvas's build status panel reports
   * problems and stays silent otherwise (design-canvas rule).
   */
  readonly validationProblem = computed(() => {
    switch (this.validationState()) {
      case 'invalid':
        return {
          tone: 'error' as const,
          message: this.#messages.message('workspace.validation.invalid'),
        };
      case 'incomplete':
        return {
          tone: 'warning' as const,
          message: this.#messages.message('workspace.validation.incomplete'),
        };
      default:
        return null;
    }
  });
}
