import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
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

/** One entry in the primary navigation. */
export interface NavigationEntry {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly current?: boolean;
}

/** One shell action. Always has visible text — never an icon alone. */
export interface ShellAction {
  readonly id: string;
  readonly label: string;
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
  readonly detail: string | null;
  readonly ident: string | null;
  /** Which field is open for editing, or `null` for the drawn, idle state. */
  readonly editing: 'name' | 'ident' | null;
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

  readonly bannerLabel = this.#messages.messageSignal('shell.banner.label');
  readonly navigationLabel = this.#messages.messageSignal('shell.navigation.label');
  readonly actionsLabel = this.#messages.messageSignal('shell.actions.label');
  readonly statusLabel = this.#messages.messageSignal('shell.status.label');
  readonly actionsOpenLabel = this.#messages.messageSignal('shell.actions.open');
  readonly actionsCloseLabel = this.#messages.messageSignal('shell.actions.close');

  /**
   * Whether the compact action layer is open.
   *
   * Pure view state: which controls are currently on screen. It is not domain
   * state, is never persisted, and is reset by nothing but the Commander, so
   * holding it here does not make the frame a store (constitution III).
   */
  readonly actionsOpen = signal(false);

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
