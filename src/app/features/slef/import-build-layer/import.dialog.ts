import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SlefPresenter } from '../../../application/slef/slef.presenter';
import { MessageService } from '../../../i18n/message.service';
import { Layer } from '../../../ui/components/layer/layer';
import { ImportBuildLayer } from './import-build-layer';

/**
 * The import layer, mounted once for the whole application.
 *
 * Import is offered from the shipyard, hull detail, the workspace and the
 * library, and none of those screens owns it: a Commander can paste a build
 * from wherever they are, and the layer has to outlive the route they were on
 * when they opened it. Mounting it beside the replacement confirmation — at the
 * one level that is always mounted — is what makes that true without four
 * copies of the same dialog (`contracts/routes-and-ui.md`, "Hosts").
 *
 * It adds no route and no history entry.
 */
@Component({
  selector: 'edsb-slef-import-dialog',
  imports: [ImportBuildLayer, Layer],
  templateUrl: './import.dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportDialog {
  readonly #messages = inject(MessageService);
  readonly presenter = inject(SlefPresenter);

  readonly open = computed(() => this.presenter.layer() === 'import');
  readonly view = this.presenter.importView;
  readonly dismissLabel = this.#messages.messageSignal('action.close');

  submit(): void {
    void this.presenter.submit();
  }
}
