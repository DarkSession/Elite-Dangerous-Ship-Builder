import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { BuildLinkCoordinator } from '../../application/build-link/build-link.coordinator';
import { RecordOpenService } from '../../application/build-library/record-open.service';
import { TabOwnershipCoordinator } from '../../application/build-library/tab-ownership.coordinator';
import { provideLocalization } from '../../i18n/i18n.providers';
import { MemoryStorage, provideMemoryStorage } from '../../platform/storage/storage.spec-helpers';
import { BuildWorkspacePage } from './build-workspace.page';

/**
 * The one moment the workspace cannot yet tell whether it has a build.
 *
 * A page opened at an address carrying a link fragment has to decode it before
 * it knows. Saying there is no build in the meantime states a condition that is
 * false (011/FR-029).
 */
describe('BuildWorkspacePage, reading an incoming link', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildWorkspacePage],
      providers: [
        provideLocalization(),
        provideRouter(routes),
        ...provideMemoryStorage(new MemoryStorage()),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    clearFragment();
  });

  /** Writes the address this page is opened at, before anything reads it. */
  function setFragment(value: string): void {
    const view = TestBed.inject(DOCUMENT).defaultView;
    view!.location.hash = value;
  }

  /**
   * Takes the fragment off the address entirely.
   *
   * The document outlives one test, and a page opened at no fragment is a state
   * this file has to state rather than inherit: a fragment left on the address
   * by anything before it would make this page read a link it was never given.
   */
  function clearFragment(): void {
    const view = TestBed.inject(DOCUMENT).defaultView!;
    view.history.replaceState(null, '', view.location.pathname + view.location.search);
  }

  /** Lets the restore, the ingest and the decode behind it all finish. */
  function settle(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  function render() {
    const fixture = TestBed.createComponent(BuildWorkspacePage);
    fixture.detectChanges();
    return fixture;
  }

  it('says there is no build only once it has finished finding out', () => {
    clearFragment();

    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('ednb-empty-state')).not.toBeNull();
    expect(host.querySelector('ednb-skeleton')).toBeNull();
  });

  it('says there is no build once the link turns out not to be one', async () => {
    setFragment('#b.broken');
    // A link that cannot be decoded is the path the wait has to leave. A wait
    // this one latched would hold the skeleton over an empty workspace for the
    // rest of the session, which is the state FR-029 forbids most of all.
    TestBed.inject(BuildLinkCoordinator).decode = () => Promise.reject(new Error('refused'));

    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('ednb-skeleton')).not.toBeNull();

    await settle();
    fixture.detectChanges();

    expect(host.querySelector('ednb-skeleton')).toBeNull();
    expect(host.querySelector('ednb-empty-state')).not.toBeNull();
  });

  it('reads the link even when this tab’s own record cannot be opened', async () => {
    // The restore and the read are one chain, and the read is what ends the
    // wait. A restore that failed and took the read with it would leave the
    // skeleton over an empty workspace for the rest of the session.
    setFragment('#b.broken');
    TestBed.inject(TabOwnershipCoordinator).claim = () => 'a-held-record';
    TestBed.inject(RecordOpenService).open = () => Promise.reject(new Error('storage unavailable'));
    TestBed.inject(BuildLinkCoordinator).decode = () => Promise.reject(new Error('refused'));

    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;

    await settle();
    fixture.detectChanges();

    expect(host.querySelector('ednb-skeleton')).toBeNull();
    expect(host.querySelector('ednb-empty-state')).not.toBeNull();
  });

  it('holds the build’s place while a link is being read', () => {
    setFragment('#b.pending');
    // Held open for the whole test. The decode is the wait this draws, and one
    // that resolved would end the wait before the screen could be read.
    TestBed.inject(BuildLinkCoordinator).decode = () => new Promise(() => {});

    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('ednb-skeleton')).not.toBeNull();
    expect(host.querySelector('ednb-empty-state')).toBeNull();
  });
});
