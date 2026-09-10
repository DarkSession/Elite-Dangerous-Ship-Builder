import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MessageService } from '../../i18n/message.service';
import { StatusNotice, type StatusTone } from '../components/status/status-notice';
import type { MessageKey, MessageParams } from '../../i18n/locale-registry';

/** One line of a notice: an application message and its scalar parameters. */
export interface NoticeLine {
  /** Stable identity, for tracking in the rendered list. Never translated. */
  readonly id: string;
  readonly messageKey: MessageKey;
  readonly params?: MessageParams;
  /** Package-owned text shown after the framing, where there is any. */
  readonly detail?: string | null;
}

/**
 * What outfitting tells a Commander, drawn where it can be re-read.
 *
 * `StatusNotice` owns the visible half — a named tone, never a colour on its
 * own. What this adds is the framing outfitting needs: several lines under one
 * heading, each individually readable and in reading order.
 *
 * It announces nothing. A notice is drawn because an edit was refused, and the
 * refusal is what a reader is told about — announced by `OutfittingStore`, where
 * it happens, so a second refusal reaches a reader whether or not it moves
 * anything on screen (011/FR-009). A component announcing what it renders can
 * only speak when it renders, and can speak again whenever it re-renders.
 *
 * `alert` is for something that did not happen — a refusal — and `status` for
 * something that did. That is not a styling choice: an alert interrupts, and
 * interrupting a Commander to tell them their build imported correctly is
 * exactly the behaviour a polite region exists to avoid.
 */
@Component({
  selector: 'ednb-outfitting-notice',
  imports: [StatusNotice],
  templateUrl: './outfitting-notice.html',
  styleUrl: './outfitting-notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutfittingNotice {
  readonly #messages = inject(MessageService);

  /** The notice's own heading, in the Commander's language. */
  readonly title = input.required<string>();

  readonly lines = input.required<readonly NoticeLine[]>();

  /** `alert` interrupts; `status` waits its turn. */
  readonly mode = input<'status' | 'alert'>('status');

  readonly tone = computed<StatusTone>(() => (this.mode() === 'alert' ? 'error' : 'info'));

  readonly regionLabel = computed(() => this.#messages.message('outfitting.notice.label'));

  readonly resolved = computed(() =>
    this.lines().map((line) => ({
      id: line.id,
      text: this.#messages.message(line.messageKey, line.params),
      detail: line.detail ?? null,
    })),
  );
}
