import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { relationId } from '../../a11y/text-equivalence';

/** One column. `unit` is announced with every value in the column. */
export interface TableColumn {
  readonly key: string;
  readonly label: string;
  readonly unit?: string;
  /** True for the column whose cells identify their row. */
  readonly rowHeader?: boolean;
  readonly numeric?: boolean;
}

/** One row. Values are already formatted for the active locale. */
export interface TableRow {
  readonly id: string;
  readonly cells: Readonly<Record<string, string>>;
  readonly selected?: boolean;
}

/**
 * A data table.
 *
 * A real `<table>` with a `<caption>` and header cells that scope to their
 * column and row. That scoping is the whole point: it is what lets a screen
 * reader say "Power draw, Power Plant, 12.4 megawatts" when a Commander lands
 * on a cell, instead of "12.4".
 *
 * Wide tables scroll inside their own labelled region. The document never
 * scrolls horizontally (FR-011).
 */
@Component({
  selector: 'edsb-data-table',
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTable {
  /** What the table shows. Rendered as the visible caption. */
  readonly caption = input.required<string>();
  readonly columns = input.required<readonly TableColumn[]>();
  readonly rows = input.required<readonly TableRow[]>();

  /** Text shown instead of an empty table body. */
  readonly emptyLabel = input<string | null>(null);

  /** Visible text naming a selected row's state. */
  readonly selectedLabel = input<string | null>(null);

  readonly captionId = relationId('table-caption');

  columnId(key: string): string {
    return `${this.captionId}-${key}`;
  }

  rowHeaderColumn(): TableColumn | null {
    return this.columns().find((column) => column.rowHeader) ?? null;
  }

  otherColumns(): readonly TableColumn[] {
    return this.columns().filter((column) => !column.rowHeader);
  }
}
