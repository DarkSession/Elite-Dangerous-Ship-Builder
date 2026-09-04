import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MessageService } from '../../../i18n/message.service';
import { relationId } from '../../a11y/text-equivalence';
import { ActionButton } from '../action/action-button';

/** What is currently known about the illustration. */
export type HullArtworkState = 'loading' | 'available' | 'temporarily-unavailable';

/**
 * A hull's illustration, and the truth about it when it is not there.
 *
 * Three rules, and each exists because breaking it breaks something concrete:
 *
 *   * **the area is reserved at a fixed ratio**, so an illustration arriving
 *     late does not shove the facts below it down the page mid-read;
 *   * **the picture carries no information**, so its text equivalent is a name
 *     rather than a description of the shape — everything the illustration
 *     shows is also published as a fact;
 *   * **nothing here disables anything**. A missing illustration cannot stop a
 *     Commander creating a build, and its absence is stated as temporary
 *     because a same-origin asset that is missing right now almost always is
 *     (FR-006).
 */
@Component({
  selector: 'ednb-hull-artwork',
  imports: [ActionButton],
  templateUrl: './hull-artwork.html',
  styleUrl: './hull-artwork.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HullArtwork {
  readonly #messages = inject(MessageService);

  /** Same-origin, base-relative path to the package illustration. */
  readonly source = input.required<string>();

  /** The illustration's text equivalent, naming the hull it shows. */
  readonly label = input.required<string>();

  readonly state = input<HullArtworkState>('loading');

  /** Bumped by the caller to force a fresh attempt after a failure. */
  readonly attempt = input(0);

  readonly loaded = output<void>();
  readonly failed = output<void>();
  readonly retryRequested = output<void>();

  readonly statusId = relationId('artwork-status');

  /**
   * The loading mark, served from this origin like every other asset. The file
   * is a copy of EDAssets' `EDLoader1.svg`, not a link to it — nothing this
   * application draws is fetched from another host at runtime.
   */
  readonly loaderSource = 'assets/loader.svg';

  readonly loadingText = this.#messages.messageSignal('hullDetail.artwork.loading');
  readonly unavailableText = this.#messages.messageSignal('hullDetail.artwork.unavailable');
  readonly retryLabel = this.#messages.messageSignal('hullDetail.artwork.retry');

  readonly isUnavailable = computed(() => this.state() === 'temporarily-unavailable');
  readonly isLoading = computed(() => this.state() === 'loading');

  /**
   * The request URL, with the attempt number as a cache-busting parameter only
   * when retrying.
   *
   * The first attempt asks for the plain path so the service worker's cached
   * copy is used. A retry after a failure adds the counter, because the browser
   * would otherwise reuse its own negative result and the retry would do
   * nothing.
   */
  readonly requestUrl = computed(() =>
    this.attempt() === 0 ? this.source() : `${this.source()}?attempt=${this.attempt()}`,
  );
}
