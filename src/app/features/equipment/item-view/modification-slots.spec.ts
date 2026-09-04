import { TestBed } from '@angular/core/testing';
import { LoadoutPresenter } from '../../../application/equipment/loadout.presenter';
import { LoadoutStore } from '../../../application/equipment/loadout.store';
import { provideLocalization } from '../../../i18n/i18n.providers';
import { ModificationSlots } from './modification-slots';

/**
 * Four slots, always four.
 *
 * The states worth pinning are the two that lose information if they are drawn
 * carelessly: a locked slot must be present rather than hidden (FR-008), and a
 * locked slot that holds something must keep naming it (FR-011).
 */

const REGEN = 'suit_increasedshieldregen';

describe('ModificationSlots', () => {
  let store: LoadoutStore;
  let presenter: LoadoutPresenter;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideLocalization()] });
    store = TestBed.inject(LoadoutStore);
    presenter = TestBed.inject(LoadoutPresenter);
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
  });

  function render() {
    const item = presenter.item();
    const fixture = TestBed.createComponent(ModificationSlots);
    fixture.componentRef.setInput('slots', item?.slots ?? []);
    fixture.componentRef.setInput('heading', item?.slotsHeading ?? '');
    fixture.detectChanges();
    return fixture;
  }

  const cells = (element: HTMLElement): HTMLButtonElement[] => [
    ...element.querySelectorAll<HTMLButtonElement>('.slots__slot'),
  ];

  it('draws four slots at every grade, locked ones included (FR-008)', () => {
    store.dispatch({ kind: 'setSuitGrade', grade: 1 });
    const element = render().nativeElement as HTMLElement;

    expect(cells(element).length).toBe(4);
    expect(
      cells(element).filter((cell) => cell.getAttribute('aria-disabled') === 'true').length,
    ).toBeGreaterThan(0);
  });

  it('says what a locked slot needs rather than only dimming it', () => {
    store.dispatch({ kind: 'setSuitGrade', grade: 1 });
    const locked = cells(render().nativeElement as HTMLElement).find(
      (cell) => cell.getAttribute('aria-disabled') === 'true',
    );

    expect(locked?.querySelector('.slots__status')?.textContent?.trim()).not.toBe('');
    expect(locked?.getAttribute('aria-label')).toContain(
      locked?.querySelector('.slots__status')?.textContent?.trim() ?? 'never',
    );
  });

  it('keeps a held modification named when the grade that opened its slot is gone (FR-011)', () => {
    store.dispatch({ kind: 'setSuitGrade', grade: 5 });
    store.dispatch({ kind: 'fitModification', target: 'suit', slot: 3, symbol: REGEN });
    const fitted = cells(render().nativeElement as HTMLElement)[3];
    const named = fitted?.querySelector('.slots__name')?.textContent?.trim();
    expect(named).not.toBe('');

    store.dispatch({ kind: 'setSuitGrade', grade: 2 });
    const held = cells(render().nativeElement as HTMLElement)[3];

    expect(held?.getAttribute('aria-disabled')).toBe('true');
    expect(held?.querySelector('.slots__name')?.textContent?.trim()).toBe(named);
  });

  it('opens an unlocked slot and refuses a locked one', () => {
    store.dispatch({ kind: 'setSuitGrade', grade: 2 });
    const fixture = render();
    const opened: number[] = [];
    fixture.componentInstance.openSlot.subscribe((slot) => opened.push(slot));
    const element = fixture.nativeElement as HTMLElement;

    cells(element)[0]?.click();
    cells(element)[3]?.click();

    expect(opened).toEqual([0]);
  });

  it('states a fitted recipe without inventing a magnitude for it', () => {
    store.dispatch({ kind: 'setSuitGrade', grade: 5 });
    store.dispatch({ kind: 'fitModification', target: 'suit', slot: 0, symbol: REGEN });
    const fitted = cells(render().nativeElement as HTMLElement)[0];

    // A name and a status line. No figure is drawn beside a recipe here: what
    // it changed is the item's own attribute grid restating.
    expect(fitted?.querySelectorAll('.slots__status').length).toBe(1);
    expect(fitted?.textContent).not.toMatch(/[+-]?\d+(\.\d+)?\s*%/);
  });
});
