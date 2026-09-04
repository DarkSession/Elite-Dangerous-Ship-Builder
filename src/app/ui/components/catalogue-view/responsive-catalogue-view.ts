import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
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
  selector: 'ednb-responsive-catalogue-view',
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
   * Whether resting a pointer on a row reads the hull it names.
   *
   * Answered by the screen rather than asked here, because it is two questions
   * and neither is this box's. The **device** has to be able to rest a pointer
   * without pressing, and the **rail** the reading appears in has to be drawn —
   * and a component composing from the box it was given cannot see a rail
   * beside it (`observeRestingReads`, `design/hull-catalogue.md`, "Resting reads
   * a hull only where the rail is drawn").
   *
   * One input rather than two, so the row's press, its hover and its own words
   * cannot answer differently. Where it is false the manifest takes the path a
   * touch screen takes: the press opens the hull, and the sheet's own action
   * builds it.
   */
  readonly restsToRead = input.required<boolean>();

  /**
   * Whether the pointer has actually moved since this list appeared.
   *
   * A page that loads under a resting pointer fires `mouseenter` on whichever
   * row the layout happens to put beneath it — no movement, no intent, and the
   * hull under the cursor is chance. Resting reads a hull *and replaces the
   * address*, so without this a Commander opening a shared or bookmarked
   * `/ships/Anaconda` with their pointer over the manifest landed on some other
   * hull entirely, and the address they followed was gone (reported
   * 2026-08-28).
   *
   * `pointermove` is what tells the two apart, measured rather than assumed: a
   * hover fires `pointerover, mouseover, mouseenter, pointermove`, and a load
   * under a resting pointer fires the same sequence with the move missing.
   * Nothing resets it — once the Commander has moved the pointer, every
   * `mouseenter` after that is theirs.
   */
  readonly #pointerMoved = signal(false);

  /**
   * The row entered before the first move has confirmed there was one.
   *
   * The move that carries a pointer onto a row fires `mouseenter` *before* its
   * `pointermove`, so a row cannot be answered the moment it is entered without
   * answering the resting pointer too. It is held here instead and released by
   * the move, which on a real hover is the very next event and on a load never
   * comes at all.
   */
  #enteredBeforeMoving: string | null = null;

  readonly captionId = relationId('catalogue-caption');
  readonly selectedLabel = this.#messages.messageSignal('catalogue.selected');
  readonly markerLabel = this.#messages.messageSignal('catalogue.selected');

  readonly #ascending = this.#messages.messageSignal('catalogue.sort.indicator.ascending');
  readonly #descending = this.#messages.messageSignal('catalogue.sort.indicator.descending');

  /** The reference's current-row lozenge. Decorative: `aria-current` says it. */
  readonly marker = '\u25c6';

  readonly isEmpty = computed(() => this.hulls().length === 0);

  constructor() {
    const destroyRef = inject(DestroyRef);

    // On the document, because the movement that matters happens before the
    // pointer reaches a row: by the time `mouseenter` fires on one, the pointer
    // has already crossed the page to get there.
    const view = inject(DOCUMENT).defaultView;
    if (view) {
      const moved = (): void => {
        this.#pointerMoved.set(true);
        view.removeEventListener('pointermove', moved);
        const entered = this.#enteredBeforeMoving;
        this.#enteredBeforeMoving = null;
        // Asked again rather than carried over from the row being entered. The
        // stash outlives that moment, and the answer can change inside it: a
        // window zoomed or dragged below the rail's own width between the
        // `mouseenter` and the move that releases it would otherwise read a
        // hull into a rail that is no longer drawn — the reported behaviour, at
        // one row instead of every row the pointer crosses.
        if (entered !== null && this.restsToRead()) {
          this.hullPreviewed.emit(entered);
        }
      };
      view.addEventListener('pointermove', moved, { passive: true });
      destroyRef.onDestroy(() => view.removeEventListener('pointermove', moved));
    }
  }

  /**
   * Resting on a row reads the hull, where resting is a thing that reads
   * anything at all and where the Commander put the pointer there themselves.
   */
  preview(hull: HullSummary): void {
    if (!this.restsToRead()) {
      return;
    }
    if (this.#pointerMoved()) {
      this.hullPreviewed.emit(hull.symbol);
      return;
    }
    this.#enteredBeforeMoving = hull.symbol;
  }

  /**
   * Pressing a row flies it, where resting has already read it.
   *
   * Where resting reads nothing the first press opens the hull instead, because
   * nothing else can. Pressing the row that is *already* open is then the
   * decision to fly it — the same second step a pointer makes by resting and
   * then pressing. Until 2026-08-28 that second press repeated the navigation
   * the row had already made and nothing happened (Commander request).
   *
   * The environment answers this question, and the press itself overrules it. A
   * laptop with a touch screen at the rail's width matches the query and a
   * finger on it has still never rested anywhere, so on that device a tap would
   * take the first branch and build a hull the Commander has not read — from
   * anywhere on the row, since the whole row presses. A press made by touch
   * therefore takes the touch path whatever the environment says: it opens the
   * hull, and the press after it builds, which is the same two steps and the
   * safer one first.
   */
  activate(hull: HullSummary, press?: Event): void {
    if (hull.selected || (this.restsToRead() && !byTouch(press))) {
      this.hullBuilt.emit(hull.symbol);
      return;
    }
    this.hullOpened.emit(hull.symbol);
  }

  /** `aria-sort` for a header: only the sorted column carries one. */
  ariaSort(column: CatalogueColumn): string | null {
    return column.sorted ? column.direction : null;
  }

  /**
   * The caret the reference paints on the column a list is ordered by (canvas
   * 1a `.sy-caret`). Decorative: `aria-sort` and the header's own accessible
   * name carry the same fact.
   *
   * A header the list is not ordered by gets one too, and hides it — see
   * {@link caretReserved}. It is the ascending glyph because the two are the
   * same width and something has to be there for the width to be reserved.
   */
  indicator(column: CatalogueColumn): string {
    return column.sorted && column.direction === 'descending'
      ? this.#descending()
      : this.#ascending();
  }

  /**
   * Whether this header's caret is holding its place rather than reading.
   *
   * Hidden rather than absent: the two right-ranged headings are pushed along
   * by a caret that appears, so the caret's width is part of the column at all
   * times and only its ink comes and goes.
   */
  caretReserved(column: CatalogueColumn): boolean {
    return !column.sorted;
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
   * Which action that is follows the same answer the press does, and where
   * resting reads nothing, the row: where a rest can read the hull, it does and
   * the press builds; where it cannot, the press opens the detail until the row
   * is the open one, and then it builds. The words say whichever of the two the
   * next press will do, so the control is never named for an action it no
   * longer takes.
   */
  openActionLabel(hull: HullSummary): string {
    const builds = this.restsToRead() || hull.selected;
    return this.#messages.message(builds ? 'catalogue.build-hull' : 'catalogue.open-hull', {
      hull: hull.name.text ?? hull.symbol,
    });
  }
}

/**
 * Whether a press was made by a finger.
 *
 * A `click` carries the pointer that made it, so the question is answered by
 * the press rather than about the device. A keyboard's press carries no pointer
 * type at all, which is neither a finger nor a reason to open instead of build:
 * it takes the device's own answer, like a mouse.
 */
function byTouch(press: Event | undefined): boolean {
  return press instanceof PointerEvent && press.pointerType === 'touch';
}
