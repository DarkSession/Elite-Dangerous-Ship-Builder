import { TestBed } from '@angular/core/testing';
import { LoadoutSharePresenter } from '../../../application/equipment/loadout-share.presenter';
import { LoadoutStore } from '../../../application/equipment/loadout.store';
import { provideLocalization } from '../../../i18n/i18n.providers';
import { BUNDLED_ENGLISH } from '../../../i18n/locale-registry';
import { ExportLoadoutDialog } from './export-loadout.dialog';

/**
 * The export layer, as canvas 1a draws it.
 *
 * What is worth pinning is the boundary rather than the arrangement: the field
 * carries identities and nothing the package could answer, and the value is
 * always there to select whether or not the clipboard worked.
 */
describe('ExportLoadoutDialog', () => {
  let store: LoadoutStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideLocalization()] });
    store = TestBed.inject(LoadoutStore);
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    // jsdom has no modal dialog, and the layer opens one.
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      this.open = false;
    };
  });

  function render() {
    const fixture = TestBed.createComponent(ExportLoadoutDialog);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    return fixture;
  }

  it('offers the canvas’s three formats, in its own order', () => {
    const element = render().nativeElement as HTMLElement;
    const labels = [...element.querySelectorAll('.choice-group__label, .choice__label')].map(
      (label) => label.textContent?.trim(),
    );

    expect(labels).toEqual([
      BUNDLED_ENGLISH['equipment.export.mode.json'],
      BUNDLED_ENGLISH['equipment.export.mode.link'],
      BUNDLED_ENGLISH['equipment.export.mode.text'],
    ]);
  });

  it('writes the loadout as identities, and nothing the package can answer', () => {
    const element = render().nativeElement as HTMLElement;
    const field = element.querySelector('textarea');

    expect(field?.readOnly).toBe(true);
    const payload = JSON.parse(field?.value ?? '{}') as Record<string, unknown>;
    expect(payload['format']).toBe('edsb.loadout');
    expect(payload['suitFamily']).toBe('tacticalsuit');
    expect(Object.keys(payload)).not.toContain('shieldStrength');
  });

  it('states the loadout in words where the summary is chosen', () => {
    const share = TestBed.inject(LoadoutSharePresenter);
    const fixture = render();

    share.selectFormat('text');
    fixture.detectChanges();

    const field = (fixture.nativeElement as HTMLElement).querySelector('textarea');
    expect(field?.value).toContain('Dominator Suit');
    expect(field?.value).not.toContain('tacticalsuit');
  });
});
