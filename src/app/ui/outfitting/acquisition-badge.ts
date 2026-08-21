import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type {
  AcquisitionLabel,
  AcquisitionLabelKind,
} from '../../application/outfitting/acquisition-labels';
import type { MessageKey } from '../../i18n/locale-registry';
import { MessageService } from '../../i18n/message.service';

/** The marker each restriction is drawn as, short enough for a chip. */
const SHORT: Record<AcquisitionLabelKind, MessageKey> = {
  mercenary: 'outfitting.acquisition.short.mercenary',
  communityGoal: 'outfitting.acquisition.short.communityGoal',
  techBroker: 'outfitting.acquisition.short.techBroker',
  eventReward: 'outfitting.acquisition.short.eventReward',
  uniqueReward: 'outfitting.candidate.reward-only',
  notOrdinarilyAvailable: 'outfitting.acquisition.short.notOrdinarilyAvailable',
  entitlement: 'outfitting.acquisition.short.entitlement',
};

/** One label, with its explanation resolved for the reading language. */
interface RenderedLabel {
  readonly kind: string;
  readonly packageValue: string;
  readonly short: string;
  readonly explanation: string;
}

/**
 * How a module is obtained, as words.
 *
 * The canvas marks a restricted row with a cool `REWARD ONLY` chip. This
 * renders that chip, and the chip is text — never a colour, a border or an icon
 * on its own. A Commander who cannot see the colour still reads why a module is
 * not simply purchasable, and the full sentence is there for anyone who needs
 * more than the chip's two words.
 *
 * Labels stack. A community-goal article that also needs a game entitlement is
 * restricted twice, and showing only one restriction sends a Commander to an
 * outfitting service to find out about the other.
 */
@Component({
  selector: 'edsb-acquisition-badge',
  templateUrl: './acquisition-badge.html',
  styleUrl: './acquisition-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcquisitionBadge {
  readonly #messages = inject(MessageService);

  readonly labels = input.required<readonly AcquisitionLabel[]>();

  /** Whether the full sentences are drawn, or only read by assistive technology. */
  readonly showExplanations = input(false);

  readonly groupLabel = this.#messages.messageSignal('outfitting.acquisition.label');

  readonly rendered = computed<readonly RenderedLabel[]>(() =>
    this.labels().map((label) => ({
      kind: label.kind,
      packageValue: label.packageValue,
      short: this.#short(label),
      explanation: this.#messages.message(label.messageKey, label.params ?? undefined),
    })),
  );

  /**
   * The chip's two words.
   *
   * A `Record` over the label kinds, so a kind added to the projection cannot
   * reach a row without someone deciding what its marker says. A reward article
   * gets the canvas's own `REWARD ONLY`; everything else is named by the route
   * it comes from. The chip is a marker, not the explanation — the sentence
   * beside it is that, and it is present whether or not it is drawn.
   */
  #short(label: AcquisitionLabel): string {
    return this.#messages.message(SHORT[label.kind]);
  }
}
