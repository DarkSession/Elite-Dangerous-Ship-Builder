import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { LocaleStore } from '../../../i18n/locale.store';
import { MessageService } from '../../../i18n/message.service';
import { AnnouncementOutlet } from '../../announcements/announcement-outlet';
import { AnnouncementService } from '../../announcements/announcement.service';
import {
  ShipIdentityFields,
  type IdentityCommit,
  type IdentityField,
} from '../../outfitting/ship-identity-fields';
import { ActionButton } from '../action/action-button';
import { ActionLayer } from './action-layer';
import { StatusNotice, type StatusTone } from '../status/status-notice';
import { observeBanner } from './sticky-banner';

/** One entry in the primary navigation. */
export interface NavigationEntry {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly current?: boolean;
}

/**
 * One tool the application carries.
 *
 * The same shape as a navigation entry, and read differently: `current` means
 * the open route belongs to this tool, and the frame then names it rather than
 * offering it. It is a separate type because the two lists mean different
 * things — which screen, and which tool — and one of them will grow fields the
 * other has no use for.
 */
export type ToolEntry = NavigationEntry;

/** One shell action. Always has a text name — never an icon alone. */
export interface ShellAction {
  readonly id: string;
  readonly label: string;
  /**
   * A conventional typographic mark drawn on the wide bar in place of the
   * words, or absent for the words themselves.
   *
   * Only the reference's `?` uses it, and only where the reference draws it:
   * on the trailing edge of the wide command bar, where a bar that is already
   * carrying a build's name has no room for a fourth phrase. It never replaces
   * the label — `label` remains the action's accessible name and the folded
   * action layer goes on drawing it in words, as canvas 1d does.
   */
  readonly symbol?: string;
  /**
   * A conventional typographic mark drawn *beside* the words, or absent.
   *
   * Canvas 1c's history pair — `↶ UNDO` and `REDO ↷` — is what this is for.
   * Unlike `symbol` it never replaces the label: the word is drawn either way,
   * so the mark is a second rendering of a name the control already carries and
   * is hidden from a reader for the same reason the divider is.
   */
  readonly mark?: string;
  /**
   * Which side of the label that mark is drawn on. Leading unless said.
   *
   * Canvas 1c draws `↶ UNDO` and `REDO ↷`: each arrow points the way
   * its action travels, so the one going forward follows its word.
   */
  readonly markPosition?: 'leading' | 'trailing';
  readonly emphasis?: 'primary' | 'secondary' | 'quiet' | 'danger';
  readonly disabled?: boolean;
  /** What activating it would do, said only to a reader. Never drawn. */
  readonly description?: string;
  /**
   * Whether the canvas's hairline divider is drawn before this action.
   *
   * Canvas 1c rules one between the history pair and the committing actions —
   * `↶ UNDO  REDO ↷ │ EXPORT  SAVE  ?`. It is decoration and is hidden from a
   * reader, who has the actions' own names to go by.
   */
  readonly startsGroup?: boolean;
}

/**
 * A screen's own identity, drawn in place of the bar's plain title.
 *
 * Only the workspace publishes one: canvas 1c and 1d both put the build's name
 * where the screen's name goes on every other screen, with the hull and the ID
 * plate under it. The frame renders it and owns none of it — the values and
 * what confirming one means both belong to the screen (FR-019).
 */
export interface ScreenIdentity {
  readonly name: string | null;
  /**
   * What the bar reads when the build has no name of its own.
   *
   * Published by the screen rather than defaulted to the route's word, so an
   * unnamed build is titled by what the build calls itself — its ident, else
   * its hull — exactly as the library titles the same record's row. A Commander
   * moving between the two surfaces reads one title, not two (FR-010, ruled
   * 2026-08-25).
   */
  readonly fallbackName?: string | null;
  readonly detail: string | null;
  readonly ident: string | null;
  /** Which field is open for editing, or `null` for the drawn, idle state. */
  readonly editing: 'name' | 'ident' | null;
}

/**
 * A screen that is a layer over another one, at compact width.
 *
 * Canvas 1b's hull sheet replaces the shipyard's bar with one of its own: a
 * bare `←` on the leading edge, the hull's name where the screen's name
 * goes, and its manufacturer line under that. No insignia, no release mark and
 * no count — the sheet is not a screen a Commander navigated to, it is one they
 * opened, and its bar says what they opened and how to close it.
 *
 * Only compact width draws it. At wide width the same route is an inspector
 * beside the manifest that is still on screen, so the bar goes on naming the
 * shipyard and the way back is the manifest itself (canvas 1a).
 */
export interface ScreenReturn {
  /** The way back, as a real link: an address that opens and copies. */
  readonly back: NavigationEntry;
  /**
   * What the layer is showing, drawn where the screen's name would be, or
   * `null` where the package could not supply a name at all — the bar then
   * carries the way back alone and the screen goes on saying, in its own body,
   * what it could not name.
   */
  readonly title: string | null;
  /** The line under it, or none. */
  readonly detail: string | null;
}

