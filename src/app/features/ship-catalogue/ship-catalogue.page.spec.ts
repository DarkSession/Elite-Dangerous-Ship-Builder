import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import germanCatalogue from '../../i18n/locales/de.json';
import { CatalogueFacade } from '../../application/catalogue/catalogue.facade';
import { provideLocalization } from '../../i18n/i18n.providers';
import type { MessageCatalogue } from '../../i18n/locale-registry';
import { LocaleStore } from '../../i18n/locale.store';
import { provideMemoryStorage, MemoryStorage } from '../../platform/storage/storage.spec-helpers';
import { AnnouncementService } from '../../ui/announcements/announcement.service';
import { declareMeasurement, declareResizeObserver } from '../../ui/measurement.spec-helpers';
import { ShipCataloguePage } from './ship-catalogue.page';

/**
 * What the manifest says out loud.
 *
 * The count is the one thing on this screen that moves without the Commander
 * looking at it, so it is the one thing announced. What this suite is about is
 * that it is announced *every* time it moves — a filter narrowed twice is two
 * events, and the second one used to be silence (011/FR-009).
 */
describe('ShipCataloguePage announcements', () => {
  let released: (() => void)[] = [];

  beforeEach(async () => {
    released = [declareResizeObserver(), declareMeasurement({ width: 1440 })];

    await TestBed.configureTestingModule({
      imports: [ShipCataloguePage],
      providers: [
        provideLocalization(),
        provideRouter([]),
        ...provideMemoryStorage(new MemoryStorage()),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    for (const release of released) {
      release();
    }
  });

  function render(): { detect: () => void } {
    const fixture = TestBed.createComponent(ShipCataloguePage);
    fixture.detectChanges();
    return { detect: () => fixture.detectChanges() };
  }

  it('says nothing about the count a visit opens on', () => {
    render();

    // Initial content. It is already in reading order above the manifest, and
    // announcing it would start every visit by talking over the reader.
    expect(TestBed.inject(AnnouncementService).polite()).toBe('');
  });

  it('states every narrowing, and the widening after them', () => {
    const { detect } = render();
    const catalogue = TestBed.inject(CatalogueFacade);
    const announcements = TestBed.inject(AnnouncementService);

    // The sizes are chosen so that each step shows fewer hulls than the one
    // before it. Under the policy this change replaced, the count was the
    // number the request carried and a request whose number did not rise was
    // dropped — so a sequence that only rose would pass against the defect and
    // report nothing. The counts are read rather than written down, because
    // the Almanac decides them and a hull added to it must not fail this.
    const shown = () => catalogue.count().shown;

    catalogue.changeSizes(['medium']);
    detect();
    const first = announcements.politeEvent();
    expect(first, 'the first narrowing said nothing').not.toBeNull();
    const afterFirst = shown();

    // Narrowed again, with nothing else on the screen touched. The effect runs
    // on the count, and the count moved, so this is a second event. Two
    // narrowings that land on one count are the case where the words do not
    // move either; `hull-detail.page.spec.ts` and the refusal notices read that
    // one, where two events are spoken in one sentence by construction.
    catalogue.changeSizes(['small']);
    detect();
    const second = announcements.politeEvent();
    const afterSecond = shown();
    expect(afterSecond, 'the second step did not narrow').toBeLessThan(afterFirst);
    expect(second?.identity, 'the second narrowing was published as the first').not.toBe(
      first?.identity,
    );

    // A third, to read that nothing accumulates: the count falls again and is
    // stated again.
    catalogue.changeSizes(['large']);
    detect();
    const third = announcements.politeEvent();
    expect(shown(), 'the third step did not narrow').toBeLessThan(afterSecond);
    expect(third?.identity, 'the third narrowing was published as the second').not.toBe(
      second?.identity,
    );

    // And widening is a move in the other direction, which is equally worth
    // hearing: a Commander who clears a filter is told the list grew back.
    catalogue.changeSizes([]);
    detect();
    expect(shown()).toBeGreaterThan(afterFirst);
    expect(announcements.politeEvent()?.identity).not.toBe(third?.identity);
  });

  it('says nothing more when a locale commits behind the count', () => {
    const { detect } = render();
    const catalogue = TestBed.inject(CatalogueFacade);
    const announcements = TestBed.inject(AnnouncementService);

    catalogue.changeSizes(['large']);
    detect();
    const announced = announcements.politeEvent();
    expect(announced).not.toBeNull();

    // Announcing resolves a message, and a message reads the catalogue. Read
    // in `untracked`, so a reading language arriving behind an unchanged count
    // does not republish a narrowing the Commander already heard.
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
