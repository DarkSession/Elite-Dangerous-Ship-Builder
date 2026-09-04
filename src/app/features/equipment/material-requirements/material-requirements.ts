import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import type { MaterialsView } from '../../../application/equipment/loadout.presenter';
import { MessageService } from '../../../i18n/message.service';
import { relationId } from '../../../ui/a11y/text-equivalence';
import { GameText } from '../../../ui/components/game-text/game-text';

/**
 * The micro resources the loadout asks for: the climb to each selected grade,
 * and every fitted, unlocked modification (FR-014).
 *
 * Canvas 1a draws it under the commander stats and canvas 1b gives it a tab of
 * its own; both draw the same block — a rule carrying `n TYPES · n UNITS`, then
 * one row per resource, commonest first, then the note saying what the total
 * covers.
 *
 * The rows are `ui/outfitting/material-lines`' own view, which the ship tool's
 * cost rail already renders: a name and a count, with the rarity chip left off
 * because the package publishes a category for a micro resource and no rarity
 * (constitution VII, and the presenter's own note).
 *
 * A modification in a locked slot contributes nothing. It is held, not fitted,
 * and a shopping list that counted it would send a Commander gathering for
 * something they cannot apply (FR-011).
 */
@Component({
  selector: 'ednb-material-requirements',
  imports: [GameText],
  templateUrl: './material-requirements.html',
  styleUrl: './material-requirements.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialRequirements {
  readonly #messages = inject(MessageService);

  readonly materials = input.required<MaterialsView>();

  /**
   * Canvas 1b's arrangement: the list read on its own in a tab of its own.
   *
   * The wide column packs the rows at `gap: 7px` with nothing between them;
   * the compact tab gives each one `padding: 11px 14px` over a hairline, which
   * is the same list at the size a thumb reaches for.
   */
  readonly compact = input(false);

  readonly headingId = relationId('material-requirements');

  readonly heading = this.#messages.messageSignal('equipment.region.materials');
  readonly note = this.#messages.messageSignal('equipment.materials.note');
}
