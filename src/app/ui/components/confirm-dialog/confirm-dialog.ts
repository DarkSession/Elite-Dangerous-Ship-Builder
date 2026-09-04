import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ActionButton } from '../action/action-button';
import { Layer } from '../layer/layer';

/**
 * A question with two answers, one of which cannot be undone.
 *
 * Built on `Layer`, so background inertness, the top layer and focus return all
 * come from the platform's own `<dialog>` rather than being reimplemented here.
 * What this adds is the part a Commander reads: a title that names the thing,
 * a description that says what will happen to it, and two buttons whose labels
 * say what each one does — never "OK" and "Cancel" over an unnamed subject.
 *
 * The confirming action carries `danger` emphasis where a caller asks for it,
 * but the wording is what carries the meaning: emphasis is colour, and colour
 * is never the only signal (FR-010).
 */
@Component({
  selector: 'ednb-confirm-dialog',
  imports: [ActionButton, Layer],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  readonly open = input(false);

  /** What is being confirmed. Names the record, hull or build. */
  readonly title = input.required<string>();

  /** What will happen, in the Commander's language. */
  readonly description = input<string | null>(null);

  /** The confirming action's own words: "Delete build", not "OK". */
  readonly confirmLabel = input.required<string>();
  readonly cancelLabel = input.required<string>();
  readonly dismissLabel = input.required<string>();

  /** True when confirming destroys something. */
  readonly destructive = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
