import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { LinkSharePresenter } from '../../../application/build-link/link-share.presenter';
import { SlefPresenter } from '../../../application/slef/slef.presenter';
import { MessageService } from '../../../i18n/message.service';
import { ChoiceGroup, type Choice } from '../../../ui/components/choice-group/choice-group';
import { FormatLayer } from '../../../ui/components/layer/format-layer';
import { ShareLinkPanel } from '../../../ui/components/share-link-panel/share-link-panel';
import { ExportBuildLayer } from './export-build-layer';

/**
 * Passing a build on: one layer, two formats.
 *
 * Canvas 1c draws a single Export layer with the formats listed down its
 * leading edge, so a share link and a SLEF payload are two answers to one
 * question rather than two screens. Feature 001 owns the link and feature 004
 * owns the payload; this composes both and owns neither.
 *
 * It lives in feature 004 because the arrows point one way. The application
 * root connects the workspace action to feature 004. Feature 001 does not
 * import this directory.
 *
 * The dialog owns the intents; neither panel owns any of them. Copying,
 * sharing, retrying an encode and generating a payload can each fail in their
 * own way, and each failure has to leave the value itself on screen and
 * selectable — which is only true if the panels never depend on any of them
 * having worked.
 */
@Component({
  selector: 'ednb-slef-export-dialog',
  imports: [ChoiceGroup, ExportBuildLayer, FormatLayer, ShareLinkPanel],
  templateUrl: './export.dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportDialog {
  readonly #messages = inject(MessageService);
  readonly slef = inject(SlefPresenter);
  readonly link = inject(LinkSharePresenter);

  readonly open = computed(() => this.slef.layer() === 'export');

  constructor() {
    // The layer is loaded on demand, so it arrives after the request that
    // opened it. Preparing on arrival is what makes the payload be there when
    // the Commander looks, without the shell having had to load the serializer
    // to find that out.
    effect(() => {
      // Reading the artifact is what makes this self-healing: a build replaced
      // from another tab while the layer is open drops the artifact, and this
      // makes the next one rather than leaving a message telling the Commander
      // to do something the layer offers no control for.
      this.slef.exportArtifactRevision();
      if (this.open()) {
        this.slef.prepareExport();
      }
    });
  }

  readonly title = computed(() => this.slef.exportView().title);
  readonly dismissLabel = this.#messages.messageSignal('action.close');

  /** The question the format list asks. The canvas draws no room for it. */
  readonly modeLegend = computed(() => this.slef.exportView().modeLabel);

  /**
   * The formats the layer offers, as the reference sidebar draws them.
   *
   * Two, in the canvas's own order: the payload first, the link beside it. The
   * canvas once listed Journal Loadout and Markdown Table between them; neither
   * is a capability this application has, and a control for a format that cannot
   * be produced is worse than no control, so both were taken out of `.design`
   * rather than left drawn (`specs/004-slef/design/reference-review.md`).
   */
  readonly modes = computed<readonly Choice[]>(() =>
    this.slef.exportView().modes.map((mode) => ({
      value: mode.mode,
      label: mode.label,
      description: mode.description,
    })),
  );

  readonly selectedMode = computed(
    () => this.slef.exportView().modes.find((mode) => mode.selected)?.mode ?? 'slef',
  );

  readonly selectedModes = computed<readonly string[]>(() => [this.selectedMode()]);

  selectMode(values: readonly string[]): void {
    this.slef.selectMode(values[0] === 'slef' ? 'slef' : 'link');
  }

  /**
   * The link panel's own way out of a refusal: the other format, in the same
   * layer. Before this feature landed it was a button for a capability that did
   * not exist; now it is the mode beside it.
   */
  chooseSlef(): void {
    this.slef.selectMode('slef');
  }
}
