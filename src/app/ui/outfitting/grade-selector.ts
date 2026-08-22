import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MessageService } from '../../i18n/message.service';
import { relationId } from '../a11y/text-equivalence';

/**
 * Which complete grade of the selected recipe to apply.
 *
 * Both canvases draw five cells with the chosen one filled — 1c as a bar of
 * five, 1d as five buttons — and this is that, as a named radio group. The
 * The bar runs from grade 1 to the recipe's highest. A bespoke Mercenary recipe
 * starts at the grade the article was bought at, and the cells below that are
 * still drawn — the article carries them — but refused: the Almanac has no
 * recipe for a job that would take it back down (contract, "Engineering";
 * wave 4).
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

  /** The cells to draw, ascending — one to the recipe's highest. */
  readonly grades = input.required<readonly number[]>();

  /** The first grade the recipe offers. Cells below it are drawn and refused. */
  readonly lowest = input<number | null>(null);

  readonly selected = input<number | null>(null);

  readonly chosen = output<number>();

  readonly groupName = relationId('grade-choice');

  readonly legend = this.#messages.messageSignal('outfitting.engineering.grade.legend');

  /** The chosen grade, drawn beside the label exactly as canvas 1c draws it. */
  readonly selectedLabel = computed(() => {
    const grade = this.selected();
    return grade === null ? null : String(grade);
  });

  /**
   * True where this grade is below the one the recipe starts at.
   *
   * Drawn striped rather than refused. A Merc-Coin article bought at grade 2
   * can still be taken back down to 1, and a cell that could not be pressed
   * would make that a thing a Commander can see and not do (wave 5).
   */
  readonly unavailable = (grade: number): boolean => {
    const lowest = this.lowest();
    return lowest !== null && grade < lowest;
  };

  /** The canvas fills the bar to the chosen grade, so every cell up to it. */
  readonly filled = (grade: number): boolean => {
    const selected = this.selected();
    return selected !== null && grade <= selected;
  };

  readonly optionLabel = (grade: number): string =>
    this.#messages.message('outfitting.engineering.grade.option', { grade });
}
