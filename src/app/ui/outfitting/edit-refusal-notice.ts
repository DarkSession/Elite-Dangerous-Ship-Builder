import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { getLoadoutEditErrorMessage } from '@elite-dangerous-almanac/core/i18n/diagnostics';
import type { EditFailure } from '../../application/outfitting/build-edit-intent';
import { GameTextPresenter } from '../../i18n/game-text.presenter';
import { MessageService } from '../../i18n/message.service';
import { OutfittingNotice, type NoticeLine } from './outfitting-notice';

/**
 * Why an edit did not happen.
 *
 * Two voices, kept apart. The application says what happened in workflow terms
 * — the change was not made, the build is exactly as it was — and the Almanac
 * says *why*, in its own words, resolved through the package's diagnostic
 * leaves. The application never paraphrases the reason and never keeps a
 * private translation of one: a package diagnostic is game text, and a second
 * copy of it would be a second thing to contradict the next release
 * (outfitting-editor contract, "Refusals").
 *
 * The refusal is an alert. A Commander who has just pressed a button and had
 * nothing happen needs to be told now, not when they next happen to read the
 * page.
 */
@Component({
  selector: 'edsb-edit-refusal-notice',
  imports: [OutfittingNotice],
  templateUrl: './edit-refusal-notice.html',
  styleUrl: './edit-refusal-notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditRefusalNotice {
  readonly #messages = inject(MessageService);
  readonly #gameText = inject(GameTextPresenter);

  readonly failure = input.required<EditFailure | null>();
  readonly revision = input.required<number>();

  /** The mount's drawn label, so the notice names it the way the ledger does. */
  readonly slotLabel = input<string | null>(null);

  readonly dismissed = output<void>();

  readonly title = computed(() => this.#messages.message('outfitting.refusal.title'));

  readonly lines = computed<readonly NoticeLine[]>(() => {
    const failure = this.failure();
    if (failure === null) {
      return [];
    }

    const lines: NoticeLine[] = [
      {
        id: 'framing',
        messageKey: failure.framingKey,
        detail: this.#packageReason(failure),
      },
    ];

    if (failure.slotKey !== null) {
      lines.push({
        id: 'slot',
        messageKey: 'outfitting.refusal.slot',
        params: { slot: this.slotLabel() ?? failure.slotKey },
      });
    }

    return lines;
  });

  /**
   * The Almanac's own sentence, resolved for the active locale.
   *
   * A locale miss shows the package's canonical text; the disclosure that it is
   * untranslated is carried by the shared game-text presentation the detail is
   * rendered through, so nothing here decides how to say it.
   */
  #packageReason(failure: EditFailure): string | null {
    if (failure.diagnostic === null || failure.diagnostic === undefined) {
      return null;
    }
    const presented = this.#gameText.present(
      getLoadoutEditErrorMessage,
      failure.diagnostic as Parameters<typeof getLoadoutEditErrorMessage>[0],
    );
    return presented.text;
  }
}