/** Visible route or global feedback, in ordinary reading order. */
export interface ShellStatus {
  readonly tone: StatusTone;
  readonly message: string;
  readonly detail?: string;
}

/**
 * The application frame.
 *
 * Supplies the landmarks, route identity, actions and feedback outlets that
 * surround every capability — and owns none of their state. Route context
 * arrives as immutable presentation input and the frame emits intent; it never
 * reaches into a build store (constitution III).
 *
 * The reference puts the screen's own name in the command bar and nowhere
 * else, so that name is the document's one `h1` and routes do not render a
 * second copy of it (canvas 1a/1b/1c, "Command bar").
 */
@Component({
  selector: 'edsb-app-frame',
  imports: [ActionButton, ActionLayer, AnnouncementOutlet, ShipIdentityFields, StatusNotice],
  templateUrl: './app-frame.html',
  styleUrl: './app-frame.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // On the host rather than on the header, because the regions below the bar
  // have to hear it too: what they have to clear is the bar's, and a released
  // bar is nothing to clear (`app-frame.scss`).
  host: {
    '[class.frame--returning]': 'back() !== null',
    '[class.frame--released]': 'bannerReleased()',
    '[style.--edsb-layout-bar-height]': 'barHeight()',
  },
})
export class AppFrame {
  readonly #messages = inject(MessageService);
  readonly #locale = inject(LocaleStore);
  readonly #announcements = inject(AnnouncementService);

  /** Visible identity of the current screen or build, supplied by the route. */
  readonly routeContext = input<string | null>(null);

  /** The one count the bar carries beside that name, when the screen has one. */
  readonly routeCount = input<string | null>(null);

  readonly navigation = input<readonly NavigationEntry[]>([]);

  /**
   * The tools the application carries, in the order the bar draws them.
   *
   * One of them is the whole registry today, and the bar then names that tool
   * and offers no other — which is what the bar is for, and what it says to
   * everyone else.
   *
   * Empty on a surface that carries no tools at all — the component preview
   * catalogue is one — and the region is then not in the document, so no reader
   * meets a navigation landmark with nothing in it (011/FR-028).
   */
  readonly tools = input<readonly ToolEntry[]>([]);

  /**
   * Where the bar's own insignia goes, when it goes anywhere.
   *
   * Every canvas puts the mark on the leading edge of the bar, and the
   * 2026-08-26 revision put it where the outfitting bar's `SHIPYARD` chip used
   * to be. So the mark carries that trip, and the word is not drawn twice. A
   * screen that supplies none draws the mark as the decoration it is.
   */
  readonly home = input<NavigationEntry | null>(null);

  /**
   * The compact bar a layered screen publishes, where one does.
   *
   * Rendered alongside the ordinary bar and hidden at the width it does not
   * belong to, the way the wide action row and the folded action layer already
   * are: `display: none` takes the composition that is not in use out of the
   * accessibility tree, so exactly one `h1` and one way back are ever exposed.
   */
  readonly back = input<ScreenReturn | null>(null);

  /** The open screen's own identity block, where it publishes one. */
  readonly identity = input<ScreenIdentity | null>(null);
  readonly actions = input<readonly ShellAction[]>([]);

  /** Visible route or global feedback. Ordinary content, not a live region. */
  readonly status = input<ShellStatus | null>(null);

  readonly actionSelected = output<string>();

  /** The identity block asked to open, close or confirm one of its fields. */
  readonly identityOpened = output<IdentityField>();
  readonly identityClosed = output<void>();
  readonly identityCommitted = output<IdentityCommit>();

  /**
   * A primary navigation link was activated.
   *
   * The link stays a real link — it has an `href`, it can be opened in a new
   * tab, its address can be copied — and the frame does not decide what
   * activating it means. The event is handed to the caller so an application
   * that routes on the client can take it over, and one that does not (the
   * preview catalogue) simply lets the browser follow the link.
   */
  readonly navigationSelected = output<{ entry: NavigationEntry; event: MouseEvent }>();

  /**
   * A tool was chosen. Only ever one the Commander is not already in: the
   * current tool is drawn as text and has nothing to activate.
   */
  readonly toolSelected = output<{ entry: ToolEntry; event: MouseEvent }>();

  readonly bannerLabel = this.#messages.messageSignal('shell.banner.label');
  readonly navigationLabel = this.#messages.messageSignal('shell.navigation.label');
  readonly toolsLabel = this.#messages.messageSignal('shell.tools.label');
  readonly actionsLabel = this.#messages.messageSignal('shell.actions.label');
  readonly statusLabel = this.#messages.messageSignal('shell.status.label');
  readonly betaLabel = this.#messages.messageSignal('shell.beta');

