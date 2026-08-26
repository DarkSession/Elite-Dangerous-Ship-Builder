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
  readonly valueLabel = this.#messages.messageSignal('link.value.label');
  readonly #copyLabel = this.#messages.messageSignal('link.copy');
  readonly #copiedLabel = this.#messages.messageSignal('link.copied');
  readonly shareLabel = this.#messages.messageSignal('link.share');
  readonly encodingLabel = this.#messages.messageSignal('link.encoding');
  readonly absentLabel = this.#messages.messageSignal('link.absent');
  readonly refusedTitle = this.#messages.messageSignal('link.refused.title');
  readonly retryLabel = this.#messages.messageSignal('link.retry');
  readonly slefLabel = this.#messages.messageSignal('link.slef');
  readonly slefUnavailableLabel = this.#messages.messageSignal('link.slef.unavailable');

  readonly hasUrl = computed(() => (this.url() ?? '').length > 0);

  /**
   * The copy control's label — or what it says instead, having just copied.
   *
   * The reference answers a successful copy on the control that did it, and
   * puts the label back a moment later. A panel that answered with a notice of
   * its own said the same thing in a second place and left it standing there
   * (Commander request 2026-08-26). Swapping the label rather than adding
   * anything also means the answer arrives where a reader already is: the
   * control they just pressed, whose accessible name is what changed.
   */
  readonly copyLabel = computed(() =>
    this.feedback() === 'copied' ? this.#copiedLabel() : this.#copyLabel(),
  );

  /**
   * The same answer, for a reader rather than for a look.
   *
   * The label swap is the visible answer and the only one on the screen. What
   * it is not is a reliable spoken one: an accessible-name change on the
   * control that already has focus is announced differently by every reader,
   * and by some not at all. This is the same word in a region that draws
   * nothing, so the answer arrives either way and the panel still says it once.
   */
  readonly copiedAnnouncement = this.#copiedLabel;

  /**
   * What went wrong with the last attempt, in words.
   *
   * Only failures. A failure says what to do instead — select the text and copy
   * it — because "could not copy" on its own leaves a Commander with no next
   * move, and that is not something to flash for a second and take away.
   */
  readonly feedbackNotice = computed(() => {
    switch (this.feedback()) {
      case 'copy-failed':
        return { tone: 'warning' as const, message: this.#messages.message('link.copy-failed') };
      case 'share-failed':
        return { tone: 'warning' as const, message: this.#messages.message('link.share-failed') };
      default:
        return null;
    }
  });
}
