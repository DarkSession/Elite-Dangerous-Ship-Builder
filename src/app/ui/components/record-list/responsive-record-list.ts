import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { relationId } from '../../a11y/text-equivalence';
import { SavedBuildCard, type SavedBuild } from '../saved-build-card/saved-build-card';
import { StatusNotice } from '../status/status-notice';

/** One labelled group of stored builds. */
export interface RecordListGroup {
  readonly id: string;
  /** The group's own heading: "Unnamed builds", "Named builds". */
  readonly label: string;
  readonly builds: readonly SavedBuild[];
  /** Shown instead of an empty group. */
  readonly emptyLabel: string;
}

/** A record this build cannot open, listed rather than hidden. */
export interface UnavailableRecord {
  readonly id: string;
  /** Why it cannot be opened, in the Commander's language. */
  readonly explanation: string;
  /** Whatever metadata could be read without guessing. */
  readonly detail: string | null;
}

/**
 * Every stored build, in one reading order.
 *
 * Working and named builds are separate groups because they behave
 * differently, but they are one list: the groups do not become columns that a
 * reader has to move between, and the narrow and wide compositions present the
 * same records in the same order.
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
  readonly groups = input.required<readonly RecordListGroup[]>();
  readonly unavailable = input<readonly UnavailableRecord[]>([]);

  /** The heading for the unavailable group, when there is one. */
  readonly unavailableLabel = input<string | null>(null);

  readonly actionSelected = output<{ recordId: string; actionId: string }>();

  readonly listId = relationId('record-list');

  readonly hasUnavailable = computed(() => this.unavailable().length > 0);

  groupId(id: string): string {
    return `${this.listId}-${id}`;
  }
}
