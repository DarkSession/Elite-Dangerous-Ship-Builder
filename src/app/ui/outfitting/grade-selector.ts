import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MessageService } from '../../i18n/message.service';
import { relationId } from '../a11y/text-equivalence';

/**
 * Which complete grade of the selected recipe to apply.
 *
 * Both canvases draw five cells with the chosen one filled — 1c as a bar of
 * five, 1d as five buttons — and this is that, as a named radio group. The
 * cells are exactly the grades the selected package descriptor publishes and
 * never a fixed five: a bespoke Mercenary recipe starts at grade 2, and drawing
 * a grade 1 cell for it would offer a job the Almanac has no recipe for
 * (contract, "Engineering").
 *
 * There is no quality control beside it, and there never will be. Every grade
 * this application models is a completed 100% grade, so a roll is not something
 * a Commander can choose here and the canvas's `G5 ROLL` wording was withdrawn
 * for the same reason (FR-013, reference review).
 */
@Component({
  selector: 'edsb-grade-selector',
  templateUrl: './grade-selector.html',
  styleUrl: './grade-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradeSelector {
  readonly #messages = inject(MessageService);

  /** Exactly the grades the selected descriptor offers, ascending. */
  readonly grades = input.required<readonly number[]>();

  readonly selected = input<number | null>(null);

  readonly chosen = output<number>();

  readonly groupName = relationId('grade-choice');

  readonly legend = this.#messages.messageSignal('outfitting.engineering.grade.legend');

  /** The chosen grade, drawn beside the label exactly as canvas 1c draws it. */
  readonly selectedLabel = computed(() => {
    const grade = this.selected();
    return grade === null ? null : String(grade);
  });

  readonly optionLabel = (grade: number): string =>
    this.#messages.message('outfitting.engineering.grade.option', { grade });
}
