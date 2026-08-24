import { TestBed } from '@angular/core/testing';
import { SlefStore, utf8ByteLength } from './slef.store';
import { SLEF_IMPORT_LIMIT_BYTES } from '../../domain/slef/slef-import.models';
import {
  SLEF_EXPORT_FILENAME,
  SLEF_EXPORT_MIME_TYPE,
  type SlefExportArtifact,
} from '../../domain/slef/slef-export.models';

function artifact(revision: number): SlefExportArtifact {
  return {
    revision,
    payload: '[]',
    utf8Bytes: 2,
    moduleCount: 0,
    filename: SLEF_EXPORT_FILENAME,
    mimeType: SLEF_EXPORT_MIME_TYPE,
    header: { appName: 'App', appVersion: '1.0.0' },
    linkOmission: 'absent',
    validation: { valid: true, complete: true, issues: [] },
  };
}

describe('SlefStore', () => {
  let store: SlefStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(SlefStore);
  });

  describe('draft', () => {
    it('publishes the exact text, its UTF-8 size and the one limit', () => {
      store.setDraft('  ä ');

      expect(store.draft()).toEqual({
        text: '  ä ',
        utf8Bytes: 5,
        limitBytes: SLEF_IMPORT_LIMIT_BYTES,
      });
    });

    it('measures multibyte text in bytes, not in characters', () => {
      expect(utf8ByteLength('€')).toBe(3);
      expect(utf8ByteLength('a'.repeat(SLEF_IMPORT_LIMIT_BYTES))).toBe(SLEF_IMPORT_LIMIT_BYTES);
    });

    it('clears a failure that described older text when the draft changes', () => {
      store.setImportFailure({ kind: 'empty' });
      store.setDraft('{}');

      expect(store.importFailure()).toBeNull();
      expect(store.importStatus()).toBe('editing');
    });
  });

  describe('request token', () => {
    it('supersedes every result still in flight when a newer one is issued', () => {
      const first = store.issueToken();
      const second = store.issueToken();

      expect(store.isCurrent(first)).toBe(false);
      expect(store.isCurrent(second)).toBe(true);
    });
  });

  describe('export artifact', () => {
    it('holds at most one, and forgets the previous delivery results with it', () => {
      store.setArtifact(artifact(1));
      store.setDelivery({ action: 'copy', status: 'copied' });

      store.setArtifact(artifact(2));

      expect(store.artifact()?.revision).toBe(2);
      expect(store.delivery()).toEqual({});
    });

    it('invalidates synchronously when the active revision moves on', () => {
      store.setArtifact(artifact(1));

      store.invalidateArtifactUnless(1);
      expect(store.artifact()).not.toBeNull();

      store.invalidateArtifactUnless(2);
      expect(store.artifact()).toBeNull();
    });

    it('keeps the artifact when a delivery action fails', () => {
      store.setArtifact(artifact(1));

      store.setDelivery({ action: 'copy', status: 'failed', reason: 'failed' });

      expect(store.artifact()).not.toBeNull();
      expect(store.delivery().copy).toEqual({
        action: 'copy',
        status: 'failed',
        reason: 'failed',
      });
    });
  });

  it('writes nothing to any browser storage', () => {
    const local = vi.spyOn(Storage.prototype, 'setItem');

    store.setDraft('{"Ship":"sidewinder"}');
    store.setArtifact(artifact(1));
    store.setDelivery({ action: 'download', status: 'dispatched' });
    store.openLayer('import');
    store.selectExportMode('slef');

    expect(local).not.toHaveBeenCalled();
    local.mockRestore();
  });
});
