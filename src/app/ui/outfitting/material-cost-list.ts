import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { GameTextPresentation } from '../../i18n/game-text.presenter';
import type { MessageKey } from '../../i18n/locale-registry';
import { MessageService } from '../../i18n/message.service';
import { GameText } from '../components/game-text/game-text';
import { MaterialGrade } from './material-grade';
import { relationId } from '../a11y/text-equivalence';

/** One material a job consumes, already resolved and formatted. */
export interface MaterialLineView {
  readonly symbol: string;
  readonly name: GameTextPresentation;
  /** The package's own rarity grade, 1–5. `null` where it publishes none. */
  readonly grade: number | null;
  /** The count, formatted for the active locale. */
  readonly count: string;
}

/** Which part of the job a list belongs to. */
export type MaterialPart = 'blueprint' | 'experimental' | 'combined';

/** One part's requirement, or the reason there is no figure for it. */
export interface MaterialPartView {
  readonly part: MaterialPart;
  readonly state: 'known' | 'unavailable' | 'notSelected';
  readonly materials: readonly MaterialLineView[];
}

/**
 * What the selected engineering would cost in materials.
 *
 * The canvas heads this `MATERIALS · G5` and lists an icon, a name and a count
 * per row, with `REQUIRED` on the right and Merc Coins on their own line. It is
 * drawn as a requirement and named as one: the heading gives the grade and
 * nothing calls the recipe a roll, because a completed grade is the only thing
 * this application models (FR-013, reference review "`G5 ROLL` label").
 *
 * Three states per part, kept apart the whole way down. `[]` is the package
 * saying nothing more is needed and reads as exactly that; `null` is the
 * package having no cost to state and reads as unavailable. Showing the second
 * as a zero would promise a free upgrade the Almanac never costed
 * (constitution VI).
 *
 * The canvas's rarity icons come from `edassets.org`. Nothing here reaches
 * another origin at runtime (constitution I), so each row carries a mark drawn
 * from the same idea instead — see `MaterialGrade`.
 *
 * Counts are in a description list so each number is associated with the
 * material it belongs to natively, rather than by sitting next to it.
 */
@Component({
  selector: 'edsb-material-cost-list',
  imports: [GameText, MaterialGrade],
  templateUrl: './material-cost-list.html',
  styleUrl: './material-cost-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialCostList {
  readonly #messages = inject(MessageService);

  readonly parts = input.required<readonly MaterialPartView[]>();

  /** The grade the heading names. `null` before one is chosen. */
  readonly grade = input<number | null>(null);

  readonly headingId = relationId('material-cost');

  readonly requiredLabel = this.#messages.messageSignal(
    'outfitting.engineering.materials.required',
  );
  readonly noneLabel = this.#messages.messageSignal('outfitting.engineering.materials.none');
  readonly unavailableLabel = this.#messages.messageSignal(
    'outfitting.engineering.materials.unavailable',
  );

  /** Canvas 1c and 1d both write `MATERIALS · G5`; without a grade, just the noun. */
  readonly heading = computed(() => {
    const grade = this.grade();
    return grade === null
      ? this.#messages.message('outfitting.engineering.materials.heading')
      : this.#messages.message('outfitting.engineering.materials.heading.grade', { grade });
  });

  /** Only the parts that have something to say. A part nothing selected is not drawn. */
  readonly shown = computed(() => this.parts().filter((part) => part.state !== 'notSelected'));

  /** The canvas heads the list once. Two headings only where there are two lists. */
  readonly namesParts = computed(
    () => this.shown().filter((part) => part.materials.length > 0).length > 1,
  );

  partLabel(part: MaterialPart): string {
    return this.#messages.message(
      (
        {
          blueprint: 'outfitting.engineering.materials.blueprint',
          experimental: 'outfitting.engineering.materials.experimental',
          combined: 'outfitting.engineering.materials.combined',
        } as const satisfies Record<MaterialPart, MessageKey>
      )[part],
    );
  }
}
