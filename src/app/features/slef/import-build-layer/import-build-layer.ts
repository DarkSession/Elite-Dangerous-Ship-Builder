import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { SlefImportView } from '../../../application/slef/slef.presenter';
import { ActionButton } from '../../../ui/components/action/action-button';
import { TextareaField } from '../../../ui/components/textarea-field/textarea-field';
import { DiagnosticList } from '../../../ui/technical/diagnostic-list';

/**
 * Where a pasted build comes in, exactly as the reference draws it.
 *
 * Description, one editable monospaced field, one status line, then the footer
 * the canvas rules off: what is accepted on the left, Cancel and Load Build on
 * the right (canvases 1a/1b, `imp-in`/`imp-msg`/`imp-cancel`/`imp-go`).
 *
 * A refusal is said below the status line, in the application's own words, with
 * the Almanac's diagnostics under it in a list — five separate facts about a
 * payload cannot be flattened into a sentence without losing the one a
 * Commander needs (FR-011). The canvas draws no Clear control and no candidate
 * panel, so this has neither: the incoming hull is named by feature 001's own
 * replacement confirmation, which is the surface that asks about it.
 *
 * The component owns no loadout, parser, byte counter or replacement decision.
 * It renders one immutable localized view and emits intents.
 */
@Component({
  selector: 'edsb-slef-import-layer',
  imports: [ActionButton, DiagnosticList, TextareaField],
  templateUrl: './import-build-layer.html',
  styleUrl: './import-build-layer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportBuildLayer {
  readonly view = input.required<SlefImportView>();

  readonly changed = output<string>();
  readonly submitted = output<void>();
  readonly cancelled = output<void>();
}
