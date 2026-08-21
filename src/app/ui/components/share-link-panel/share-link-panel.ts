import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MessageService } from '../../../i18n/message.service';
import { relationId } from '../../a11y/text-equivalence';
import { ActionButton } from '../action/action-button';
import { StatusNotice } from '../status/status-notice';

/** Where the link currently stands. */
export type ShareLinkState = 'absent' | 'encoding' | 'published' | 'refused';

/** How the last copy or share attempt went. */
export type ShareLinkFeedback = 'idle' | 'copied' | 'copy-failed' | 'share-failed';

/** A refusal, already said in the Commander's language by the application. */
export interface ShareLinkRefusal {
  readonly message: string;
  /** Which mount is involved, when the codec could say. */
  readonly detail: string | null;
}

/**
 * The build's link, and the ways of passing it on.
 *
 * The link text itself is always present and always selectable — before the
 * copy action, after it succeeds and after it fails. Clipboard access is a
 * permission a browser can refuse and a platform share sheet is a thing that
 * can simply not appear; neither of those may be the only way to get a link
 * out of this application (FR-019).
 *
 * The value scrolls inside its own labelled region rather than wrapping the
 * page sideways. It is one long unbroken token, and a document that scrolls
 * horizontally is unusable at 400% zoom.
 */
@Component({
  selector: 'edsb-share-link-panel',
  imports: [ActionButton, StatusNotice],
  templateUrl: './share-link-panel.html',
  styleUrl: './share-link-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareLinkPanel {
  readonly #messages = inject(MessageService);

  readonly state = input.required<ShareLinkState>();

  /** The canonical address, when there is one to show. */
  readonly url = input<string | null>(null);

  readonly refusal = input<ShareLinkRefusal | null>(null);
  readonly feedback = input<ShareLinkFeedback>('idle');

  /** Whether this platform offers a share sheet at all. */
  readonly shareAvailable = input(false);

  /** Whether feature 004's file export has landed. */
  readonly slefAvailable = input(false);

  readonly copyRequested = output<void>();
  readonly shareRequested = output<void>();
  readonly retryRequested = output<void>();
  readonly slefRequested = output<void>();

  readonly panelId = relationId('share-link');

  readonly title = this.#messages.messageSignal('link.title');
  readonly description = this.#messages.messageSignal('link.description');
  readonly valueLabel = this.#messages.messageSignal('link.value.label');
  readonly copyLabel = this.#messages.messageSignal('link.copy');
  readonly shareLabel = this.#messages.messageSignal('link.share');
  readonly encodingLabel = this.#messages.messageSignal('link.encoding');
  readonly absentLabel = this.#messages.messageSignal('link.absent');
  readonly refusedTitle = this.#messages.messageSignal('link.refused.title');
  readonly retryLabel = this.#messages.messageSignal('link.retry');
  readonly slefLabel = this.#messages.messageSignal('link.slef');
  readonly slefUnavailableLabel = this.#messages.messageSignal('link.slef.unavailable');

  readonly hasUrl = computed(() => (this.url() ?? '').length > 0);

  /**
   * What the last attempt did, in words.
   *
   * A failure says what to do instead — select the text and copy it — because
   * "could not copy" on its own leaves a Commander with no next move.
   */
  readonly feedbackNotice = computed(() => {
    switch (this.feedback()) {
      case 'copied':
        return { tone: 'success' as const, message: this.#messages.message('link.copied') };
      case 'copy-failed':
        return { tone: 'warning' as const, message: this.#messages.message('link.copy-failed') };
      case 'share-failed':
        return { tone: 'warning' as const, message: this.#messages.message('link.share-failed') };
      default:
        return null;
    }
  });
}
