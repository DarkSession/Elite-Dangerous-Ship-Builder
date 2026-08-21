import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ActionButton } from '../action/action-button';
import { Layer } from '../layer/layer';
import { relationId } from '../../a11y/text-equivalence';

/**
 * One way out of a decision, and what it costs.
 *
 * `outcome` is required rather than optional because this component exists for
 * decisions where the button label alone is not enough — "Overwrite" and "Keep
 * both" say what happens to a file, not which of two versions of an evening's
 * work survives (build-library design, "Named conflict").
 */
export interface DialogChoice {
  readonly id: string;
  /** The action's own words. Also its accessible name. */
  readonly label: string;
  /** Visible text saying which version survives, and what is lost. */
  readonly outcome: string;
  readonly emphasis?: 'primary' | 'secondary' | 'quiet' | 'danger';
}

/**
 * A decision with more than two answers.
 *
 * A save conflict has three, and none of them is "cancel out of the problem":
 * overwrite, keep both and cancel each keep a different thing, and a Commander
 * has to be able to tell which. Each choice therefore carries its outcome as
 * visible, associated text beside the button rather than as a tooltip or an
 * inference from button order.
 */
@Component({
  selector: 'edsb-choice-dialog',
  imports: [ActionButton, Layer],
  templateUrl: './choice-dialog.html',
  styleUrl: './choice-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoiceDialog {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly choices = input.required<readonly DialogChoice[]>();
  readonly dismissLabel = input.required<string>();

  readonly chosen = output<string>();
  readonly dismissed = output<void>();

  readonly groupId = relationId('choice-dialog');

  outcomeId(id: string): string {
    return `${this.groupId}-${id}-outcome`;
  }
}
