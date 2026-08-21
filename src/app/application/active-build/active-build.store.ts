import { Injectable, computed, signal } from '@angular/core';
import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { BuildSnapshotV1 } from '../../domain/build/build-snapshot';
import { toBuildSnapshotV1 } from '../../domain/build/build-snapshot.serializer';
import { baselineFingerprint, isDirty } from '../../domain/build/replacement-policy';
import type {
  ActiveBuildState,
  BuildCandidate,
  BuildProvenance,
  LinkPublicationState,
  NamedSource,
  PersistenceStatus,
  QualityCompletionNotice,
} from './active-build.models';

/**
 * The one live build, and everything the application knows about it.
 *
 * There is exactly one `ShipLoadout` in the application at a time and it lives
 * here. No component holds a second copy, because two copies of a build are two
 * builds, and the one a Commander sees would eventually not be the one that
 * gets saved.
 *
 * The loadout itself is mutable — the package edits in place — so the store
 * publishes a `revision` that every derived value reads. An editor calls
 * `touch()` after a modelled edit and the snapshot, dirty state, autosave and
 * link publication all follow from that one signal. A signal holding the
 * loadout object alone could not: the reference never changes.
 */
@Injectable({ providedIn: 'root' })
export class ActiveBuildStore {
  readonly #loadout = signal<ShipLoadout | null>(null);
  readonly #hullName = signal<string | null>(null);
  readonly #revision = signal(0);
  readonly #provenance = signal<BuildProvenance>('none');
  readonly #workingRecordId = signal<string | null>(null);
  readonly #sourceNamed = signal<NamedSource | null>(null);
  readonly #baseline = signal<string | null>(null);
  readonly #persistence = signal<PersistenceStatus>('ready');
  readonly #link = signal<LinkPublicationState>({ kind: 'absent' });
  readonly #notices = signal<readonly QualityCompletionNotice[]>([]);

  readonly loadout = this.#loadout.asReadonly();
  /** The active hull's name in the Commander's language, as committed. */
  readonly hullName = this.#hullName.asReadonly();
  readonly provenance = this.#provenance.asReadonly();
  readonly workingRecordId = this.#workingRecordId.asReadonly();
  readonly sourceNamed = this.#sourceNamed.asReadonly();
  readonly baselineFingerprint = this.#baseline.asReadonly();
  readonly persistence = this.#persistence.asReadonly();
  readonly link = this.#link.asReadonly();
  readonly qualityCompletionNotices = this.#notices.asReadonly();

  /** Increments once per modelled edit or commit. Everything derived reads it. */
  readonly revision = this.#revision.asReadonly();

  /** The active build's modelled state, recomputed once per revision. */
  readonly snapshot = computed<BuildSnapshotV1 | null>(() => {
    this.#revision();
    const loadout = this.#loadout();
    return loadout === null ? null : toBuildSnapshotV1(loadout);
  });

  /** The fingerprint of the current modelled state. */
  readonly fingerprint = computed<string | null>(() => {
    const snapshot = this.snapshot();
    return snapshot === null ? null : baselineFingerprint(snapshot);
  });

  /** Whether replacing this build would lose work. */
  readonly dirty = computed(() => isDirty(this.fingerprint(), this.#baseline()));

  /** The package's own verdict on the active build. `null` when there is none. */
  readonly validation = computed(() => {
    this.#revision();
    return this.#loadout()?.validation ?? null;
  });

  readonly state = computed<ActiveBuildState>(() => ({
    loadout: this.#loadout(),
    hullName: this.#hullName(),
    provenance: this.#provenance(),
    workingRecordId: this.#workingRecordId(),
    sourceNamed: this.#sourceNamed(),
    baselineFingerprint: this.#baseline(),
    dirty: this.dirty(),
    persistence: this.#persistence(),
    link: this.#link(),
    qualityCompletionNotices: this.#notices(),
  }));

  /**
   * Makes a candidate the active build, in one write.
   *
   * Every field that describes where the build came from moves together: a
   * committed link build cannot be left carrying the previous build's named
   * source, and a transient notice about the previous build is not about this
   * one.
   */
  commit(candidate: BuildCandidate): void {
    this.#loadout.set(candidate.loadout);
    this.#hullName.set(candidate.hullName);
    this.#provenance.set(candidate.provenance);
    this.#sourceNamed.set(candidate.sourceNamed);
    this.#baseline.set(candidate.baseline);
    this.#notices.set([]);
    this.#link.set({ kind: 'absent' });
    this.#revision.update((revision) => revision + 1);
  }

  /** Announces a modelled edit to the live build. */
  touch(): void {
    if (this.#loadout() === null) {
      return;
    }
    this.#revision.update((revision) => revision + 1);
  }

  /** The tab-owned record autosave writes to. */
  setWorkingRecordId(recordId: string | null): void {
    this.#workingRecordId.set(recordId);
  }

  /**
   * Marks the current modelled state as the saved baseline.
   *
   * Called after a successful named save or open, and after nothing else: a
   * working autosave is not a baseline, because a Commander cannot ask for the
   * previous version of it back.
   */
  markSaved(sourceNamed: NamedSource | null): void {
    this.#baseline.set(this.fingerprint());
    if (sourceNamed !== null) {
      this.#sourceNamed.set(sourceNamed);
      this.#provenance.set('named');
    }
  }

  setPersistence(status: PersistenceStatus): void {
    this.#persistence.set(status);
  }

  setLink(state: LinkPublicationState): void {
    this.#link.set(state);
  }

  setQualityCompletionNotices(notices: readonly QualityCompletionNotice[]): void {
    this.#notices.set(notices);
  }

  /** Clears the active build entirely. Test support and explicit discard only. */
  clear(): void {
    this.#loadout.set(null);
    this.#hullName.set(null);
    this.#provenance.set('none');
    this.#sourceNamed.set(null);
    this.#baseline.set(null);
    this.#notices.set([]);
    this.#link.set({ kind: 'absent' });
    this.#revision.update((revision) => revision + 1);
  }
}
