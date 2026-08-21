import { Injectable, Injector, effect, inject, untracked } from '@angular/core';
import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { encodeBuildLinkFragment } from '../../domain/build-link/build-link-codec-loader';
import { HistoryLocationAdapter } from '../../platform/browser/history-location.adapter';
import type { LinkFailureCode } from '../active-build/active-build.models';
import { ActiveBuildStore } from '../active-build/active-build.store';
import { BuildLinkCoordinator } from './build-link.coordinator';
import { MAX_BUILD_LINK_LENGTH, recognizeBuildLinkFragment } from './fragment-recognizer';
import { LinkErrorMapper } from './link-error.mapper';
import { linkPayloadSource } from './link-payload.allowlist';

/**
 * Keeping the address bar showing the build that is actually open.
 *
 * A published fragment is not a snapshot a Commander asked for — it is the
 * current build, continuously. That is why it is written with
 * `history.replaceState` rather than by assigning the hash: an assignment
 * pushes an entry, and one entry per edit would bury the Commander's real
 * navigation history under a hundred versions of the same page (FR-020).
 *
 * What is encoded comes through the payload allowlist and nothing else. A note,
 * a save name, a record id or a tab id cannot perturb the link, because none of
 * them is reachable from what the encoder is given.
 */
@Injectable({ providedIn: 'root' })
export class FragmentPublisher {
  readonly #active = inject(ActiveBuildStore);
  readonly #location = inject(HistoryLocationAdapter);
  readonly #ingress = inject(BuildLinkCoordinator);
  readonly #errors = inject(LinkErrorMapper);
  readonly #injector = inject(Injector);

  /** Discards an encode that finished after a newer edit started one. */
  #token = 0;

  /**
   * How a build becomes a fragment.
   *
   * A property rather than a direct call so a test can control when an encode
   * finishes or make one refuse — neither of which the real codec can be asked
   * to do on demand.
   */
  encode: (loadout: ShipLoadout) => Promise<string> = encodeBuildLinkFragment;

  /**
   * Publishes after every modelled edit, for as long as the workspace is open.
   *
   * Returns an unsubscribe: the watcher outlives no screen, and a second
   * registration would encode the same build twice per keystroke.
   */
  start(): () => void {
    const watcher = effect(
      () => {
        // The revision is the subscription. The loadout is edited in place, so
        // its reference never changes and reading it alone would publish once
        // and then never again.
        this.#active.revision();
        this.#active.loadout();
        void this.publish();
      },
      { injector: this.#injector },
    );

    return () => watcher.destroy();
  }

  /** Encodes the current build and replaces the fragment with it. */
  async publish(): Promise<void> {
    const loadout = untracked(() => linkPayloadSource(this.#active.state()));

    if (loadout === null) {
      this.#clearBuildFragment();
      this.#active.setLink({ kind: 'absent' });
      return;
    }

    this.#token += 1;
    const token = this.#token;
    this.#active.setLink({ kind: 'encoding' });

    let fragment: string;
    try {
      fragment = await this.encode(loadout);
    } catch (error) {
      if (token !== this.#token) {
        return;
      }
      const failure = this.#errors.classify(error);
      this.#refuse(failure.code, failure.slot);
      return;
    }

    if (token !== this.#token) {
      return;
    }

    // The bound is the application's promise about what it publishes, so it is
    // checked on the way out as well as on the way in. A link that exceeds it
    // is refused rather than published and truncated by something downstream.
    if (fragment.length > MAX_BUILD_LINK_LENGTH) {
      this.#refuse('tooLong', null);
      return;
    }

    this.#ingress.markPublished(fragment);
    this.#location.replaceFragment(fragment);
    this.#active.setLink({ kind: 'published', fragment });
  }

  /** The canonical shareable address for what is currently published. */
  publishedUrl(): string | null {
    const link = this.#active.link();
    return link.kind === 'published' ? this.#location.urlWithFragment(link.fragment) : null;
  }

  /**
   * Refuses to publish, and takes the stale link down with it.
   *
   * The build stays exactly as it is — a build that cannot be shared is still a
   * build. What cannot stay is the fragment: it describes an earlier version,
   * and leaving it in the address bar would hand a Commander a link to
   * something they are no longer editing (build-link contract, "Active-edit
   * synchronization").
   */
  #refuse(code: LinkFailureCode, slot: string | null): void {
    this.#clearBuildFragment();
    this.#active.setLink({ kind: 'refused', code, slot });
  }

  #clearBuildFragment(): void {
    if (recognizeBuildLinkFragment(this.#location.fragment()).kind === 'unrelated') {
      return;
    }
    this.#ingress.markPublished(null);
    this.#location.replaceFragment(null);
  }
}
