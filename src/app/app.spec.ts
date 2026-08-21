import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideLocalization } from './i18n/i18n.providers';
import { BUNDLED_ENGLISH } from './i18n/locale-registry';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideLocalization()],
    }).compileComponents();
  });

  it('creates the application root', () => {
    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders inside the shared application frame', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('edsb-app-frame')).not.toBeNull();
    expect(element.querySelector('header')).not.toBeNull();
    expect(element.querySelector('main')).not.toBeNull();
  });

  it('synthesizes no heading of its own, leaving the h1 to the route', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    // A shell-owned h1 would name every screen the same thing, so the shell
    // owns none: the route inside `main` supplies it.
    expect(element.querySelectorAll('h1').length).toBe(0);
    expect(element.querySelector('header')?.querySelector('h1') ?? null).toBeNull();
  });

  it('offers the same primary navigation from every screen', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const links = [...(fixture.nativeElement as HTMLElement).querySelectorAll('nav a')].map(
      (link) => link.textContent?.trim(),
    );

    // The reference's command bar offers the shipyard and the library, and
    // never a chip for the build screen (canvas 1a/1b/1c).
    expect(links).toEqual([
      BUNDLED_ENGLISH['navigation.catalogue'],
      BUNDLED_ENGLISH['navigation.library'],
    ]);
  });

  it('resolves its text through the message facade', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain(BUNDLED_ENGLISH['navigation.library']);
    expect(text).not.toMatch(/\{\{/);
  });

  it('mounts exactly one assertive and one polite announcement outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('[data-announcement-outlet="assertive"]').length).toBe(1);
    expect(element.querySelectorAll('[data-announcement-outlet="polite"]').length).toBe(1);
    expect(element.querySelectorAll('[aria-live]').length).toBe(2);
  });
});
