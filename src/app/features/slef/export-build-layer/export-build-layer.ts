import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { DeliveryAction } from '../../../domain/ships/slef/slef-export.models';
import type { SlefExportView } from '../../../application/slef/slef.presenter';
import { ActionButton } from '../../../ui/components/action/action-button';
import { StatusNotice } from '../../../ui/components/status/status-notice';
import { TextareaField } from '../../../ui/components/textarea-field/textarea-field';

/**
 * The SLEF side of the export layer, exactly as the reference draws it.
 *
 * A readonly payload field, the one metadata line beneath it, and the actions
 * on the same row (canvas 1c, `exp-out`/`exp-meta`/`exp-dl`/`exp-copy`). The
 * two things the canvas does not draw and this feature will not do without —
 * the package's verdict on the build being exported, and whether the payload
 * carries a link — are said in the same place, as ordinary status lines, rather
 * than as new regions beside it (`design/reference-review.md`).
 *
 * The component owns none of it. It renders one immutable localized view and
 * emits intents; the payload is a string it was handed, and the actions are
 * events it fires (`contracts/routes-and-ui.md`, "Intent boundary").
 */
@Component({
  selector: 'ednb-slef-export-layer',
  imports: [ActionButton, StatusNotice, TextareaField],
  templateUrl: './export-build-layer.html',
  styleUrl: './export-build-layer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportBuildLayer {
  readonly view = input.required<SlefExportView>();

  readonly copyRequested = output<void>();
  readonly downloadRequested = output<void>();
  readonly shareRequested = output<void>();

  /**
   * Copy is the emphasised action, as the canvas draws it — but only while
   * there is something to copy. Emphasis on a control that cannot act is the
   * sort of thing that reads as broken rather than as unavailable.
   */
  readonly ready = computed(() => this.view().payload.length > 0);

  request(action: DeliveryAction): void {
    switch (action) {
      case 'copy':
        this.copyRequested.emit();
        return;
      case 'download':
        this.downloadRequested.emit();
        return;
      default:
        this.shareRequested.emit();
    }
  }
}
