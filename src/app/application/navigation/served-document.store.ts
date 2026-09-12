import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationCancellationCode,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
} from '@angular/router';
import { ServedContentAdapter } from '../../platform/browser/served-content.adapter';

/**
 * Whether a cancellation is a handover to a replacement the router has taken
 * on.
 *
 * Both codes name a replacement already on its way: one press superseding
 * another, and a guard sending the Commander somewhere else. A handover is not
 * an ending, so what the replacement does is what decides — the pair counts as
 * one presentation (`openspec/specs/platform/published-addresses/`, "What an
 * address served is held until a screen replaces it").
 *
 * `navigation-waiting` reads the same two codes for its own purpose, which is
 * keeping one waiting statement standing across the pair (018/FR-005). They are
 * two readings of one fact the router states rather than one rule in two
 * places: that capability says what is said, and this one says what the
 * Commander is left on.
 */
function handsOver(event: NavigationCancel): boolean {
  return (
    event.code === NavigationCancellationCode.SupersededByNewNavigation ||
    event.code === NavigationCancellationCode.Redirect
  );
}

/**
 * What the address served, held until a screen replaces it.
 *
 * The build writes a document for every content-bearing address, and a
 * Commander is reading it before any script runs. The takeover hands that
 * document to a screen the application presents; hydration claims the nodes
 * that screen renders, and where no screen renders, nothing claims them and
 * they go. This is what keeps them: the copy `ServedContentAdapter` took
 * before the first navigation goes back where it was taken from, in the render
 * that would otherwise have emptied the page (023/FR-001).
 *
 * It renders nothing and is tested without rendering (constitution III). The
 * frame takes the nodes as an input and places them in its own container.
 *
 * **The boundary is the first screen presented, not the first navigation.** The
 * hold ends at the router's first `NavigationEnd` and nowhere else. Every other
 * ending — a failure, a cancellation with nothing taking over, or the router
 * answering a handover without navigating — presented no screen, so the
 * Commander is still owed what the address served.
 *
 * Screens presented rather than navigations run, and rather than errors raised.
 * A rule written about `NavigationError` alone would leave the cancelled
 * Commander on an empty shell with no statement over it, because a cancellation
 * is stated as nothing (018/FR-007) — which is worse than either outcome this
 * exists for. A rule written about the session's first navigation would miss the
 * pair: a first navigation handed over to a replacement that then fails has
 * presented no screen either.
 *
 * **Nothing is held where nothing was served.** A development server generates
 * no document and an address the build writes none for answers with the shell,
 * so the copy is empty and the Commander is left on that shell — which is what
 * that address served them (018/FR-007). One rule, not two.
 */
@Injectable({ providedIn: 'root' })
export class ServedDocumentStore {
  readonly #router = inject(Router);

  /**
   * The copy, taken as this is constructed.
   *
   * Injected here rather than where it is read, because the only moment the
   * copy can be taken is before the router reaches the outlet: this store is
   * created by an application initializer registered ahead of `provideRouter`,
   * and constructing it is what takes the copy (`src/app/app.config.ts`).
   */
  readonly #served = inject(ServedContentAdapter);

  readonly #held = signal<readonly Node[] | null>(null);

  /**
   * What the frame is to put back in the outlet's place, or `null`.
   *
   * `null` until a navigation ends with no screen presented, and `null` again
   * from the first `NavigationEnd` onward. The nodes are the same ones on every
   * read: the frame is the only thing that renders them, and it places them
   * once.
   */
  readonly held = this.#held.asReadonly();

  /**
   * The language the held content is in, where the document declared one.
   *
   * Constant for the life of the page: it is what the document said when it was
   * served, which is not something a later render can change. The frame states
   * it on the container, because by then the application has written the
   * committed locale onto the document root and the content standing under it
   * is in another language (023/FR-001, 011/FR-017).
   */
  readonly language = this.#served.language;

  /**
   * The height of the box the content was served in.
   *
   * Handed on for the frame to stand the copy in the same box. The shell
   * stretches a screen shorter than the window to the rest of it, so a copy put
   * back into a box measured from its own content stands where its content ends
   * rather than where it was served (023/FR-001, 015/FR-009).
   */
  readonly height = this.#served.height;

  /**
   * Whether a screen has been presented in this session.
   *
   * What ends the hold, once and for the life of the page. Not a count and not
   * a reference to the screen: after the first one, nothing this store knows
   * could be put back over what a Commander is using (023/FR-001).
   */
  #screenPresented = false;

  /**
   * The navigation being followed, or `null` between navigations.
   *
   * Held so an ending can be matched to the navigation it belongs to, and so a
   * handover can be told from an ending with nothing behind it.
   */
  #running: number | null = null;

  constructor() {
    const events = this.#router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.#running = event.id;
        return;
      }
      if (event instanceof NavigationEnd) {
        this.#present(event.id);
        return;
      }
      if (event instanceof NavigationCancel && handsOver(event)) {
        // Not an ending. The replacement is what decides, and until it ends
        // there is nothing to put back and nothing to release.
        if (this.#running === event.id) {
          this.#running = null;
        }
        return;
      }
      if (event instanceof NavigationSkipped) {
        // The router answering an address it is already at. Read for one case:
        // where it is what took over a handover, nothing is running and this is
        // the end of the pair, with no screen presented. Where a navigation is
        // running, this is not its ending and is left to it.
        if (this.#running === null) {
          this.#restore();
        }
        return;
      }
      if (event instanceof NavigationError || event instanceof NavigationCancel) {
        if (this.#running !== null && this.#running !== event.id) {
          // An ending for a navigation this store is no longer following.
          return;
        }
        this.#running = null;
        this.#restore();
      }
    });

    inject(DestroyRef).onDestroy(() => events.unsubscribe());
  }

  /** A screen stands in the outlet, so there is nothing left to put back. */
  #present(id: number): void {
    if (this.#running !== null && this.#running !== id) {
      return;
    }
    this.#running = null;
    this.#screenPresented = true;
    this.#held.set(null);
    // And the copy itself goes, not only the offer of it. Nothing can be put
    // back after this, so a clone of the served document held for the life of
    // the page is memory spent on a page the Commander cannot be returned to.
    this.#served.release();
  }

  #restore(): void {
    if (this.#screenPresented) {
      return;
    }
    this.#held.set(this.#served.content);
  }
}
