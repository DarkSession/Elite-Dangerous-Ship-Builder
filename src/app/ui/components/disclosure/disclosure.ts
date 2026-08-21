import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { relationId } from '../../a11y/text-equivalence';

/**
 * A show/hide control with its content.
 *
 * The expanded state is exposed as `aria-expanded` and the content is related
 * to the trigger by `aria-controls`, so a reader knows both that there is more
 * and whether it is currently showing.
 *
 * The content is a persistent alternative to hover. The reference canvas puts
 * meaning in `title` tooltips and hover tips; on a touch device those are
 * unreachable, and to a screen reader they are unreliable. Anything worth
 * saying goes in here, where a tap opens it (FR-006, FR-010).
 */
@Component({
  selector: 'edsb-disclosure',
  templateUrl: './disclosure.html',
  styleUrl: './disclosure.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Disclosure {
  /** The trigger's visible label. */
  readonly label = input.required<string>();
  readonly expanded = input(false);
  readonly disabled = input(false);

  /** Visible text naming the state, beyond the control's own affordance. */
  readonly stateLabel = input<string | null>(null);

  readonly toggled = output<boolean>();

  readonly triggerId = relationId('disclosure-trigger');
  readonly contentId = relationId('disclosure-content');

  toggle(): void {
    if (this.disabled()) {
      return;
    }
    this.toggled.emit(!this.expanded());
  }
}
