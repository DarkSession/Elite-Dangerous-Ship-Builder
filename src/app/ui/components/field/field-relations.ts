import { computed, type Signal } from '@angular/core';
import { describedBy, relationId } from '../../a11y/text-equivalence';

/**
 * The label, description and error relationships every labelled control shares.
 *
 * Written once because getting it wrong is easy and invisible: a placeholder
 * used as a label, an error shown in red beside a field but never associated
 * with it, a description a sighted reader gets and a screen-reader user does
 * not. All three are the same defect — meaning present visually and absent
 * programmatically.
 */
export interface FieldRelations {
  /** Id of the visible label element. */
  readonly labelId: string;
  /** Id of the control itself, for the label's `for`. */
  readonly controlId: string;
  /** Id of the description element, whether or not it is rendered. */
  readonly descriptionId: string;
  /** Id of the error element, whether or not it is rendered. */
  readonly errorId: string;
  /** The value for `aria-describedby`, or `null` when nothing describes it. */
  readonly describedBy: Signal<string | null>;
  /** Whether the control is currently invalid. */
  readonly invalid: Signal<boolean>;
}

/**
 * Builds the relationships for one control instance.
 *
 * Ids are generated per instance: a description is only useful if it belongs to
 * the field the reader is actually on.
 */
export function createFieldRelations(sources: {
  description: Signal<string | null | undefined>;
  error: Signal<string | null | undefined>;
  unit?: Signal<string | null | undefined>;
}): FieldRelations {
  const labelId = relationId('label');
  const controlId = relationId('control');
  const descriptionId = relationId('description');
  const errorId = relationId('error');
  const unitId = relationId('unit');

  const hasText = (value: string | null | undefined): boolean =>
    typeof value === 'string' && value.trim().length > 0;

  return {
    labelId,
    controlId,
    descriptionId,
    errorId,
    describedBy: computed(() =>
      describedBy(
        hasText(sources.description()) ? descriptionId : null,
        hasText(sources.unit?.()) ? unitId : null,
        // The error comes last so it is the most recent thing a reader hears
        // before acting on the field.
        hasText(sources.error()) ? errorId : null,
      ),
    ),
    invalid: computed(() => hasText(sources.error())),
  };
}
