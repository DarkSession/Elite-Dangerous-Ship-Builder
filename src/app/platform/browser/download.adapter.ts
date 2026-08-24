import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/core';

/**
 * Handing a file to the browser, and saying only what can be observed.
 *
 * `dispatched` means the anchor was built, clicked and cleaned up. It does not
 * mean a file reached a disk: a browser may show a chooser, a download may be
 * declined, a sandbox may drop it, and none of that comes back. An application
 * that said "saved" here would be claiming something it cannot know, which is
 * exactly the fabricated success FR-004 forbids (delivery contract,
 * "Download").
 *
 * The anchor exists for the length of one click and is removed afterwards. The
 * object URL is revoked on the next task rather than in the same one, because a
 * browser is still reading it while the click is being dispatched; a leaked
 * object URL would pin its Blob for the lifetime of the document, and one task
 * is not a leak.
 */
@Injectable({ providedIn: 'root' })
export class DownloadAdapter {
  readonly #document = inject(DOCUMENT);

  /** Starts one download of exactly these bytes, under exactly this name. */
  dispatch(payload: string, filename: string, mimeType: string): boolean {
    const view = this.#document.defaultView;
    if (!view) {
      return false;
    }

    let url: string | null = null;
    let anchor: HTMLAnchorElement | null = null;
    try {
      url = view.URL.createObjectURL(new view.Blob([payload], { type: mimeType }));
      anchor = this.#document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.rel = 'noopener';
      this.#document.body.appendChild(anchor);
      anchor.click();
      return true;
    } catch {
      return false;
    } finally {
      anchor?.remove();
      if (url !== null) {
        // Revoked on the next task, not in this one. A browser starts reading
        // the object URL while the click is still being dispatched, and Firefox
        // has historically lost that race against a synchronous revoke — which
        // would leave the application reporting a dispatch that never began.
        // Deferring costs one task and cannot leak: the callback runs whether
        // the click succeeded or threw.
        const revoking = url;
        view.setTimeout(() => view.URL.revokeObjectURL(revoking), 0);
      }
    }
  }

  /**
   * A `File` carrying the same bytes, for the share sheet.
   *
   * Built here rather than in the coordinator so the one place that knows how
   * to turn a payload into browser objects stays one place — and so a runtime
   * without `File` answers `null` instead of throwing into a click handler.
   */
  toFile(payload: string, filename: string, mimeType: string): File | null {
    const view = this.#document.defaultView as (Window & { File?: typeof File }) | null;
    if (!view?.File) {
      return null;
    }
    try {
      return new view.File([payload], filename, { type: mimeType });
    } catch {
      return null;
    }
  }
}
