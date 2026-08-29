import { Injectable, computed, inject } from '@angular/core';
import { ActiveBuildStore } from '../active-build/active-build.store';
import { FragmentPublisher } from '../build-link/fragment-publisher';
import { generateSlefExportArtifact } from '../../domain/slef/slef-export';
import type { ActiveExportSnapshot, CanonicalLink } from '../../domain/slef/slef-export.models';
import { APPLICATION_METADATA } from '../../platform/build/application-metadata';
import { SlefStore } from './slef.store';

/**
 * Turning the active build into one exportable artifact, once.
 *
 * Everything here exists to make one guarantee: the payload a Commander copies
 * describes the build they are looking at. That needs the loadout, the revision
 * and the link read together — a link certified a moment ago for a build that
 * has since been edited is the exact stale-fragment case the snapshot exists to
 * prevent — and it needs the artifact dropped the instant the revision moves
 * on (export contract, "Artifact lifecycle").
 */
@Injectable({ providedIn: 'root' })
export class SlefExportCoordinator {
  readonly #active = inject(ActiveBuildStore);
  readonly #publisher = inject(FragmentPublisher);
  readonly #store = inject(SlefStore);

  /**
   * One atomic read of everything an artifact depends on.
   *
   * `null` when there is no active build, which is the whole of the
   * export-unavailable rule: no build, no generation, and no stale payload left
   * over from the previous one (FR-001).
   */
  readonly snapshot = computed<ActiveExportSnapshot | null>(() => {
    const loadout = this.#active.loadout();
    if (loadout === null) {
      return null;
    }
    const revision = this.#active.revision();
    return { loadout, revision, canonicalLink: this.#canonicalLink(revision) };
  });

  /**
   * Generates the artifact for the current revision, replacing any older one.
   *
   * Refuses with no active build rather than producing an empty payload, and
   * discloses an invalid or incomplete package verdict without withholding
   * anything: a build that does not fly is still a build a Commander may want
   * to send somebody (FR-001, FR-004).
   */
  generate(): boolean {
    const snapshot = this.snapshot();
    if (snapshot === null) {
      this.#store.setArtifact(null);
      return false;
    }

    this.#store.setGenerating(true);
    try {
      this.#store.setArtifact(generateSlefExportArtifact(snapshot, APPLICATION_METADATA));
      return true;
    } finally {
      this.#store.setGenerating(false);
    }
  }

  /**
   * Drops an artifact whose build has moved on.
   *
   * Called before every delivery action rather than only on edit, because that
   * is the moment where being wrong matters: what is about to leave has to be
   * the current build or nothing.
   */
  invalidateStaleArtifact(): void {
    const snapshot = this.snapshot();
    if (snapshot === null) {
      this.#store.setArtifact(null);
      return;
    }
    this.#store.invalidateArtifactUnless(snapshot.revision);
  }

  /**
   * What feature 001 says about a link for exactly this revision.
   *
   * A published fragment counts only when it was published *for* this revision.
   * Encoding is asynchronous, so a modelled edit leaves a correct link to the
   * previous build sitting in the store for a moment; exporting it would point
   * a consumer at a build that no longer exists.
   */
  #canonicalLink(revision: number): CanonicalLink {
    const link = this.#active.link();
    switch (link.kind) {
      case 'published': {
        if (link.revision !== revision) {
          return { kind: 'stale' };
        }
        const url = this.#publisher.publishedUrl();
        return url === null ? { kind: 'stale' } : { kind: 'certified', url };
      }
      case 'encoding':
        return { kind: 'pending' };
      case 'refused':
        return { kind: 'refused' };
      default:
        return { kind: 'absent' };
    }
  }
}
