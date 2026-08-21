import { ConfirmDialog } from './confirm-dialog';
import { element, query, renderComponent, textOf } from '../ui-component.spec-helpers';

const inputs = {
  // Closed: a modal dialog's own open behaviour belongs to the platform and is
  // exercised in the browser suite. What a unit test can hold to account is the
  // content, the relationships and the intent, all of which are present either way.
  open: false,
  title: 'Delete “Anaconda explorer”?',
  description: 'This removes the saved build. It cannot be undone.',
  confirmLabel: 'Delete build',
  cancelLabel: 'Keep build',
  dismissLabel: 'Close',
};

describe('ConfirmDialog', () => {
  it('names the subject and both outcomes in visible text', () => {
    const fixture = renderComponent(ConfirmDialog, inputs);
    const text = textOf(element(fixture));

    expect(text).toContain('Delete “Anaconda explorer”?');
    expect(text).toContain('This removes the saved build.');
    expect(text).toContain('Delete build');
    expect(text).toContain('Keep build');
    // Never an unnamed OK over an unnamed subject.
    expect(text).not.toContain('OK');
  });

  it('associates its description with the dialog', () => {
    const fixture = renderComponent(ConfirmDialog, inputs);
    const dialog = query(fixture, 'dialog');
    const describedBy = dialog.getAttribute('aria-describedby');

    expect(describedBy).not.toBeNull();
    expect(textOf(element(fixture).querySelector(`#${describedBy}`))).toContain(
      'This removes the saved build.',
    );
  });

  it('emits the confirmation only when the confirming action is used', () => {
    const fixture = renderComponent(ConfirmDialog, inputs);
    let confirmed = 0;
    let cancelled = 0;
    fixture.componentInstance.confirmed.subscribe(() => (confirmed += 1));
    fixture.componentInstance.cancelled.subscribe(() => (cancelled += 1));

    const buttons = element(fixture).querySelectorAll('button');
    const confirm = [...buttons].find((button) => textOf(button) === 'Delete build')!;
    const cancel = [...buttons].find((button) => textOf(button) === 'Keep build')!;

    confirm.click();
    expect(confirmed).toBe(1);
    expect(cancelled).toBe(0);

    cancel.click();
    expect(cancelled).toBe(1);
  });

  it('carries destructive meaning in words, not only in emphasis', () => {
    const plain = renderComponent(ConfirmDialog, inputs);
    const dangerous = renderComponent(ConfirmDialog, { ...inputs, destructive: true });

    for (const fixture of [plain, dangerous]) {
      expect(textOf(element(fixture))).toContain('Delete build');
    }
  });

  it('treats dismissing the layer as cancelling', () => {
    const fixture = renderComponent(ConfirmDialog, inputs);
    let cancelled = 0;
    fixture.componentInstance.cancelled.subscribe(() => (cancelled += 1));

    query(fixture, '.layer__dismiss').click();

    expect(cancelled).toBe(1);
  });

  it('does not open itself', () => {
    const fixture = renderComponent(ConfirmDialog, inputs);

    expect(query(fixture, 'dialog').hasAttribute('open')).toBe(false);
  });
});
