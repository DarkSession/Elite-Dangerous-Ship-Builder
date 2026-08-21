import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { LocaleStore } from '../../../i18n/locale.store';
import { MessageService } from '../../../i18n/message.service';
import { AnnouncementOutlet } from '../../announcements/announcement-outlet';
import { AnnouncementService } from '../../announcements/announcement.service';
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
  imports: [ActionButton, ActionLayer, AnnouncementOutlet, StatusNotice],
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
  readonly actions = input<readonly ShellAction[]>([]);

  /** Visible route or global feedback. Ordinary content, not a live region. */
  readonly status = input<ShellStatus | null>(null);

  readonly actionSelected = output<string>();

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

  constructor() {
    // One polite announcement per committed locale revision, and only when
    // there is something to say. A settled change does not interrupt current
    // speech, and the dedupe identity keeps a re-render from repeating it.
    effect(() => {
      const snapshot = this.#locale.snapshot();
      if (snapshot.status !== 'fallback') {
        return;
      }

      this.#announcements.announce({
        kind: 'locale.fallback',
        revision: snapshot.revision,
        urgency: 'polite',
        messageKey: 'locale.fallback.notice',
        params: { locale: snapshot.requestedLocale },
      });
    });
  }

  selectAction(action: ShellAction): void {
    if (action.disabled ?? false) {
      return;
    }
    this.actionSelected.emit(action.id);
  }
}
