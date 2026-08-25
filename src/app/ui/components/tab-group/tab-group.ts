import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { relationId } from '../../a11y/text-equivalence';

/** One tab. */
export interface TabItem {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
  /**
   * The id of the panel this tab controls, when the consumer renders one.
   *
   * Optional, and absent by default: `aria-controls` pointing at an element
   * that does not exist is a broken reference, and the tab strip does not own
   * the panel. A consumer that renders panels supplies their ids; one that uses
   * tabs to switch a region it manages itself simply does not.
   */
  readonly panelId?: string;
}

/**
 * How the group presents: as tabs over a panel, or as a segmented control.
 *
 * The difference is real, not cosmetic. Tabs own a panel and expose
 * `aria-selected` with `aria-controls`; a segmented control is a set of
 * mutually exclusive buttons that filter something elsewhere, and claiming a
 * tablist role for it would promise a panel relationship that does not exist.
 */
export type TabPresentation = 'tabs' | 'segmented';

/**
 * A tab or segmented control.
 *
 * Selection is exposed programmatically and in visible text — never by colour
 * or an underline alone, which is how the reference canvas marks it (FR-010).
 */
@Component({
  selector: 'edsb-tab-group',
  templateUrl: './tab-group.html',
  styleUrl: './tab-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.tab-group-host--labelled]': 'labelVisible()' },
})
export class TabGroup {
  /** What the set of tabs is for. Becomes the group's accessible name. */
  readonly label = input.required<string>();

  /**
   * Whether {@link label} is drawn in front of the strip as well as exposed.
   *
   * Off by default, because most strips are named by what they sit under: the
   * anatomy's mode strip is the region's own heading said twice if it prints a
   * label, and the same goes for the `TOP` / `BOTTOM` side selector.
   *
   * On, the label becomes a visible caption and the group is named by it
   * through `aria-labelledby` rather than by a string only a screen reader
   * gets. That is the stronger of the two: the visible name and the accessible
   * name are then the same words by construction, which is what WCAG 2.5.3
   * asks for and what the preview contract already claims for this component.
   * Feature 005's `H-PTS` caption in front of its `DEPLOYED` / `RETRACTED`
   * segments is the canvas that asked for it.
   */
  readonly labelVisible = input(false);

  /** Ties the visible caption to the group that it names. */
  readonly labelId = relationId('tab-group-label');
  readonly tabs = input.required<readonly TabItem[]>();
  readonly selectedId = input.required<string>();
  readonly presentation = input<TabPresentation>('tabs');

  /** Visible text naming the selected state, for readers who cannot see it. */
  readonly selectedLabel = input<string | null>(null);

  readonly disabled = input(false);

  readonly selected = output<string>();

  readonly isTabs = computed(() => this.presentation() === 'tabs');

  isSelected(id: string): boolean {
    return id === this.selectedId();
  }

  select(tab: TabItem): void {
    if (this.disabled() || (tab.disabled ?? false)) {
      return;
    }
    this.selected.emit(tab.id);
  }
}
