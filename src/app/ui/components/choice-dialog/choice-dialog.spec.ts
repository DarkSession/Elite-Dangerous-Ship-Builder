import { ChoiceDialog, type DialogChoice } from './choice-dialog';
import { element, query, renderComponent, textOf } from '../ui-component.spec-helpers';

const choices: readonly DialogChoice[] = [
  {
    id: 'overwrite',
    label: 'Overwrite the saved build',
    outcome: 'Your version is kept. The other tab’s version is replaced.',
  },
  {
    id: 'keep-both',
    label: 'Keep both builds',
    outcome: 'Both versions are kept, as two saved builds.',
  },
  {
    id: 'cancel',
    label: 'Cancel',
    outcome: 'Nothing is saved. The other tab’s version is kept.',
    emphasis: 'quiet',
  },
];

const inputs = {
  // Closed: a modal dialog's own open behaviour belongs to the platform and is
  // exercised in the browser suite. What a unit test can hold to account is the
  // content, the relationships and the intent, all of which are present either way.
  open: false,
  title: 'This build was changed in another tab',
  description: 'Choose which version to keep.',
  choices,
  dismissLabel: 'Close',
};

describe('ChoiceDialog', () => {
  it('offers every choice with its own visible outcome', () => {
    const fixture = renderComponent(ChoiceDialog, inputs);
    const text = textOf(element(fixture));

    for (const choice of choices) {
      expect(text).toContain(choice.label);
      expect(text).toContain(choice.outcome);
    }
  });

  it('associates each choice with the outcome it causes', () => {
    const fixture = renderComponent(ChoiceDialog, inputs);

    for (const choice of choices) {
      const button = [...element(fixture).querySelectorAll('button')].find(
        (candidate) => textOf(candidate) === choice.label,
      )!;
      const describedBy = button.closest('ednb-action-button')?.getAttribute('aria-describedby');
      expect(describedBy).not.toBeNull();
      expect(textOf(element(fixture).querySelector(`#${describedBy}`))).toBe(choice.outcome);
    }
  });

  it('emits the identity of the choice, never its translated label', () => {
    const fixture = renderComponent(ChoiceDialog, inputs);
    const chosen: string[] = [];
    fixture.componentInstance.chosen.subscribe((id) => chosen.push(id));

    for (const choice of choices) {
      [...element(fixture).querySelectorAll('button')]
        .find((candidate) => textOf(candidate) === choice.label)!
        .click();
    }

    expect(chosen).toEqual(['overwrite', 'keep-both', 'cancel']);
  });

  it('presents the choices as a semantic list', () => {
    const fixture = renderComponent(ChoiceDialog, inputs);

    expect(element(fixture).querySelectorAll('ul > li')).toHaveLength(choices.length);
  });

  it('emits a dismissal separately from a choice', () => {
    const fixture = renderComponent(ChoiceDialog, inputs);
    let dismissed = 0;
    const chosen: string[] = [];
    fixture.componentInstance.dismissed.subscribe(() => (dismissed += 1));
    fixture.componentInstance.chosen.subscribe((id) => chosen.push(id));

    query(fixture, '.layer__dismiss').click();

    expect(dismissed).toBe(1);
    expect(chosen).toEqual([]);
  });

  it('renders an empty choice list without an empty dialog body', () => {
    const fixture = renderComponent(ChoiceDialog, { ...inputs, choices: [] });

    expect(element(fixture).querySelectorAll('li')).toHaveLength(0);
    expect(textOf(element(fixture))).toContain('This build was changed in another tab');
  });
});
