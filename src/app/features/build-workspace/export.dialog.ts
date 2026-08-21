import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ActiveBuildStore } from '../../application/active-build/active-build.store';
import { FragmentPublisher } from '../../application/build-link/fragment-publisher';
import { LinkErrorMapper } from '../../application/build-link/link-error.mapper';
import { SLEF_FALLBACK } from '../../application/build-link/slef-fallback.port';
import { MessageService } from '../../i18n/message.service';
import { NavigatorAdapter } from '../../platform/browser/navigator.adapter';
import { Layer } from '../../ui/components/layer/layer';
import {
  ShareLinkPanel,
  type ShareLinkFeedback,
  type ShareLinkState,
} from '../../ui/components/share-link-panel/share-link-panel';

/**
 * Passing a build on.
 *
 * The dialog owns the intents; the panel owns none of them. Copying, sharing,
 * retrying an encode and reaching for a file export are all things that can
 * fail in their own way, and each failure has to leave the link itself on
 * screen and selectable — which is only true if the panel never depends on any
 * of them having worked (build-link contract, "Active-edit synchronization").
 */
@Component({
  selector: 'edsb-export-dialog',
  imports: [Layer, ShareLinkPanel],
  templateUrl: './export.dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportDialog {
  readonly #messages = inject(MessageService);
  readonly #active = inject(ActiveBuildStore);
  readonly #publisher = inject(FragmentPublisher);
  readonly #errors = inject(LinkErrorMapper);
  readonly #navigator = inject(NavigatorAdapter);
  readonly #slef = inject(SLEF_FALLBACK);

  readonly open = input(false);
  readonly dismissed = output<void>();

  readonly title = this.#messages.messageSignal('link.title');
  readonly dismissLabel = this.#messages.messageSignal('action.close');

  readonly feedback = signal<ShareLinkFeedback>('idle');

  readonly shareAvailable = this.#navigator.canShare();
  readonly slefAvailable = this.#slef.available;

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
    this.feedback.set((await this.#navigator.copyText(url)) ? 'copied' : 'copy-failed');
  }

  async share(): Promise<void> {
    const url = this.url();
    if (url === null) {
      return;
    }
    const shared = await this.#navigator.share({ title: this.title(), url });
    this.feedback.set(shared ? 'idle' : 'share-failed');
  }

  /** Encodes again, for a refusal that came from something transient. */
  retry(): void {
    this.feedback.set('idle');
    void this.#publisher.publish();
  }

  exportFile(): void {
    this.#slef.export();
  }
}
