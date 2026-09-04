import { TestBed } from '@angular/core/testing';
import { LoadoutPresenter } from '../../../application/equipment/loadout.presenter';
import { LoadoutStore } from '../../../application/equipment/loadout.store';
import { provideLocalization } from '../../../i18n/i18n.providers';
import { LoadoutLedger } from './loadout-ledger';

/**
 * The leading column of artboard `1a`.
 *
 * Driven by the real presenter over the real store, because what is worth
 * checking is not that a row renders — it is that the ledger states the
 * catalogue's mounts and not the worn suit's, which is the whole of FR-007.
 */

const RIFLE = 'wpn_m_assaultrifle_plasma_fauto';

describe('LoadoutLedger', () => {
  let store: LoadoutStore;
  let presenter: LoadoutPresenter;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideLocalization()] });
    store = TestBed.inject(LoadoutStore);
    presenter = TestBed.inject(LoadoutPresenter);
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
  });

  function render() {
    const fixture = TestBed.createComponent(LoadoutLedger);
    fixture.componentRef.setInput('ledger', presenter.ledger());
    fixture.componentRef.setInput('selected', store.selected());
    fixture.detectChanges();
    return fixture;
  }

  const rows = (element: HTMLElement): HTMLButtonElement[] => [
    ...element.querySelectorAll<HTMLButtonElement>('.ledger__row'),
  ];

  it('draws the suit, every catalogue mount and the suit’s tools', () => {
    const element = render().nativeElement as HTMLElement;

    // One suit row and one row per catalogue mount — the Dominator carries all
    // three, so nothing is held here.
    expect(rows(element).map((row) => row.dataset['target'])).toEqual([
      'suit',
      'PrimaryWeapon1',
      'PrimaryWeapon2',
      'SecondaryWeapon',
    ]);
    expect(element.querySelectorAll('.tools__row').length).toBeGreaterThan(0);
  });

  it('marks the open item as the current one', () => {
    store.select('PrimaryWeapon1');
    const element = render().nativeElement as HTMLElement;

    expect(
      rows(element)
        .filter((row) => row.getAttribute('aria-current') === 'true')
        .map((row) => row.dataset['target']),
    ).toEqual(['PrimaryWeapon1']);
  });

  it('draws no row for a mount the worn suit does not carry (FR-007)', () => {
    store.dispatch({ kind: 'fitWeapon', mount: 'PrimaryWeapon2', symbol: RIFLE });
    // The Maverick carries one primary. The weapon on the second is not lost —
    // the loadout keeps it — but the ledger lists the suit's mounts, not the
    // catalogue's (Commander request 2026-09-04).
    store.dispatch({ kind: 'selectSuit', suitFamily: 'utilitysuit' });

    const element = render().nativeElement as HTMLElement;

    expect(rows(element).some((row) => row.dataset['target'] === 'PrimaryWeapon2')).toBe(false);
    expect(rows(element).some((row) => row.dataset['target'] === 'PrimaryWeapon1')).toBe(true);
    expect(rows(element).some((row) => row.dataset['target'] === 'SecondaryWeapon')).toBe(true);
  });

  it('opens the row a Commander presses', () => {
    store.dispatch({ kind: 'fitWeapon', mount: 'PrimaryWeapon2', symbol: RIFLE });
    store.dispatch({ kind: 'selectSuit', suitFamily: 'utilitysuit' });

    const fixture = render();
    const opened: string[] = [];
    fixture.componentInstance.opened.subscribe((target) => opened.push(target));
    const element = fixture.nativeElement as HTMLElement;

    // There is no row for the mount the suit does not carry, so there is nothing
    // here to refuse: the ledger offers only what can be opened.
    rows(element)
      .find((row) => row.dataset['target'] === 'SecondaryWeapon')
      ?.click();

    expect(opened).toEqual(['SecondaryWeapon']);
  });
});
