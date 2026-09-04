import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DocumentAdapter } from '../../platform/browser/document.adapter';
import { provideLocalization } from '../../i18n/i18n.providers';
import { HullDetailUnknownHull } from './hull-detail-unknown-hull';

class SilentDocumentAdapter {
  commitRootState(): void {}
}

function render(address: string): HTMLElement {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [HullDetailUnknownHull],
    providers: [
      provideLocalization(),
      provideRouter([]),
      { provide: DocumentAdapter, useValue: new SilentDocumentAdapter() },
    ],
  });
  const fixture = TestBed.createComponent(HullDetailUnknownHull);
  fixture.componentRef.setInput('hull', address);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('an address no hull answers to', () => {
  it('names the problem and echoes what was actually asked for', () => {
    const element = render('Nonexistent_Hull');
    const text = (element.textContent ?? '').replace(/\s+/g, ' ');

    expect(text).toContain('No such hull');
    expect(text).toContain('Nonexistent_Hull');
  });

  it('states plainly that nothing was created or changed', () => {
    const text = render('Nonexistent_Hull').textContent ?? '';

    expect(text).toContain('Nothing has been created or changed');
  });

  it('offers no creation action and guesses no hull', () => {
    const element = render('Anacnda');

    expect(element.querySelectorAll('button')).toHaveLength(0);
    expect(element.textContent).not.toContain('Anaconda');
  });

  it('shows no fact at all', () => {
    const element = render('Nonexistent_Hull');

    expect(element.querySelectorAll('dl')).toHaveLength(0);
    expect(element.querySelectorAll('ednb-fact-list')).toHaveLength(0);
  });

  it('offers the way back to the catalogue', () => {
    const element = render('Nonexistent_Hull');
    const link = element.querySelector('a');

    expect(link?.textContent?.trim()).toBe('Back to Ship Builder');
    expect(link?.getAttribute('href')).toContain('/ships');
  });

  it('reports the failure as an error rather than as ordinary content', () => {
    const element = render('Nonexistent_Hull');

    expect(element.querySelector('[role="alert"]')).not.toBeNull();
  });
});
