import { TestBed } from '@angular/core/testing';
import { HelpDialogStore } from './help-dialog.store';

describe('HelpDialogStore', () => {
  function store(): HelpDialogStore {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [HelpDialogStore] });
    return TestBed.inject(HelpDialogStore);
  }

  it('starts closed, with nothing having asked for it', () => {
    const help = store();

    expect(help.state()).toEqual({ status: 'closed' });
    expect(help.open()).toBe(false);
    expect(help.invocation()).toBeNull();
  });

  it('opens with the frame as the invoking context', () => {
    const help = store();

    help.openDialog();

    expect(help.open()).toBe(true);
    expect(help.state()).toEqual({ status: 'open', invocation: { kind: 'global' } });
  });

  it('replaces the invocation of an already-open dialog rather than refusing', () => {
    const help = store();

    help.openDialog();
    help.openDialog({ kind: 'global' });

    expect(help.state()).toEqual({ status: 'open', invocation: { kind: 'global' } });
  });

  it('closes, and closing a closed dialog changes nothing', () => {
    const help = store();
    help.openDialog();

    help.closeDialog();
    const closed = help.state();
    help.closeDialog();

    expect(help.open()).toBe(false);
    expect(help.state()).toBe(closed);
  });

  it('needs no Router, History, URL, storage or build state to do any of it', () => {
    // Constructed with no provider but itself: a store that injected the
    // Router, a location adapter or a build store would fail to resolve here
    // rather than pass quietly.
    const help = store();

    const url = location.href;
    const historyLength = history.length;
    const stored = JSON.stringify({ ...localStorage });
    const sessionStored = JSON.stringify({ ...sessionStorage });

    help.openDialog();
    help.closeDialog();

    expect(location.href).toBe(url);
    expect(history.length).toBe(historyLength);
    expect(JSON.stringify({ ...localStorage })).toBe(stored);
    expect(JSON.stringify({ ...sessionStorage })).toBe(sessionStored);
  });
});
