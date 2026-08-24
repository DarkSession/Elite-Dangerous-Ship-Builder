import { Injectable, computed, inject, signal } from '@angular/core';
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
    this.#feedback.set((await this.#navigator.copyText(url)) ? 'copied' : 'copy-failed');
  }

  async share(): Promise<void> {
    const url = this.url();
    if (url === null) {
      return;
    }
    const shared = await this.#navigator.share({
      title: this.#messages.message('link.title'),
      url,
    });
    this.#feedback.set(shared ? 'idle' : 'share-failed');
  }

  /** Encodes again, for a refusal that came from something transient. */
  retry(): void {
    this.#feedback.set('idle');
    void this.#publisher.publish();
  }
}
