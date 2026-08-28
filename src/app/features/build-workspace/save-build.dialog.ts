import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  untracked,
} from '@angular/core';
import { MessageService } from '../../i18n/message.service';
import { Formatters } from '../../i18n/formatters/formatters';
import { ActionButton } from '../../ui/components/action/action-button';
import { ChoiceGroup, type Choice } from '../../ui/components/choice-group/choice-group';
import { Layer } from '../../ui/components/layer/layer';
import { TextField } from '../../ui/components/text-field/text-field';
import { TextareaField } from '../../ui/components/textarea-field/textarea-field';

/** The named record this build was opened from, as the layer needs to say it. */
export interface SaveSource {
  /** The name the Commander gave it. */
  readonly name: string;
  /** When it was last saved, in the reader's own words. */
  readonly lastSaved: string;
  /**
   * Whether it can be replaced in place at all.
   *
   * False in a browser without Web Locks, where an unprotected read-then-write
   * is exactly how one tab's version disappears. Saving as a new build is
   * unaffected, so the layer offers that rather than refusing the save.
   */
  readonly replaceable: boolean;
}

/** What the Commander chose to do with what they typed. */
export interface SaveRequest {
  readonly name: string;
  /** The one local note, or `null` where they left it empty. */
  readonly note: string | null;
  /** True to replace the record this build was opened from. */
  readonly overwrite: boolean;
}

/** The two modes, and nothing else. */
type SaveMode = 'overwrite' | 'new';

/**
 * Naming a build, and deciding what that means.
 *
 * The distinction the layer exists to keep straight: "save as a new build" and
 * "replace the build I opened" are two different operations, and neither of
 * them is decided by whether the name happens to match something. A Commander
 * who types a name that already exists gets told so and gets a new record —
 * never a silent overwrite of a build with the same label (build-workspace
 * design, "Composition").
 *
 * **Revised 2026-08-25.** Since a save consumes the unsaved entry these edits
 * were autosaved into, the two choices no longer differ only in which record is
 * written: replacing removes that entry, and saving as new keeps both builds.
 * One of them therefore ends with a record fewer than it started with, which is
 * exactly the sort of thing a Commander has to be told before they press it and
 * not after — so each choice states its outcome in visible, associated words
 * (FR-008, T150a).
 *
 * **Moved here 2026-08-27.** It was the library's, reached from a footer button
 * under a row. It is the workspace's now, and the two choices are the canvas's
 * two bordered cards rather than two buttons: the mode is one decision made
 * before one `SAVE BUILD`, which is what canvas 1c draws and what makes
 * "which of these versions survives" a question with one answer instead of two
 * commit buttons that look alike (FR-009, ruled 2026-08-27).
 */
