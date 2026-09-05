import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Where the block sits in the space it is given. */
export type EmptyStateAlign = 'centre' | 'leading';

/**
 * What a screen says where its content would be, when there is none.
 *
 * A heading, a sentence and whatever way out the screen offers. The way out is
 * projected rather than an input, because it differs at every call site: a link
 * to the shipyard on one screen, a notice and a link on another, nothing at all
 * on a third.
 *
 * The heading is an `h2` at every call site. On a screen it sits one level under
 * that screen's `h1`; in a layer it stands beside the layer's own title, which
 * is an `h2` as well, and names the state of the list the title named. A level
 * of its own would be a second outline decision made in three places.
 *
 * It says what is not there. It never says a screen is empty while the screen
 * is still finding out — that is a waiting state, and `Skeleton` draws it
 * (011/FR-029).
 */
@Component({
  selector: 'ednb-empty-state',
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  /** What is not there, named. */
  readonly title = input.required<string>();

  /** Why, and what to do about it. `null` where the caller projects its own. */
  readonly description = input<string | null>(null);

  /**
   * How the block sits in its space.
   *
   * A centred block is the whole of the screen it is on and centres itself at
   * every width. A leading one shares its width with something else where there
   * is room for both, so it centres itself only below the wide step, where it
   * becomes the whole screen too.
   */
  readonly align = input<EmptyStateAlign>('centre');

  readonly classes = computed(() => `empty empty--${this.align()}`);
}
