import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { GameTextPresentation } from '../../i18n/game-text.presenter';
import { GameText } from '../components/game-text/game-text';

/** One thing a bench chooser offers. */
export interface EquipmentChoice {
  /** The identity the chooser answers with: a suit family, a symbol, a recipe key. */
  readonly id: string;
  readonly name: GameTextPresentation;
  /** The code line under the name: what the thing is, or who grants it. */
  readonly meta: string;
  /** The one figure the canvas draws at the row's trailing edge, where it draws one. */
  readonly figure: string | null;
  /** True where this is what is already fitted or worn. */
  readonly current: boolean;
  /** True where another slot on the same item already holds it (FR-009). */
  readonly unavailable: boolean;
  /** What `unavailable` means, in words rather than in dimming. */
  readonly unavailableLabel: string | null;
}

/**
 * The rows a bench chooser draws.
 *
 * One list for all three of them — suits, a mount's weapons and a slot's
 * modifications — because the canvas draws one row shape for all three: a name
 * over a code line, with a figure or a marker at the trailing edge.
 *
 * It is not `ui/outfitting/candidate-list`. That list is the ship tool's: it
 * takes outfitting families, module choices, credit prices and Merc Coin
 * prices, and a bench chooser has none of them — the largest one here offers
 * eleven weapons against that list's four hundred and seventy-eight, with no
 * family level to fold them into. Fitting one to the other would mean inventing
 * ship-shaped data for equipment (013 design/equipment-bench.md).
 *
 * Nothing is dropped from the list to say it cannot be chosen. A recipe another
 * slot already holds is drawn, marked and refused, because it is the answer to
 * "where is the one I wanted" (FR-009).
 */
@Component({
  selector: 'edsb-choice-list',
  imports: [GameText],
  templateUrl: './choice-list.html',
  styleUrl: './choice-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoiceList {
  readonly choices = input.required<readonly EquipmentChoice[]>();

  /** What the list is, for a reader arriving at it. */
  readonly label = input.required<string>();

  readonly chosen = output<string>();

  choose(choice: EquipmentChoice): void {
    if (choice.unavailable) return;
    this.chosen.emit(choice.id);
  }
}