@Component({
  selector: 'edsb-save-build-dialog',
  imports: [ActionButton, ChoiceGroup, Layer, TextField, TextareaField],
  templateUrl: './save-build.dialog.html',
  styleUrl: './save-build.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveBuildDialog {
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);

  readonly open = input(false);

  /** The name to start from: the record's own, or empty for a build with none. */
  readonly initialName = input<string>('');

  /** The note to start from: the record's own, or empty. */
  readonly initialNote = input<string | null>(null);

  /** The save this build was opened from, when it was opened from one. */
  readonly source = input<SaveSource | null>(null);

  /** How many stored builds already use the typed name. */
  readonly duplicateCount = input(0);

  /**
   * Why the last save wrote nothing, where it wrote nothing.
   *
   * The layer stays open on a failure rather than closing over one: a save that
   * quietly did nothing is the one outcome a Commander has no way of noticing,
   * because the build on screen is unchanged either way (FR-009).
   */
  readonly failure = input<string | null>(null);

  /**
   * Whether a save is in flight.
   *
   * The commit is refused while it is, because the layer no longer closes the
   * moment it is pressed: a second press on a write that has not come back yet
   * would mint a second record of the same build.
   */
  readonly saving = input(false);

  /** What is typed, so the screen can count the builds already using it. */
  readonly nameChanged = output<string>();
  readonly saveRequested = output<SaveRequest>();
  readonly dismissed = output<void>();

  readonly title = this.#messages.messageSignal('workspace.save.title');
  readonly nameLabel = this.#messages.messageSignal('workspace.save.name.label');
  readonly noteLabel = this.#messages.messageSignal('workspace.save.note.label');
  readonly modeLegend = this.#messages.messageSignal('workspace.save.mode.legend');
  readonly confirmLabel = this.#messages.messageSignal('workspace.save.confirm');
  readonly cancelLabel = this.#messages.messageSignal('action.cancel');
  readonly dismissLabel = this.#messages.messageSignal('action.close');

  /**
   * What is typed, starting from the record's own name and note.
   *
   * `linkedSignal` rather than a signal seeded once: the layer is one component
   * that opens on whichever build is active, and a draft carried over from the
   * last build a Commander saved would put a stale name in front of them. It
   * resets exactly once per opening, and holds whatever they type until the
   * next one — including an empty field, which a fallback to the initial value
   * would silently refuse to let them clear.
   *
   * Opening is the whole trigger, and the initial values are read outside the
   * tracking context on purpose. A closed `dialog` still holds its content, so
   * without a reset a name typed and then cancelled is still in the field the
   * next time it opens. But tracking the initial values as well would reset the
   * draft *while the layer is open*: the screen re-reads its listing after
   * every save, which hands the layer a fresh source object, and a Commander
   * who had chosen "save as a new build" and hit a full quota would find their
   * choice quietly back on "overwrite" — and press it (FR-009).
   */
  readonly name = linkedSignal<boolean, string>({
    source: () => this.open(),
    computation: () => untracked(() => this.initialName()),
  });

  readonly note = linkedSignal<boolean, string>({
    source: () => this.open(),
    computation: () => untracked(() => this.initialNote() ?? ''),
  });

  /**
   * Which mode is selected.
   *
   * Replacing the save a build was opened from is the one selected first, as
   * the canvas draws it: a Commander who opened a save and pressed `SAVE` means
   * that save, and the alternative is one press away. Where there is nothing to
   * replace — or where the browser cannot replace anything safely — there is
   * one mode, and it is this one. Keyed on opening for the same reason the
   * drafts are: the canvas draws replacing selected every time the layer opens,
   * and only then — a Commander's choice is not something a listing refresh
   * behind the layer is allowed to change.
   */
  readonly mode = linkedSignal<boolean, SaveMode>({
    source: () => this.open(),
    computation: () =>
      untracked(() => {
        const source = this.source();
        return source !== null && source.replaceable ? 'overwrite' : 'new';
      }),
  });

  /**
   * The two cards the canvas draws, or none at all.
   *
   * A choice of one is not a choice. Where there is nothing to replace — a
   * build that came from nowhere, or a browser that cannot replace a save
   * safely — saving as a new build is the only thing `SAVE BUILD` can do, and a
   * single selected card in front of it asks a question with one answer. The
   * canvas draws the pair or it draws neither.
   *
   * Nothing is lost by leaving them out. `effectiveMode()` still resolves to
   * `new`, and the one case a Commander could be surprised by — a save they
   * opened that this browser cannot replace — says so on the message line
   * instead, where the reason belongs.
   */
  readonly modes = computed<readonly Choice[]>(() => {
    const source = this.source();
    if (source === null || !source.replaceable) {
      return [];
    }

    return [
      {
        value: 'overwrite',
        label: this.#messages.message('workspace.save.mode.overwrite', { name: source.name }),
        description: this.#messages.message('workspace.save.mode.overwrite.outcome', {
          when: source.lastSaved,
        }),
      },
      {
        value: 'new',
        label: this.#messages.message('workspace.save.mode.new'),
        description: this.#messages.message('workspace.save.mode.new.outcome'),
      },
    ];
  });

  /**
   * The mode as it stands, refused where there is nothing left to replace.
   *
   * A selection outlives the card it was made on: a record removed in another
   * tab between opening the layer and pressing save takes the replacing card
   * away, and `overwrite` against a record that is gone would ask for a write
   * with no target rather than the save the Commander can still have.
   */
  readonly effectiveMode = computed<SaveMode>(() => {
    const source = this.source();
    return this.mode() === 'overwrite' && source !== null && source.replaceable
      ? 'overwrite'
      : 'new';
  });

  readonly selectedMode = computed<readonly string[]>(() => [this.effectiveMode()]);

  /**
   * The one line the canvas draws above the actions.
   *
   * Three things can stand there, and more than one of them can be true at
   * once. A failed write comes first and alone: it is about the press that has
   * already happened rather than about the press to come. That the browser
   * cannot replace a save at all is the reason a mode is missing, and is said
   * whenever it is missing. That the name is already in use is only true of a
   * save that is about to create a record: replacing one creates nothing, so
   * warning that "saving creates a separate build" while the Commander has
   * chosen to replace one would describe a save that is not the one they asked
   * for.
   *
   * The last two are joined rather than ranked. A browser without Web Locks
   * leaves saving as a new build as the only mode there is — which is exactly
   * the mode a duplicate name matters in, so ranking the reason above the
   * warning would silence the warning in the one state that cannot avoid it.
   */
  readonly message = computed(() => {
    const failure = this.failure();
    if (failure !== null) {
      return failure;
    }

    const source = this.source();
    const sentences: string[] = [];

    if (source !== null && !source.replaceable) {
      sentences.push(
        this.#messages.message('workspace.save.locks-unavailable', { name: source.name }),
      );
    }

    const count = this.duplicateCount();
    if (this.effectiveMode() === 'new' && count > 0) {
      // One build and several read differently in both shipped languages, and
      // one is the ordinary case here: a Commander who opened a save and chose
      // to keep both is looking at exactly one build with that name.
      sentences.push(
        count === 1
          ? this.#messages.message('workspace.save.duplicate-name.one')
          : this.#messages.message('workspace.save.duplicate-name', {
              count: this.#formatters.integer(count),
            }),
      );
    }

    return sentences.length > 0 ? sentences.join(' ') : null;
  });

  readonly canSave = computed(() => this.name().trim().length > 0);

  changeName(value: string): void {
    this.name.set(value);
    this.nameChanged.emit(value);
  }

  changeNote(value: string): void {
    this.note.set(value);
  }

  changeMode(selected: readonly string[]): void {
    const chosen = selected[0];
    if (chosen === 'overwrite' || chosen === 'new') {
      this.mode.set(chosen);
    }
  }

  save(): void {
    if (!this.canSave()) {
      return;
    }
    const note = this.note().trim();
    this.saveRequested.emit({
      name: this.name().trim(),
      note: note.length > 0 ? note : null,
      overwrite: this.effectiveMode() === 'overwrite',
    });
  }
}
