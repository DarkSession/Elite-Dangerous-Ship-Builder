import { TestBed } from '@angular/core/testing';
import type { PersistenceStatus as Status } from '../../application/build-library/working-record.port';
import { provideLocalization } from '../../i18n/i18n.providers';
import {
  PersistenceStatus,
  type PersistenceSubject,
  type StatusActionId,
} from './persistence-status';

/** Every state the two screens can be in, in the order the contract lists them. */
const STATES: readonly Status[] = [
  'ready',
  'saving',
  'saved',
  'quota-full',
  'unavailable',
  'write-failed',
  'record-deleted-externally',
];

/** Both screens draw this one component; what differs is what it is told. */
const SCREENS: readonly PersistenceSubject[] = ['build', 'loadout'];

function render(status: Status, subject: PersistenceSubject = 'build', paused = false) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [PersistenceStatus],
    providers: [provideLocalization()],
  });

  const fixture = TestBed.createComponent(PersistenceStatus);
  const pressed: StatusActionId[] = [];
  fixture.componentRef.setInput('status', status);
  fixture.componentRef.setInput('subject', subject);
  fixture.componentRef.setInput('paused', paused);
  fixture.componentInstance.actionSelected.subscribe((action) => pressed.push(action));
  fixture.detectChanges();
  return { fixture, pressed };
}

const textOf = (fixture: { nativeElement: unknown }) =>
  ((fixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s+/g, ' ');

const buttons = (fixture: { nativeElement: unknown }) => [
  ...(fixture.nativeElement as HTMLElement).querySelectorAll('button'),
];

describe('PersistenceStatus', () => {
  it('names every state a Commander has to act on, never by colour alone', () => {
    const expected: readonly (readonly [Status, string, string])[] = [
      ['quota-full', 'storage is full', 'storage is full'],
      ['unavailable', 'not allowing the application to store', 'not allowing the application'],
      ['write-failed', 'The build is unchanged', 'The loadout is unchanged'],
      ['record-deleted-externally', 'unnamed build was discarded', 'unnamed loadout was discarded'],
    ];

    for (const [status, build, loadout] of expected) {
      expect(textOf(render(status).fixture), status).toContain(build);
      expect(textOf(render(status, 'loadout').fixture), status).toContain(loadout);
    }
  });

  it('draws nothing at all while storage is doing its job, on either screen', () => {
    // Neither canvas has a "saved" banner. Repeating it every few seconds over
    // the top of someone's reading is worse than silence, and the states that
    // matter are the ones above.
    for (const subject of SCREENS) {
      for (const status of ['ready', 'saving', 'saved'] as const) {
        expect(textOf(render(status, subject).fixture).trim(), `${subject} ${status}`).toBe('');
      }
    }
  });

  it('says editing still works in every failure state, on either screen', () => {
    for (const subject of SCREENS) {
      for (const status of ['quota-full', 'unavailable', 'write-failed'] as const) {
        expect(textOf(render(status, subject).fixture), `${subject} ${status}`).toMatch(
          /still works|Editing/i,
        );
      }
    }
  });

  it('says something about every state it is given, and never throws on one', () => {
    for (const subject of SCREENS) {
      for (const status of STATES) {
        expect(render(status, subject).fixture.componentInstance.message().length).toBeGreaterThan(
          0,
        );
      }
    }
  });

  it('reports a failure as an alert rather than as an incidental update', () => {
    const { fixture } = render('write-failed');

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')).not.toBeNull();
  });

  it('does not interrupt with an alert while it is simply saving', () => {
    const { fixture } = render('saving');

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')).toBeNull();
  });

  it('offers a retry when a write failed', () => {
    const { fixture } = render('write-failed');

    expect(buttons(fixture).map((button) => button.textContent?.trim())).toContain(
      'Try saving again',
    );
  });

  it('offers management and a retry when the browser store is full', () => {
    // A full quota, and nothing else. The twenty-record limit that also reached
    // this state was withdrawn on 2026-08-25, and the expiry that replaced it is
    // never offered as a way out of a full store (001/FR-013).
    const { fixture } = render('quota-full');
    const labels = buttons(fixture).map((button) => button.textContent?.trim());

    expect(labels).toContain('Choose builds to discard');
    expect(labels).toContain('Try saving again');
  });

  it('offers the bench its own words for what to discard', () => {
    const labels = buttons(render('quota-full', 'loadout').fixture).map((button) =>
      button.textContent?.trim(),
    );

    expect(labels).toContain('Choose loadouts to discard');
  });

  it('asks for an explicit resume while saving is paused, on either screen', () => {
    for (const subject of SCREENS) {
      const { fixture, pressed } = render('record-deleted-externally', subject, true);

      buttons(fixture)[0]?.click();

      expect(pressed, subject).toEqual(['resume']);
    }
  });

  it('offers no resume while saving is not paused', () => {
    // Resuming what is not stopped is a control that does nothing.
    const { fixture } = render('record-deleted-externally', 'build', false);

    expect(buttons(fixture)).toHaveLength(0);
  });

  it('says which action was pressed rather than acting on it', () => {
    // The two screens hold an autosave each. A component that reached for one
    // would be the ship tool's alone.
    const { fixture, pressed } = render('quota-full', 'loadout');

    for (const button of buttons(fixture)) {
      button.click();
    }

    expect(pressed).toEqual(['manage', 'retry']);
  });

  it('offers nothing to do when saving is going normally', () => {
    for (const status of ['saved', 'saving', 'ready'] as const) {
      const { fixture } = render(status);

      expect(buttons(fixture), status).toHaveLength(0);
    }
  });
});
