import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MessageService } from '../../../i18n/message.service';
import { relationId } from '../../a11y/text-equivalence';
import { GameText } from '../game-text/game-text';
import { HullSummaryCard, type HullSummary } from '../hull-summary-card/hull-summary-card';
import { UnavailableValue } from '../unavailable-value/unavailable-value';

/** One sortable column, with the words that name its next action. */
export interface CatalogueColumn {
  readonly field: string;
  readonly label: string;
  /** The action label: "Sort by retail price, descending". */
  readonly sortActionLabel: string;
  /** True for the column the list is currently ordered by. */
  readonly sorted: boolean;
  readonly direction: 'ascending' | 'descending';
  readonly numeric?: boolean;
}

/**
 * The catalogue, in whichever composition the available space allows.
 *
 * Two renderings of one list, and exactly one of them exists at a time — the
 * other is removed from layout and from the accessibility tree by its media
 * query, so no hull is announced twice and no control is reachable while
 * invisible.
 *
 *   * **Wide**: a real `<table>` with `<th scope="col">` headers that are
 *     buttons. Real table semantics are what let a reader hear "Retail price,
 *     Anaconda, 146,969,450 CR" on a cell instead of a bare number, and a
 *     header that is a button is what makes the sort discoverable without a
 *     legend.
 *   * **Narrow**: the same facts as stacked definition-list cards. Not a table
 *     squeezed sideways: a five-column table at 390 CSS pixels either scrolls
 *     the document or truncates identities, and both are worse than restating
 *     the labels.
 *
 * The table owns its own overflow. The document never scrolls horizontally
 * (routes-and-ui contract).
 */
@Component({
  selector: 'edsb-responsive-catalogue-view',
  imports: [GameText, HullSummaryCard, UnavailableValue],
  templateUrl: './responsive-catalogue-view.html',
  styleUrl: './responsive-catalogue-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResponsiveCatalogueView {
  readonly #messages = inject(MessageService);

  /** What the list contains. Rendered as the table's visible caption. */
  readonly caption = input.required<string>();
  readonly columns = input.required<readonly CatalogueColumn[]>();
  readonly hulls = input.required<readonly HullSummary[]>();

  /** Text shown instead of an empty list. Never an empty region. */
  readonly emptyLabel = input<string | null>(null);

  readonly sortRequested = output<string>();
  readonly hullOpened = output<string>();
  /** A hull the pointer is resting on. The inspector follows it. */
  readonly hullPreviewed = output<string>();
  /** A hull the Commander asked to fly: the stock build for it. */
  readonly hullBuilt = output<string>();

  /**
   * Whether this device can hover at all.
   *
   * The manifest reads a hull on hover and builds one on click, which needs a
   * pointer that can rest somewhere without pressing. A touch screen has none:
   * there the row keeps opening the detail, where the build action already
   * lives as its own control. So the row's action, its accessible name and the
   * hover handler all follow this one answer rather than disagreeing about
   * which device is in front of them (constitution III, "touch as well as
   * pointer").
   */
  readonly #hoverable = signal(hoverMatch()?.matches ?? false);

  readonly captionId = relationId('catalogue-caption');
  readonly scrollLabel = this.#messages.messageSignal('catalogue.table.caption');
  readonly selectedLabel = this.#messages.messageSignal('catalogue.selected');
  readonly markerLabel = this.#messages.messageSignal('catalogue.selected');

  readonly #ascending = this.#messages.messageSignal('catalogue.sort.indicator.ascending');
  readonly #descending = this.#messages.messageSignal('catalogue.sort.indicator.descending');

  /** The reference's current-row lozenge. Decorative: `aria-current` says it. */
  readonly marker = '\u25c6';

  readonly isEmpty = computed(() => this.hulls().length === 0);

  constructor() {
    const query = hoverMatch();
    if (query === null) {
      return;
    }
    const follow = (): void => this.#hoverable.set(query.matches);
    query.addEventListener('change', follow);
    inject(DestroyRef).onDestroy(() => query.removeEventListener('change', follow));
  }

  /** Resting on a row reads the hull, where resting is a thing the device does. */
  preview(hull: HullSummary): void {
    if (this.#hoverable()) {
      this.hullPreviewed.emit(hull.symbol);
    }
  }

  /** Pressing a row flies it. Without hover it opens it, since nothing else can. */
  activate(hull: HullSummary): void {
    (this.#hoverable() ? this.hullBuilt : this.hullOpened).emit(hull.symbol);
  }

  /** `aria-sort` for a header: only the sorted column carries one. */
  ariaSort(column: CatalogueColumn): string | null {
    return column.sorted ? column.direction : null;
  }

  /**
   * The caret the reference paints on the column a list is ordered by (canvas
   * 1a `.sy-caret`). Decorative: `aria-sort` and the header's own accessible
   * name carry the same fact.
   */
  indicator(column: CatalogueColumn): string | null {
    if (!column.sorted) {
      return null;
    }
    return column.direction === 'ascending' ? this.#ascending() : this.#descending();
  }

  currentFor(hull: HullSummary): string | null {
    return hull.selected ? 'true' : null;
  }

  /**
   * The row action's own words.
   *
   * The visible text is the hull's name, because that is what a manifest row
   * should read as. The action is added as associated hidden text so the
   * control announces as something a Commander can do rather than as a noun —
   * and so one locator finds the same action in both compositions.
   *
   * Which action that is follows the device: where the row can be hovered, the
   * hover shows the hull and the press builds it; where it cannot, the press is
   * still the way in to the detail.
   */
  openActionLabel(hull: HullSummary): string {
    return this.#messages.message(
      this.#hoverable() ? 'catalogue.build-hull' : 'catalogue.open-hull',
      { hull: hull.name.text ?? hull.symbol },
    );
  }
}

/**
 * The one question this component asks the environment.
 *
 * Guarded because the renderer used for tests and prerendering has no
 * `matchMedia`, and a manifest that throws there renders nothing at all.
 */
function hoverMatch(): MediaQueryList | null {
  return typeof matchMedia === 'function' ? matchMedia('(hover: hover)') : null;
}
