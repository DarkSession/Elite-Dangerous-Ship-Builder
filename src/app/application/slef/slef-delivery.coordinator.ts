import { Injectable, inject } from '@angular/core';
import { DownloadAdapter } from '../../platform/browser/download.adapter';
import { NavigatorAdapter } from '../../platform/browser/navigator.adapter';
import type {
  DeliveryCapability,
  DeliveryOutcome,
  SlefExportArtifact,
} from '../../domain/slef/slef-export.models';
import { SlefExportCoordinator } from './slef-export.coordinator';
import { SlefStore } from './slef.store';

/**
 * What this browser can do with a payload, from feature detection alone.
 *
 * Never from a viewport measurement and never from a user-agent string. A
 * narrow window is a narrow window, not a phone; a desktop browser may have a
 * share sheet and a phone browser may not. Detection is also only a hint: every
 * one of these can still fail when it is actually invoked (delivery contract,
 * "Capability").
 *
 * Download is unconditional. It needs no permission and no secure context, and
 * it is the fallback every other failure falls back to — so it is never taken
 * away, not even where Web Share can carry files.
 */
export function detectDeliveryCapability(
  navigator: NavigatorAdapter,
  download: DownloadAdapter,
  artifact: SlefExportArtifact | null,
): DeliveryCapability {
  return {
    clipboard: navigator.clipboardAvailable() ? 'available' : 'unavailable',
    download: 'available',
    share: shareCapability(navigator, download, artifact),
  };
}

function shareCapability(
  navigator: NavigatorAdapter,
  download: DownloadAdapter,
  artifact: SlefExportArtifact | null,
): DeliveryCapability['share'] {
  if (!navigator.canShare()) {
    return 'unavailable';
  }
  if (artifact === null) {
    return 'text';
  }
  const file = download.toFile(artifact.payload, artifact.filename, artifact.mimeType);
  return file !== null && navigator.canShareFiles([file]) ? 'file' : 'text';
}

/**
 * The three ways a payload leaves, and what each of them may claim.
 *
 * Every action consumes the one current artifact and regenerates nothing. Each
 * one rechecks that the artifact still describes the active build first, so a
 * Commander who edited between reading the payload and pressing Copy gets a
 * refusal rather than yesterday's build on their clipboard.
 *
 * The results are deliberately unequal in what they assert. Copy resolves a
 * promise, so `copied` is a fact. Share resolves or aborts, so `shared` and
 * `cancelled` are facts and they are different facts. Download can only be
 * *started*: the browser never says whether a file was written, so
 * `dispatched` is the strongest honest word (delivery contract).
 */
@Injectable({ providedIn: 'root' })
export class SlefDeliveryCoordinator {
  readonly #navigator = inject(NavigatorAdapter);
  readonly #download = inject(DownloadAdapter);
  readonly #store = inject(SlefStore);
  readonly #export = inject(SlefExportCoordinator);

  /** Publishes what this browser can do with the artifact currently held. */
  refreshCapability(): DeliveryCapability {
    const capability = detectDeliveryCapability(
      this.#navigator,
      this.#download,
      this.#store.artifact(),
    );
    this.#store.setCapability(capability);
    return capability;
  }

  async copy(): Promise<DeliveryOutcome> {
    const artifact = this.#current();
    if (artifact === null) {
      return this.#record({ action: 'copy', status: 'failed', reason: 'unsupported' });
    }

    this.#store.setDelivery({ action: 'copy', status: 'working' });
    const copied = await this.#navigator.copyText(artifact.payload);

    // `failed`, not `permissionDenied`. A rejected write, a denied permission
    // and an insecure context all come back as the same `false`, and naming one
    // of them would be the application stating a cause it did not observe. The
    // way out on screen — the payload, still selectable — is the same for all
    // three (browser-delivery contract, "Clipboard").
    return this.#record(
      copied
        ? { action: 'copy', status: 'copied' }
        : { action: 'copy', status: 'failed', reason: 'failed' },
    );
  }

  download(): DeliveryOutcome {
    const artifact = this.#current();
    if (artifact === null) {
      return this.#record({ action: 'download', status: 'setupFailed', reason: 'unsupported' });
    }

    const dispatched = this.#download.dispatch(
      artifact.payload,
      artifact.filename,
      artifact.mimeType,
    );

    return this.#record(
      dispatched
        ? { action: 'download', status: 'dispatched' }
        : { action: 'download', status: 'setupFailed', reason: 'failed' },
    );
  }

  /**
   * Opens the share sheet, inside the gesture that asked for it.
   *
   * The `File` is built synchronously and handed straight to the platform. An
   * awaited step before the call would spend the transient activation the
   * gesture granted, and the sheet would silently refuse to open.
   */
  async share(): Promise<DeliveryOutcome> {
    const artifact = this.#current();
    if (artifact === null || !this.#navigator.canShare()) {
      return this.#record({ action: 'share', status: 'failed', reason: 'unsupported' });
    }

    this.#store.setDelivery({ action: 'share', status: 'working' });

    const file = this.#download.toFile(artifact.payload, artifact.filename, artifact.mimeType);
    const data: ShareData =
      file !== null && this.#navigator.canShareFiles([file])
        ? { files: [file] }
        : { text: artifact.payload };

    const result = await this.#navigator.shareData(data);

    return this.#record(
      result === 'shared'
        ? { action: 'share', status: 'shared' }
        : result === 'cancelled'
          ? { action: 'share', status: 'cancelled' }
          : { action: 'share', status: 'failed', reason: 'failed' },
    );
  }

  /**
   * The artifact, if it still describes the build on screen.
   *
   * A stale one is dropped rather than delivered. Nothing here regenerates: a
   * Commander asked to copy what they were reading, and quietly exporting a
   * newer build instead would put something they never saw on their clipboard.
   */
  #current(): SlefExportArtifact | null {
    this.#export.invalidateStaleArtifact();
    return this.#store.artifact();
  }

  #record(outcome: DeliveryOutcome): DeliveryOutcome {
    this.#store.setDelivery(outcome);
    return outcome;
  }
}
