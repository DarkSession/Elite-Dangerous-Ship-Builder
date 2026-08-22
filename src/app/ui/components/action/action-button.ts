import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { relationId } from '../../a11y/text-equivalence';

/** How prominent an action is. Emphasis never carries meaning on its own. */
export type ActionEmphasis = 'primary' | 'secondary' | 'quiet' | 'danger';

/**
 * A button.
 *
 * A real `<button>`, because every alternative loses something: a `div` has no
 * role, no default activation and no disabled semantics, and the reference
 * canvas's 268 clickable `div`s are exactly the pattern this replaces.
 *
 * The label is always visible text. There is no icon-only variant: an icon
 * without words is a guess for anyone who does not already know what it means,
 * and the compact layouts keep visible labels rather than collapsing to an
 * unlabelled ellipsis (shell design, "Compact/zoom composition").
 */
@Component({
  selector: 'edsb-action-button',
  templateUrl: './action-button.html',
  styleUrl: './action.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionButton {
  /** The visible label. It is also the accessible name — they cannot differ. */
  readonly label = input.required<string>();

  readonly emphasis = input<ActionEmphasis>('secondary');

  /** True while the action is running. Exposed as `aria-busy`, not only as motion. */
  readonly busy = input(false);

  /** For a toggle. `null` when the button is not a toggle. */
  readonly pressed = input<boolean | null>(null);

  readonly disabled = input(false);

  /** Text announced alongside the label while busy, if the caller has one. */
  readonly busyLabel = input<string | null>(null);

  /**
   * What this action would do, for a reader who cannot see what it is next to.
   *
   * Invisible by design. The reference draws `↶ UNDO` and nothing else beside
   * it, so the label is the whole of what is drawn; which decision the control
   * would step through is the sort of thing a sighted Commander reads off the
   * screen they are looking at, and a reader needs said (design-canvas rule,
   * the accessibility floor).
   */
  readonly description = input<string | null>(null);

  readonly activated = output<void>();

  /**
   * The accessible name.
   *
   * While busy it appends the caller's busy text rather than replacing the
   * label, so the control does not appear to become a different button
   * mid-action.
   */
  readonly accessibleName = computed(() => {
    const busyLabel = this.busyLabel();
    return this.busy() && busyLabel ? `${this.label()} ${busyLabel}` : this.label();
  });

  readonly isToggle = computed(() => this.pressed() !== null);

  readonly descriptionId = relationId('action-description');

  activate(): void {
    if (this.disabled() || this.busy()) {
      return;
    }
    this.activated.emit();
  }
}
