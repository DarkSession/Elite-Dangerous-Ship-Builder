import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { NavigatorAdapter } from '../../platform/browser/navigator.adapter';
import { MessageService } from '../../i18n/message.service';
import { TextField } from '../components/text-field/text-field';

/**
 * Finding one module among the ones a mount takes.
 *
 * The canvas draws a single field with its words in the placeholder and a key
 * hint beside it — no label above, at either width. The label is here all the
 * same, bound to the control and `visually-hidden`, the same arrangement
 * feature 011's catalogue search already ships. So are the instructions: what
 * the search matches is not guessable from a placeholder, and a Commander who
 * types a symbol and gets nothing deserves to know why rather than concluding
 * the search is broken. Neither is drawn, because neither canvas draws them —
 * the invisible accessibility floor, not a paragraph beside the design.
 *
 * The key hint is an *unrequired* affordance. Constitution V puts the keyboard
 * criteria out of scope and forbids requiring keyboard operation, so nothing
 * here is the only route to the field: pointer and touch reach it exactly as
 * canvas 1d shows. The hint is application text, so it is localized, and it
 * names the modifier this platform actually has — `⌘K` is Apple's and shipping
 * it on Windows names a key that is not on the keyboard.
 */
@Component({
  selector: 'edsb-candidate-search',
  imports: [TextField],
  templateUrl: './candidate-search.html',
  styleUrl: './candidate-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidateSearch {
  readonly #messages = inject(MessageService);
  readonly #navigator = inject(NavigatorAdapter);

  readonly query = input('');

  /** How many choices the current query leaves. Announced politely. */
  readonly resultCount = input.required<number>();

  /** Whether clearing is a way out of where the Commander currently is. */
  readonly canClear = input(false);

  readonly changed = output<string>();
  readonly cleared = output<void>();

  readonly label = this.#messages.messageSignal('outfitting.search.label');
  readonly instructions = this.#messages.messageSignal('outfitting.search.instructions');
  readonly placeholder = this.#messages.messageSignal('outfitting.search.placeholder');
  readonly clearLabel = this.#messages.messageSignal('outfitting.search.clear');

  readonly announcement = computed(() =>
    this.#messages.message('outfitting.results.announced', { count: this.resultCount() }),
  );

  readonly shortcutHint = computed(() =>
    this.#messages.message(
      this.#navigator.applePlatform()
        ? 'outfitting.search.shortcut.apple'
        : 'outfitting.search.shortcut.other',
    ),
  );
}
