import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoadoutPresenter } from '../../../application/equipment/loadout.presenter';
import { MODIFICATION_SLOT_COUNT } from '../../../domain/equipment/loadout/loadout-edit';
import { MessageService } from '../../../i18n/message.service';
import { relationId } from '../../../ui/a11y/text-equivalence';
import { ChoiceList, type EquipmentChoice } from '../../../ui/equipment/choice-list';
import { GradeSelector } from '../../../ui/outfitting/grade-selector';

/**
 * The bench before a suit is on it — canvas 2a and 2b's inline gate.
 *
 * Not an empty state standing in place of the bench: the bench is drawn, and
 * this is what its detail column holds while everything else is inert. A
 * Commander can see the mounts, the slots and the figures a suit will fill in,
 * and the one live choice in front of them is which suit (turn 2, "everything
 * locked until a suit is chosen").
 *
 * The suits are the same `ui/equipment/choice-list` every other chooser uses,
 * drawn as the canvas's two-column cards. What each card says is the package's:
 * the suit's name and its mount counts. The canvas's type word (`TACTICAL`) and
 * its one-line description are not published for a suit and are withdrawn (013
 * design/reference-review.md).
 *
 * The grade ladder and the modification slots are previews of controls, not
 * controls: there is nothing to grade and nothing to modify yet. They are
 * `inert` and hidden from the accessibility tree, so a reader is never handed a
 * ladder that does nothing.
 */
@Component({
  selector: 'edsb-suit-gate',
  imports: [ChoiceList, GradeSelector, RouterLink],
  templateUrl: './suit-gate.html',
  styleUrl: './suit-gate.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuitGate {
  readonly #messages = inject(MessageService);
  readonly #presenter = inject(LoadoutPresenter);

  /** Canvas 2b's arrangement: the chooser alone, without the two previews. */
  readonly compact = input(false);

  /** The suit family a Commander chose. */
  readonly chosen = output<string>();

  readonly headingId = relationId('suit-gate');

  readonly title = this.#messages.messageSignal('equipment.gate.title');
  readonly description = this.#messages.messageSignal('equipment.gate.description');
  readonly step = this.#messages.messageSignal('equipment.gate.step');
  readonly prompt = this.#messages.messageSignal('equipment.gate.prompt');
  readonly savedLabel = this.#messages.messageSignal('equipment.gate.saved');
  readonly slotsHeading = this.#messages.messageSignal('equipment.gate.slots');

  /** The ladder the canvas previews: every grade a suit can reach, none chosen. */
  readonly gradePreview = computed(() => this.#presenter.gradeLadder());

  /** The same `G1`…`G5` words the live ladder carries. */
  readonly gradeLabels = computed(() =>
    this.gradePreview().map((grade) => this.#messages.message('equipment.grade.short', { grade })),
  );

  /** The four locked slots the canvas previews under the chooser. */
  readonly slotPreview = computed(() =>
    Array.from({ length: MODIFICATION_SLOT_COUNT }, (_, slot) =>
      this.#messages.message('equipment.gate.slot', { slot: slot + 1 }),
    ),
  );

  readonly choices = computed<readonly EquipmentChoice[]>(() =>
    this.#presenter.suitChoices().map((choice) => ({
      id: choice.family,
      name: choice.name,
      meta: choice.meta,
      figure: choice.figure,
      figureUnit: choice.figureUnit,
      current: choice.current,
      unavailable: false,
      unavailableLabel: null,
    })),
  );
}
