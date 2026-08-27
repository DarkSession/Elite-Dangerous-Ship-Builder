import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import type { SlefImportView } from '../../../application/slef/slef.presenter';
import { ActionButton } from '../../../ui/components/action/action-button';
import { Disclosure } from '../../../ui/components/disclosure/disclosure';
import { TextareaField } from '../../../ui/components/textarea-field/textarea-field';
import { DiagnosticList } from '../../../ui/technical/diagnostic-list';

/**
 * Where a pasted build comes in, exactly as the reference draws it.
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
  selector: 'edsb-slef-import-layer',
  imports: [ActionButton, Disclosure, DiagnosticList, TextareaField],
  templateUrl: './import-build-layer.html',
  styleUrl: './import-build-layer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportBuildLayer {
  readonly view = input.required<SlefImportView>();

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
