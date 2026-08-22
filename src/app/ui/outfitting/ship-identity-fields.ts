import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MessageService } from '../../i18n/message.service';
import { relationId } from '../a11y/text-equivalence';

/** Which of the two identity fields a confirmation is about. */
export type IdentityField = 'name' | 'ident';

/** One confirmed value, or the absence a Commander cleared it back to. */
export interface IdentityCommit {
  readonly field: IdentityField;
  /** `null` is an explicit absence. An empty string is never committed. */
  readonly value: string | null;
}

/**
 * The ship's name and its ID plate, on the command bar's identity line.
 *
 * Drawn exactly where both canvases draw them: the name is the bar's own title
 * with a pencil beside it — `PACIFIER ✎`, titled "Click to rename this build" —
 * and under it the hull and the ID plate, `ANACONDA · FD-11X ✎`. Neither canvas
 * draws a labelled field pair, a settings row or a dialog, so neither is here:
 * the pencil opens the field in place and closes when it is confirmed
 * (FR-019, canvas 1c and 1d "Command bar").
 *
 * Both fields carry a pencil at both widths. Canvas 1d draws one on the name
 * and none on the ident, which is an omission in the reference rather than a
 * capability boundary — a Commander on a phone can set an ID plate too.
 *
 * Clearing sets absence, not an empty string. A build whose name is `""` and a
 * build with no name are different builds, and the package publishes the
 * difference (constitution IV).
 */
@Component({
  selector: 'edsb-ship-identity-fields',
  templateUrl: './ship-identity-fields.html',
  styleUrl: './ship-identity-fields.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipIdentityFields {
  readonly #messages = inject(MessageService);

  /** The ship's name, or `null` where the build has none. */
  readonly name = input<string | null>(null);

  /** What the heading reads when the build has no name of its own. */
  readonly fallbackName = input.required<string>();

  /** The hull, drawn ahead of the ID plate as the canvas draws it. */
  readonly detail = input<string | null>(null);

  readonly ident = input<string | null>(null);

  /** Which field is open for editing. `null` is the drawn, idle state. */
  readonly editing = input<IdentityField | null>(null);

  /**
   * The document level this name is a heading at.
   *
   * On the command bar the build's name *is* the screen's name, so it is the
   * document's one `h1`. Anywhere the block is shown beside other content — the
   * preview catalogue, where several of them are rendered at once — it is a
   * section heading instead. A component that hard-coded `h1` would make every
   * such page have several (feature 011, ordered headings).
   */
  readonly headingLevel = input<1 | 2>(1);

  readonly opened = output<IdentityField>();
  readonly closed = output<void>();
  readonly committed = output<IdentityCommit>();

  readonly nameFieldId = relationId('ship-name');
  readonly identFieldId = relationId('ship-ident');

  readonly heading = computed(() => this.name() ?? this.fallbackName());

  readonly nameLabel = this.#messages.messageSignal('outfitting.identity.name.label');
  readonly identLabel = this.#messages.messageSignal('outfitting.identity.ident.label');
  readonly nameEdit = this.#messages.messageSignal('outfitting.identity.name.edit');
  /**
   * The ID plate's control names itself with the plate it is showing.
   *
   * The plate is visible text on the control, so the accessible name has to
   * contain it — a name that said only "Change the ship ID" would be a
   * different name from the one a Commander reads aloud (WCAG 2.5.3).
   */
  readonly identEdit = computed(() => {
    const plate = this.ident();
    return plate === null
      ? this.#messages.message('outfitting.identity.ident.edit')
      : this.#messages.message('outfitting.identity.ident.edit.value', { ident: plate });
  });
  readonly confirmLabel = this.#messages.messageSignal('outfitting.identity.confirm');
  readonly clearLabel = this.#messages.messageSignal('outfitting.identity.clear');
  readonly cancelLabel = this.#messages.messageSignal('action.cancel');

  open(field: IdentityField): void {
    this.opened.emit(field);
  }

  /**
   * Confirms what was typed, or clears the field to absence.
   *
   * Whitespace alone is absence rather than a name made of spaces: a Commander
   * who selects a name and presses space has cleared it, and storing `" "`
   * would give the build a name nobody can see or search for.
   */
  confirm(field: IdentityField, raw: string): void {
    const value = raw.trim();
    this.committed.emit({ field, value: value.length === 0 ? null : value });
  }

  clear(field: IdentityField): void {
    this.committed.emit({ field, value: null });
  }
}
