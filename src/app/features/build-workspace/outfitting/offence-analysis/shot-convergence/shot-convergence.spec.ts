import { BuildMetrics } from '@elite-dangerous-almanac/core/ships/build-metrics';
import { TestBed } from '@angular/core/testing';
import { projectConvergence, type Convergence } from '../../../../../domain/offence/convergence';
import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import {
  everyStateBuild,
  noWeaponsBuild,
  OFFENCE_DEFAULT_SLOTS,
  OFFENCE_FIXTURE_HULL,
  populatedBuild,
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
  function geometryOf(
    loadout: ShipLoadout = everyStateBuild(),
  ): Extract<Convergence, { kind: 'available' }> {
    const convergence = projectConvergence(
      OFFENCE_FIXTURE_HULL,
      BuildMetrics.of(loadout).weaponMetrics().weapons,
    );
    if (convergence.kind !== 'available') {
      throw new Error('expected an available convergence for the fixture hull');
    }
    return convergence;
  }

  function render(options: { build?: ShipLoadout; selectedSlot?: string } = {}) {
    const fixture = TestBed.createComponent(ShotConvergence);
    fixture.componentRef.setInput('geometry', geometryOf(options.build));
    if (options.selectedSlot !== undefined) {
      fixture.componentRef.setInput('selectedSlot', options.selectedSlot);
    }
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

  it('places one mark per hardpoint the hull’s gunsight carries', () => {
    const { component } = render();

    expect(component.shots()).toHaveLength(geometryOf().mounts.length);
    expect(component.shots().every((shot) => shot.armed)).toBe(true);
  });

  it('draws the hardpoints nothing is fitted to, and names them as empty', () => {
    // The stock build arms two of this hull's eight mounts, so the plate has to
    // carry both kinds at once. Where a mount sits is a property of the hull,
    // and a Commander choosing what to fit is asking where its shot would go.
    const { component, element } = render({ build: populatedBuild() });

    const shots = component.shots();
    expect(shots).toHaveLength(geometryOf(populatedBuild()).mounts.length);
    const empty = shots.filter((shot) => !shot.armed);
    expect(empty).toHaveLength(shots.length - OFFENCE_DEFAULT_SLOTS.length);
    expect(element.querySelectorAll('.plate__dot--empty')).toHaveLength(empty.length);

    // The ink is never the only thing that says so: each empty mount's own
    // sentence is in the list beside the plate, and it is not the sentence an
    // armed one gets (011 FR-022).
    const stated = [...element.querySelectorAll('.shots__entry')].map((entry) =>
      (entry.textContent ?? '').trim(),
    );
    for (const shot of empty) {
      expect(stated).toContain(shot.statement);
      expect(shot.statement).not.toBe(shots.find((other) => other.armed)?.statement);
    }
  });

  it('still draws every mount for a hull the build has armed nothing on', () => {
    const { component, element } = render({ build: noWeaponsBuild() });

    const shots = component.shots();
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every((shot) => !shot.armed)).toBe(true);
    expect(element.querySelectorAll('.plate__dot--empty')).toHaveLength(shots.length);
    // No armed group, so none of the four cells that measure one is drawn.
    expect(component.facts()).toEqual([]);
  });

  it('marks the mount the workspace has selected, and states it in words', () => {
    const selectedSlot = OFFENCE_DEFAULT_SLOTS[0];
    const { component, element } = render({ selectedSlot });

    const selected = component.shots().filter((shot) => shot.selected);
    expect(selected).toHaveLength(1);
    expect(selected[0]?.id).toBe(selectedSlot);
    expect(element.querySelectorAll('.plate__dot--selected')).toHaveLength(1);
    expect(element.querySelectorAll('.plate__numeral--selected')).toHaveLength(1);

    // Selection is a hue and a ring; whether the mount is armed stays with the
    // fill against the outline, so a selected empty hardpoint is still empty.
    expect(element.querySelector('.plate__dot--selected')?.classList).toContain('plate__dot');

    // And the plate draws no ink for how a weapon aims any more: the canvas's
    // second hue is spent on selection here, and the mount is named in words.
    expect(element.querySelector('.plate__dot--aimed')).toBeNull();
    expect(element.querySelector('.plate__numeral--aimed')).toBeNull();

    // And it is a sentence, not a ring alone.
    const stated = [...element.querySelectorAll('.shots__entry')].map((entry) =>
      (entry.textContent ?? '').trim(),
    );
    expect(stated).toContain(selected[0]?.statement);
    const unselected = component.shots().find((shot) => !shot.selected);
    expect(selected[0]?.statement).not.toBe(unselected?.statement);
  });

  it('leaves a selected hardpoint with nothing on it visibly empty', () => {
    // The stock build leaves this hull's Huge mount empty, and the workspace
    // opens on it. Selection is a hue and a ring; whether a mount is armed is
    // the fill against the outline, so the two states have to be legible at
    // once — a mark that filled itself in to say "selected" would be reporting
    // a weapon that is not there.
    const { component, element } = render({
      build: populatedBuild(),
      selectedSlot: 'HugeHardpoint1',
    });

    const selected = component.shots().filter((shot) => shot.selected);
    expect(selected).toHaveLength(1);
    expect(selected[0]?.armed).toBe(false);
    expect(element.querySelectorAll('.plate__dot--empty.plate__dot--selected')).toHaveLength(1);
    expect(
      element.querySelectorAll('.plate__numeral--empty.plate__numeral--selected'),
    ).toHaveLength(1);

    // And the sentence is the empty-and-selected one, not either single state's.
    const stated = [...element.querySelectorAll('.shots__entry')].map((entry) =>
      (entry.textContent ?? '').trim(),
    );
    expect(stated).toContain(selected[0]?.statement);
    const otherEmpty = component.shots().find((shot) => !shot.armed && !shot.selected);
    expect(selected[0]?.statement).not.toBe(otherEmpty?.statement);
  });

  it('marks nothing when the workspace has no hardpoint selected', () => {
    const { component, element } = render();

    expect(component.shots().some((shot) => shot.selected)).toBe(false);
    expect(element.querySelector('.plate__dot--selected')).toBeNull();
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
    const marks = component.shots().length;
    expect(marks).toBeGreaterThan(0);
    expect(element.querySelectorAll('.plate__dot')).toHaveLength(marks);
    expect(element.querySelectorAll('.plate__numeral')).toHaveLength(marks);
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
    // The clamp is reached rather than being a bound nothing touches — on
    // whichever axis reaches it first. This hull's mounts sit far below the
    // cockpit and much less far to either side of it, so at the track's own
    // shortest range it is the vertical axis that runs out of plate.
    expect(
      marks.some((shot) =>
        [shot.left, shot.top].some((fraction) => at(fraction) === 4 || at(fraction) === 96),
      ),
    ).toBe(true);
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
