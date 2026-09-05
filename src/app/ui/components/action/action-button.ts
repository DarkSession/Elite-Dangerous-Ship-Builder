import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { relationId } from '../../a11y/text-equivalence';

/** How prominent an action is. Emphasis never carries meaning on its own. */
export type ActionEmphasis = 'primary' | 'secondary' | 'quiet' | 'danger';

/**
 * A button.
 *
 * A real `<button>`, because every alternative loses something: a `div` has no
 * role, no default activation and no disabled semantics, and the reference
 * canvas's 268 clickable `div`s are exactly the pattern this replaces.
 *
 * The label is always the accessible name, and normally it is also the visible
 * text. There is no icon-only variant: an icon without words is a guess for
 * anyone who does not already know what it means. A mark may replace a word on
 * screen; it may never replace the word in the accessibility tree (011
 * reference review, ruled 2026-08-26).
 *
 * `symbol` is the one narrow exception, and it is not an icon. A caller may
 * draw a single conventional typographic mark — `?` — in place of the label,
 * and the label is then carried as text inside the button where a reader still
 * meets it. So the control keeps a real text name in the accessibility tree,
 * keeps its 44-pixel target, and renders no image, no font icon and no glyph
 * whose meaning has to be learned. A caller that has no such convention to
 * lean on passes no symbol and gets the visible label.
 */
@Component({
  selector: 'ednb-action-button',
  templateUrl: './action-button.html',
  styleUrl: './action.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionButton {
  /** The visible label. It is also the accessible name — they cannot differ. */
  readonly label = input.required<string>();

  /**
   * A conventional mark drawn in place of the label, or `null` for the label.
   *
   * Hidden from the accessibility tree: it is a second rendering of the name
   * the button already carries, and announcing both would name the control
   * twice. The label stays in the button as text, so the accessible name is
   * unchanged by drawing it this way.
   */
  readonly symbol = input<string | null>(null);

  /**
   * A conventional mark drawn *beside* the label, or `null` for none.
   *
   * The difference from `symbol` is what happens to the word: `symbol` draws
   * the mark instead of it, `mark` draws the mark in front of it. Canvas 1c's
   * history pair is the case — it draws `↶ UNDO`, not `↶` alone — and the two
   * cannot be the same input, because one hides the label and the other does
   * not. Like `symbol` it is hidden from the accessibility tree: it is a second
   * rendering of a name the button already carries in text.
   *
   * The same narrow rule applies. One conventional typographic mark, no image,
   * no font icon, and nothing whose meaning has to be learned to use the
   * control — the word is right there either way.
   */
  readonly mark = input<string | null>(null);

  /**
   * Which side of the label the mark is drawn on.
   *
   * Canvas 1c draws the history pair as `↶ UNDO` and `REDO ↷` — the
   * mark leads the word going back and follows it going forward, because each
   * arrow points the way its action travels. That is the whole reason this
   * exists; a caller with no such convention leaves it alone.
   */
  readonly markPosition = input<'leading' | 'trailing'>('leading');

  readonly emphasis = input<ActionEmphasis>('secondary');

  /** True while the action is running. Exposed as `aria-busy`, not only as motion. */
  readonly busy = input(false);

  /** For a toggle. `null` when the button is not a toggle. */
  readonly pressed = input<boolean | null>(null);

  readonly disabled = input(false);

  /** Text announced alongside the label while busy, if the caller has one. */
  readonly busyLabel = input<string | null>(null);

  /**
   * What this action would do, for a reader who cannot see what it is next to.
   *
   * Invisible by design. The reference draws `↶ UNDO` and nothing else beside
   * it, so the label is the whole of what is drawn; which decision the control
   * would step through is the sort of thing a sighted Commander reads off the
   * screen they are looking at, and a reader needs said (design-canvas rule,
   * the accessibility floor).
   */
  readonly description = input<string | null>(null);

  readonly activated = output<void>();

  /**
   * The accessible name.
   *
   * While busy it appends the caller's busy text rather than replacing the
   * label, so the control does not appear to become a different button
   * mid-action.
   */
  readonly accessibleName = computed(() => {
    const busyLabel = this.busyLabel();
    return this.busy() && busyLabel ? `${this.label()} ${busyLabel}` : this.label();
  });

  readonly isToggle = computed(() => this.pressed() !== null);

  /**
   * The button's own classes: its emphasis, and whether it is drawn as a mark.
   *
   * A mark is narrower than any word, so the variant carries a target size of
   * its own rather than inheriting one from text that is no longer there.
   */
  readonly classes = computed(
    () => `action action--${this.emphasis()}${this.symbol() ? ' action--symbol' : ''}`,
  );

  readonly descriptionId = relationId('action-description');

  activate(): void {
    if (this.disabled() || this.busy()) {
      return;
    }
    this.activated.emit();
  }
}
