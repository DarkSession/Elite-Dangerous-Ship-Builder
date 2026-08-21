import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * One item in a collection.
 *
 * `actions` are the item's own controls. They are rendered as siblings of the
 * item's own activation target, never nested inside it — a clickable container
 * that swallows independent controls is the pattern this component exists to
 * prevent (feedback contract, "Application structure").
 */
export interface CollectionItem {
  readonly id: string;
  /** The item's primary readable text. */
  readonly label: string;
  /** Supporting text, associated with the item. */
  readonly detail?: string;
  /** Whether the item itself can be activated. */
  readonly activatable?: boolean;
  readonly selected?: boolean;
  readonly disabled?: boolean;
}

/**
 * A semantic list of items.
 *
 * A real `ul`/`li`, so a reader is told how many items there are and where they
 * are in the set. The alternative — a stack of divs — gives them neither.
 *
 * Selection is exposed as `aria-current`, and the caller supplies the visible
 * text that names it, so selection never depends on a border position or a
 * background tint.
 */
@Component({
  selector: 'edsb-collection',
  templateUrl: './collection.html',
  styleUrl: './collection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Collection {
  /** What the list contains. Becomes the list's accessible name. */
  readonly label = input.required<string>();
  readonly items = input.required<readonly CollectionItem[]>();

  /** Visible text naming the selected item's state. */
  readonly selectedLabel = input<string | null>(null);

  /** Text shown when the collection is empty. Never an empty region. */
  readonly emptyLabel = input<string | null>(null);

  readonly activated = output<string>();

  detailId(id: string): string {
    return `${id}-detail`;
  }

  activate(item: CollectionItem): void {
    if (item.disabled ?? false) {
      return;
    }
    this.activated.emit(item.id);
  }
}
