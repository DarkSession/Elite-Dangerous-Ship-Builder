import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Someone else's words, reproduced rather than restated.
 *
 * The excerpt is the only legal body this application embeds, and everything
 * about this component exists to keep it the document it came from: the text is
 * bound as text, never as markup, so nothing in it can become a link, a heading
 * or an element, and it is marked in the language it was written in, so a
 * reader whose interface is in German is not read English prose in a German
 * voice.
 *
 * It renders what it is given. It does not fetch, parse, translate, wrap,
 * summarise or link the text, because every one of those would be this
 * application editing a notice it is only carrying (constitution IV).
 *
 * It also frames nothing. An earlier revision drew two sentences above the
 * quotation saying where it came from and that it was untranslated; the design
 * reference draws neither, and they are withdrawn with the rest of the framing
 * this feature had added around the reference's own licence block. The language
 * is still declared — as `lang`, where it is a fact about the text rather than
 * a sentence about it.
 */
@Component({
  selector: 'edsb-legal-excerpt',
  templateUrl: './legal-excerpt.html',
  styleUrl: './legal-excerpt.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalExcerpt {
  /** The exact text. Rendered as text content and never as markup. */
  readonly text = input.required<string>();

  /** The language the excerpt is in, as a BCP 47 tag. */
  readonly language = input.required<string>();
}
