import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { GameTextPresentation } from '../../i18n/game-text.presenter';
import { GameText } from '../components/game-text/game-text';

/** One thing a bench chooser offers. */
export interface EquipmentChoice {
  /** The identity the chooser answers with: a suit family, a symbol, a recipe key. */
  readonly id: string;
  readonly name: GameTextPresentation;
  /**
   * The code line under the name: what the thing is, where there is one.
   *
   * `null` on the modification picker, whose rows the canvas draws as the
   * recipe's name and nothing else.
   */
  readonly meta: string | null;
  /** The one figure the canvas draws at the row's trailing edge, where it draws one. */
  readonly figure: string | null;
  /**
   * The unit beside it, where the canvas writes one.
   *
   * Its own word rather than part of the figure: the canvas draws the number
   * large and amber and the unit small beside it, and a single run of text
   * cannot be two sizes.
   */
  readonly figureUnit?: string | null;
  /** True where this is what is already fitted or worn. */
  readonly current: boolean;
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
 * What a list offers is the caller's. The 2026-09-04 canvas revision settled two
 * of those calls in opposite directions: the swap block lists the fitted item
 * among the alternatives and marks it, and the modification picker drops a
 * recipe another slot already holds rather than drawing it refused. Every row
 * this component draws can therefore be chosen.
 */
@Component({
  selector: 'ednb-choice-list',
  imports: [GameText],
  templateUrl: './choice-list.html',
  styleUrl: './choice-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoiceList {
  readonly choices = input.required<readonly EquipmentChoice[]>();

  /** What the list is, for a reader arriving at it. */
  readonly label = input.required<string>();

  /**
   * Two to a line.
   *
   * Canvas 1a's swap block and canvas 2a's suit list: both are
   * `grid-template-columns: 1fr 1fr` over the same row. The compact artboards
   * draw them in a single file, which is what the list's own container query
   * already decides.
   */
  readonly asPairs = input(false);

  /**
   * Ruled rather than boxed, which is how the canvas draws the modification
   * picker: `border-bottom: 1px solid rgba(255,255,255,.04)` under each row and
   * no box around it. The box belongs to a row that stands on its own.
   */
  readonly ruled = input(false);

  readonly chosen = output<string>();

  choose(choice: EquipmentChoice): void {
    this.chosen.emit(choice.id);
  }
}
