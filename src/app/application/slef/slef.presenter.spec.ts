import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { getSlefDiagnosticMessage } from '@elite-dangerous-almanac/core/i18n/diagnostics';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { GameTextPresenter } from '../../i18n/game-text.presenter';
import { provideLocalization } from '../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../i18n/testing/localization-harness';
import { FIXTURE_HULL, FIXTURE_SLOTS } from '../../domain/outfitting/outfitting.fixtures';
import {
  SLEF_IMPORT_LIMIT_BYTES,
  type SlefPackageDiagnostic,
} from '../../domain/slef/slef-import.models';
import { ActiveBuildStore } from '../active-build/active-build.store';
import { DownloadAdapter } from '../../platform/browser/download.adapter';
import { NavigatorAdapter } from '../../platform/browser/navigator.adapter';
import { SlefPresenter } from './slef.presenter';
import { SlefStore } from './slef.store';

/** A platform that can do everything, so the wording is what is under test. */
class FakeNavigator {
  languages(): readonly string[] {
    return ['en'];
  }
  clipboardAvailable(): boolean {
    return true;
  }
  canShare(): boolean {
    return true;
  }
  canShareFiles(): boolean {
    return true;
  }
  async copyText(): Promise<boolean> {
    return true;
  }
  async shareData(): Promise<'shared'> {
    return 'shared';
  }
}

class FakeDownload {
  dispatch(): boolean {
    return true;
  }
  toFile(payload: string, filename: string, mimeType: string): File {
    return new File([payload], filename, { type: mimeType });
  }
}

/** One package diagnostic, with only the field under test varied. */
function diagnostic(overrides: Partial<SlefPackageDiagnostic>): SlefPackageDiagnostic {
  return {
    index: 1,
    path: 'entries[1].Modules[0].Item',
    code: 'invalidModule',
    constraint: 'stringRequired',
    params: {},
    message: 'Unknown module.',
    ...overrides,
  } as SlefPackageDiagnostic;
}

function commit(active: ActiveBuildStore): void {
  active.commit({
    loadout: ShipLoadout.default(FIXTURE_HULL),
    hullName: 'Anaconda',
    provenance: 'working',
    qualityNotices: [],
    sourceNamed: null,
    autosaveRecordId: null,
    baseline: null,
  });
}

