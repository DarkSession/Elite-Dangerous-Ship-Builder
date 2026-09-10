import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import germanCatalogue from '../../i18n/locales/de.json';
import { provideLocalization } from '../../i18n/i18n.providers';
import type { MessageCatalogue } from '../../i18n/locale-registry';
import { LocaleStore } from '../../i18n/locale.store';
import { BroadcastChannelAdapter } from '../../platform/browser/broadcast-channel.adapter';
import { recordKey } from '../../platform/storage/storage-keys';
import { MemoryStorage, provideMemoryStorage } from '../../platform/storage/storage.spec-helpers';
import { AnnouncementService } from '../../ui/announcements/announcement.service';
import { declareMeasurement, declareResizeObserver } from '../../ui/measurement.spec-helpers';
import { BuildLibraryPage } from './build-library.page';

/**
 * What the library says out loud.
 *
 * The narrowed count is the one thing on this surface that moves without the
 * Commander looking at it. This suite is about it being said *every* time it
 * moves: a search narrowed twice is two events, and the second of them used to
 * be silence (011/FR-009).
 */

class SilentChannel {
  readonly available = false;
  post(): void {}
  subscribe(): () => void {
    return () => {};
  }
}

const NOW = '2026-01-02T03:04:05.000Z';

/** One named record, so a search can tell the rows apart. */
function seedNamed(storage: MemoryStorage, id: string, name: string): void {
  storage.setItem(
    recordKey(id),
    JSON.stringify({
      format: 'ednb.local-record',
      version: 1,
      id,
      kind: 'named',
      revisionId: `revision-${id}`,
      createdAt: NOW,
      modifiedAt: NOW,
      name,
      note: null,
      hullSymbol: 'Anaconda',
      validation: { valid: true, complete: true },
      build: {
        format: 'ednb.build',
        version: 1,
        shipSymbol: 'Anaconda',
        shipName: null,
        shipIdent: null,
        modules: [],
      },
      sourceNamed: null,
      autosaveRecordId: null,
    }),
  );
}

describe('BuildLibraryPage announcements', () => {
  let released: (() => void)[] = [];

  function render(): { page: BuildLibraryPage; detect: () => void } {
    released = [declareResizeObserver(), declareMeasurement({ width: 1440 })];

    const storage = new MemoryStorage();
    seedNamed(storage, 'one', 'Alpha');
    seedNamed(storage, 'two', 'Alpha Two');
    seedNamed(storage, 'three', 'Beta');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [BuildLibraryPage],
      providers: [
        provideLocalization(),
        provideRouter([]),
        ...provideMemoryStorage(storage),
        { provide: BroadcastChannelAdapter, useValue: new SilentChannel() },
      ],
    });

    const fixture = TestBed.createComponent(BuildLibraryPage);
    fixture.detectChanges();
    return {
      page: fixture.componentInstance,
      detect: () => fixture.detectChanges(),
    };
  }

  afterEach(() => {
    for (const release of released) {
      release();
    }
    released = [];
  });

  it('says nothing about the count the layer opens on', () => {
    render();

    // Initial content: it is drawn in the header the search sits in, and a
    // reader meets it in reading order without being spoken to.
    expect(TestBed.inject(AnnouncementService).polite()).toBe('');
  });

  it('states every narrowing, and the widening that follows it', () => {
    const { page, detect } = render();
    const announcements = TestBed.inject(AnnouncementService);

    page.changeSearch('alpha');
    detect();
    const first = announcements.politeEvent();
    expect(first, 'the first narrowing said nothing').not.toBeNull();

    // Narrowed again, without a record being opened or changed in between.
    page.changeSearch('alpha two');
    detect();
    const second = announcements.politeEvent();
    expect(second?.identity, 'the second narrowing was published as the first').not.toBe(
      first?.identity,
    );

    // Clearing the search moves the count the other way, which is equally
    // worth hearing: the list a Commander is looking at grew back.
    page.changeSearch('');
    detect();
    expect(announcements.politeEvent()?.identity).not.toBe(second?.identity);
  });

  it('says nothing more when a reading language arrives behind the count', () => {
    const { page, detect } = render();
    const announcements = TestBed.inject(AnnouncementService);

    page.changeSearch('alpha');
    detect();
    const announced = announcements.politeEvent();
    expect(announced).not.toBeNull();

    // Announcing resolves a message, which reads the catalogue. Read in
    // `untracked`, so a language committed behind an unchanged count does not
    // republish a narrowing the Commander already heard.
    TestBed.inject(LocaleStore).commitCandidate(
      {
        requested: 'de',
        catalogue: germanCatalogue as unknown as MessageCatalogue,
        source: 'asset',
        failure: null,
      },
      'browser',
    );
    detect();

    expect(announcements.politeEvent()).toBe(announced);
  });
});
