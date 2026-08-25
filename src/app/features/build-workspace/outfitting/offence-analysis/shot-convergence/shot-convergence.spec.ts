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
      everyStateBuild().weaponMetrics().weapons,
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

    expect(component.shots()).toHaveLength(everyStateBuild().weaponMetrics().weapons.length);
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

  it('offers the range as a real control, with its value announced', () => {
    const { element, component } = render();
    const slider = element.querySelector<HTMLInputElement>('input[type="range"]');

    expect(slider).not.toBeNull();
    expect(slider?.min).toBe(String(component.rangeBounds.min));
    expect(slider?.max).toBe(String(component.rangeBounds.max));
    expect(slider?.getAttribute('aria-valuetext')).toBe(component.targetRangeText());
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
