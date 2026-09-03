import { TestBed } from '@angular/core/testing';
import { LoadoutStore } from '../../../application/equipment/loadout.store';
import { provideLocalization } from '../../../i18n/i18n.providers';
import { BUNDLED_ENGLISH } from '../../../i18n/locale-registry';
import { ModificationChooser } from './modification-chooser';

/** `<dialog>`'s modal methods, which jsdom does not implement. */
function stubNativeDialog(): void {
  const prototype = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
  prototype['showModal'] = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  prototype['close'] = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
}

const REGEN = 'suit_increasedshieldregen';

describe('ModificationChooser', () => {
  let store: LoadoutStore;

  beforeEach(() => {
    stubNativeDialog();
    TestBed.configureTestingModule({ providers: [provideLocalization()] });
    store = TestBed.inject(LoadoutStore);
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    store.dispatch({ kind: 'setSuitGrade', grade: 5 });
  });

  function render(slot = 0) {
    const fixture = TestBed.createComponent(ModificationChooser);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('target', 'suit');
    fixture.componentRef.setInput('slot', slot);
    fixture.detectChanges();
    return fixture;
  }

  const rows = (element: HTMLElement): HTMLButtonElement[] => [
    ...element.querySelectorAll<HTMLButtonElement>('.choice'),
  ];

  it('offers the suit’s own recipes, and names who grants each of them (FR-010)', () => {
    const element = render().nativeElement as HTMLElement;

    expect(rows(element).length).toBeGreaterThan(0);
    expect(
      rows(element).every((row) => (row.querySelector('.choice__meta')?.textContent ?? '') !== ''),
    ).toBe(true);
  });

  it('keeps a recipe another slot holds in the list, marked and refused (FR-009)', () => {
    store.dispatch({ kind: 'fitModification', target: 'suit', slot: 0, symbol: REGEN });
    const fixture = render(1);
    const chosen: string[] = [];
    fixture.componentInstance.chosen.subscribe((symbol) => chosen.push(symbol));
    const element = fixture.nativeElement as HTMLElement;
    const held = rows(element).find((row) => row.dataset['choice'] === REGEN);

    expect(held).toBeDefined();
    expect(held?.getAttribute('aria-disabled')).toBe('true');
    expect(held?.querySelector('.choice__marker')?.textContent?.trim()).toBe(
      BUNDLED_ENGLISH['equipment.chooser.fitted'],
    );

    held?.click();
    expect(chosen).toEqual([]);
  });

  it('marks the recipe this slot already holds as the current choice, not a refusal', () => {
    store.dispatch({ kind: 'fitModification', target: 'suit', slot: 0, symbol: REGEN });
    const element = render(0).nativeElement as HTMLElement;
    const current = rows(element).find((row) => row.dataset['choice'] === REGEN);

    expect(current?.getAttribute('aria-current')).toBe('true');
    expect(current?.getAttribute('aria-disabled')).toBeNull();
  });

  it('offers clearing the slot as a control in the chooser (FR-012)', () => {
    const fixture = render();
    let cleared = 0;
    fixture.componentInstance.cleared.subscribe(() => (cleared += 1));
    const clear = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.chooser__clear',
    );

    expect(clear?.textContent?.trim()).toBe(BUNDLED_ENGLISH['equipment.chooser.clear']);
    clear?.click();
    expect(cleared).toBe(1);
  });

  it('names itself by the slot it was opened for', () => {
    const element = render(2).nativeElement as HTMLElement;

    expect(element.querySelector('.layer__title')?.textContent?.trim()).toContain('3');
  });
});
