import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { JournalFile } from '../../domain/journal/journal-scan';
import { provideLocalization } from '../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../i18n/testing/localization-harness';
import {
  MemoryStorage,
  provideMemoryStorage,
  quotaError,
} from '../../platform/storage/storage.spec-helpers';
import { LoadoutImportStore } from './loadout-import.store';
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

/** A store that refuses to write any record naming this loadout. */
class RefusesOne extends MemoryStorage {
  constructor(readonly refuses: string) {
    super();
  }

  override setItem(key: string, value: string): void {
    if (value.includes(this.refuses)) {
      throw quotaError();
    }
    super.setItem(key, value);
  }
}

describe('LoadoutImportPresenter announcements', () => {
  let presenter: LoadoutImportPresenter;
  let announcements: AnnouncementService;
  let storage: MemoryStorage;

  function configure(store: MemoryStorage): void {
    storage = store;
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideLocalization(),
        ...provideIsolatedLocaleEnvironment(),
        ...provideMemoryStorage(storage),
      ],
    });
    presenter = TestBed.inject(LoadoutImportPresenter);
    announcements = TestBed.inject(AnnouncementService);
  }

  /** Scans two named loadouts and chooses both, which stores rather than opens. */
  async function chooseBoth(): Promise<void> {
    await presenter.scanFiles([
      journalFile('Journal.01.log', [
        event({ LoadoutName: 'Kept', timestamp: '2026-09-02T10:00:00Z' }),
        event({ LoadoutName: 'Refused', timestamp: '2026-09-01T10:00:00Z' }),
      ]),
    ]);
    presenter.choosePicks(
      TestBed.inject(LoadoutImportStore)
        .entries()
        .map((entry) => entry.key),
    );
  }

  beforeEach(() => {
    configure(new MemoryStorage());
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

  it('says what refused a scan, in the sentence the panel states it in', async () => {
    await presenter.scanFiles([journalFile('Journal.01.log', ['{"event":"Docked"}'])]);

    expect(announcements.polite()).toBe('No suit loadout event was found in Journal.01.log.');
  });

  it('never says a file held nothing when it was never read', async () => {
    // A file over the size limit is refused before it is opened. Reporting the
    // empty list it left behind would state an outcome nobody reached
    // (constitution IV).
    const enormous = {
      name: 'Journal.big.log',
      size: 64 * 1024 * 1024,
      text: () => Promise.resolve(''),
    };

    await presenter.scanFiles([enormous]);

    const spoken = announcements.polite();
    expect(spoken).toContain('Journal.big.log');
    expect(spoken).not.toContain('Nothing was found');
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

  it('states both outcomes of a batch that saves one loadout and cannot save the other', async () => {
    // One request, two outcomes, and the polite outlet holds one event: a
    // second announcement in the same tick would write over the first and only
    // the last of them would reach a reader (011/FR-009).
    configure(new RefusesOne('Refused'));
    await chooseBoth();

    expect(await presenter.submit()).toMatchObject({ kind: 'stored', stored: 1 });

    expect(announcements.polite()).toBe('1 loadout imported and saved. 1 loadout was not saved.');
  });

  it('never says the rest were saved where nothing was', async () => {
    // A browser that has stopped accepting writes refuses every one of them.
    // The Commander is still owed an answer, and the answer is that nothing was
    // saved — saying the rest were would state an outcome that did not happen
    // (constitution IV).
    configure(new MemoryStorage());
    await chooseBoth();
    storage.writeError = quotaError();

    expect(await presenter.submit()).toMatchObject({ kind: 'stored', stored: 0 });

    expect(announcements.polite()).toBe('2 loadouts were not saved.');
  });
});
