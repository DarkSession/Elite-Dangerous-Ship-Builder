import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { JournalFile } from '../../domain/journal/journal-scan';
import { provideLocalization } from '../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../i18n/testing/localization-harness';
import { MemoryStorage, provideMemoryStorage } from '../../platform/storage/storage.spec-helpers';
import { AnnouncementService } from '../../ui/announcements/announcement.service';
import { LoadoutImportPresenter } from './loadout-import.presenter';

/**
 * What the bench's import says out loud.
 *
 * A scan says that it started and how it ended, because everything else it
 * produces is on the screen and a Commander who is not looking at the screen
 * would otherwise hear a beginning with no end (016/FR-004, FR-006).
 *
 * The one outcome that is not said is the one nobody is waiting for. A scan
 * replaced by a newer one is a question the Commander withdrew, and its answer
 * landing on top of the newer one's is the defect the token used to hide
 * (011/FR-009).
 */
const EVENT = {
  timestamp: '2026-09-01T10:00:00Z',
  event: 'SuitLoadout',
  SuitName: 'tacticalsuit_class5',
  LoadoutName: 'Double Trouble',
  SuitMods: [],
  Modules: [],
} as const;

function event(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({ ...EVENT, ...overrides });
}

function journalFile(name: string, lines: readonly string[]): JournalFile {
  const text = lines.join('\n');
  return { name, size: text.length, text: () => Promise.resolve(text) };
}

describe('LoadoutImportPresenter announcements', () => {
  let presenter: LoadoutImportPresenter;
  let announcements: AnnouncementService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideLocalization(),
        ...provideIsolatedLocaleEnvironment(),
        ...provideMemoryStorage(new MemoryStorage()),
      ],
    });
    presenter = TestBed.inject(LoadoutImportPresenter);
    announcements = TestBed.inject(AnnouncementService);
  });

  it('says that it is reading files, out loud', async () => {
    const scanning = presenter.scanFiles([journalFile('Journal.01.log', [event()])]);

    expect(announcements.polite()).toBe('Reading journal files.');

    await scanning;
  });

  it('says how the scan ended, not only that it started', async () => {
    await presenter.scanFiles([
      journalFile('Journal.01.log', [event({ LoadoutName: 'One' }), event({ LoadoutName: 'Two' })]),
    ]);

    expect(announcements.polite()).toBe('2 loadouts found. Choose one or more.');
  });

  it('says nothing about the outcome of a scan a newer one replaced', async () => {
    let release: (text: string) => void = () => {};
    const slow: JournalFile = {
      name: 'Journal.slow.log',
      size: 1,
      text: () => new Promise<string>((resolve) => (release = resolve)),
    };

    const abandoned = presenter.scanFiles([slow]);

    // A second drop while the first is still being read. Its outcome is the
    // answer the Commander is waiting for.
    await presenter.scanFiles([
      journalFile('Journal.02.log', [event({ LoadoutName: 'One' }), event({ LoadoutName: 'Two' })]),
    ]);
    const answered = announcements.politeEvent();
    expect(answered?.text).toBe('2 loadouts found. Choose one or more.');

    // The abandoned scan then settles, on nothing at all. Announced, it would
    // talk over the answer to the question that replaced it.
    release('{"event":"Docked"}');
    await abandoned;

    expect(announcements.politeEvent()).toBe(answered);
  });
});
