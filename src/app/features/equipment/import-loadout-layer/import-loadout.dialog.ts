import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoadoutImportPresenter } from '../../../application/equipment/loadout-import.presenter';
import { MessageService } from '../../../i18n/message.service';
import { Layer } from '../../../ui/components/layer/layer';
import { LibraryPresence } from '../../build-library/library-presence';
import { JournalImportLayer } from '../../shared/journal-import-layer/journal-import-layer';

/**
 * Where a suit loadout comes in.
 *
 * The same panel the Ship Builder's import draws, over this tool's own words:
 * both canvases draw one plate, one list and one paste box, so both fill one
 * layer (`features/shared/journal-import-layer`).
 *
 * Mounted on the bench, which is the only surface a suit loadout can land on.
 * It adds no route and no history entry.
 */
@Component({
  selector: 'ednb-import-loadout-dialog',
  imports: [JournalImportLayer, Layer],
  templateUrl: './import-loadout.dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportLoadoutDialog {
  readonly #messages = inject(MessageService);
  readonly #library = inject(LibraryPresence);
  readonly presenter = inject(LoadoutImportPresenter);

  readonly open = this.presenter.open;
  readonly view = this.presenter.view;
  readonly dismissLabel = this.#messages.messageSignal('action.close');

  submit(): void {
    void this.#submit();
  }

  scan(files: readonly File[]): void {
    void this.presenter.scanFiles(files);
  }

  /**
   * Submits, and opens the saved records over the bench after a batch.
   *
   * A batch import opens nothing on the bench, so the records are where the
   * Commander goes next (016/FR-017). A batch carrying a refusal stays where it
   * is: the refusal is read on the layer that was refused.
   */
  async #submit(): Promise<void> {
    const submission = await this.presenter.submit();
    // Nothing was refused and nothing was left out: the batch is finished with,
    // so the records are where the Commander goes next. Either kind of package
    // answer keeps the layer, because that is where it is read.
    if (submission.kind === 'stored' && submission.refused.length === 0 && submission.left === 0) {
      this.#library.raise(this.presenter.importNotice());
    }
  }
}
