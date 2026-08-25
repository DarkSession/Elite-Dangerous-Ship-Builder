import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { relationId } from '../../a11y/text-equivalence';

/**
 * Someone else's words, reproduced rather than restated.
 *
 * The excerpt is the only legal body this application embeds, and everything
 * about this component exists to keep it the document it came from: the text is
 * bound as text, never as markup, so nothing in it can become a link, a heading
 * or an element; it is marked in the language it was written in, so a reader
 * whose interface is in German is not read English prose in a German voice; and
 * the framing around it — where it came from, and that it is untranslated — is
 * associated with the region rather than left as prose beside it.
 *
 * It renders what it is given. It does not fetch, parse, translate, wrap,
 * summarise or link the text, because every one of those would be this
 * application editing a notice it is only carrying (constitution IV).
 */
@Component({
  selector: 'edsb-legal-excerpt',
  templateUrl: './legal-excerpt.html',
  styleUrl: './legal-excerpt.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalExcerpt {
  /** Where the excerpt was taken from, in the reader's own language. */
  readonly sourceNotice = input.required<string>();

  /** That the excerpt itself stays in the language it was written in. */
  readonly languageNotice = input.required<string>();

  /** The exact text. Rendered as text content and never as markup. */
  readonly text = input.required<string>();

  /** The language the excerpt is in, as a BCP 47 tag. */
  readonly language = input.required<string>();

  readonly sourceId = relationId('legal-excerpt-source');
  readonly languageId = relationId('legal-excerpt-language');

  /** Both notices, in the order a reader meets them. */
  readonly describedBy = computed(() => `${this.sourceId} ${this.languageId}`);
}
