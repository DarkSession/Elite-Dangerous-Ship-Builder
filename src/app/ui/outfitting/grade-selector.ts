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
  selector: 'ednb-grade-selector',
  templateUrl: './grade-selector.html',
  styleUrl: './grade-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradeSelector {
  readonly #messages = inject(MessageService);

  /** The cells to draw, ascending — one to the recipe's highest. */
  readonly grades = input.required<readonly number[]>();

  /**
   * Which of the two artboards' controls to draw.
   *
   * Canvas 1c draws `GRADE   5` over a bar of five bare cells filled up to the
   * chosen one; canvas 1d draws five numbered buttons with only the chosen one
   * filled. Two drawings of one choice, and the difference is not a width the
   * control can read off itself — it is which artboard the editor around it is
   * being drawn as, which only the editor knows (Commander request 2026-08-26).
   */
  readonly asSteps = input(false);

  /** The first grade the recipe offers. Cells below it are drawn and refused. */
  readonly lowest = input<number | null>(null);

  /**
   * How a cell writes the grade it is.
   *
   * The ship tool's cells carry the bare number both its canvases draw. The
   * bench's carry `G1`…`G5`, which is how the equipment canvas writes a grade
   * everywhere it writes one — including on the ledger chip beside the row this
   * ladder belongs to. The words come from the caller rather than from a flag,
   * so the format stays in the catalogue the caller already reads.
   */
  readonly cellLabels = input<readonly string[] | null>(null);

  /**
   * Drawn as a preview of a ladder rather than as one.
   *
   * Canvas 2a shows what a suit will bring before there is a suit to grade, and
   * draws those cells flat — nothing chosen, nothing choosable. Without it the
   * preview is the live control's amber, which reads as five buttons that
   * answer nothing. The caller keeps it out of the accessibility tree; this is
   * what stops it looking like a control to everyone else.
   */
  readonly preview = input(false);

  readonly selected = input<number | null>(null);

  readonly chosen = output<number>();

  readonly groupName = relationId('grade-choice');

  readonly legend = this.#messages.messageSignal('outfitting.engineering.grade.legend');

  /**
   * The chosen grade, drawn beside the label exactly as canvas 1c draws it.
   *
   * Canvas 1d has no such figure and needs none: its cells carry their own
   * numbers, and the chosen one is the filled number. Written twice it would be
   * the same grade said twice in one control.
   */
  readonly selectedLabel = computed(() => {
    const grade = this.selected();
    return grade === null || this.asSteps() ? null : String(grade);
  });

  /**
   * True where this grade is below the one the recipe starts at.
   *
   * Drawn hatched rather than refused. A Merc-Coin article bought at grade 2
   * can still be taken back down to 1, and a cell that could not be pressed
   * would make that a thing a Commander can see and not do (wave 5).
   */
  /** What one cell writes: the caller's word for the grade, else the number. */
  readonly cellLabel = (grade: number, index: number): string =>
    this.cellLabels()?.[index] ?? String(grade);

  readonly unavailable = (grade: number): boolean => {
    const lowest = this.lowest();
    return lowest !== null && grade < lowest;
  };

  /**
   * Which cells are filled.
   *
   * Canvas 1c fills the bar to the chosen grade, so every cell up to it and
   * grade 5 reads as five. Canvas 1d fills the chosen button and no other,
   * because a numbered button that is filled for being *below* the choice would
   * be four buttons claiming to be the one that is pressed.
   */
  readonly filled = (grade: number): boolean => {
    const selected = this.selected();
    if (selected === null) {
      return false;
    }
    return this.asSteps() ? grade === selected : grade <= selected;
  };

  /**
   * What each cell is called.
   *
   * A grade outside the recipe's range says so. The hatch over the cell is what
   * a Commander sees, and it is drawn to the non-text contrast floor, but a mark
   * is not a statement: nothing else on the cell distinguishes a grade the
   * recipe cannot reach from one it can, and a state carried by the drawing
   * alone is the one thing that is never allowed (constitution V).
   */
  readonly optionLabel = (grade: number): string =>
    this.#messages.message(
      this.unavailable(grade)
        ? 'outfitting.engineering.grade.option-outside'
        : 'outfitting.engineering.grade.option',
      { grade },
    );
}
