import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HELP_MANIFEST } from '../../platform/build/help-manifest.generated';
import { provideLocalization } from '../../i18n/i18n.providers';
import { StartPage } from './start.page';

describe('StartPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideLocalization(), provideRouter([])],
    });
  });

  const render = (): HTMLElement => {
    const fixture = TestBed.createComponent(StartPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it("draws the masthead below the bar's heading rather than a second h1", () => {
    // The shell's bar owns the page's h1 and names the screen — here the
    // product itself. A page that drew its own would be two h1s saying two
    // different things.
    const root = render();

    expect(root.querySelectorAll('h1').length).toBe(0);
    expect(root.querySelector('h2')?.textContent?.trim()).toBe('Tools for Commanders');
    expect(root.querySelector('.start__tagline')?.textContent?.trim()).toBe(
      'A growing set of tools for the galaxy.',
    );
  });

  it('offers one card per tool, and marks none of them as the one being read', () => {
    // No tool is open at the entry point, so nothing here may say one is
    // (FR-010).
    const root = render();
    const links = root.querySelectorAll('ednb-tool-card a');

    expect([...links].map((link) => link.getAttribute('href'))).toEqual(['/ships', '/equipment']);
    expect(root.querySelectorAll('[aria-current]').length).toBe(0);
  });

  it('reproduces the licence notice exactly, in the language it was written in', () => {
    // The manifest's text, hashed against root `LICENSE`. Not restated here and
    // not translated: rewording a notice is this application editing something
    // it only carries.
    const excerpt = render().querySelector('.start__legal blockquote');

    expect(excerpt?.textContent).toBe(HELP_MANIFEST.disclaimer.exactText);
    expect(excerpt?.getAttribute('lang')).toBe(HELP_MANIFEST.disclaimer.language);
  });

  it('draws nothing the design does not', () => {
    // The standing rule, held by a test rather than by review: the canvas draws
    // a masthead, a tool selector and an attribution band. A search field, a
    // recent-builds strip or a version line would each be a control this screen
    // invented.
    const root = render();

    expect(root.querySelectorAll('input, button, select, textarea').length).toBe(0);
    expect(root.querySelectorAll('a').length).toBe(2);
  });
});
