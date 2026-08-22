import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ActionButton } from '../action/action-button';
import { relationId } from '../../a11y/text-equivalence';
import type { NavigationEntry, ShellAction } from './app-frame';

/**
 * The compact shell action layer.
 *
 * When the banner cannot hold every action on one row, the actions move into
 * this layer rather than being dropped or collapsed behind an icon. The trigger
 * carries visible localized text and the layer relates to it by
 * `aria-controls`, so a reader is told both that there is more and whether it
 * is currently open.
 *
 * This deliberately replaces the reference canvas's unlabelled ellipsis
 * control. An ellipsis is a guess for anyone who has not already learned what
 * it hides, it has no accessible name of its own, and its 24-pixel hit area is
 * below the target baseline (shell design, "Compact/zoom composition").
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

  /** The screens the layer offers, drawn above the actions as links. */
  readonly links = input<readonly NavigationEntry[]>([]);

  /** Accessible name of the navigation landmark those links sit in. */
  readonly linksLabel = input('');

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
  readonly linkSelected = output<{ entry: NavigationEntry; event: MouseEvent }>();

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
