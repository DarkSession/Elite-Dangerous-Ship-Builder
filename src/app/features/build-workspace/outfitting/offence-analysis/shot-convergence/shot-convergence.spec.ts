import { BuildMetrics } from '@elite-dangerous-almanac/core/ships/build-metrics';
import { TestBed } from '@angular/core/testing';
import { projectConvergence, type Convergence } from '../../../../../domain/offence/convergence';
import {
  everyStateBuild,
  OFFENCE_FIXTURE_HULL,
} from '../../../../../domain/offence/offence.fixtures';
import { provideLocalization } from '../../../../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../../../../i18n/testing/localization-harness';
import { ShotConvergence } from './shot-convergence';

/**
 * The gunsight block, from the outside.
 *
 * The geometry is the projection's own, for the same fixture build the panel
 * around it draws — never a set of offsets written here, which would pass a
 * release that changed what the package publishes.
 */
describe('ShotConvergence', () => {
  function geometryOf(): Extract<Convergence, { kind: 'available' }> {
    const convergence = projectConvergence(
      OFFENCE_FIXTURE_HULL,
      BuildMetrics.of(everyStateBuild()).weaponMetrics().weapons,
    );
    if (convergence.kind !== 'available') {
      throw new Error('expected an available convergence for the fixture hull');
    }
    return convergence;
  }

  function render() {
    const fixture = TestBed.createComponent(ShotConvergence);
    fixture.componentRef.setInput('geometry', geometryOf());
    fixture.detectChanges();
    return {
      element: fixture.nativeElement as HTMLElement,
      component: fixture.componentInstance,
      detect: () => fixture.detectChanges(),
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideLocalization(), ...provideIsolatedLocaleEnvironment()],
    });
  });

  it('places one shot per weapon the hull’s gunsight carries', () => {
    const { component } = render();

    expect(component.shots()).toHaveLength(
      BuildMetrics.of(everyStateBuild()).weaponMetrics().weapons.length,
    );
  });

  it('states every shot in words as well as drawing it', () => {
    const { component, element } = render();

    // The plate itself is decorative; the sentences are the reading.
    expect(element.querySelector('.plate')?.getAttribute('aria-hidden')).toBe('true');
    const stated = [...element.querySelectorAll('.shots__entry')].map((entry) =>
      (entry.textContent ?? '').trim(),
    );
    // Every mark on the plate, and the ring caption with them: it is the one
    // figure the plate draws that the four cells below do not repeat.
    expect(stated).toHaveLength(component.shots().length + 1);
    expect(stated).toContain(component.ringCaption());
    for (const sentence of stated) {
      expect(sentence).not.toBe('');
    }
  });

  it('moves the shots and the spread when the target range moves, and the spans never', () => {
    const { component, detect } = render();
    const spansOf = () =>
      component
        .facts()
        .filter((fact) => fact.id === 'lateral' || fact.id === 'vertical')
        .map((fact) => fact.value);
    const spans = spansOf();
    const near = component.shots().map((shot) => shot.left);
    const spread = component.facts().find((fact) => fact.id === 'spread')?.value;

    component.setTargetRange(2000);
    detect();

    // The mounts are where they are: their separation in metres is a property
    // of the hull, and only what it subtends changes with range.
    expect(spansOf()).toEqual(spans);
    expect(component.facts().find((fact) => fact.id === 'spread')?.value).not.toBe(spread);
    expect(component.shots().map((shot) => shot.left)).not.toEqual(near);
  });

  it('draws each cell as a label and a figure, as the canvas draws all four', () => {
    const { element, component } = render();

    // Two lines per cell and no third. The canvas's `APPARENT SPREAD` cell is a
    // label over `33 mrad` and `wireConvergence` writes only that figure into
    // it, so the range the spread was read at is not repeated here — the range
    // field's own readout, directly above these cells, already says it.
    expect(component.facts()).toHaveLength(4);
    for (const cell of element.querySelectorAll('.fact')) {
      expect(cell.querySelectorAll('span')).toHaveLength(2);
    }
  });

  it('marks each mount with one dot and one hardpoint numeral, and no badge column', () => {
    const { element, component } = render();

    // The 2026-08-25 canvas revision withdrew the badge parked at the plate's
    // edge and the leader line back to it. What is left is the dot where the
    // shot lands and the mount's numeral placed beside it.
    const armed = component.shots().length;
    expect(armed).toBeGreaterThan(0);
    expect(element.querySelectorAll('.plate__dot')).toHaveLength(armed);
    expect(element.querySelectorAll('.plate__numeral')).toHaveLength(armed);
    expect(element.querySelector('.plate__leader')).toBeNull();
    expect(element.querySelector('.plate__shot')).toBeNull();

    // Each numeral is the mount's own hardpoint place, and it sits at one of
    // the four corners the canvas offers, offset from its dot in pixels.
    const numerals = [...element.querySelectorAll<HTMLElement>('.plate__numeral')];
    expect(numerals.map((numeral) => (numeral.textContent ?? '').trim())).toEqual(
      component.shots().map((shot) => shot.badge),
    );
    for (const shot of component.shots()) {
      expect([7, -13]).toContain(shot.numeralLeft);
      expect([-14, 5]).toContain(shot.numeralTop);
    }
  });

  it('holds a shot outside the field of view at the frame, and states where it really goes', () => {
    const { component, detect } = render();

    // A hundred metres puts this hull's widest mounts far outside the plate's
    // forty milliradians.
    component.setTargetRange(component.rangeBounds.min);
    detect();

    // The margin, to the place a percentage of a plate is drawn at.
    const at = (percent: number) => Math.round(percent * 1e6) / 1e6;
    const marks = component.shots();
    for (const shot of marks) {
      // Nothing leaves the plate: the canvas clamps to a 4% margin, so no mark
      // is drawn outside it and none is dropped.
      expect(at(shot.left)).toBeGreaterThanOrEqual(4);
      expect(at(shot.left)).toBeLessThanOrEqual(96);
      expect(at(shot.top)).toBeGreaterThanOrEqual(4);
      expect(at(shot.top)).toBeLessThanOrEqual(96);
      // And every one of them still says what it actually does.
      expect(shot.statement).not.toBe('');
    }
    // The clamp is reached rather than being a bound nothing touches.
    expect(marks.some((shot) => at(shot.left) === 4 || at(shot.left) === 96)).toBe(true);
  });

  it('offers the range as a real control, with its value announced', () => {
    const { element, component } = render();
    const slider = element.querySelector<HTMLInputElement>('input[type="range"]');

    expect(slider).not.toBeNull();
    expect(slider?.min).toBe(String(component.rangeBounds.min));
    expect(slider?.max).toBe(String(component.rangeBounds.max));
    expect(slider?.getAttribute('aria-valuetext')).toBe(component.targetRangeText());
  });

  it('sets the range field’s label and value on the row above its own track', () => {
    const { element } = render();

    // The canvas's 2026-08-25 layout: `TARGET RANGE` and `600 m` share the row
    // above the track, and the track's two ends are printed beneath it. The
    // order in the document is the order it is read in.
    const field = element.querySelector('edsb-range-field');
    const parts = [...(field?.querySelectorAll('.range > *') ?? [])].map((part) =>
      part.className.replace('range__', ''),
    );
    expect(parts).toEqual(['label', 'value', 'track', 'scale']);
  });

  it('pairs every figure under the plate with the word that names it', () => {
    const { element } = render();

    const cells = [...element.querySelectorAll('.fact')];
    expect(cells.length).toBeGreaterThan(0);
    for (const cell of cells) {
      expect((cell.querySelector('.fact__label')?.textContent ?? '').trim()).not.toBe('');
      expect((cell.querySelector('.fact__value')?.textContent ?? '').trim()).not.toBe('');
    }
  });
});
