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

  it('owns exactly one visible top-level heading', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const headings = (fixture.nativeElement as HTMLElement).querySelectorAll('h1');

    expect(headings.length).toBe(1);
    expect(headings[0]?.textContent?.trim()).toBe(BUNDLED_ENGLISH['app.name']);
  });

  it('puts the route heading inside main, not in the banner', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const main = (fixture.nativeElement as HTMLElement).querySelector('main');

    expect(main?.querySelector('h1')).not.toBeNull();
  });

  it('resolves its text through the message facade', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain(BUNDLED_ENGLISH['app.tagline']);
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
