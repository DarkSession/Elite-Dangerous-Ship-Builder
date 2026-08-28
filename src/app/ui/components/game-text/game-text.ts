import {
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { type GameTextTranslationState } from '../../../i18n/game-text.presenter';
import { MessageService } from '../../../i18n/message.service';
import { relationId } from '../../a11y/text-equivalence';

/**
 * Almanac game text, rendered with its provenance.
 *
 * Three states, and each is said out loud rather than implied:
 *
 *   * **localized** — the package had the text in the active locale. Nothing to
 *     disclose; it simply reads.
 *   * **canonical** — the package had no translation, so its own canonical text
 *     is shown, marked as untranslated and described so a reader knows why the
 *     words are in another language. The `lang` attribute says which language,
 *     so a screen reader pronounces it correctly instead of reading English
 *     with German phonetics.
 *   * **unavailable** — the package has nothing at all. The absence is stated;
 *     the raw symbol is never used as a display name (FR-020).
 *
 * The text itself is never translated here and never comes from an application
 * catalogue. Only the framing around it — the untranslated tag, the disclosure,
 * the unavailable wording — is application-owned.
 */
@Component({
  selector: 'edsb-game-text',
  templateUrl: './game-text.html',
  styleUrl: './game-text.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameText {
  readonly #messages = inject(MessageService);

  /** The package-returned string. `null` only in the unavailable state. */
  readonly text = input<string | null>(null);

  /** The language the text is actually in, so `lang` can be accurate. */
  readonly language = input<string | null>(null);

  readonly translationState = input.required<GameTextTranslationState>();

  /** What the value would have named. Gives an absence its context. */
  readonly label = input<string | null>(null);

  readonly disclosureId = relationId('game-text-disclosure');

  readonly isCanonical = computed(() => this.translationState() === 'canonical');
  readonly isUnavailable = computed(() => this.translationState() === 'unavailable');

  /** The short tag shown beside canonical text. */
  readonly untranslatedLabel = this.#messages.messageSignal('game-text.untranslated.label');

  /**
   * Why the text is in another language.
   *
   * Names the locale the reader asked for, using that language's own name, so
   * the sentence reads as a statement about their language rather than about a
   * tag they may not recognise.
   */
  readonly disclosure = computed(() =>
    this.#messages.message('game-text.untranslated.description', {
      locale: this.#messages.message('locale.self-name'),
    }),
  );

  readonly unavailableText = this.#messages.messageSignal('game-text.unavailable');

  private readonly value = viewChild<ElementRef<HTMLElement>>('value');

  /**
   * Whether the box it was given is too narrow to draw the whole text.
   *
   * Asked by a caller that truncates this text — the ledger row, and nothing
   * else — because the box that overflows is this one: the row's rule shrinks
   * the value alone so the untranslated tag beside it keeps its place, so the
   * badge above cannot see the overflow from its own element. A pixel of slack
   * for sub-pixel layout, which the two engines round differently.
   */
  cut(): boolean {
    const element = this.value()?.nativeElement;
    return element !== undefined && element.scrollWidth - element.clientWidth > 1;
  }
}
