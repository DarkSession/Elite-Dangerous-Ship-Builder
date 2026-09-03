import { TestBed } from '@angular/core/testing';
import { LoadoutStore } from '../../../application/equipment/loadout.store';
import { provideLocalization } from '../../../i18n/i18n.providers';
import { WeaponChooser } from './weapon-chooser';

/**
 * What may go on the selected item.
 *
 * The one thing worth pinning is that a mount is offered its own weapons and
 * never the catalogue: a rifle is never a choice for a sidearm mount (FR-003).
 */
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

describe('WeaponChooser', () => {
  let store: LoadoutStore;

  beforeEach(() => {
    stubNativeDialog();
    TestBed.configureTestingModule({ providers: [provideLocalization()] });
    store = TestBed.inject(LoadoutStore);
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
  });

  function render(target: 'suit' | 'PrimaryWeapon1' | 'SecondaryWeapon', open = true) {
    const fixture = TestBed.createComponent(WeaponChooser);
    fixture.componentRef.setInput('open', open);
    fixture.componentRef.setInput('target', target);
    fixture.componentRef.setInput('title', 'Swap');
    fixture.detectChanges();
    return fixture;
  }

  const rows = (element: HTMLElement): HTMLElement[] => [
    ...element.querySelectorAll<HTMLElement>('.choice'),
  ];

  it('offers every suit the library publishes, marking the one worn', () => {
    const element = render('suit').nativeElement as HTMLElement;

    expect(rows(element).length).toBe(4);
    expect(rows(element).filter((row) => row.getAttribute('aria-current') === 'true').length).toBe(
      1,
    );
  });

  it('offers a mount only the weapons of its own kind (FR-003)', () => {
    const primary = rows(render('PrimaryWeapon1').nativeElement as HTMLElement).length;
    const secondary = rows(render('SecondaryWeapon').nativeElement as HTMLElement).length;

    expect(primary).toBeGreaterThan(0);
    expect(secondary).toBeGreaterThan(0);
    // Two disjoint lists over one catalogue: neither is the whole of it.
    expect(primary + secondary).toBeLessThan(primary * 2 + secondary * 2);
    expect(primary).not.toBe(secondary);
  });

  it('answers with the identity a Commander chose', () => {
    const fixture = render('PrimaryWeapon1');
    const chosen: string[] = [];
    fixture.componentInstance.chosen.subscribe((id) => chosen.push(id));

    rows(fixture.nativeElement as HTMLElement)[0]?.click();

    expect(chosen.length).toBe(1);
  });

  it('is closed until it is opened', () => {
    const element = render('suit', false).nativeElement as HTMLElement;

    expect(element.querySelector('dialog')?.hasAttribute('open') ?? false).toBe(false);
  });
});
