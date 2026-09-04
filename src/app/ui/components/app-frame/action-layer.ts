import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ActionButton } from '../action/action-button';
import { relationId } from '../../a11y/text-equivalence';
import type { ShellAction } from './app-frame';

/**
 * The folded shell action layer.
 *
 * When the banner cannot hold every action on one row, the actions move into
 * this layer rather than being dropped. The layer relates to its trigger by
 * `aria-controls`, so a reader is told both that there is more and whether it
 * is currently open.
 *
 * The trigger is drawn as canvas 1d draws it — the `⋮` mark on its own
 * outlined square — and named as this feature requires: the mark is hidden and
 * the localized name is carried as text inside the control. An earlier reading
 * spelled the name out on screen instead, on the grounds that a glyph is a
 * guess with no accessible name. Only the second half of that was true, and it
 * is answered by the hidden text rather than by the drawing: the name is in the
 * accessibility tree, the target keeps its 44-pixel baseline, and there is no
 * image, no font icon and no shape whose meaning has to be learned. What is
 * still refused is a control with no text name at all (011 reference review,
 * ruled 2026-08-26).
 *
 * Presentation-only: the open state arrives as input and leaves as intent, so
 * the layer never becomes a second place where shell state lives.
 */
@Component({
  selector: 'edsb-action-layer',
  imports: [ActionButton],
  templateUrl: './action-layer.html',
  styleUrl: './action-layer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionLayer {
  /** The actions the layer holds. Each keeps its own visible label. */
  readonly actions = input.required<readonly ShellAction[]>();

  /** Accessible name of the group of actions. */
  readonly label = input.required<string>();

  /** Visible trigger text while the layer is closed. */
  readonly openLabel = input.required<string>();

  /** Visible trigger text while the layer is open. */
  readonly closeLabel = input.required<string>();

  readonly expanded = input(false);
  readonly disabled = input(false);

  readonly toggled = output<boolean>();
  readonly actionSelected = output<string>();
  readonly triggerId = relationId('action-layer-trigger');
  readonly layerId = relationId('action-layer-panel');

  /**
   * The trigger's visible text.
   *
   * It states the action the control performs now, so the words change with the
   * state instead of leaving `aria-expanded` as the only signal (FR-010).
   */
  readonly triggerLabel = computed(() => (this.expanded() ? this.closeLabel() : this.openLabel()));

  toggle(): void {
    if (this.disabled()) {
      return;
    }
    this.toggled.emit(!this.expanded());
  }

  select(action: ShellAction): void {
    if (this.disabled() || (action.disabled ?? false)) {
      return;
    }
    this.actionSelected.emit(action.id);
  }
}
