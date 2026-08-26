import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import type { IngressNotice } from '../../domain/build/build-ingress-result';
import { MessageService } from '../../i18n/message.service';
import { Formatters } from '../../i18n/formatters/formatters';
import { OutfittingNotice, type NoticeLine } from './outfitting-notice';
import { slotName } from './slot-naming';

/**
 * What the Almanac completed while the build was being read in.
 *
 * One kind of notice, and one only: an imported module arrived at a partial
 * roll the package could identify, and the package completed it to the full
 * grade. That is a real change to what a Commander saved or shared, so it is
 * reported, naming the mount and the quality it came in at (FR-013).
 *
 * Package-defaulted fixed mounts are deliberately *not* reported here and have
 * no notice of their own. A hull's default armour arriving in an empty armour
 * mount is what construction does, every time, on every path — it is ordinary
 * build state from the moment it exists, and telling a Commander about it every
 * time they open a build would be reporting the absence of news (FR-010).
 */
@Component({
  selector: 'edsb-quality-completion-notice',
  imports: [OutfittingNotice],
  templateUrl: './quality-completion-notice.html',
  styleUrl: './quality-completion-notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QualityCompletionNotice {
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);

  readonly notices = input.required<readonly IngressNotice[]>();
  readonly revision = input.required<number>();

  /** The mount labels, already localized, keyed by the package's slot key. */
  readonly slotLabels = input<Readonly<Record<string, string>>>({});

  readonly dismissed = output<void>();

  readonly title = computed(() => this.#messages.message('outfitting.notice.import.title'));

  readonly lines = computed<readonly NoticeLine[]>(() =>
    this.notices().map((notice) => ({
      id: notice.slotKey,
      messageKey: 'outfitting.notice.quality-completed' as const,
      params: {
        slot: slotName(this.slotLabels(), notice.slotKey),
        quality: this.#formatters.percent(notice.previousQuality),
      },
    })),
  );
}
