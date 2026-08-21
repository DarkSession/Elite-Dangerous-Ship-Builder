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
import { AutosaveService } from '../../application/build-library/autosave.service';
import { RecordInvalidationService } from '../../application/build-library/record-invalidation.service';
import { RecordOpenService } from '../../application/build-library/record-open.service';
import { TabOwnershipCoordinator } from '../../application/build-library/tab-ownership.coordinator';
import { MessageService } from '../../i18n/message.service';
import { HistoryLocationAdapter } from '../../platform/browser/history-location.adapter';
import { GameTextPresenter } from '../../i18n/game-text.presenter';
import { NAVIGATION_ROUTES } from '../shared/app-navigation';
import { ActionButton } from '../../ui/components/action/action-button';
import { ActionLink } from '../../ui/components/action/action-link';
import { GameText } from '../../ui/components/game-text/game-text';
import { StatusNotice } from '../../ui/components/status/status-notice';
import { ExportDialog } from './export.dialog';
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
  imports: [
    ActionButton,
    ActionLink,
    ExportDialog,
    GameText,
    PersistenceStatus,
    StatusNotice,
    RouterLink,
  ],
  templateUrl: './build-workspace.page.html',
  styleUrl: './build-workspace.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildWorkspacePage {
  readonly #messages = inject(MessageService);
  readonly #gameText = inject(GameTextPresenter);
  readonly #active = inject(ActiveBuildStore);
  readonly #ownership = inject(TabOwnershipCoordinator);
  readonly #autosave = inject(AutosaveService);
  readonly #open = inject(RecordOpenService);
  readonly #invalidation = inject(RecordInvalidationService);
  readonly #link = inject(BuildLinkCoordinator);
  readonly #publisher = inject(FragmentPublisher);
  readonly #linkErrors = inject(LinkErrorMapper);
  readonly #location = inject(HistoryLocationAdapter);

  readonly catalogueRoute = NAVIGATION_ROUTES.catalogue;

  readonly emptyTitle = this.#messages.messageSignal('workspace.empty.title');
  readonly emptyDescription = this.#messages.messageSignal('workspace.empty.description');
  readonly emptyAction = this.#messages.messageSignal('workspace.empty.action');
  readonly hullLabel = this.#messages.messageSignal('workspace.hull');
  readonly provenanceLabel = this.#messages.messageSignal('workspace.provenance.label');
  readonly shareLabel = this.#messages.messageSignal('workspace.actions.share');

  /** Whether the export layer is open. */
  readonly exportOpen = signal(false);

  readonly hasBuild = computed(() => this.#active.loadout() !== null);

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

  /** The hull's name, in the Commander's language where the package has one. */
  readonly hull = computed(() => {
    const symbol = this.#active.loadout()?.shipSymbol;
    return symbol === undefined ? null : this.#gameText.shipName(symbol);
  });

  /** Where this build came from, as a sentence rather than a state name. */
  readonly provenance = computed(() => {
    switch (this.#active.provenance()) {
      case 'stock':
        return this.#messages.message('workspace.provenance.stock');
      case 'link':
        return this.#messages.message('workspace.provenance.link');
      case 'named':
        return this.#messages.message('workspace.provenance.named', {
          name: this.#active.sourceNamed()?.recordId ?? '',
        });
      case 'working':
        return this.#messages.message('workspace.provenance.working');
      default:
        return null;
    }
  });

  /** Whether closing this tab would lose something, in words. */
  readonly savedState = computed(() =>
    this.#messages.message(this.#active.dirty() ? 'workspace.dirty' : 'workspace.clean'),
  );

  /**
   * The package's own verdict, never this application's.
   *
   * Three distinct states rather than a boolean: an incomplete build is one a
   * Commander is still assembling, an invalid one is a build the game would
   * refuse, and collapsing them would tell them the wrong thing about both.
   */
  readonly validation = computed(() => {
    const verdict = this.#active.validation();
    if (verdict === null) {
      return null;
    }
    if (!verdict.valid) {
      return {
        tone: 'error' as const,
        message: this.#messages.message('workspace.validation.invalid'),
      };
    }
    if (!verdict.complete) {
      return {
        tone: 'warning' as const,
        message: this.#messages.message('workspace.validation.incomplete'),
      };
    }
    return {
      tone: 'success' as const,
      message: this.#messages.message('workspace.validation.valid'),
    };
  });
}
