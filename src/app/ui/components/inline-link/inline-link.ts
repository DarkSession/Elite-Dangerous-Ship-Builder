import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A link inside a sentence.
 *
 * `ActionLink` is a control: it takes the target baseline, its own padding and
 * its own row, because it is one of the things a screen offers. This is not
 * that. It is a few words in the middle of a line that happen to go somewhere,
 * and it has to sit in the text flow without breaking the line it is part of —
 * which is why it is a component of its own rather than a variant.
 *
 * It carries no emphasis, no icon and no state. It is underlined, so it is not
 * identified by colour alone (constitution V), and it wraps with the sentence
 * around it rather than pushing the page sideways.
 *
 * Every instance leaves the application, because there is nowhere inside the
 * application a sentence would link to — routes are navigated, not read about.
 * So the destination is named in the visible words the caller supplies, and
 * those words are the whole of the accessible name: a Commander is told where
 * they are going before they go (constitution I), and told it once.
 */
@Component({
  selector: 'edsb-inline-link',
  templateUrl: './inline-link.html',
  styleUrl: './inline-link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineLink {
  /** The visible words. They name where the link goes, in the reader's language. */
  readonly label = input.required<string>();

  readonly href = input.required<string>();
}
