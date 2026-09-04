import { TestBed } from '@angular/core/testing';
import { LoadoutPresenter } from '../../../application/equipment/loadout.presenter';
import { LoadoutStore } from '../../../application/equipment/loadout.store';
import { provideLocalization } from '../../../i18n/i18n.providers';
import { SuitTools } from './suit-tools';

/** Carriage is a property of the suit: stated, counted, and never a choice. */
describe('SuitTools', () => {
  let presenter: LoadoutPresenter;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideLocalization()] });
    presenter = TestBed.inject(LoadoutPresenter);
    TestBed.inject(LoadoutStore).dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
  });

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(SuitTools);
    fixture.componentRef.setInput('tools', presenter.ledger().tools);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('names every tool the library records for the worn suit', () => {
    const element = render();
    const named = [...element.querySelectorAll('.tools__name')].map((name) =>
      name.textContent?.trim(),
    );

    expect(String(named.length)).toBe(presenter.ledger().toolCount);
    expect(named.every((name) => name !== '')).toBe(true);
  });

  it('offers no control and no tool stat (FR-005a)', () => {
    const element = render();

    expect(element.querySelectorAll('button, a, input').length).toBe(0);
    // A badge and a name. The library publishes battery and timing figures for
    // every tool and neither artboard draws one.
    expect(element.querySelectorAll('.tools__row > *').length).toBe(
      element.querySelectorAll('.tools__row').length * 2,
    );
  });

  it('says a tool cannot be changed rather than only dimming it', () => {
    const rows = [...render().querySelectorAll('.tools__row')];

    expect(rows.every((row) => (row.getAttribute('aria-label') ?? '').includes('cannot'))).toBe(
      true,
    );
  });

  it('keeps the rule and marks its count where there is no suit to ask', () => {
    // Canvas 2a and 2b draw `SUIT TOOLS` with a `—` on an empty bench: what a
    // suit will carry is part of what the ledger is offering to fill in, and a
    // `0` would claim this suit carries nothing rather than that there is no
    // suit yet.
    const fixture = TestBed.createComponent(SuitTools);
    fixture.componentRef.setInput('tools', []);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.tools')).not.toBeNull();
    expect(element.querySelectorAll('.tools__row').length).toBe(0);
    expect(element.querySelector('.tools__count')?.textContent?.trim()).toBe('—');
  });
});
