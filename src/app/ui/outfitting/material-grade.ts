import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MessageService } from '../../i18n/message.service';

/**
 * A material's rarity, drawn as the design draws it.
 *
 * The canvas puts `edassets.org/static/img/materials/grade-N.svg` in each row
 * at 13 × 13. These are those five files, taken once and shipped with the
 * application: nothing here reaches another origin at runtime (constitution I),
 * and nothing here is a redrawing of the game's mark either — a Commander
 * knows this icon, and an approximation of it would be a different icon.
 *
 * The grade is said in words beside the mark for anyone who cannot see it. The
 * mark itself is one colour at every grade, so what says which grade this is
 * is the shape rather than a hue.
 */
@Component({
  selector: 'ednb-material-grade',
  host: { '[attr.data-grade]': 'grade()' },
  templateUrl: './material-grade.html',
  styleUrl: './material-grade.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialGrade {
  readonly #messages = inject(MessageService);

  /** The package's own rarity grade, 1–5. */
  readonly grade = input.required<number>();

  /** The file for this grade, clamped to the five the design ships. */
  readonly source = computed(() => {
    const grade = Math.max(1, Math.min(5, Math.round(this.grade())));
    return `assets/icons/materials/grade-${grade}.svg`;
  });

  /** The grade in words, for a reader who cannot see the mark. */
  readonly label = computed(() =>
    this.#messages.message('outfitting.engineering.materials.grade', { grade: this.grade() }),
  );
}
