import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
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
 * The key hint is an *unrequired* affordance, and it is wired: the combination
 * it names puts the caret in the field, and the browser's own use of it is
 * cancelled so the address bar does not take it first. Constitution V puts the
 * keyboard criteria out of scope and forbids requiring keyboard operation, so
 * nothing here is the only route to the field: pointer and touch reach it
 * exactly as canvas 1d shows. The hint is application text, so it is localized,
 * and it names the modifier this platform actually has — `⌘K` is Apple's and
 * shipping it on Windows names a key that is not on the keyboard. Both
 * modifiers are accepted whichever hint is drawn, because a Commander on a
 * Mac keyboard plugged into a PC has both.
 */
@Component({
  selector: 'ednb-candidate-search',
  imports: [TextField],
  templateUrl: './candidate-search.html',
  styleUrl: './candidate-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'reachField($event)',
  },
})
export class CandidateSearch {
  readonly #messages = inject(MessageService);
  readonly #navigator = inject(NavigatorAdapter);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

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

  private readonly field = viewChild.required<TextField>('field');

  /**
   * The combination the hint names, doing what the hint says.
   *
   * `preventDefault` is the whole point of it: `Ctrl + K` is the browser's own
   * shortcut for its address bar in every engine this application is tested in,
   * so a listener that does not cancel the event draws a hint for a key the
   * page never receives (Commander request 2026-08-28).
   *
   * Two things it will not do. It leaves the press alone where text is being
   * entered somewhere else — a Commander renaming their ship, or pasting a
   * build into the import layer, is mid-edit in a field of their own, and on a
   * Mac keyboard `Ctrl + K` is that field's own kill-to-end-of-line. And it
   * cancels the press only once the caret has actually arrived: a field behind
   * an open modal is inert, and a press cancelled on its behalf would reach
   * neither this field nor the browser.
   */
  reachField(event: KeyboardEvent): void {
    if (event.altKey || event.shiftKey || !(event.ctrlKey || event.metaKey)) {
      return;
    }
    if (event.key.toLowerCase() !== 'k' || this.#editingElsewhere(event.target)) {
      return;
    }
    if (this.field().focus()) {
      event.preventDefault();
    }
  }

  /** Whether the press came from somewhere text is being entered that is not this field. */
  #editingElsewhere(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement) || this.#host.nativeElement.contains(target)) {
      return false;
    }
    return (
      target.isContentEditable ||
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    );
  }

  readonly shortcutHint = computed(() =>
    this.#messages.message(
      this.#navigator.applePlatform()
        ? 'outfitting.search.shortcut.apple'
        : 'outfitting.search.shortcut.other',
    ),
  );
}
