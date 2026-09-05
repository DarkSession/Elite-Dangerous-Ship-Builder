import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Location } from '@angular/common';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  RouteConfigLoadStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { ApplicationUpdateStore } from './application/updates/application-update.store';
import { ActiveBuildStore } from './application/active-build/active-build.store';
import { MessageService } from './i18n/message.service';
import { AppNavigation, NAVIGATION_ROUTES } from './features/shared/app-navigation';
import { BuildLibraryPage } from './features/build-library/build-library.page';
import { LibraryPresence } from './features/build-library/library-presence';
import { ScreenChrome, WORKSPACE_EXPORT_ACTION } from './features/shared/screen-chrome';
import { LocaleStore } from './i18n/locale.store';
import { SlefStore } from './application/slef/slef.store';
import { ExportDialog } from './features/slef/export-build-layer/export.dialog';
import { ImportDialog } from './features/slef/import-build-layer/import.dialog';
import { AnnouncementService } from './ui/announcements/announcement.service';
import {
  AppFrame,
  type ToolEntry,
  type ShellAction,
  type ShellStatus,
} from './ui/components/app-frame/app-frame';
import { HelpPresenter } from './application/help/help.presenter';
import { HelpDialog } from './features/help/help-dialog.component';
import { Layer, type LayerWidth } from './ui/components/layer/layer';
import { StatusNotice } from './ui/components/status/status-notice';
import { Skeleton } from './ui/components/waiting/skeleton';

/** The shell action that opens the import layer, named once. */
export const IMPORT_ACTION = 'slef.import';

/**
 * Opening a build already saved on this device.
 *
 * An action rather than a place. The library is a layer over the screen a
 * Commander is on, with no address of its own, so a link to it would be a link
 * to nowhere — see `build-library/library-presence.ts`.
 */
export const LIBRARY_ACTION = 'library.open';

/** The shell action that opens the Help · About modal, named once. */
export const HELP_ACTION = 'help.open';

