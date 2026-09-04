import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ModificationSlotView } from '../../../application/equipment/loadout.presenter';
import { relationId } from '../../../ui/a11y/text-equivalence';
import { GameText } from '../../../ui/components/game-text/game-text';

/**
 * The four modification slots an item has, open and locked alike.
 *
 * Canvas 1a's `MODIFICATION SLOTS · 2 / 4` grid: a numbered square, the recipe
 * or a placeholder, and a status line under it. Every item draws four —
 * a locked slot is present and stated, never hidden, because a Commander
 * deciding whether to raise a grade needs to see what raising it would open
 * (FR-008).
 *
 * **A locked slot keeps what is in it.** Dropping a grade holds a recipe rather
 * than discarding it, so the row still names the modification and says it is
 * held and what grade would return it (FR-011). A held row is a control that
 * refuses, exactly as the ledger's held mount is: it can be reached and read,
 * and pressing it does nothing.
 *
 * No slot draws a magnitude. Whether a recipe changes a figure is the item's
 * own attribute grid restating; a recipe the package publishes no magnitude for
 * says it is fitted with no numeric change rather than showing a zero (spec Edge
 * Cases).
 */
@Component({
  selector: 'edsb-modification-slots',
  imports: [GameText],
  templateUrl: './modification-slots.html',
  styleUrl: './modification-slots.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModificationSlots {
  readonly slots = input.required<readonly ModificationSlotView[]>();

  /** The rule's own heading, already counting what is filled of what is open. */
  readonly heading = input.required<string>();

  /**
   * The slot whose picker is open under the grid, or none.
   *
   * Canvas 1a marks it the way it marks a selected ledger row, because the
   * picker expands directly under the grid: without the mark, the block that
   * opened belongs to nothing on screen. Canvas 1b marks nothing, and neither
   * does this — the compact picker takes the screen, so there is no grid behind
   * it to mark and nothing on it is expanded.
   */
  readonly opened = input<number | null>(null);

  readonly openSlot = output<number>();

  readonly headingId = relationId('modification-slots');

  open(slot: ModificationSlotView): void {
    if (slot.locked) return;
    this.openSlot.emit(slot.slot);
  }
}
