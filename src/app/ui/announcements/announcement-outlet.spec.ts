import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideLocalization } from '../../i18n/i18n.providers';
import { BUNDLED_ENGLISH } from '../../i18n/locale-registry';
import { DocumentAdapter } from '../../platform/browser/document.adapter';
import { AnnouncementOutlet } from './announcement-outlet';
import { AnnouncementService } from './announcement.service';

class SilentDocumentAdapter {
  commitRootState(): void {}
}

/**
 * The two live regions, read as nodes rather than as text.
 *
 * A live region announces a change to what it contains. Whether a reader hears
 * a second event therefore depends on the region's contents changing, not on
 * the service having decided to publish — so what is read here is the node, and
 * the case that matters is the one where the words do not move.
 */
describe('AnnouncementOutlet', () => {
  function render(): {
    fixture: ComponentFixture<AnnouncementOutlet>;
    announcements: AnnouncementService;
  } {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideLocalization(),
        { provide: DocumentAdapter, useValue: new SilentDocumentAdapter() },
      ],
    });
    const fixture = TestBed.createComponent(AnnouncementOutlet);
    fixture.detectChanges();
    return { fixture, announcements: TestBed.inject(AnnouncementService) };
  }

  const region = (fixture: ComponentFixture<AnnouncementOutlet>, urgency: string): HTMLElement => {
    const found = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      `[data-announcement-outlet="${urgency}"]`,
    );
    if (found === null) {
      throw new Error(`There is no ${urgency} outlet to read.`);
    }
    return found;
  };

  /**
   * What the region holds, as the node holding it.
   *
   * Text nodes only. The framework leaves its own anchors in there as comments,
   * which a reader is never told about and which stay put across a change.
   */
  const nodeIn = (region: HTMLElement): ChildNode | null =>
    [...region.childNodes].find(
      (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '',
    ) ?? null;

  const failure = (revision: number) => ({
    kind: 'navigation.failed',
    revision,
    urgency: 'polite' as const,
    messageKey: 'navigation.failed.notice' as const,
  });

  it('holds nothing before anything has happened', () => {
    const { fixture } = render();

    expect(region(fixture, 'polite').textContent?.trim()).toBe('');
    expect(region(fixture, 'assertive').textContent?.trim()).toBe('');
  });

  it('replaces what it holds for a second event spoken in the same words', () => {
    const { fixture, announcements } = render();

    announcements.announce(failure(1));
    fixture.detectChanges();
    const polite = region(fixture, 'polite');
    const first = nodeIn(polite);
    expect(first, 'the first failure put nothing in the region').not.toBeNull();
    expect(first?.textContent?.trim()).toBe(BUNDLED_ENGLISH['navigation.failed.notice']);

    // A second navigation that failed. It is a different event, and it says the
    // same sentence — which is the whole difficulty: text written over itself
    // is not a change, and a region that did not change is a region a reader is
    // not told about again. So the node itself has to be a new one.
    announcements.announce(failure(2));
    fixture.detectChanges();
    const second = nodeIn(polite);

    expect(second, 'the second failure emptied the region').not.toBeNull();
    expect(second?.textContent?.trim()).toBe(BUNDLED_ENGLISH['navigation.failed.notice']);
    expect(second, 'the region held the same node, so nothing changed to announce').not.toBe(first);
  });

  it('keeps the node it holds when the same event is published again', () => {
    const { fixture, announcements } = render();

    announcements.announce(failure(1));
    fixture.detectChanges();
    const first = nodeIn(region(fixture, 'polite'));

    // The same event, not a second one. Nothing happened, so nothing may look
    // to a reader as though it did.
    announcements.announce(failure(1));
    fixture.detectChanges();

    expect(nodeIn(region(fixture, 'polite'))).toBe(first);
  });

  it('empties the region on a locale switch rather than leaving the old words', () => {
    const { fixture, announcements } = render();

    announcements.announce(failure(1));
    fixture.detectChanges();
    announcements.clearOutlets();
    fixture.detectChanges();

    expect(nodeIn(region(fixture, 'polite'))).toBeNull();
    expect(region(fixture, 'polite').textContent?.trim()).toBe('');
  });
});
