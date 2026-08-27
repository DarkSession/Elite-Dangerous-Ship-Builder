import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { ActiveBuildStore } from '../active-build/active-build.store';
import { MessageService } from '../../i18n/message.service';
import { NavigatorAdapter } from '../../platform/browser/navigator.adapter';
import type {
  ShareLinkFeedback,
  ShareLinkState,
} from '../../ui/components/share-link-panel/share-link-panel';
import { FragmentPublisher } from './fragment-publisher';
import { LinkErrorMapper } from './link-error.mapper';

/**
 * How long a successful copy is said on the control that did it.
 *
 * The reference's own number: it swaps the button's text for `COPIED ✓` and
 * puts the label back 1200 ms later. Long enough to be read, short enough that
 * a control never sits there claiming something that happened a minute ago.
 */
const COPIED_HOLD_MS = 1_200;

/**
 * Everything the share-link panel shows, and every intent it emits.
 *
 * Lifted out of the layer that draws it. The panel is composed inside feature
 * 004's exchange layer, where a component may not reach a store, a clipboard or
 * a navigator — and the rule is right: copying a link, retrying an encode and
 * reading the current publication state are decisions about feature 001's
 * build, not about the layer that happens to be drawing them.
 *
 * Every failure leaves the link itself on screen and selectable, which is only
 * true because nothing here clears the URL on a failed action.
 */
@Injectable({ providedIn: 'root' })
export class LinkSharePresenter {
  readonly #messages = inject(MessageService);
  readonly #active = inject(ActiveBuildStore);
  readonly #publisher = inject(FragmentPublisher);
  readonly #errors = inject(LinkErrorMapper);
  readonly #navigator = inject(NavigatorAdapter);

  readonly #feedback = signal<ShareLinkFeedback>('idle');

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#stopHolding());
  }

  readonly feedback = this.#feedback.asReadonly();
  readonly shareAvailable = this.#navigator.canShare();

  readonly state = computed<ShareLinkState>(() => this.#active.link().kind);

  readonly url = computed(() => {
    const link = this.#active.link();
    return link.kind === 'published' ? this.#publisher.publishedUrl() : null;
  });

  readonly refusal = computed(() => {
    const link = this.#active.link();
    return link.kind === 'refused'
      ? this.#errors.describe({ code: link.code, slot: link.slot })
      : null;
  });

  async copy(): Promise<void> {
    const url = this.url();
    if (url === null) {
      return;
    }
    // Cleared first, so a second copy flashes again rather than setting a
    // signal to the value it already holds and announcing nothing.
    this.#stopHolding();
    this.#feedback.set('idle');
    const copied = await this.#navigator.copyText(url);
    this.#feedback.set(copied ? 'copied' : 'copy-failed');
    if (copied) {
      this.#hold = setTimeout(() => {
        this.#hold = null;
        this.#feedback.set('idle');
      }, COPIED_HOLD_MS);
    }
  }

  async share(): Promise<void> {
    const url = this.url();
    if (url === null) {
      return;
    }
    this.#stopHolding();
    // A dismissal and a failure are the same answer for a link: it did not
    // leave this way, so the one on screen is still the way out.
    const shared =
      (await this.#navigator.shareData({
        title: this.#messages.message('link.title'),
        url,
      })) === 'shared';
    this.#feedback.set(shared ? 'idle' : 'share-failed');
  }

  /** Encodes again, for a refusal that came from something transient. */
  retry(): void {
    this.#stopHolding();
    this.#feedback.set('idle');
    void this.#publisher.publish();
  }

  /**
   * The pending restore of the copy control's own label.
   *
   * A timer rather than a signal that expires by itself, because what it is
   * timing is a label a Commander is reading. It is cancelled by anything that
   * decides the feedback again, and by the injector going away — an application
   * torn down mid-flash must not wake up to write to a destroyed signal.
   */
  #hold: ReturnType<typeof setTimeout> | null = null;

  #stopHolding(): void {
    if (this.#hold !== null) {
      clearTimeout(this.#hold);
      this.#hold = null;
    }
  }
}
