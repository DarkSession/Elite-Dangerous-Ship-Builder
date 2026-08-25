import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { relationId } from '../../a11y/text-equivalence';

/**
 * A link out of the application that says so before it is followed.
 *
 * The distinction from `ActionLink` is what is guaranteed rather than what is
 * drawn: this one cannot be configured without its warning. `external` there is
 * an input a caller can leave false; here leaving the application, possibly
 * needing a network and what the destination is for are three required pieces
 * of visible text, associated with the link so a reader meets them as its
 * description rather than as loose prose beside it.
 *
 * It is inert until it is activated. A real anchor with a real `href`, and
 * nothing that fetches, prefetches, preconnects or measures the destination —
 * so an application that has made no request can be opened offline, read in
 * full, and closed again having still made none (constitution I).
 */
@Component({
  selector: 'edsb-warned-external-link',
  templateUrl: './warned-external-link.html',
  styleUrl: './warned-external-link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarnedExternalLink {
  /** The link's visible text. It is also its accessible name. */
  readonly label = input.required<string>();

  /** The absolute destination. Never carries application state. */
  readonly href = input.required<string>();

  /** What the destination is for, in the reader's own language. */
  readonly purpose = input.required<string>();

  /** That following it leaves the application. */
  readonly leavingWarning = input.required<string>();

  /** That following it may need a network connection. */
  readonly networkWarning = input.required<string>();

  readonly descriptionId = relationId('warned-external');

  /** The three sentences, in the order they are read. */
  readonly warnings = computed(() => [
    this.purpose(),
    this.leavingWarning(),
    this.networkWarning(),
  ]);
}
