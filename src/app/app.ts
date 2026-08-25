import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import {
  ReplacementCoordinator,
  type ReplacementQuestion,
} from './application/active-build/replacement-coordinator';
import { ApplicationUpdateStore } from './application/updates/application-update.store';
import { MessageService } from './i18n/message.service';
import { AppNavigation, NAVIGATION_ROUTES } from './features/shared/app-navigation';
import { ScreenChrome } from './features/shared/screen-chrome';
import { LocaleStore } from './i18n/locale.store';
import { SlefStore } from './application/slef/slef.store';
import { ExportDialog } from './features/slef/export-build-layer/export.dialog';
import { ImportDialog } from './features/slef/import-build-layer/import.dialog';
import { AnnouncementService } from './ui/announcements/announcement.service';
import {
  AppFrame,
  type NavigationEntry,
  type ShellAction,
  type ShellStatus,
} from './ui/components/app-frame/app-frame';
import { ConfirmDialog } from './ui/components/confirm-dialog/confirm-dialog';
import { HelpPresenter } from './application/help/help.presenter';
import { HelpDialog } from './features/help/help-dialog.component';

/** The shell action that opens the import layer, named once. */
export const IMPORT_ACTION = 'slef.import';

/** The shell action that opens the Help · About modal, named once. */
export const HELP_ACTION = 'help.open';

/** The shell action that starts the application over on a newer version. */
export const UPDATE_ACTION = 'app.update';

/** A replacement question waiting for an answer. */
interface PendingReplacement {
  readonly question: ReplacementQuestion;
  readonly answer: (replace: boolean) => void;
}

/**
 * The application root.
 *
 * Mounts the shared frame around the router outlet and supplies the navigation
 * every screen offers. It owns no heading: each route renders its own `h1`
 * inside the frame's `<main>`, because a shell-synthesized heading would give
 * every screen the same one and leave a reader unable to tell where they are.
 *
 * It does own one thing beyond the frame: the question asked before unsaved
 * work is replaced. That question has to be answerable from wherever the
 * Commander happens to be — hull detail, the library, a pasted link — so it
 * lives at the one level that is always mounted rather than in the workspace
 * route, which may not be (cross-screen replacement rule).
 */
