import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLocalization } from '../../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../../i18n/testing/localization-harness';
import { DocumentAdapter } from '../../../platform/browser/document.adapter';
import { SlefStore } from '../../../application/slef/slef.store';
import { ImportDialog } from './import.dialog';
import { stubNativeDialog } from '../../../ui/components/layer/layer.spec-helpers';

class SilentDocumentAdapter {
  commitRootState(): void {}
}

describe('the import layer’s host', () => {
  let store: SlefStore;

  function render() {
    const fixture = TestBed.createComponent(ImportDialog);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    stubNativeDialog();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'outfitting', children: [] }]),
        provideLocalization(),
        ...provideIsolatedLocaleEnvironment(),
        { provide: DocumentAdapter, useValue: new SilentDocumentAdapter() },
      ],
    });
    store = TestBed.inject(SlefStore);
  });

  it('is mounted and closed until the layer is asked for', () => {
    const fixture = render();

    expect(fixture.componentInstance.open()).toBe(false);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('dialog')?.hasAttribute('open'),
    ).toBe(false);
  });

  it('opens for the import layer, and not for the export one', () => {
    const fixture = render();

    store.openLayer('export');
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);

    store.openLayer('import');
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(true);
  });

  it('shows the presenter’s own words rather than any of its own', () => {
    const fixture = render();
    store.openLayer('import');
    fixture.detectChanges();

    expect(fixture.componentInstance.view().title).toBe('Import build');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Import build');
  });

  it('submits through the presenter, without waiting on the answer', () => {
    const fixture = render();
    store.openLayer('import');
    store.setDraft('{ not json');
    fixture.detectChanges();

    expect(() => fixture.componentInstance.submit()).not.toThrow();
  });
});
