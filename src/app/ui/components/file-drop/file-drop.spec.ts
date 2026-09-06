import { describedText, element, query, renderComponent } from '../ui-component.spec-helpers';
import { FileDrop } from './file-drop';

function render(inputs: Record<string, unknown> = {}) {
  return renderComponent(FileDrop, { label: 'Select or drop journal files', ...inputs });
}

function file(name: string, text = '{}'): File {
  return new File([text], name, { type: 'application/json' });
}

/** A drop carrying files, as the browser delivers one. */
function dropEvent(files: readonly File[]): DragEvent {
  const event = new Event('drop', { bubbles: true, cancelable: true }) as DragEvent;
  Object.defineProperty(event, 'dataTransfer', { value: { files } });
  return event;
}

describe('where files come in', () => {
  it('names itself in visible text, on the control a Commander reaches', () => {
    const button = query(render(), '.file-drop__button');

    expect(button.textContent?.trim()).toBe('Select or drop journal files');
  });

  it('opens the picker from that control', () => {
    const fixture = render();
    const control = query(fixture, 'input[type="file"]') as HTMLInputElement;
    let opened = 0;
    control.addEventListener('click', () => (opened += 1));

    (query(fixture, '.file-drop__button') as HTMLButtonElement).click();

    expect(opened).toBe(1);
  });

  it('takes several files at once', () => {
    const control = query(render(), 'input[type="file"]');

    expect(control.hasAttribute('multiple')).toBe(true);
  });

  it('offers the file kinds it was told to offer', () => {
    const control = query(render({ accept: '.log,.json,.txt' }), 'input[type="file"]');

    expect(control.getAttribute('accept')).toBe('.log,.json,.txt');
  });

  it('is reachable without a pointer, and offers one control rather than two', () => {
    const fixture = render();
    const button = query(fixture, '.file-drop__button');
    const control = query(fixture, 'input[type="file"]');

    // The button is the control: it is in the tab order and it is what is
    // announced. The input behind it is a mechanism, and a second announced
    // control for the same action would be read as a second action.
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(button.getAttribute('tabindex')).toBe(null);
    expect(control.getAttribute('aria-hidden')).toBe('true');
    expect(control.getAttribute('tabindex')).toBe('-1');
  });

  it('associates the hint and the scanned line with the control', () => {
    const fixture = render({
      hint: 'Journal, log and JSON files',
      scanned: 'Journal.01.log · 4 builds',
    });

    expect(describedText(query(fixture, '.file-drop__button'))).toContain(
      'Journal, log and JSON files',
    );
    expect(describedText(query(fixture, '.file-drop__button'))).toContain(
      'Journal.01.log · 4 builds',
    );
  });

  it('hands over the files that were dropped on it', () => {
    const fixture = render();
    const chosen: (readonly File[])[] = [];
    fixture.componentInstance.chosen.subscribe((files) => chosen.push(files));

    element(fixture)
      .querySelector('.file-drop')
      ?.dispatchEvent(dropEvent([file('Journal.01.log'), file('Journal.02.log')]));

    expect(chosen).toHaveLength(1);
    expect(chosen[0]?.map((one) => one.name)).toEqual(['Journal.01.log', 'Journal.02.log']);
  });

  it('says that it has taken a drag, and stops saying so when it leaves', () => {
    const fixture = render();
    const plate = query(fixture, '.file-drop');

    plate.dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(plate.hasAttribute('data-dragging')).toBe(true);

    plate.dispatchEvent(new Event('dragleave', { bubbles: true }));
    fixture.detectChanges();
    expect(plate.hasAttribute('data-dragging')).toBe(false);
  });

  it('takes nothing while it is disabled', () => {
    const fixture = render({ disabled: true });
    const chosen: (readonly File[])[] = [];
    fixture.componentInstance.chosen.subscribe((files) => chosen.push(files));

    query(fixture, '.file-drop').dispatchEvent(dropEvent([file('Journal.01.log')]));

    expect(chosen).toEqual([]);
    expect(query(fixture, '.file-drop__button').hasAttribute('disabled')).toBe(true);
  });

  it('says it is reading without taking the control away', () => {
    const fixture = render({ busy: true });

    // Disabling it would move focus to the top of the document, and the
    // element it would move focus off is the one the Commander just activated.
    // The plate says it is busy; the control stays where they left it.
    expect(query(fixture, '.file-drop__button').hasAttribute('disabled')).toBe(false);
    expect(query(fixture, '.file-drop__button').getAttribute('aria-busy')).toBe('true');
    expect(query(fixture, '.file-drop').hasAttribute('data-busy')).toBe(true);
  });

  it('reports an empty selection as nothing at all', () => {
    const fixture = render();
    const chosen: (readonly File[])[] = [];
    fixture.componentInstance.chosen.subscribe((files) => chosen.push(files));

    query(fixture, '.file-drop').dispatchEvent(dropEvent([]));

    expect(chosen).toEqual([]);
  });
});
