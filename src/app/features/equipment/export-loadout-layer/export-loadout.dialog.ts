import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import {
  LoadoutSharePresenter,
  type ExportFormat,
} from '../../../application/equipment/loadout-share.presenter';
import { MessageService } from '../../../i18n/message.service';
import { ActionButton } from '../../../ui/components/action/action-button';
import { ChoiceGroup, type Choice } from '../../../ui/components/choice-group/choice-group';
import { Layer } from '../../../ui/components/layer/layer';
import { ShareLinkPanel } from '../../../ui/components/share-link-panel/share-link-panel';
import { TextareaField } from '../../../ui/components/textarea-field/textarea-field';

/**
 * Passing a loadout on: one layer, three formats.
 *
 * Canvas 1a's `EXPORT LOADOUT`: the formats down the leading edge, the chosen
 * one's content beside them. The same arrangement the ship tool's export layer
 * draws, over this tool's own three answers — the object, the link and the
 * summary — because passing a loadout on is one decision with three answers
 * rather than three screens.
 *
 * The link is the shared `ui/components/share-link-panel`, whole: the value
 * stays on screen and selectable whether copying worked or not, which is the
 * property that makes a clipboard a browser may refuse an acceptable control
 * (FR-020).
 *
 * The dialog owns no intent. Copying, sharing and writing a file are decisions
 * about the loadout, and they live in the presenter beside it.
 */
@Component({
  selector: 'ednb-export-loadout-dialog',
  imports: [ActionButton, ChoiceGroup, Layer, ShareLinkPanel, TextareaField],
  templateUrl: './export-loadout.dialog.html',
  styleUrl: './export-loadout.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportLoadoutDialog {
  readonly #messages = inject(MessageService);

  readonly share = inject(LoadoutSharePresenter);

  readonly open = input(false);
  readonly dismissed = output<void>();

  readonly title = this.#messages.messageSignal('equipment.export.title');
  readonly dismissLabel = this.#messages.messageSignal('action.close');
  readonly formatLegend = this.#messages.messageSignal('equipment.export.mode.label');
  readonly downloadLabel = this.#messages.messageSignal('equipment.export.download');
  readonly copyLabel = this.#messages.messageSignal('equipment.export.copy');

  /** The three formats, in the canvas's own order: object, link, summary. */
  readonly formats = computed<readonly Choice[]>(() =>
    (['json', 'link', 'text'] as const).map((format) => ({
      value: format,
      label: this.#messages.message(`equipment.export.mode.${format}`),
      description: this.#messages.message(`equipment.export.mode.${format}.description`),
    })),
  );

  readonly selectedFormats = computed<readonly string[]>(() => [this.share.format()]);

  /** The field's own label is the format it is showing. The canvas draws none. */
  readonly fieldLabel = computed(() =>
    this.#messages.message(`equipment.export.mode.${this.share.format()}`),
  );

  selectFormat(values: readonly string[]): void {
    const chosen = values[0];
    this.share.selectFormat(
      chosen === 'link' || chosen === 'text' ? (chosen as ExportFormat) : 'json',
    );
  }
}
