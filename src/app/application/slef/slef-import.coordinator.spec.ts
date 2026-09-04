import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import {
  FIXTURE_HULL,
  FIXTURE_SLOTS,
  SUPPORTED_PARTIAL_QUALITY,
  SUPPORTED_PARTIAL_SOURCE_QUALITY,
  UNSUPPORTED_PARTIAL_QUALITY,
} from '../../domain/ships/outfitting/outfitting.fixtures';
import { provideLocalization } from '../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../i18n/testing/localization-harness';
import { ActiveBuildStore } from '../active-build/active-build.store';
import { BuildIngressCoordinator } from '../active-build/build-ingress.coordinator';
import type { BuildCandidate } from '../active-build/active-build.models';
import { SlefImportCoordinator } from './slef-import.coordinator';
import { SlefStore } from './slef.store';

const VALID = JSON.stringify({ event: 'Loadout', Ship: FIXTURE_HULL, Modules: [] });

function seedActive(active: ActiveBuildStore): void {
  active.commit({
    loadout: ShipLoadout.default('Sidewinder'),
    hullName: 'Sidewinder',
    provenance: 'working',
    qualityNotices: [],
    sourceNamed: null,
    autosaveRecordId: null,
    baseline: null,
  });
}

describe('the one path from a draft to an active build', () => {
  let active: ActiveBuildStore;
  let store: SlefStore;
  let replacement: BuildIngressCoordinator;
  let coordinator: SlefImportCoordinator;
  let committed: BuildCandidate[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // A stub `/outfitting`, so the coordinator's move to the workspace resolves
        // without mounting feature 001's real route.
        provideRouter([{ path: 'outfitting', children: [] }]),
        provideLocalization(),
        ...provideIsolatedLocaleEnvironment(),
      ],
    });
    active = TestBed.inject(ActiveBuildStore);
    store = TestBed.inject(SlefStore);
    replacement = TestBed.inject(BuildIngressCoordinator);
    coordinator = TestBed.inject(SlefImportCoordinator);
    committed = [];
    replacement.addSink({
      onCommitted: (candidate) => {
        committed.push(candidate);
      },
    });
    // Since 2026-08-25 nothing is asked between a valid draft and an active
    // build: the build being replaced has a record of its own (FR-008).
  });

  describe('delegation', () => {
    it('replaces the build exactly once, through feature 001 alone', async () => {
      seedActive(active);
      const before = active.revision();
      store.setDraft(VALID);

      expect(await coordinator.submit()).toEqual({ kind: 'committed' });

      expect(committed).toHaveLength(1);
      expect(active.revision()).toBe(before + 1);
      expect(active.provenance()).toBe('working');
      expect(active.loadout()?.shipSymbol.toLowerCase()).toBe(FIXTURE_HULL.toLowerCase());
    });

    it('arrives dirty, with no baseline and no named source to get it back from', async () => {
      store.setDraft(VALID);

      await coordinator.submit();

      expect(active.dirty()).toBe(true);
      expect(active.sourceNamed()).toBeNull();
    });

    it('writes no link and no working record of its own', async () => {
      store.setDraft(VALID);

      await coordinator.submit();

      // Both belong to feature 001's sinks. Feature 004 committing either would
      // be the second replacement path the coordinator exists to prevent.
      expect(active.link()).toEqual({ kind: 'absent' });
      expect(active.autosaveRecordId()).toBeNull();
    });
  });

  describe('what the accepted import reports', () => {
    it('hands the completions over as feature 001’s own quality notices', async () => {
      store.setDraft(JSON.stringify(SUPPORTED_PARTIAL_QUALITY));

      await coordinator.submit();

      expect(active.qualityCompletionNotices()).toEqual([
        {
          kind: 'qualityCompleted',
          slotKey: FIXTURE_SLOTS.thrusters,
          moduleSymbol: 'Int_Engine_Size7_Class5',
          blueprintFdname: 'Engine_Dirty',
          previousQuality: SUPPORTED_PARTIAL_SOURCE_QUALITY,
          quality: 1,
        },
      ]);
    });

    it('publishes no second report of them, and none of the package verdict', async () => {
      // The canvas draws no feature-004 import report, and both facts one would
      // carry are already drawn — the completions by feature 002's notice, the
      // verdict by feature 003's rail (design/import-outcome.md, "Divergence").
      // Asserted on what the store actually holds after an accepted import:
      // the completions are feature 001's, and feature 004 keeps none of them.
      store.setDraft(JSON.stringify(SUPPORTED_PARTIAL_QUALITY));

      await coordinator.submit();

      expect(active.qualityCompletionNotices()).toHaveLength(1);
      const held = JSON.stringify({
        draft: store.draft(),
        status: store.importStatus(),
        failure: store.importFailure(),
        ending: store.importEnding(),
        artifact: store.artifact(),
      });
      expect(held).not.toContain('qualityCompleted');
      expect(held).not.toContain('previousQuality');
      expect(held).not.toContain('valid');
    });

    it('leaves the verdict where feature 003 reads it: on the build itself', async () => {
      store.setDraft(VALID);

      await coordinator.submit();

      expect(active.loadout()?.validation()).toBeDefined();
    });

    it('retires the notices with the build they described', async () => {
      store.setDraft(JSON.stringify(SUPPORTED_PARTIAL_QUALITY));
      await coordinator.submit();

      store.setDraft(VALID);
      await coordinator.submit();

      expect(active.qualityCompletionNotices()).toEqual([]);
    });
  });

  describe('the draft', () => {
    it('is cleared only once the draft has become a build', async () => {
      store.setDraft(VALID);

      await coordinator.submit();

      expect(store.draft().text).toBe('');
      expect(store.layer()).toBe('none');
    });

    it.each([
      ['a refusal', '[]'],
      ['a normalization refusal', JSON.stringify(UNSUPPORTED_PARTIAL_QUALITY)],
      ['malformed JSON', '{ not json'],
    ])('survives %s exactly as it was typed', async (_name, text) => {
      store.setDraft(text);

      expect(await coordinator.submit()).toEqual({ kind: 'failed' });

      expect(store.draft().text).toBe(text);
      expect(store.importFailure()).not.toBeNull();
    });

    it('is spent by a commit, and not before', async () => {
      // The draft stops being a draft only when it has become a build. Every
      // other ending keeps it exactly as it was typed.
      seedActive(active);
      store.setDraft(VALID);

      expect(await coordinator.submit()).toEqual({ kind: 'committed' });

      expect(store.draft().text).toBe('');
    });
  });

  describe('atomicity', () => {
    it('leaves the active build byte-identical after every refusal', async () => {
      seedActive(active);
      const fingerprint = active.fingerprint();
      const revision = active.revision();
      store.setDraft(JSON.stringify(UNSUPPORTED_PARTIAL_QUALITY));

      await coordinator.submit();
      store.setDraft('[]');
      await coordinator.submit();

      expect(active.fingerprint()).toBe(fingerprint);
      expect(active.revision()).toBe(revision);
      expect(committed).toHaveLength(0);
    });

    it('loses to a newer ingress started while it was in flight', async () => {
      // The slow-paste-lands-on-a-newer-build case the request token exists
      // for: feature 001 supersedes the older request rather than committing
      // it, and the draft survives untouched because it never became a build.
      seedActive(active);
      store.setDraft(VALID);

      const inFlight = coordinator.submit();
      const other = {
        loadout: ShipLoadout.default('Eagle'),
        hullName: 'Eagle',
        provenance: 'stock' as const,
        qualityNotices: [],
        sourceNamed: null,
        autosaveRecordId: null,
        baseline: null,
      };
      await replacement.commit(() => ({ ok: true, candidate: other }));

      expect(await inFlight).toEqual({ kind: 'superseded' });
      expect(committed).toEqual([other]);
      expect(active.hullName()).toBe('Eagle');
      expect(store.draft().text).toBe(VALID);
    });

    it('stands by a commit even if the layer closes as it lands', async () => {
      // A token issued after the store has been written cannot un-replace the
      // build, and saying `superseded` here would describe an active build as
      // one that never arrived.
      seedActive(active);
      store.setDraft(VALID);
      const stop = replacement.addSink({ onCommitted: () => coordinator.abandon() });

      expect(await coordinator.submit()).toEqual({ kind: 'committed' });

      expect(committed).toHaveLength(1);
      expect(store.draft().text).toBe('');
      stop();
    });
  });
});
