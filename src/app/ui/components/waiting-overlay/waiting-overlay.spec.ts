import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { WaitingOverlay } from './waiting-overlay';

/**
 * The statement that the application is waiting, as a component.
 *
 * What it stands over and what it takes away are read in a real browser, by
 * `e2e/navigation-waiting.spec.ts`: a modal's inertness is a platform
 * behaviour, and jsdom implements neither the top layer nor the modal methods.
 * What is settled here is the markup a reader meets and the fact that the
 * overlay asks for a *modal* rather than for a dialog that merely covers.
 */

/**
 * The modal methods jsdom does not implement, faithful in the one respect.
 *
 * `restoreNativeDialog` puts the prototype back. The environment is shared with
 * every other file in the run, so a stub left on it is a stub the next file
 * inherits.
 */
let restoreNativeDialog: () => void = () => {};

function stubNativeDialog(): string[] {
  const calls: string[] = [];
  const prototype = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
  const original = {
    showModal: prototype['showModal'],
    show: prototype['show'],
    close: prototype['close'],
  };
  restoreNativeDialog = () => {
    prototype['showModal'] = original.showModal;
    prototype['show'] = original.show;
    prototype['close'] = original.close;
  };
  prototype['showModal'] = function showModal(this: HTMLDialogElement) {
    calls.push('showModal');
    this.setAttribute('open', '');
  };
  prototype['show'] = function show(this: HTMLDialogElement) {
    calls.push('show');
    this.setAttribute('open', '');
  };
  prototype['close'] = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) {
      return;
    }
    calls.push('close');
    this.removeAttribute('open');
    queueMicrotask(() => this.dispatchEvent(new Event('close')));
  };
  return calls;
}

const WAITING = 'Loading the screen you asked for';

function render(open: boolean): {
  fixture: ComponentFixture<WaitingOverlay>;
  calls: string[];
  dialog: HTMLDialogElement;
} {
  const calls = stubNativeDialog();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [WaitingOverlay] });
  const fixture = TestBed.createComponent(WaitingOverlay);
  fixture.componentRef.setInput('text', WAITING);
  fixture.componentRef.setInput('open', open);
  fixture.detectChanges();

  const element = fixture.nativeElement as HTMLElement;
  const dialog = element.querySelector('dialog');
  if (dialog === null) {
    throw new Error('The overlay drew no dialog.');
  }
  return { fixture, calls, dialog };
}

/** Normalised text, the way an accessible-name computation would read it. */
const textOf = (node: Element | null) => (node?.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('WaitingOverlay', () => {
  afterEach(() => {
    restoreNativeDialog();
  });

  it('asks for a modal, which is what makes the screen behind inert', () => {
    const { calls, dialog } = render(true);

    // Not `show()`. A dialog that merely covers the screen leaves it clickable,
    // focusable and in the accessibility tree, which is the whole of what this
    // overlay exists to take away.
    expect(dialog.tagName).toBe('DIALOG');
    expect(calls).toEqual(['showModal']);
  });

  it('renders nothing focusable when it is closed', () => {
    const { fixture, calls, dialog } = render(false);

    expect(calls).toEqual([]);
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button, a, [tabindex]').length,
    ).toBe(0);
  });

  it('is named by the sentence rather than by the mark', () => {
    const { fixture, dialog } = render(true);
    const spoken = (fixture.nativeElement as HTMLElement).querySelector('.waiting__spoken');

    expect(dialog.getAttribute('aria-labelledby')).toBe(spoken?.getAttribute('id'));
    expect(textOf(spoken)).toBe(WAITING);
  });

  it('exposes the mark to no reader, and asks for it by a relative path', () => {
    const { fixture } = render(true);
    const mark = (fixture.nativeElement as HTMLElement).querySelector('img');

    expect(mark?.getAttribute('alt')).toBe('');
    expect(mark?.getAttribute('aria-hidden')).toBe('true');
    // A pull request is served from a sub-path, so a leading slash misses the
    // file (constitution, working rules).
    expect(mark?.getAttribute('src')).toBe('assets/loader.svg');
  });

  it('offers no way to answer it', () => {
    const { fixture } = render(true);

    // The navigation is already running. There is nothing to cancel, and the
    // way out is the navigation ending.
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button, [role="button"], a').length,
    ).toBe(0);
  });

  it('refuses the native cancel, so Escape does not say the wait is over', () => {
    const { dialog } = render(true);

    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);

    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.hasAttribute('open')).toBe(true);
  });

  it('states nothing about how long it will take', () => {
    const { fixture } = render(true);
    const element = fixture.nativeElement as HTMLElement;

    // No proportion, percentage, remaining time or step count: the application
    // knows none of them (constitution IV).
    expect(textOf(element)).not.toMatch(/%|\d/);
    expect(element.querySelectorAll('progress, [role="progressbar"]').length).toBe(0);
  });

  it('has nothing to sit through, either way', () => {
    const { fixture, dialog } = render(true);

    // No fade in and none out. A statement that arrives late is late, and one
    // that lingers is a statement that is no longer true.
    //
    // That reading is taken in `e2e/navigation-waiting.spec.ts`, from an engine
    // that resolves a stylesheet. Here it would be no reading at all: this one
    // answers the same empty string for a duration set to zero, a duration set
    // to a second, and a stylesheet it never applied. What is read here is the
    // half that does not need one — the statement goes when it is told to.
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();

    expect(dialog.hasAttribute('open')).toBe(false);
  });
});