/** The shell action that starts the application over on a newer version. */
export const UPDATE_ACTION = 'app.update';

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
  imports: [
    AppFrame,
    BuildLibraryPage,
    ExportDialog,
    HelpDialog,
    ImportDialog,
    Layer,
    RouterOutlet,
    Skeleton,
    StatusNotice,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly #navigation = inject(AppNavigation);
  readonly #locale = inject(LocaleStore);
  readonly chrome = inject(ScreenChrome);
  readonly #router = inject(Router);
  readonly #location = inject(Location);
  readonly #messages = inject(MessageService);
  readonly #slef = inject(SlefStore);
  readonly #active = inject(ActiveBuildStore);
  readonly help = inject(HelpPresenter);
  readonly #updates = inject(ApplicationUpdateStore);
  readonly #announcements = inject(AnnouncementService);
  readonly library = inject(LibraryPresence);

  /**
   * The address on screen, as the chrome reads it.
   *
   * Seeded from `Location` rather than from `Router.url`, which is `/` until the
   * first navigation finishes. On a direct load of any address but the
   * shipyard's, that made the shell's first paint name no current tool at all —
   * `/equipment` drew `Equipment Builder` as a link to the page a Commander was
   * already on, and corrected itself a frame later (Commander request
   * 2026-09-04). `Location.path()` answers before the router has run, in the
   * browser and in the prerender alike.
   */
  readonly #path = signal(this.#location.path() || NAVIGATION_ROUTES.catalogue);

  /** Where the bar's insignia goes: the shipyard, from every screen but itself. */
  readonly home = computed(() => this.#navigation.home(this.#path()));

  /** The tools the shell names, with the open route's own marked as current. */
  readonly tools = computed(() => this.#navigation.tools(this.#path()));

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
   * It is also the one action the bar draws as a mark. The reference sets a `?`
   * on that trailing edge and spells the entry out in the narrow menu, and the
   * `symbol` here is what carries that difference: the same action, the same
   * name to a reader at both widths, drawn as the mark only where the reference
   * draws one.
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
    // Importing opens the bar's actions rather than closing them.
    //
    // No canvas draws either of the two ways a build arrives on the command
    // bar's action row — the shipyard's `IMPORT` sits beside `?` and its
    // `OPEN SAVED BUILD` is a control on the page — so where they go on a bar
    // that carries both is this application's decision. They belong beside each
    // other: they are the same question with two answers, and the screen's own
    // history and export sat between them (Commander request 2026-08-26).
    // The library is the first of the two, where it was the link in the bar's
    // navigation immediately before this row until it stopped being a place a
    // Commander goes (2026-09-04). It is drawn where it was drawn.
    const [first, ...rest] = screen;
    return [
      {
        id: LIBRARY_ACTION,
        label: this.#messages.message('navigation.library'),
        emphasis: 'secondary' as const,
      },
      {
        id: IMPORT_ACTION,
        label: this.#messages.message('slef.import.title'),
        emphasis: 'secondary' as const,
      },
      ...(first === undefined ? [] : [{ ...first, startsGroup: true }, ...rest]),
      {
        id: HELP_ACTION,
        label: this.help.actionLabel(),
        symbol: this.help.actionSymbol(),
        description: this.help.actionDescription(),
        emphasis: 'quiet' as const,
      },
      ...(update === null ? [] : [update]),
    ];
  });

  /**
   * The restart, offered only while there is something to restart onto.
   *
   * The way in for the two cases the overlay does not cover: a cached version
   * the worker cannot repair, which is never restarted on a clock, and a newer
   * version whose restart could not happen because there was no page to start
   * over. Where the overlay *is* up this stays away — see below — because the
   * page under it is inert and a control nobody can reach is no control.
   *
   * Not pressing it costs nothing. The newer version is already downloaded, and
   * the next start of the application is served it.
   */
  readonly updateAction = computed<ShellAction | null>(() => {
    const state = this.#updates.state();
    if (state === 'current') {
      return null;
    }
    if (state === 'ready' && this.#updates.overlay()) {
      // The page under a modal layer is inert, so an action drawn here while
      // the overlay stands is one a Commander cannot press. It appears only if
      // the restart the overlay announced could not be carried out.
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
    if (state === 'ready' && this.#updates.overlay()) {
      // Same sentence, said by the overlay. On the shell as well it would be
      // the notice a reader meets twice for one event (feedback contract).
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

  /**
   * The overlay that stands over the page while the restart is coming.
   *
   * Everything about it is here rather than in a component of its own: it is
   * one layer, mounted beside the frame like the help dialog, and what it says
   * is the shell's own account of the version this session is running.
   *
   * It offers nothing to press. The restart is not a question (owner's
   * decision, 2026-08-27), so the layer is drawn with no dismiss label, which
   * is what takes its control, Escape and its ground away together.
   */
  readonly updateOverlay = computed(() => this.#updates.overlay());
  readonly updateOverlayTitle = this.#messages.messageSignal('update.applying.title');
  readonly updateOverlayNotice = this.#messages.messageSignal('update.applying.notice');

  /**
   * The notice the session that came up after the restart draws.
   *
   * The overlay above went with the page that drew it, and a Commander who
   * looked away for those few seconds would otherwise find a page that had
   * silently become a different one. This says what happened and which version
   * it happened onto, and it is dismissed rather than waited out.
   */
  readonly updateApplied = computed(() => this.#updates.applied());
  readonly updateAppliedTitle = this.#messages.messageSignal('update.applied.title');
  readonly updateAppliedNotice = this.#messages.messageSignal('update.applied.notice');
  readonly updateAppliedDismiss = this.#messages.messageSignal('update.applied.dismiss');
  readonly updateAppliedDetail = computed(() =>
    this.#messages.message('update.applied.detail', {
      version: this.help.manifest.build.applicationVersion,
    }),
  );

  /** Takes the after-the-restart notice down, having been read. */
  acknowledgeUpdate(): void {
    this.#updates.acknowledgeApplied();
  }

  /** The open screen's own identity block, where it publishes one. */
  readonly identity = this.chrome.identity;

  /** The compact bar a screen opened over another one publishes, where one does. */
  readonly back = this.chrome.return;

  /**
   * Whether either exchange layer is wanted.
   *
   * The shell holds the state; the layers themselves are deferred. Neither one
   * is on screen in most sessions, and loading the Almanac's serializer, the
   * inspector and the delivery ports at startup for a control nobody pressed is
   * a megabyte spent on nothing.
   */
  readonly exchangeWanted = computed(() => this.#slef.layer() !== 'none');

  /** The way out of a layer, and of the state that stands in for one. */
  readonly dismissLabel = this.#messages.messageSignal('action.close');

  /** What a layer says while the chunk that draws it is on its way. */
  readonly layerPendingNotice = this.#messages.messageSignal('layer.pending.notice');

  /** What a layer says when the chunk that draws it did not arrive. */
  readonly layerFailedNotice = this.#messages.messageSignal('layer.failed.notice');

  /** What the frame says while the screen's own chunk is on its way. */
  readonly routePendingNotice = this.#messages.messageSignal('route.pending.notice');

  /**
   * The name the waiting layer takes.
   *
   * The import layer's own name, and for export the name it takes before a hull
   * is known. The layer that arrives names itself for the build it is about,
   * which needs the build and the hull's own text: reaching for those here
   * would load, in the shell, the presenter whose chunk this is waiting for.
   *
   * So the export layer's name gains the hull when the chunk lands. The layer
   * is named throughout, which is what a reader needs; the name it settles on
   * is the more precise of the two.
   */
  readonly exchangePendingTitle = computed(() =>
    this.#messages.message(
      this.#slef.layer() === 'import' ? 'slef.import.title' : 'slef.export.title',
    ),
  );

  /**
   * The width the waiting exchange layer takes.
   *
   * The width of the layer it stands in for. The import layer is a panel at the
   * default measure and the export layer is a wide one, so a placeholder at one
   * width would grow or shrink under the hand that opened it when the chunk
   * lands.
   */
  readonly exchangePendingWidth = computed<LayerWidth>(() =>
    this.#slef.layer() === 'export' ? 'wide' : 'default',
  );

  readonly libraryPendingTitle = this.#messages.messageSignal('library.title');

  /** Takes back the request that opened a layer, before the layer is there. */
  cancelExchange(): void {
    this.#slef.closeLayer();
  }

  /**
   * Whether this navigation asked for a chunk it has not finished with.
   *
   * Raised by the first fetch and lowered by the screen, not by the fetch. A
   * chunk that has landed is a screen that still has to be created and drawn,
   * and a skeleton taken down at the end of the fetch leaves the frame empty
   * for that gap.
   *
   * Every fetch this can see belongs to a navigation, which is what lowers it
   * again on the paths where no screen arrives. A preloading strategy would
   * break that: it asks for chunks outside any navigation, and there would be
   * no `Navigation*` event to answer the raise. This application registers
   * none.
   */
  readonly #routeLoading = signal(false);

  /**
   * Whether this frame has held a screen.
   *
   * Raised once and never lowered. The router takes the old screen out and puts
   * the new one in inside one step, so a frame that has held a screen holds one
   * from then on: what changes is which.
   */
  readonly #screenShown = signal(false);

  /**
   * Whether a screen is on its way to a frame that has none.
   *
   * Two conditions, and both are needed. The router reports a chunk only when
   * it has one to fetch, so an address already loaded draws nothing. And a
   * screen already on the frame stays there while the next one loads, which is
   * what the router does for free — a skeleton over that would take a screen
   * away to say another was coming (011/FR-029).
   */
  readonly routeWaiting = computed(() => this.#routeLoading() && !this.#screenShown());

  routeActivated(): void {
    this.#screenShown.set(true);
  }

  constructor() {
    this.#router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.#path.set(event.urlAfterRedirects);
      }
      if (event instanceof RouteConfigLoadStart) {
        this.#routeLoading.set(true);
      }
      // The router reports the end of a fetch that succeeded and says nothing
      // about one that failed, so a chunk that cannot be fetched would leave
      // the frame saying a screen is loading for the rest of the session. Every
      // way a navigation can finish lowers it.
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.#routeLoading.set(false);
      }
    });

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
    // The version and whether the overlay stands are the only things this
    // depends on. Announcing resolves a message, which reads the catalogue —
    // tracked, that would make a committed locale re-run this effect and
    // republish an event that already happened, over whatever the outlet was
    // carrying.
    effect(() => {
      const { state, revision } = this.#updates.snapshot();
      if (state === 'current') {
        return;
      }

      // Not while the overlay stands. It opens with `showModal()` in the same
      // tick the state arrives, which makes everything outside the dialog
      // inert — the outlet included, since it is mounted inside the frame — so
      // an announcement published here would be one no reader is ever offered.
      // The overlay is the announcement in that state: it takes focus and its
      // description is read where it stands.
      //
      // Tracked rather than read in `untracked`, because the overlay coming
      // down is exactly when this has something to say. A restart that could
      // not be carried out lowers it without moving the state or the revision,
      // and the notice left on the shell is the one thing telling a reader the
      // session is behind. `(kind, revision, urgency)` is the dedupe identity,
      // so a later version raising and lowering the overlay again does not say
      // it twice.
      if (state === 'ready' && this.#updates.overlay()) {
        return;
      }

      untracked(() =>
        this.#announcements.announce({
          kind: 'app.update',
          revision,
          urgency: state === 'unusable' ? 'assertive' : 'polite',
          // The durable fact, not the thing about to happen. An announcement
          // is spoken once and cannot be taken back, and this only reaches a
          // reader once the restart has already failed, where "this session is
          // restarting on it" would be a statement nothing corrects.
          messageKey: state === 'unusable' ? 'update.unusable.announcement' : 'update.ready.notice',
        }),
      );
    });
  }

  /**
   * Follows a shell navigation link without reloading the application.
   *
   * A full page load would discard the build a Commander is working on, which
   * is the one thing navigating between screens must never do. Modified clicks
   * — new tab, new window, download — are left to the browser, because that is
   * what the reader asked for.
   */
  navigateFromShell({ entry, event }: { entry: ToolEntry; event: MouseEvent }): void {
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
    if (id === WORKSPACE_EXPORT_ACTION) {
      if (this.#active.loadout() === null) {
        return;
      }
      if (this.#active.link().kind === 'refused') {
        this.#slef.selectExportMode('slef');
      }
      this.#slef.openLayer('export');
      return;
    }
    if (id === LIBRARY_ACTION) {
      this.library.raise();
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
  }
}