  /**
   * Which side of the bar's identity the release mark stands on.
   *
   * It follows a plain screen title and leads a screen's own identity block.
   * Canvas 1a draws the first — `SHIPYARD BETA · 48 SHIPS`, a beta shipyard —
   * and canvases 1c and 1d the second, where the identity is the Commander's
   * own build name in a field they can edit: a chip after that reads as part of
   * the name, and the build is not the thing in beta.
   *
   * A bar carrying neither leads, because there is nothing there to follow.
   */
  readonly betaFollowsTitle = computed(
    () => this.identity() === null && this.routeContext() !== null,
  );
  readonly actionsOpenLabel = this.#messages.messageSignal('shell.actions.open');
  readonly actionsCloseLabel = this.#messages.messageSignal('shell.actions.close');

  /**
   * Whether the folded action layer is open.
   *
   * Pure view state: which controls are currently on screen. It is not domain
   * state, is never persisted, and is reset by nothing but the Commander, so
   * holding it here does not make the frame a store (constitution III).
   */
  readonly actionsOpen = signal(false);

  protected readonly banner = viewChild<ElementRef<HTMLElement>>('banner');

  /**
   * Whether the banner has released the top of the screen.
   *
   * Not a preference and not a composition mode: it is the answer to how much
   * of the window the bar is currently taking, which only the rendered bar
   * knows. Held here because the header is the frame's own element; every
   * screen below it goes on composing as it did.
   */
  readonly #bannerMeasurement = observeBanner(this.banner);

  readonly bannerReleased = this.#bannerMeasurement.released;

  /**
   * What a region below has to clear, as the bar actually came out.
   *
   * The token layer declares the one height the bar is drawn at, which is what
   * it is at every width where it does not wrap. Every width where it does
   * wrap draws more rows than one — so the declared figure is a floor the real
   * bar passes, not the height a sticky region under it can offset by.
   * Published from the measurement so a region that freezes below the bar,
   * reserves scroll room for it or subtracts it from its own height clears the
   * bar that is there.
   *
   * `null` until the first reading, and while the bar is released there is
   * nothing to clear — which is the same `0px` the token layer already gives a
   * released frame, restated here because an inline value outranks that rule
   * (Commander request 2026-08-25).
   */
  protected readonly barHeight = computed(() => {
    if (this.bannerReleased()) {
      return '0px';
    }
    const drawn = this.#bannerMeasurement.height();
    return drawn === null ? null : `${drawn}px`;
  });

  setActionsOpen(open: boolean): void {
    this.actionsOpen.set(open);
  }

  selectActionById(id: string): void {
    this.actionsOpen.set(false);
    this.actionSelected.emit(id);
  }

  /**
   * The locale outcome, as visible text.
   *
   * One thing a Commander needs to be told and would otherwise only be able to
   * infer: that the language their browser asked for could not be loaded and
   * English is standing in for it. It is ordinary content in reading order, not
   * a live region — the announcement below is what interrupts, once (FR-019).
   */
  readonly localeNotice = computed<ShellStatus | null>(() => {
    const snapshot = this.#locale.snapshot();

    if (snapshot.status === 'fallback') {
      return {
        tone: 'warning',
        message: this.#messages.message('locale.fallback.notice', {
          locale: snapshot.requestedLocale,
        }),
        detail: this.#messages.message(
          snapshot.fallbackReason === 'load-failed'
            ? 'locale.fallback.reason.load-failed'
            : 'locale.fallback.reason.invalid',
        ),
      };
    }

    return null;
  });

  /**
   * Everything the shell currently has to say, in reading order.
   *
   * The route's or the application's own feedback first, the locale outcome
   * after it. Two independent facts can be true at once — a language that could
   * not be loaded while a newer version waits to be applied — and a region that
   * showed only the first of them would drop the other silently.
   */
  readonly notices = computed<readonly ShellStatus[]>(() => {
    const standing: ShellStatus[] = [];
    const supplied = this.status();
    if (supplied !== null) {
      standing.push(supplied);
    }
    const locale = this.localeNotice();
    if (locale !== null) {
      standing.push(locale);
    }
    return standing;
  });

  constructor() {
    // One polite announcement per committed locale revision, and only when
    // there is something to say. A settled change does not interrupt current
    // speech, and the dedupe identity keeps a re-render from repeating it.
    //
    // The snapshot is the only thing this depends on. Announcing resolves a
    // message, which reads the catalogue the same snapshot carries — tracked,
    // that would be a second run for one commit, republishing an event over
    // whatever the outlet had moved on to.
    effect(() => {
      const snapshot = this.#locale.snapshot();
      if (snapshot.status !== 'fallback') {
        return;
      }

      untracked(() =>
        this.#announcements.announce({
          kind: 'locale.fallback',
          revision: snapshot.revision,
          urgency: 'polite',
          messageKey: 'locale.fallback.notice',
          params: { locale: snapshot.requestedLocale },
        }),
      );
    });
  }

  selectAction(action: ShellAction): void {
    if (action.disabled ?? false) {
      return;
    }
    this.actionSelected.emit(action.id);
  }
}
