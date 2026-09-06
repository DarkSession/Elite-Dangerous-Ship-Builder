import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { JournalImportView } from '../../../application/journal/journal-import.view';
import { ActionButton } from '../../../ui/components/action/action-button';
import { ChoiceGroup, type Choice } from '../../../ui/components/choice-group/choice-group';
import { Disclosure } from '../../../ui/components/disclosure/disclosure';
import { FileDrop } from '../../../ui/components/file-drop/file-drop';
import { TextareaField } from '../../../ui/components/textarea-field/textarea-field';
import { DiagnosticList } from '../../../ui/technical/diagnostic-list';

/**
 * Where a build or a loadout comes in, exactly as the reference draws it.
 *
 * One panel for both tools, because both canvases draw one: the Ship Builder's
 * import (`imp-*`) and the Equipment Builder's (`ge-imp-*`) are the same plate,
 * the same list, the same rule and the same footer. What differs is the words,
 * and the words arrive resolved.
 *
 * Description, one editable monospaced field, one status line, then the footer
 * the canvas rules off: what is accepted on the left, Cancel and Load Build on
 * the right (canvases 1a/1b, `imp-in`/`imp-msg`/`imp-cancel`/`imp-go`).
 *
 * A refusal is said below the status line, in the application's own words, and
 * that sentence is the whole of the answer for most of them. The slot
 * identities it was refused on and the Almanac's own five-field diagnostics sit
 * behind one `Show advanced` control beside it: they cannot be flattened into a
 * sentence without losing the one fact a Commander needs (FR-011), and they are
 * not what a Commander who pasted the wrong thing is asking (Commander request
 * 2026-08-26). Nothing is withheld — the control is next to the sentence, it
 * names itself, and what it opens is unaltered.
 *
 * The canvas draws no Clear control and no candidate panel, so this has
 * neither: the incoming hull is named by feature 001's own replacement
 * confirmation, which is the surface that asks about it.
 *
 * The component owns no loadout, parser, byte counter or replacement decision.
 * It renders one immutable localized view and emits intents.
 */
@Component({
  selector: 'ednb-journal-import-layer',
  imports: [ActionButton, ChoiceGroup, DiagnosticList, Disclosure, FileDrop, TextareaField],
  templateUrl: './journal-import-layer.html',
  styleUrl: './journal-import-layer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalImportLayer {
  readonly view = input.required<JournalImportView>();

  /**
   * Whether the refusal's detail is open.
   *
   * View state, and only view state: nothing about the draft, the request or
   * the build depends on it, so it lives here rather than in the store. It
   * stays open across edits within one attempt — a Commander who opened the
   * detail is working through it — and closes with the attempt itself.
   */
  readonly advanced = signal(false);

  readonly changed = output<string>();
  readonly submitted = output<void>();
  readonly cancelled = output<void>();
  /** The journal files a Commander selected or dropped. */
  readonly filesChosen = output<readonly File[]>();
  /** Which of the builds a scan found the Commander wants. */
  readonly picksChosen = output<readonly string[]>();

  /** What the file control takes, in the browser's own spelling. */
  readonly accept = JOURNAL_FILE_TYPES;

  /**
   * The builds a scan found, as the design system's own plates.
   *
   * The list is a group of checkboxes because that is what it is: several
   * builds, any number of them chosen. Nothing about the row is new — a marked
   * card already draws a square, a title and a line under it, and the instant
   * the journal wrote goes in the plate's far edge.
   */
  readonly choices = computed<readonly Choice[]>(() =>
    this.view().picks.map((pick) => ({
      value: pick.key,
      label: pick.title,
      description: pick.detail,
      meta: pick.meta,
    })),
  );

  readonly selectedKeys = computed(() =>
    this.view()
      .picks.filter((pick) => pick.selected)
      .map((pick) => pick.key),
  );

  /**
   * Submits the draft, and closes the detail with the attempt that opened it.
   *
   * The layer outlives a refusal: a Commander pastes a different payload into
   * the same field and tries again. Without this the next refusal arrived with
   * its detail already expanded — the previous attempt's disclosure applied to
   * a diagnosis nobody had asked to see, on a layer whose whole answer is one
   * sentence with the detail behind a control.
   */
  submit(): void {
    this.advanced.set(false);
    this.submitted.emit();
  }
}

/**
 * What the file control offers to open.
 *
 * The three extensions the game and other tools write, and the JSON media type
 * beside them for a platform that files by type rather than by suffix. It is a
 * filter on a picker, not a check: what a file holds is decided by the package
 * that reads it.
 */
export const JOURNAL_FILE_TYPES = '.log,.json,.txt,application/json';