@Component({
  selector: 'app-root',
  imports: [AppFrame, ConfirmDialog, ExportDialog, HelpDialog, ImportDialog, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly #navigation = inject(AppNavigation);
  readonly #locale = inject(LocaleStore);
  readonly chrome = inject(ScreenChrome);
  readonly #router = inject(Router);
  readonly #messages = inject(MessageService);
  readonly #replacement = inject(ReplacementCoordinator);
  readonly #slef = inject(SlefStore);
  readonly help = inject(HelpPresenter);
  readonly #updates = inject(ApplicationUpdateStore);
  readonly #announcements = inject(AnnouncementService);

  readonly #path = signal(this.#router.url);
  readonly #pending = signal<PendingReplacement | null>(null);

  readonly navigation = computed(() => this.#navigation.entries(this.#path()));

  /**
   * What the command bar shows: the screen's own name, and the one count that
   * belongs to it. The name is the same string the document title uses, so the
   * bar and the tab can never disagree.
   */
  readonly pageName = this.#locale.page;
  readonly pageCount = this.chrome.count;

  /**
   * What the command bar shows: the open screen's own actions, then Import, and
   * the restart when a newer version is waiting.
   *
   * Import is always present. The reference draws it in the command bar of the
   * shipyard, and a Commander can paste a build from any screen — including one
   * with no build at all — so it belongs to the shell rather than to four
   * screens that would each have to remember to offer it.
   *
   * Help follows it, for the same reason and one more: the reference draws it
   * at the trailing end of the wide command bar and as an item in the narrow
   * action menu, and draws no help control anywhere else in any canvas. The
   * frame surrounds every capability, so one action here is the route from all
   * of them and no screen owns a second one (012/FR-002, 012/FR-011).
   *
   * The restart is last and almost never there. It sits at the trailing edge
   * where the canvas puts what a screen is asking for, and immediately before
   * the notice that explains it in reading order, so a reader meets the control
   * and its reason together. That is why it comes after Help rather than the
   * other way round: Help is a permanent fixture of the bar and this is a
   * transient thing the page is asking for, and separating it from its own
   * notice by a control that is always there would leave the notice explaining
   * something a reader has already scrolled past.
   */
  readonly actions = computed(() => {
    const screen = this.chrome.actions();
    const update = this.updateAction();
    return [
      ...screen,
      {
        id: IMPORT_ACTION,
        label: this.#messages.message('slef.import.title'),
        emphasis: 'secondary' as const,
        startsGroup: screen.length > 0,
      },
      {
        id: HELP_ACTION,
        label: this.help.actionLabel(),
        description: this.help.actionDescription(),
        emphasis: 'quiet' as const,
      },
      ...(update === null ? [] : [update]),
    ];
  });

  /**
   * The restart, offered only while there is something to restart onto.
   *
   * Pressing it is the Commander's decision and never the application's: a
   * reload replaces everything on screen, and taking that decision for someone
   * in the middle of outfitting a hull is exactly what shell navigation already
   * refuses to do. Not pressing it costs nothing — the newer version is already
   * downloaded and the next start of the application is served it.
   */
  readonly updateAction = computed<ShellAction | null>(() => {
    const state = this.#updates.state();
    if (state === 'current') {
      return null;
    }
    return {
      id: UPDATE_ACTION,
      label: this.#messages.message(
        state === 'ready' ? 'update.ready.action' : 'update.unusable.action',
      ),
      emphasis: 'primary' as const,
      description: this.#messages.message(
        state === 'ready'
          ? 'update.ready.action.description'
          : 'update.unusable.action.description',
      ),
      disabled: this.#updates.applying(),
      startsGroup: true,
    };
  });

  /**
   * The version outcome, as visible text.
   *
   * The other thing a Commander would otherwise have no way of knowing: that
   * what they are reading is no longer what was published. It stays on the page
   * in reading order beside the control that acts on it, to be found and
   * re-read; the announcement below is the separate projection that interrupts,
   * once (feedback contract).
   *
   * The tone decides how the notice itself is exposed, and `StatusNotice` makes
   * that choice, not this: an error is an `alert` and everything else a
   * `status`. The unrepairable state therefore arrives in a live region of its
   * own, and the announcement beside it says something else rather than the
   * same sentence again — hull detail's unknown hull is the same shape, with
   * the summary in the outlet and the explanation on the page.
   */
  readonly updateStatus = computed<ShellStatus | null>(() => {
    const state = this.#updates.state();
    if (state === 'current') {
      return null;
    }
    if (state === 'unusable') {
      return {
        tone: 'error' as const,
        message: this.#messages.message('update.unusable.notice'),
        detail: this.#messages.message('update.unusable.detail'),
      };
    }
    return {
      tone: 'info' as const,
      message: this.#messages.message('update.ready.notice'),
      detail: this.#messages.message('update.ready.detail'),
    };
  });

  /** The open screen's own identity block, where it publishes one. */
  readonly identity = this.chrome.identity;

  /**
   * Whether either exchange layer is wanted.
   *
   * The shell holds the state; the layers themselves are deferred. Neither one
   * is on screen in most sessions, and loading the Almanac's serializer, the
   * inspector and the delivery ports at startup for a control nobody pressed is
   * a megabyte spent on nothing.
   */
  readonly exchangeWanted = computed(() => this.#slef.layer() !== 'none');

  readonly replacementOpen = computed(() => this.#pending() !== null);
  readonly replacementTitle = this.#messages.messageSignal('workspace.replace.title');
  readonly replacementConfirm = this.#messages.messageSignal('workspace.replace.confirm');
  readonly replacementCancel = this.#messages.messageSignal('workspace.replace.cancel');
  readonly dismissLabel = this.#messages.messageSignal('action.close');

  /**
   * What is about to be lost, and what is arriving — both named.
   *
   * A confirmation that says only "you have unsaved changes" makes a Commander
   * guess which build they are about to discard.
   */
  readonly replacementDescription = computed(() => {
    const pending = this.#pending();
    if (pending === null) {
      return null;
    }
    return this.#messages.message('workspace.replace.description', {
      current: pending.question.currentHull ?? this.#messages.message('unavailable.value'),
      incoming: pending.question.incomingHull,
    });
  });

  constructor() {
    this.#router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.#path.set(event.urlAfterRedirects);
      }
    });

    this.#replacement.setConfirmer(
      (question) =>
        new Promise<boolean>((resolve) => {
          this.#pending.set({
            question,
            answer: (replace) => {
              this.#pending.set(null);
              resolve(replace);
            },
          });
        }),
    );

    // One announcement per version revision. A waiting version is a settled,
    // nonblocking change and waits its turn; a cached version that cannot be
    // repaired is blocking, because nothing else on the page can be trusted to
    // work, and interrupts (feedback contract).
    //
    // What each outlet carries differs by how the notice beside it is exposed.
    // A waiting version's notice is a `status`; an unrepairable one is an
    // `alert`, which is the stronger promise of the two, so the assertive
    // outlet carries a summary rather than the sentence the alert already
    // spoke, and the polite outlet repeats its notice. Which of the two roles
    // a reader actually speaks on insertion is a judgment no scan can make:
    // step 16 of `e2e/manual/screen-reader.protocol.md` is where it is settled,
    // and where a reader disagreeing sends this split back for a decision.
    //
    // The version is the only thing this depends on. Announcing resolves a
    // message, which reads the catalogue — tracked, that would make a committed
    // locale re-run this effect and republish an event that already happened,
    // over whatever the outlet was carrying.
    effect(() => {
      const { state, revision } = this.#updates.snapshot();
      if (state === 'current') {
        return;
      }

      untracked(() =>
        this.#announcements.announce({
          kind: 'app.update',
          revision,
          urgency: state === 'unusable' ? 'assertive' : 'polite',
          messageKey: state === 'unusable' ? 'update.unusable.announcement' : 'update.ready.notice',
        }),
      );
    });
  }

  answerReplacement(replace: boolean): void {
    this.#pending()?.answer(replace);
  }

  /**
   * Follows a shell navigation link without reloading the application.
   *
   * A full page load would discard the build a Commander is working on, which
   * is the one thing navigating between screens must never do. Modified clicks
   * — new tab, new window, download — are left to the browser, because that is
   * what the reader asked for.
   */
  navigateFromShell({ entry, event }: { entry: NavigationEntry; event: MouseEvent }): void {
    if (event.defaultPrevented || event.button !== 0) {
      return;
    }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    void this.#router.navigateByUrl(entry.href);
  }

  /** Shell actions are navigation intents; the frame never navigates itself. */
  selectAction(id: string): void {
    // The screen's own actions first: the shell places them and knows nothing
    // about what they mean.
    if (this.chrome.select(id)) {
      return;
    }
    if (id === IMPORT_ACTION) {
      this.#slef.openLayer('import');
      return;
    }
    if (id === HELP_ACTION) {
      this.help.openDialog();
      return;
    }
    if (id === UPDATE_ACTION) {
      void this.#updates.apply();
      return;
    }
    if (id === 'library') {
      void this.#router.navigateByUrl(NAVIGATION_ROUTES.library);
    }
  }
}
