import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** One of the four blocks a bank's pips are drawn and set with. */
export interface PipStepView {
  readonly id: string;
  /** The pip count pressing it asks for. */
  readonly value: number;
  /** How much of this block the bank's allocation fills, in `[0, 1]`. */
  readonly fill: number;
  readonly label: string;
}

/**
 * The four blocks that set one bank's pips.
 *
 * One control drawn in two places — the status rail's pip sets and the
 * distributor table's cells — on one allocation. It is drawn at the same size
 * in both, at the 24-pixel target floor rather than at the reference's own 14
 * and 16, so a Commander presses the same thing wherever they reach for it.
 * Two copies of that are an agreement kept by hand.
 *
 * A block is filled from its leading edge, so a bank standing on a half fills
 * half a block. The group is named with the allocation it stands at, which is
 * the reading for anyone who cannot see the blocks; the colour is decoration on
 * top of it.
 */
@Component({
  selector: 'ednb-pip-control',
  templateUrl: './pip-control.html',
  styleUrl: './pip-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipControl {
  /**
   * The bank's own key, and what the colour is chosen by.
   *
   * A string rather than the domain's union: this draws a control, and which
   * banks a ship carries is not its decision (constitution III).
   */
  readonly bank = input.required<string>();

  /** The allocation the group stands at, in words. */
  readonly label = input.required<string>();

  readonly steps = input.required<readonly PipStepView[]>();

  /** A block was pressed. What that does to the other banks is the caller's. */
  readonly stepRequested = output<number>();
}
