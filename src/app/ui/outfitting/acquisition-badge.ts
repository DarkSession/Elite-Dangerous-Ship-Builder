import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type {
  AcquisitionLabel,
  AcquisitionLabelKind,
} from '../../application/outfitting/acquisition-labels';
import type { MessageKey } from '../../i18n/locale-registry';
import { MessageService } from '../../i18n/message.service';

/** What, if anything, the canvas draws for each restriction. */
type Marker = 'reward' | 'mercCoin' | null;

/**
 * The marker each restriction is drawn as.
 *
 * A `Record` over the label kinds, so a kind added to the projection cannot
 * reach a row without someone deciding whether the reference draws anything for
 * it. Two of them are drawn — the `REWARD ONLY` chip and the Merc Coin icon —
 * and every other restriction is spoken rather than drawn, because neither
 * canvas has a chip for it.
 */
const MARKER: Record<AcquisitionLabelKind, Marker> = {
  mercenary: 'mercCoin',
  communityGoal: null,
  techBroker: null,
  eventReward: null,
  uniqueReward: 'reward',
  notOrdinarilyAvailable: null,
  entitlement: null,
};

/** One label, with its explanation resolved for the reading language. */
interface RenderedLabel {
  readonly kind: string;
  readonly packageValue: string;
  readonly marker: Marker;
  readonly short: string;
  readonly explanation: string;
}

/**
 * How a module is obtained, as words.
 *
 * The canvas marks a restricted row two ways and no others: a cool `REWARD
 * ONLY` chip on a reward article, and the Merc Coin icon beside the name of one
 * bought with them. Both are drawn here, and neither is the only carrier — the
 * sentence that says why is beside them, drawn or hidden, so a Commander who
 * cannot see a colour or an icon still reads the restriction.
 *
 * Labels stack. A community-goal article that also needs a game entitlement is
 * restricted twice, and showing only one restriction sends a Commander to an
 * outfitting service to find out about the other. Only the two the reference
 * draws are drawn; the rest are read.
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
      marker: MARKER[label.kind],
      short: this.#messages.message('outfitting.candidate.reward-only'),
      explanation: this.#messages.message(label.messageKey, label.params ?? undefined),
    })),
  );
}
