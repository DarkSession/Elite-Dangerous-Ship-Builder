import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import {
  ReplacementCoordinator,
  type ReplacementQuestion,
} from './application/active-build/replacement-coordinator';
import { MessageService } from './i18n/message.service';
import { AppNavigation, NAVIGATION_ROUTES } from './features/shared/app-navigation';
import { AppFrame, type NavigationEntry } from './ui/components/app-frame/app-frame';
import { ConfirmDialog } from './ui/components/confirm-dialog/confirm-dialog';

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
  imports: [AppFrame, ConfirmDialog, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly #navigation = inject(AppNavigation);
  readonly #router = inject(Router);
  readonly #messages = inject(MessageService);
  readonly #replacement = inject(ReplacementCoordinator);

  readonly #path = signal(this.#router.url);
  readonly #pending = signal<PendingReplacement | null>(null);

  readonly navigation = computed(() => this.#navigation.entries(this.#path()));

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
    if (id === 'library') {
      void this.#router.navigateByUrl(NAVIGATION_ROUTES.library);
    }
  }
}
