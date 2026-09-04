import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A link.
 *
 * Separate from the button because the distinction is real: a link navigates
 * and a button acts, and a reader listening to a list of links expects every
 * one of them to take them somewhere.
 *
 * An external destination is named as such in visible text — a Commander is
 * told before they leave the application, never after (constitution I).
 */
@Component({
  selector: 'ednb-action-link',
  templateUrl: './action-link.html',
  styleUrl: './action.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionLink {
  readonly label = input.required<string>();
  readonly href = input.required<string>();

  /** True when the destination is outside the application. */
  readonly external = input(false);

  /** Visible text naming the destination as external. Required when `external`. */
  readonly externalLabel = input<string | null>(null);

  readonly disabled = input(false);
}
