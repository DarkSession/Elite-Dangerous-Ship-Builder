import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { MessageKey } from '../../../i18n/locale-registry';
import { MessageService } from '../../../i18n/message.service';
import { relationId } from '../../a11y/text-equivalence';

/** What kind of state the notice reports. */
export type StatusTone = 'info' | 'success' | 'warning' | 'error' | 'loading';

/**
 * A visible status, notice or error.
 *
 * The tone is named in text, always. Colour is a supplement — an amber border
 * and a red border are indistinguishable to a Commander who cannot see them,
 * and identical in a forced-colours mode (FR-010).
 *
 * This is ordinary semantic content, not a live region. It stays on the page to
 * be found and re-read. Announcing a change is a separate concern with its own
 * outlets, and auto-dismissal is never the only route to reading it
 * (feedback contract).
 */
@Component({
  selector: 'ednb-status-notice',
  templateUrl: './status-notice.html',
  styleUrl: './status-notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusNotice {
  readonly #messages = inject(MessageService);

  readonly tone = input<StatusTone>('info');

  /** The message a Commander reads. */
  readonly message = input.required<string>();

  /** Supporting detail, associated with the notice. */
  readonly detail = input<string | null>(null);

  /** Overrides the tone's own name, where a capability has a better one. */
  readonly toneLabel = input<string | null>(null);

  readonly detailId = relationId('status-detail');

  /** The tone's name in words. This is the text equivalent of the colour. */
  readonly resolvedToneLabel = computed(() => {
    const provided = this.toneLabel();
    if (provided !== null && provided.length > 0) {
      return provided;
    }
    const key: MessageKey = (
      {
        info: 'status.info',
        success: 'status.success',
        warning: 'status.warning',
        error: 'status.error',
        loading: 'status.loading',
      } as const
    )[this.tone()];
    return this.#messages.message(key);
  });

  /**
   * An error is exposed as an alert so it is treated as a problem rather than
   * as an incidental update; everything else is a status.
   */
  readonly role = computed(() => (this.tone() === 'error' ? 'alert' : 'status'));
}
