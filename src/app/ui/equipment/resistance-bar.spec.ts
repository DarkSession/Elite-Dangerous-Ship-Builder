import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ResistanceBar } from './resistance-bar';

@Component({
  imports: [ResistanceBar],
  template: `<ednb-resistance-bar
    [label]="label()"
    [value]="value()"
    [magnitude]="magnitude()"
    [negative]="negative()"
  />`,
})
class Host {
  readonly label = signal('Kinetic');
  readonly value = signal('+25%');
  readonly magnitude = signal(0.25);
  readonly negative = signal(false);
}

describe('ResistanceBar', () => {
  const render = () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
  });

  it('states the resistance as text beside the bar', () => {
    const element = render().nativeElement as HTMLElement;

    expect(element.querySelector('.resistance__label')?.textContent?.trim()).toBe('Kinetic');
    expect(element.querySelector('.resistance__value')?.textContent?.trim()).toBe('+25%');
  });

  it('hides the bar from the accessibility tree', () => {
    // The figure beside it carries the sign and the magnitude. Announced, the
    // bar would be one resistance stated twice (constitution V).
    const element = render().nativeElement as HTMLElement;

    expect(element.querySelector('.resistance__track')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws the bar at half the magnitude, because it fills from the midline', () => {
    // The fill starts at the centre of the track and has half of it to run in,
    // so a resistance at full magnitude reaches one end (013
    // design/equipment-bench.md).
    const fixture = render();
    const fill = (): HTMLElement =>
      (fixture.nativeElement as HTMLElement).querySelector('.resistance__fill')!;

    expect(fill().style.inlineSize).toBe('12.5%');

    fixture.componentInstance.magnitude.set(1.4);
    fixture.detectChanges();
    expect(fill().style.inlineSize).toBe('50%');

    fixture.componentInstance.magnitude.set(-0.2);
    fixture.detectChanges();
    expect(fill().style.inlineSize).toBe('0%');
  });

  it('marks a resistance that increases damage taken, in text as well as colour', () => {
    const fixture = render();
    fixture.componentInstance.negative.set(true);
    fixture.componentInstance.value.set('-50%');
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.resistance__value--negative')).not.toBeNull();
    expect(element.querySelector('.resistance__fill--negative')).not.toBeNull();
    // Nothing is carried by colour alone: the sign is in the figure.
    expect(element.querySelector('.resistance__value')?.textContent?.trim()).toBe('-50%');
  });
});
