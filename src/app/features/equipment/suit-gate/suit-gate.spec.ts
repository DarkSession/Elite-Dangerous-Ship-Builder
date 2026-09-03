import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoadoutPresenter } from '../../../application/equipment/loadout.presenter';
import { provideLocalization } from '../../../i18n/i18n.providers';
import { BUNDLED_ENGLISH } from '../../../i18n/locale-registry';
import { SuitGate } from './suit-gate';

/**
 * The gate on an empty bench.
 *
 * What is worth pinning is the line between the one live choice and everything
 * drawn around it: the previews are drawn, and they are not controls. A ladder
 * in the focus order that answers nothing is exactly what canvas 2a's dimming
 * would hide from a reader who cannot see it.
 */
describe('SuitGate', () => {
  let presenter: LoadoutPresenter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideLocalization(), provideRouter([])],
    });
    presenter = TestBed.inject(LoadoutPresenter);
  });

  function render(compact = false) {
    const fixture = TestBed.createComponent(SuitGate);
    fixture.componentRef.setInput('compact', compact);
    fixture.detectChanges();
    return fixture;
  }

  it('offers every suit the package publishes, as one live choice each', () => {
    const element = render().nativeElement as HTMLElement;
    const offered = [...element.querySelectorAll<HTMLButtonElement>('.choice')];

    expect(offered.length).toBe(presenter.suitChoices().length);
    expect(offered.every((choice) => choice.getAttribute('aria-disabled') === null)).toBe(true);
  });

  it('answers with the suit family a Commander chose', () => {
    const fixture = render();
    const chosen: string[] = [];
    fixture.componentInstance.chosen.subscribe((family: string) => chosen.push(family));

    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.choice')?.click();

    expect(chosen).toEqual([presenter.suitChoices()[0]?.family]);
  });

  it('keeps the previewed ladder and slots out of the focus order and the a11y tree', () => {
    const element = render().nativeElement as HTMLElement;

    for (const preview of ['.gate__grades', '.gate__slots']) {
      const drawn = element.querySelector(preview);
      expect(drawn?.getAttribute('aria-hidden')).toBe('true');
      expect(drawn?.hasAttribute('inert')).toBe(true);
    }
    // The ladder previews what the package publishes, not a drawn cell count.
    expect(element.querySelectorAll('.grade').length).toBe(presenter.gradeLadder().length);
    expect(element.querySelectorAll('.gate__slot').length).toBe(4);
  });

  it('draws the chooser alone where the column is narrow (canvas 2b)', () => {
    const element = render(true).nativeElement as HTMLElement;

    expect(element.querySelector('.gate__grades')).toBeNull();
    expect(element.querySelector('.gate__slots')).toBeNull();
    expect(element.querySelectorAll('.choice').length).toBeGreaterThan(0);
  });

  it('offers the saved builds this bench can open, and no import it cannot', () => {
    // The canvas draws two ways past the gate. Importing a journal event is not
    // a capability the bench has (013 design/reference-review.md).
    const element = render().nativeElement as HTMLElement;
    const links = [...element.querySelectorAll('a')];

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      BUNDLED_ENGLISH['equipment.gate.saved'],
    ]);
    expect(links[0]?.getAttribute('href')).toBe('/builds');
  });
});
