import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { BuildLinkCoordinator } from '../../application/build-link/build-link.coordinator';
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
    setFragment('');
  });

  /** Writes the address this page is opened at, before anything reads it. */
  function setFragment(value: string): void {
    const view = TestBed.inject(DOCUMENT).defaultView;
    view!.location.hash = value;
  }

  function render() {
    const fixture = TestBed.createComponent(BuildWorkspacePage);
    fixture.detectChanges();
    return fixture;
  }

  it('says there is no build only once it has finished finding out', () => {
    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('ednb-empty-state')).not.toBeNull();
    expect(host.querySelector('ednb-skeleton')).toBeNull();
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