describe('what feature 004 says out loud', () => {
  let presenter: SlefPresenter;
  let store: SlefStore;
  let active: ActiveBuildStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideLocalization(),
        ...provideIsolatedLocaleEnvironment(),
        { provide: NavigatorAdapter, useClass: FakeNavigator },
        { provide: DownloadAdapter, useClass: FakeDownload },
      ],
    });
    presenter = TestBed.inject(SlefPresenter);
    store = TestBed.inject(SlefStore);
    active = TestBed.inject(ActiveBuildStore);
  });

  describe('the import status line', () => {
    it('awaits input while the draft is empty', () => {
      expect(presenter.importView().status).toBe('Awaiting input');
    });

    it('states the used and available bytes through a named formatter', () => {
      store.setDraft('{}');

      expect(presenter.importView().status).toBe('2 byte of 65.5 kB used');
    });

    it('says a cancelled attempt changed nothing', () => {
      store.setImportEnding('cancelled');

      expect(presenter.importView().status).toBe('Nothing was imported. Your build is unchanged.');
    });

    it('returns to the byte count on the next edit', () => {
      store.setImportEnding('superseded');
      store.setDraft('{}');

      expect(presenter.importView().status).toBe('2 byte of 65.5 kB used');
    });
  });

  describe('the import refusals', () => {
    it('names the actual and the allowed size, not the raw byte counts', () => {
      store.setImportFailure({
        kind: 'tooLarge',
        utf8Bytes: SLEF_IMPORT_LIMIT_BYTES + 1,
        limitBytes: SLEF_IMPORT_LIMIT_BYTES,
      });

      expect(presenter.importView().failure?.message).toBe(
        'This draft is 65.5 kB, and the most that can be imported is 65.5 kB.',
      );
    });

    it('states the exactly-one rule with the count the payload held', () => {
      store.setImportFailure({ kind: 'cardinality', observed: 2, diagnostics: [] });

      expect(presenter.importView().failure?.message).toBe(
        'Exactly one build can be imported. This payload holds 2.',
      );
    });

    it('quotes the exact hull identity the package does not carry', () => {
      store.setImportFailure({ kind: 'unknownHull', sourceHull: 'Nonexistent_Hull' });

      expect(presenter.importView().failure?.message).toContain('Nonexistent_Hull');
    });

    it('frames a thrown parse error itself, with no package prose', () => {
      store.setImportFailure({ kind: 'syntax' });

      expect(presenter.importView().failure?.message).toBe(
        'This is not valid JSON, so the Almanac could not read it.',
      );
      expect(presenter.importView().failure?.diagnostics).toEqual([]);
    });

    it('names each refused roll by its slot, article and source quality', () => {
      store.setImportFailure({
        kind: 'normalizationUnsupported',
        failures: [
          {
            source: {
              slotKey: FIXTURE_SLOTS.frameShiftDrive,
              moduleSymbol: 'Int_Hyperdrive_Size6_Class5',
              blueprintFdname: 'FSD_LongRange',
              effectFdname: null,
              grade: 5,
              quality: 0.42,
            },
            code: 'unsupportedEngineering',
            params: null,
          },
        ],
      });
      const failure = presenter.importView().failure;

      expect(failure?.message).toContain('1 of these modules');
      expect(failure?.refusals).toHaveLength(1);
      expect(failure?.refusals[0]).toContain('42%');
      expect(failure?.refusals[0]).toContain('unsupportedEngineering');
    });
  });

  describe('the diagnostics it hands the list', () => {
    it('passes every package field through untouched, formatting only the index', () => {
      const [entry] = presenter.diagnostics([
        {
          index: 1,
          path: 'entries[1].Modules[0].Item',
          code: 'invalidModule',
          constraint: 'stringRequired',
          params: {},
          message: 'Unknown module.',
        },
      ]);

      expect(entry?.index).toBe('1');
      expect(entry?.path).toBe('entries[1].Modules[0].Item');
      expect(entry?.code).toBe('invalidModule');
      expect(entry?.constraint).toBe('stringRequired');
      expect(entry?.reason.length).toBeGreaterThan(0);
    });

    it('keeps the package’s own indices rather than renumbering the list', () => {
      const entries = presenter.diagnostics([
        diagnostic({ index: 3, path: 'entries[3].Ship' }),
        diagnostic({ index: 7, path: 'entries[7].Modules' }),
      ]);

      expect(entries.map((entry) => entry.index)).toEqual(['3', '7']);
    });

    it('keeps five separate facts rather than flattening them into a sentence', () => {
      const [entry] = presenter.diagnostics([diagnostic({})]);

      expect(entry?.path).not.toContain(entry?.code ?? '');
      expect(entry?.reason).not.toContain(entry?.path ?? '');
      expect(entry?.constraint).not.toContain(entry?.path ?? '');
    });

    it('says what the package says, in the package’s own words', () => {
      const source = diagnostic({});
      const packageText = getSlefDiagnosticMessage(
        source,
        TestBed.inject(GameTextPresenter).locale,
      );

      const [entry] = presenter.diagnostics([source]);

      expect(entry?.reason).toBe(packageText ?? source.message);
    });

    it('shows the diagnostic’s own message when the package resolves a code by echoing it', () => {
      // A code this release has no text of its own for comes back as the
      // message the diagnostic already carries. That is the package's answer,
      // not an application fallback, and it is shown as given (FR-011).
      const source = diagnostic({
        code: 'aCodeThePackageDoesNotCarry' as SlefPackageDiagnostic['code'],
      });

      const [entry] = presenter.diagnostics([source]);

      expect(entry?.reason).toBe(source.message);
    });

    it('discloses the language rather than inventing text when the package has none at all', () => {
      const source = diagnostic({
        code: 'aCodeThePackageDoesNotCarry' as SlefPackageDiagnostic['code'],
        message: '',
      });
      expect(getSlefDiagnosticMessage(source, 'en') ?? '').toBe('');

      const [entry] = presenter.diagnostics([source]);

      expect(entry?.reason).toBe('');
      expect(entry?.disclosure).not.toBeNull();
      expect(entry?.reasonLanguage).toBeNull();
    });

    it('never translates a package code through the application’s own messages', () => {
      const [entry] = presenter.diagnostics([diagnostic({})]);

      // The code renders as the package wrote it. A missing-message marker here
      // would mean the application had gone looking for a key of its own.
      expect(entry?.code).toBe('invalidModule');
      expect(entry?.code).not.toContain('slef.');
    });

    it('invents no code, path or diagnostic for a failure the package did not raise', () => {
      for (const failure of [
        { kind: 'syntax' } as const,
        { kind: 'unknownHull', sourceHull: 'Nonexistent_Hull' } as const,
        { kind: 'construction' } as const,
      ]) {
        store.setImportFailure(failure);

        const view = presenter.importView().failure;
        expect(view?.diagnostics).toEqual([]);
        expect(view?.message ?? '').not.toContain('entries[');
      }
    });
  });

  describe('the export layer', () => {
    it('names the build it is about, through the package’s own hull name', () => {
      commit(active);

      expect(presenter.exportView().title).toContain('Anaconda');
    });

    it('offers both drawn formats, with the selected one marked', () => {
      presenter.selectMode('slef');

      expect(presenter.exportView().modes.map((mode) => mode.mode)).toEqual(['slef', 'link']);
      expect(presenter.exportView().modes.find((mode) => mode.selected)?.mode).toBe('slef');
    });

    it('states the entry count and the payload size beside the payload', () => {
      commit(active);
      presenter.generate();

      expect(presenter.exportView().metadata).toMatch(/^SLEF v1 · \d+ modules · [\d.]+ kB$/);
    });

    it('says nothing about validation for a build the package is happy with', () => {
      commit(active);
      presenter.generate();

      expect(presenter.exportView().validation).toBeNull();
    });

    it('warns about an invalid build without withholding the export', () => {
      commit(active);
      presenter.generate();
      const generated = store.artifact();
      if (generated === null) {
        throw new Error('expected an artifact to warn about');
      }
      // Driven from the artifact's own verdict rather than from a build broken
      // on purpose: what is under test is that an unhappy verdict is said out
      // loud and withholds nothing, not which edits make the package unhappy.
      store.setArtifact({
        ...generated,
        validation: { valid: false, complete: false, issues: [] },
      });

      expect(presenter.exportView().validation).toBe(
        'The Almanac reports this build as invalid. It is exported exactly as it is.',
      );
      expect(presenter.exportView().payload.length).toBeGreaterThan(0);
    });

    it('says an otherwise valid build is incomplete, in its own words', () => {
      commit(active);
      presenter.generate();
      const generated = store.artifact();
      if (generated === null) {
        throw new Error('expected an artifact to warn about');
      }
      store.setArtifact({ ...generated, validation: { valid: true, complete: false, issues: [] } });

      expect(presenter.exportView().validation).toBe(
        'The Almanac reports this build as incomplete. It is exported exactly as it is.',
      );
    });

    it('explains why a link is absent rather than leaving a gap', () => {
      commit(active);
      presenter.generate();

      expect(presenter.exportView().link).toBe(
        'The export carries no link, because this build has none yet.',
      );
    });

    it('always offers Download, and never claims a file was saved', () => {
      commit(active);
      presenter.generate();
      presenter.download();
      const download = presenter.exportView().actions.find((one) => one.action === 'download');

      expect(download).toBeDefined();
      expect(download?.status).toContain('handed to your browser');
      expect(download?.failed).toBe(false);
    });

    it('leaves the payload selectable when copying fails', () => {
      commit(active);
      presenter.generate();
      store.setDelivery({ action: 'copy', status: 'failed', reason: 'failed' });
      const copy = presenter.exportView().actions.find((one) => one.action === 'copy');

      expect(copy?.failed).toBe(true);
      expect(presenter.exportView().payload.length).toBeGreaterThan(0);
    });

    it('offers Share only when the platform provides it', () => {
      commit(active);
      store.setCapability({ clipboard: 'available', download: 'available', share: 'unavailable' });

      expect(presenter.exportView().actions.map((one) => one.action)).toEqual(['download', 'copy']);
    });
  });
});
