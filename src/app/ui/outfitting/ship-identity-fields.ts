import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild,
  type ElementRef,
} from '@angular/core';
import { MessageService } from '../../i18n/message.service';
import { relationId } from '../a11y/text-equivalence';

/** Which of the two identity fields a confirmation is about. */
export type IdentityField = 'name' | 'ident';

/**
 * How long each of the two labels may be.
 *
 * These are the game's own bounds, not this application's: the ship naming
 * terminal takes twenty-two characters of name and a six-character ID plate,
 * and a build carrying more than that describes a ship nobody can register
 * (Commander request 2026-08-26). Held on the field rather than checked after
 * it, so a Commander is stopped at the bound instead of being told about it
 * afterwards — there is no submit here to be refused at, and no canvas draws a
 * message under either field.
 *
 * Both sit under the build link's own `MAX_STRING_UNITS`, so a name and an
 * ident that pass here always fit a shared link.
 */
export const SHIP_NAME_MAX_LENGTH = 22;
export const SHIP_IDENT_MAX_LENGTH = 6;

/** One confirmed value, or the absence a Commander cleared it back to. */
export interface IdentityCommit {
  readonly field: IdentityField;
  /** `null` is an explicit absence. An empty string is never committed. */
  readonly value: string | null;
}

const IDENTITY_LIMITS: Readonly<Record<IdentityField, number>> = {
  name: SHIP_NAME_MAX_LENGTH,
  ident: SHIP_IDENT_MAX_LENGTH,
};

/**
 * The ship's name and its ID plate, on the command bar's identity line.
 *
 * Drawn exactly where both canvases draw them: the name is the bar's own title
 * with a pencil beside it — `PACIFIER ✎`, titled "Click to rename this build" —
 * and under it the hull and the ID plate, `ANACONDA · FD-11X ✎`. Neither canvas
 * draws a labelled field pair, a settings row, a dialog or a row of Save and
 * Cancel controls, so none of them is here: the title is the control, it turns
 * into a field where it stands, and leaving the field is confirming it — which
 * is what "click to rename" means (FR-019, canvas 1c and 1d "Command bar").
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

  /** What each field allows, for the template and for what it commits. */
  readonly nameMaxLength = SHIP_NAME_MAX_LENGTH;
  readonly identMaxLength = SHIP_IDENT_MAX_LENGTH;

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
  protected readonly field = viewChild<ElementRef<HTMLInputElement>>('field');
  protected readonly plateField = viewChild<ElementRef<HTMLInputElement>>('plateField');

  constructor() {
    // The field replaces the control that opened it, so focus has to follow it
    // or a Commander who opened it from the keyboard is left on nothing.
    // Without `preventScroll` the browser scrolls every ancestor to bring the
    // field into view. Where the block is one of many on a page — the preview
    // catalogue renders them all at once — that drags the whole document to it
    // and leaves a sticky header sitting on the rows above.
    effect(() => {
      const open = this.editing() === 'name' ? this.field() : this.plateField();
      open?.nativeElement.focus({ preventScroll: true });
      open?.nativeElement.select();
    });
  }

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
    // Clipped as well as bounded on the field. `maxlength` holds a Commander to
    // the bound as they type and as they paste, but it does not touch a value
    // the field opened on — a name that arrived from a link or a SLEF file is
    // whatever it was, and confirming the field is what brings it inside the
    // game's own limit.
    const value = raw.trim().slice(0, IDENTITY_LIMITS[field]);
    this.committed.emit({ field, value: value.length === 0 ? null : value });
  }
}
