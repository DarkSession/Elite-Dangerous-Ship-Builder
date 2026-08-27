import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { relationId } from '../../a11y/text-equivalence';
import { SavedBuildCard, type SavedBuild } from '../saved-build-card/saved-build-card';
import { StatusNotice } from '../status/status-notice';

/** A record this build cannot open, listed rather than hidden. */
export interface UnavailableRecord {
  readonly id: string;
  /** Why it cannot be opened, in the Commander's language. */
  readonly explanation: string;
  /** Whatever metadata could be read without guessing. */
  readonly detail: string | null;
}

/** The column headers the reference draws over the rows. */
export interface RecordColumns {
  readonly build: string;
  readonly hull: string;
  readonly modified: string;
}

/**
 * Every stored build, in one reading order.
 *
 * **One list since 2026-08-27.** Named and unnamed records were two labelled
 * groups, on the argument that they behave differently and that a library
 * holding a record for every build should say which of them a Commander named.
 * Every row already says it — a name they typed is set in the title's own
 * weight, and a title read from the build is set apart from one — so the
 * heading said it twice, and it cost the thing a library is read for: with two
 * groups, the build edited most recently is not reliably the row at the top
 * (FR-010, clarification 2026-08-27).
 *
 * **Rebuilt to the canvas 2026-08-25.** The grid of cards became the reference's
 * dense rows under one plate of column headers, in a single scrolling body. The
 * headers are drawn once for the whole list rather than repeated inside every
 * row, and they are `aria-hidden` because a row already names each of its own
 * parts — a reader hearing "BUILD HULL EDITED" before every row would be worse
 * served, not better (build-library design, "Reference composition").
 *
 * Records this build cannot open are listed last, with what is known about
 * them. Hiding them would make a Commander's build appear to have vanished;
 * listing them says it is still there and still theirs.
 */
@Component({
  selector: 'edsb-responsive-record-list',
  imports: [SavedBuildCard, StatusNotice],
  templateUrl: './responsive-record-list.html',
  styleUrl: './responsive-record-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResponsiveRecordList {
  /** What the list contains. Becomes its accessible name. */
  readonly label = input.required<string>();
  readonly builds = input.required<readonly SavedBuild[]>();
  readonly columns = input.required<RecordColumns>();
  readonly unavailable = input<readonly UnavailableRecord[]>([]);

  /** The record the footer's actions would act on. */
  readonly chosen = input<string | null>(null);

  /** The heading for the unavailable group, when there is one. */
  readonly unavailableLabel = input<string | null>(null);

  /**
   * The one sentence to draw instead of the list when a search matched nothing.
   *
   * On the body's own ground, with no panel and nothing else removed: every
   * control stays where it was, so widening the search needs no separate action
   * (build-library design, "No match").
   */
  readonly noMatch = input<string | null>(null);

  readonly chose = output<string>();

  readonly listId = relationId('record-list');

  readonly hasUnavailable = computed(() => this.unavailable().length > 0);

  /**
   * The heading id for the unavailable records.
   *
   * They keep a heading of their own, where the readable records lost theirs:
   * "this could not be read" is not something a row says for itself, and the
   * entries beneath it are notices rather than builds.
   */
  readonly unavailableId = `${this.listId}-unavailable`;
}
