import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { ToolRowView } from '../../../application/equipment/loadout.presenter';
import { MessageService } from '../../../i18n/message.service';
import { relationId } from '../../../ui/a11y/text-equivalence';
import { GameText } from '../../../ui/components/game-text/game-text';

/**
 * The `SUIT TOOLS` rows: a badge, a name and a count, and no tool stat.
 *
 * Carriage is a property of the suit. Tools are fitted to every suit and cannot
 * be swapped, so this states what the worn suit carries and offers no choice:
 * the ledger's selection never lands here and the item view never opens on one
 * (FR-005a). They are list items rather than controls for that reason — a
 * disabled button would be a control for a thing that is not a choice.
 *
 * **No tool stat is drawn.** The library publishes battery and timing figures
 * for every tool and neither artboard draws one, so a row is a dashed badge and
 * a name (013 design/reference-review.md).
 *
 * The dimming is not the only thing saying a tool cannot be changed: each row's
 * accessible name says so in words (constitution V).
 */
@Component({
  selector: 'edsb-suit-tools',
  imports: [GameText],
  templateUrl: './suit-tools.html',
  styleUrl: './suit-tools.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuitTools {
  readonly #messages = inject(MessageService);

  readonly tools = input.required<readonly ToolRowView[]>();

  /** Canvas 1b's arrangement: the ledger read on its own, a step larger. */
  readonly compact = input(false);

  readonly headingId = relationId('suit-tools-heading');

  readonly heading = this.#messages.messageSignal('equipment.ledger.tools');

  /** What the bare number at the rule's trailing edge counts, said in words. */
  readonly count = computed(() =>
    this.#messages.message('equipment.ledger.tools.count', { count: this.tools().length }),
  );

  /**
   * The mark the canvas writes at the rule's trailing edge.
   *
   * A count where a suit is worn, and the dash canvas 2a and 2b draw where none
   * is — `0` would state that this suit carries nothing, which is a different
   * claim from having no suit to ask about.
   */
  readonly mark = computed(() =>
    this.tools().length === 0
      ? this.#messages.message('equipment.count.none')
      : String(this.tools().length),
  );
}
