import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { MessageService } from '../../i18n/message.service';
import { AnnouncementService } from '../announcements/announcement.service';
import { StatusNotice, type StatusTone } from '../components/status/status-notice';
import type { MessageKey, MessageParams } from '../../i18n/locale-registry';

/** One line of a notice: an application message and its scalar parameters. */
export interface NoticeLine {
  /** Stable identity for tracking and announcement dedupe. Never translated. */
  readonly id: string;
  readonly messageKey: MessageKey;
  readonly params?: MessageParams;
  /** Package-owned text shown after the framing, where there is any. */
  readonly detail?: string | null;
}

/**
 * What outfitting tells a Commander, said once.
 *
 * `StatusNotice` already owns the visible half — a named tone, never a colour
 * on its own. What this adds is the half outfitting needs and feature 011
 * deliberately left out of it: the notice is *announced*, and a batch of them
 * is announced as one event rather than as five.
 *
 * The coalescing is the point. One accepted import can complete four partial
 * rolls, and a reader who is told about each of them separately is being read a
 * list they did not ask for while the screen finishes rendering. So the lines
 * stay individually readable on the page, and the announcement is one message
 * naming how many there are (outfitting-workspace design, "Accessibility").
 *
 * `alert` is for something that did not happen — a refusal — and `status` for
 * something that did. That is not a styling choice: an alert interrupts, and
 * interrupting a Commander to tell them their build imported correctly is
 * exactly the behaviour a polite region exists to avoid.
 */
@Component({
  selector: 'edsb-outfitting-notice',
  imports: [StatusNotice],
  templateUrl: './outfitting-notice.html',
  styleUrl: './outfitting-notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutfittingNotice {
  readonly #messages = inject(MessageService);
  readonly #announcements = inject(AnnouncementService);

  /** The notice's own heading, in the Commander's language. */
  readonly title = input.required<string>();

  readonly lines = input.required<readonly NoticeLine[]>();

  /** `alert` interrupts; `status` waits its turn. */
  readonly mode = input<'status' | 'alert'>('status');

  /**
   * The build revision this notice describes.
   *
   * An announcement carrying a revision behind what is on screen is describing
   * something that is no longer true, and the announcement service drops it.
   */
  readonly revision = input.required<number>();

  /** A stable event id, so a locale switch does not look like a new event. */
  readonly announcementKind = input<string>('outfitting.notice');

  readonly tone = computed<StatusTone>(() => (this.mode() === 'alert' ? 'error' : 'info'));

  readonly regionLabel = computed(() => this.#messages.message('outfitting.notice.label'));

  readonly resolved = computed(() =>
    this.lines().map((line) => ({
      id: line.id,
      text: this.#messages.message(line.messageKey, line.params),
      detail: line.detail ?? null,
    })),
  );

  constructor() {
    effect(() => {
      const lines = this.resolved();
      if (lines.length === 0) {
        return;
      }
      // One announcement for the batch. The lines themselves stay on the page
      // in reading order, where they can be found and re-read.
      this.#announcements.announce({
        kind: this.announcementKind(),
        revision: this.revision(),
        urgency: this.mode() === 'alert' ? 'assertive' : 'polite',
        messageKey: 'outfitting.notice.announced',
        params: { title: this.title(), count: lines.length },
      });
    });
  }
}
