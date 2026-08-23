import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type {
  AcquisitionLabel,
  AcquisitionLabelKind,
} from '../../application/outfitting/acquisition-labels';
import { MessageService } from '../../i18n/message.service';

/** What, if anything, the canvas draws for each restriction. */
type Marker = 'communityGoal' | 'powerplay' | 'mercCoin' | 'techBroker' | null;

/**
 * The marker each restriction is drawn as.
 *
 * A `Record` over the label kinds, so a kind added to the projection cannot
 * reach a row without someone deciding whether the reference draws anything for
 * it. Two are drawn — the route icon a Commander earns the article through, and
 * the Merc Coin one is bought with — and every other restriction is spoken
 * rather than drawn, because the canvas has no mark for it.
 *
 * `uniqueReward` draws nothing now. It was the `REWARD ONLY` chip, and the
 * canvas replaced that chip with an icon naming *how* the article is obtained:
 * "you cannot buy this" is the smaller half of what "this is a community goal
 * reward" already says. The sentence it was short for is unchanged and still
 * beside it (module-replacement design, "Acquisition icons").
 *
 * `powerplay` is not one of the package's four acquisition routes: it is an
 * entitlement, which is why canvas 1c draws it on `Advanced Plasma Accelerator`
 * — an ordinary stock module, not a pre-engineered variant. The projection
 * reads it off the entitlement token; see the same ruling.
 *
 * `techBroker` has a mark of its own, which canvas 1c draws on
 * `Cannon · Gimballed` beside the name exactly as it draws the other two. It
 * matters because without it a tech-broker row is indistinguishable from the
 * stock article it was built on: the Almanac's tech-broker `AX Missile Rack` is
 * `3A Fixed` and so is the stock one directly above it, and every figure the
 * manifest draws for the pair is the same — so the pre-engineered half read as
 * missing rather than as unmarked.
 *
 * `eventReward` still draws nothing. It is the one route the reference has no
 * mark for anywhere, and its sentence is what a reader is given either way.
 */
const MARKER: Record<AcquisitionLabelKind, Marker> = {
  mercenary: 'mercCoin',
  communityGoal: 'communityGoal',
  powerplay: 'powerplay',
  techBroker: 'techBroker',
  eventReward: null,
  uniqueReward: null,
  notOrdinarilyAvailable: null,
  entitlement: null,
};

/** One label, with its explanation resolved for the reading language. */
interface RenderedLabel {
  readonly kind: string;
  readonly packageValue: string;
  readonly marker: Marker;
  readonly explanation: string;
}

/**
 * How a module is obtained, as words.
 *
 * The canvas marks a restricted row two ways and no others: the icon of the
 * route an article is earned through, and the Merc Coin icon beside the name of
 * one bought with them. Both are drawn here, and neither is the only carrier —
 * the sentence that says why is beside them, drawn or hidden, so a Commander
 * who cannot see a colour or an icon still reads the restriction.
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

  readonly rendered = computed<readonly RenderedLabel[]>(() =>
    this.labels().map((label) => ({
      kind: label.kind,
      packageValue: label.packageValue,
      marker: MARKER[label.kind],
      explanation: this.#messages.message(label.messageKey, label.params ?? undefined),
    })),
  );
}
