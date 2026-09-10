import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import germanCatalogue from '../../i18n/locales/de.json';
import { provideLocalization } from '../../i18n/i18n.providers';
import type { MessageCatalogue } from '../../i18n/locale-registry';
import { LocaleStore } from '../../i18n/locale.store';
import { MemoryStorage, provideMemoryStorage } from '../../platform/storage/storage.spec-helpers';
import { AnnouncementService } from '../../ui/announcements/announcement.service';
import { HullDetailPage } from './hull-detail.page';

/**
 * What the hull sheet says out loud.
 *
 * One thing: that the address a Commander followed answers to no hull. It is a
 * blocking condition, so it is assertive — and a Commander who mistypes a hull
 * twice is told twice, in words identical both times, which is exactly the case
 * 011/FR-009 exists to keep out of silence.
 */
describe('HullDetailPage announcements', () => {
  function render(hull: string): ComponentFixture<HullDetailPage> {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HullDetailPage],
      providers: [
        provideLocalization(),
        // A route to land on. The sheet replaces the address with the hull's
        // canonical spelling, and a router with nothing to match rejects that
        // navigation rather than the test noticing.
        provideRouter([{ path: '**', children: [] }]),
        ...provideMemoryStorage(new MemoryStorage()),
      ],
    });

    const fixture = TestBed.createComponent(HullDetailPage);
    fixture.componentRef.setInput('hull', hull);
    fixture.detectChanges();
    return fixture;
  }

  it('says nothing about a hull the package publishes', () => {
    render('anaconda');

    // A populated sheet is discoverable in reading order. Announcing it would
    // start every visit by talking over the reader.
    expect(TestBed.inject(AnnouncementService).assertive()).toBe('');
  });

  it('states a second unresolvable address as a second event', () => {
    const fixture = render('no-such-hull');
    const announcements = TestBed.inject(AnnouncementService);

    const first = announcements.assertiveEvent();
    expect(first, 'the first unresolvable address said nothing').not.toBeNull();

    // Another address, and the same sentence: the message names no hull,
    // because there is none to name. The address is the event, not the words.
    fixture.componentRef.setInput('hull', 'nor-this-one');
    fixture.detectChanges();

    const second = announcements.assertiveEvent();
    expect(second?.text).toBe(first?.text);
    expect(second?.identity, 'the second address was published as the first').not.toBe(
      first?.identity,
    );
  });

  it('says nothing more when a reading language arrives behind the address', () => {
    const fixture = render('no-such-hull');
    const announcements = TestBed.inject(AnnouncementService);
    const announced = announcements.assertiveEvent();
    expect(announced).not.toBeNull();

    // Announcing resolves a message, which reads the catalogue. Read in
    // `untracked`, so a language committed behind an unchanged address does not
    // state again an address the Commander has already left.
    TestBed.inject(LocaleStore).commitCandidate(
      {
        requested: 'de',
        catalogue: germanCatalogue as unknown as MessageCatalogue,
        source: 'asset',
        failure: null,
      },
      'browser',
    );
    fixture.detectChanges();

    expect(announcements.assertiveEvent()).toBe(announced);
  });
});
