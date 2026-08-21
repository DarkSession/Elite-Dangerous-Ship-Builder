import { TestBed } from '@angular/core/testing';
import { DocumentAdapter } from './document.adapter';

describe('DocumentAdapter', () => {
  let adapter: DocumentAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    adapter = TestBed.inject(DocumentAdapter);
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    document.title = 'initial';
  });

  it('publishes language, direction and title in one commit', () => {
    adapter.commitRootState('de', 'ltr', 'Schiffsbaukasten');

    expect(adapter.language).toBe('de');
    expect(adapter.direction).toBe('ltr');
    expect(adapter.title).toBe('Schiffsbaukasten');
  });

  it('publishes a right-to-left direction with its language', () => {
    adapter.commitRootState('ar', 'rtl', 'title');

    expect(adapter.language).toBe('ar');
    expect(adapter.direction).toBe('rtl');
  });

  it('leaves the existing title in place when the caller has none', () => {
    adapter.commitRootState('de', 'ltr', null);

    expect(adapter.language).toBe('de');
    expect(adapter.title).toBe('initial');
  });

  it('never writes a blank title', () => {
    adapter.commitRootState('de', 'ltr', '');

    expect(adapter.title).toBe('initial');
  });
});
