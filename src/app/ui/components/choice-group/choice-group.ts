import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { createFieldRelations } from '../field/field-relations';
import { relationId } from '../../a11y/text-equivalence';

/** How the group behaves: one choice, many choices, or a single on/off. */
export type ChoiceKind = 'radio' | 'checkbox' | 'switch';

/**
 * How the group is composed.
 *
 * `stack` is one choice per row with room for a description. `segmented` is the
 * reference's abutted strip of tracked labels separated by hairline rules
 * (canvas 1a/1b, "Segmented choice"), for short sets of one-word choices that
 * need no description. `cards` is the reference's list of bordered plates, each
 * a tracked condensed title over a description, the chosen one washed amber
 * (canvas 1c, "Choice cards") — the export layer's format list is one.
 *
 * All three render the same native inputs; only the arrangement differs.
 *
 * `marked-cards` is the same plate carrying a selection marker: canvas 1c draws
 * the save layer's two modes as bordered cards led by a 12px square, filled on
 * the one that is chosen and open on the one that is not, with a sentence-case
 * title over a monospace outcome line. The export layer's format list carries no
 * such mark, which is why the two are separate arrangements rather than one with
 * a flag.
 *
 * `cards` resolves in CSS rather than in TypeScript, because the reference
 * draws the same set of choices two ways: a column of plates beside the content
 * where there is room for one, and the scrolling strip of tracked chips canvas
 * 1d draws above the content where there is not. Resolving it in the stylesheet
 * means it also answers to zoom and to text scale, which a measurement taken
 * once at construction would not.
 */
export type ChoiceLayout = 'stack' | 'segmented' | 'cards' | 'marked-cards';

/** One choice. `description` is associated, not merely rendered nearby. */
export interface Choice {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
  readonly disabled?: boolean;
}

/**
 * A group of related choices.
 *
 * Native `input` elements inside a `fieldset` with a `legend`. The fieldset is
 * what tells a screen reader that these options belong together and what the
 * group as a whole is asking — without it, a reader hears seven unrelated
 * checkboxes.
 *
 * A switch is a checkbox with `role="switch"`: the same semantics, named the
 * way an on/off control should be.
 */
@Component({
  selector: 'ednb-choice-group',
  templateUrl: './choice-group.html',
  styleUrl: './choice-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoiceGroup {
  /** The question the group asks. Rendered as the legend. */
  readonly legend = input.required<string>();
  /**
   * Whether the legend is drawn. The reference's segmented strip carries no
   * question above it; the words stay for anyone reading it aloud
   * (canvas 1a/1b).
   */
  readonly legendHidden = input(false);
  readonly choices = input.required<readonly Choice[]>();
  readonly kind = input<ChoiceKind>('radio');
  readonly layout = input<ChoiceLayout>('stack');

  /** Selected values. A radio group and a switch hold at most one. */
  readonly selected = input<readonly string[]>([]);

  readonly description = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly disabled = input(false);

  readonly changed = output<readonly string[]>();

  readonly relations = createFieldRelations({
    description: this.description,
    error: this.error,
  });

  /** A stable name binding the radio inputs of this instance together. */
  readonly groupName = relationId('choice-group');

  /** Whether each choice draws the selection square canvas 1c puts on it. */
  readonly hasMarker = computed(() => this.layout() === 'marked-cards');

  /**
   * Whether this group is drawn as plates at all.
   *
   * Its own hook rather than a selector naming both card arrangements, because
   * the plate is where nearly every rule of those two lives: keyed on the two
   * layout names it is written into every one of them, and this component's
   * stylesheet is already the largest in the library.
   */
  readonly isCards = computed(() => {
    const layout = this.layout();
    return layout === 'cards' || layout === 'marked-cards';
  });

  readonly isMultiple = computed(() => this.kind() === 'checkbox');
  readonly inputType = computed(() => (this.kind() === 'radio' ? 'radio' : 'checkbox'));
  readonly role = computed(() => (this.kind() === 'switch' ? 'switch' : null));

  isSelected(value: string): boolean {
    return this.selected().includes(value);
  }

  choiceId(value: string): string {
    return `${this.groupName}-${value}`;
  }

  choiceDescriptionId(value: string): string {
    return `${this.groupName}-${value}-description`;
  }

  toggle(value: string): void {
    if (this.disabled()) {
      return;
    }
    if (!this.isMultiple()) {
      this.changed.emit([value]);
      return;
    }
    const current = this.selected();
    this.changed.emit(
      current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value],
    );
  }
}
