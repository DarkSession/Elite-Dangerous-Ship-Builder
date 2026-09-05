import { TestBed } from '@angular/core/testing';
import { DocumentAdapter } from '../../platform/browser/document.adapter';
import { provideLocalization } from '../../i18n/i18n.providers';
import { SaveBuildDialog, type SaveRequest, type SaveSource } from './save-build.dialog';
import { stubNativeDialog } from '../../ui/components/layer/layer.spec-helpers';

class SilentDocumentAdapter {
  commitRootState(): void {}
}

function render(inputs: Record<string, unknown> = {}) {
  stubNativeDialog();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [SaveBuildDialog],
    providers: [
      provideLocalization(),
      { provide: DocumentAdapter, useValue: new SilentDocumentAdapter() },
    ],
  });
  const fixture = TestBed.createComponent(SaveBuildDialog);
  for (const [name, value] of Object.entries({ open: true, ...inputs })) {
    fixture.componentRef.setInput(name, value);
  }
  fixture.detectChanges();
  return fixture;
}

type Fixture = ReturnType<typeof render>;

const root = (fixture: Fixture) => fixture.nativeElement as HTMLElement;

const text = (fixture: Fixture) => (root(fixture).textContent ?? '').replace(/\s+/g, ' ');

const buttons = (fixture: Fixture) => [...root(fixture).querySelectorAll('button')];

const radios = (fixture: Fixture) =>
  [...root(fixture).querySelectorAll('input[type="radio"]')] as HTMLInputElement[];

const saveButton = (fixture: Fixture) =>
  buttons(fixture).find((button) => button.textContent?.includes('Save build'))!;

const source = (overrides: Partial<SaveSource> = {}): SaveSource => ({
  name: 'Anaconda explorer',
  lastSaved: '2 days ago',
  replaceable: true,
  ...overrides,
});

/** Types into the name field the way a Commander does. */
function type(fixture: Fixture, value: string): void {
  const field = root(fixture).querySelector('input[type="text"]') as HTMLInputElement;
  field.value = value;
  field.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

describe('SaveBuildDialog', () => {
  it('starts from the record’s own name and note', () => {
    const fixture = render({
      initialName: 'Anaconda explorer',
      initialNote: 'Long-range fit.',
      source: source(),
    });

    expect((root(fixture).querySelector('input[type="text"]') as HTMLInputElement).value).toBe(
      'Anaconda explorer',
    );
    expect((root(fixture).querySelector('textarea') as HTMLTextAreaElement).value).toBe(
      'Long-range fit.',
    );
  });

  it('offers no mode at all for a build that came from nowhere', () => {
    // A choice of one is not a choice. There is nothing to replace, so saving
    // as a new build is the only thing SAVE BUILD can do, and a single selected
    // card in front of it asks a question with one answer (canvas 1c).
    const fixture = render({ initialName: 'A name' });

    expect(radios(fixture)).toHaveLength(0);
    expect(saveButton(fixture).hasAttribute('disabled')).toBe(false);
  });

  it('marks each mode with the square the canvas draws on it', () => {
    // Filled on the choice that stands, open on the offer beside it — the state
    // survives a monochrome rendering rather than being carried by the wash.
    const fixture = render({ initialName: 'Anaconda explorer', source: source() });

    expect(root(fixture).querySelectorAll('.choice__marker')).toHaveLength(2);
  });

  it('offers both modes for a build opened from a save, replacing selected first', () => {
    const fixture = render({ initialName: 'Anaconda explorer', source: source() });
    const options = radios(fixture);

    expect(options).toHaveLength(2);
    expect(options[0]!.checked).toBe(true);
    expect(text(fixture)).toContain('Overwrite “Anaconda explorer”');
    // The canvas puts when it was last saved under that choice.
    expect(text(fixture)).toContain('Last saved 2 days ago');
  });

  it('withdraws replacing where the browser cannot do it safely, and says why', () => {
    const fixture = render({
      initialName: 'Anaconda explorer',
      source: source({ replaceable: false }),
    });

    // One mode left is no mode drawn: the reason stands on the message line,
    // which is where a Commander can act on it.
    expect(radios(fixture)).toHaveLength(0);
    expect(text(fixture)).toContain('cannot coordinate between tabs');
    // Saving is still available: only the unsafe half of it went.
    expect(saveButton(fixture).hasAttribute('disabled')).toBe(false);
  });

  it('warns about a duplicate name only where saving would create a record', () => {
    const fixture = render({
      initialName: 'Anaconda explorer',
      source: source(),
      duplicateCount: 2,
    });

    // Replacing creates nothing, so "saving creates a separate build" would
    // describe a save the Commander did not ask for.
    expect(text(fixture)).not.toContain('already use this name');

    radios(fixture)[1]!.click();
    fixture.detectChanges();

    expect(text(fixture)).toContain('2 saved builds already use this name');
    expect(saveButton(fixture).hasAttribute('disabled')).toBe(false);
  });

  it('says one build in words rather than counting to one', () => {
    const fixture = render({ initialName: 'Needle', duplicateCount: 1 });

    expect(text(fixture)).toContain('Another saved build already uses this name');
    expect(text(fixture)).not.toContain('1 saved builds');
  });

  it('warns about a duplicate name even where the browser cannot replace one', () => {
    // The state that needs the warning most: saving can only create a record,
    // and the Commander has no other mode to switch to.
    const fixture = render({
      initialName: 'Anaconda explorer',
      source: source({ replaceable: false }),
      duplicateCount: 2,
    });

    expect(text(fixture)).toContain('cannot coordinate between tabs');
    expect(text(fixture)).toContain('2 saved builds already use this name');
  });

  it('reports a save that wrote nothing, in the line the canvas draws', () => {
    const fixture = render({
      initialName: 'Anaconda explorer',
      source: source(),
      duplicateCount: 2,
      failure: 'Nothing was written.',
    });

    expect(text(fixture)).toContain('Nothing was written.');
    // The press that already happened, alone: what the next one would do is
    // not the news.
    expect(text(fixture)).not.toContain('already use this name');
  });

  it('reports what was typed, so the screen can count the names in use', () => {
    const fixture = render({ initialName: '' });
    const typed: string[] = [];
    fixture.componentInstance.nameChanged.subscribe((value) => typed.push(value));

    type(fixture, 'Needle');

    expect(typed).toEqual(['Needle']);
  });

  it('lets a name be cleared, and refuses to save an empty one', () => {
    const fixture = render({ initialName: 'Anaconda explorer', source: source() });

    type(fixture, '   ');

    expect((root(fixture).querySelector('input[type="text"]') as HTMLInputElement).value).toBe(
      '   ',
    );
    expect(saveButton(fixture).hasAttribute('disabled')).toBe(true);
  });

  it('emits the name, the note and the mode that was chosen', () => {
    const fixture = render({
      initialName: 'Anaconda explorer',
      initialNote: 'Long-range fit.',
      source: source(),
    });
    const requests: SaveRequest[] = [];
    fixture.componentInstance.saveRequested.subscribe((request) => requests.push(request));

    saveButton(fixture).click();

    expect(requests).toEqual([
      { name: 'Anaconda explorer', note: 'Long-range fit.', overwrite: true },
    ]);
  });

  it('sends no note where the Commander left the field empty', () => {
    const fixture = render({ initialName: 'Needle' });
    const requests: SaveRequest[] = [];
    fixture.componentInstance.saveRequested.subscribe((request) => requests.push(request));

    saveButton(fixture).click();

    expect(requests).toEqual([{ name: 'Needle', note: null, overwrite: false }]);
  });

  it('starts again from a draft that was typed and then dismissed', () => {
    // A closed `dialog` still holds its content, so nothing about closing the
    // layer resets it. Without opening as a reset the next Commander to press
    // SAVE finds the last name they abandoned in the field — under a duplicate
    // count the screen worked out for a different one.
    const fixture = render({ initialName: 'Anaconda explorer', source: source() });
    type(fixture, 'Abandoned');
    radios(fixture)[1]!.click();
    fixture.detectChanges();

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    expect((root(fixture).querySelector('input[type="text"]') as HTMLInputElement).value).toBe(
      'Anaconda explorer',
    );
    expect((root(fixture).querySelector('textarea') as HTMLTextAreaElement).value).toBe('');
    expect(radios(fixture)[0]!.checked).toBe(true);
  });

  it('refuses a second press while the first write is still out', () => {
    // The layer no longer closes the moment the commit is pressed, so a second
    // press on a write that has not come back would mint a second record of the
    // same build.
    const fixture = render({ initialName: 'Anaconda explorer', saving: true });

    expect(saveButton(fixture).hasAttribute('disabled')).toBe(true);
  });

  it('starts again from the next build rather than keeping the last one’s name', () => {
    // One layer opens on whichever build is active. A draft carried over would
    // put a stale name in front of a Commander saving a different build.
    const fixture = render({ initialName: 'Anaconda explorer', source: source() });
    type(fixture, 'Renamed');

    fixture.componentRef.setInput('open', false);
    fixture.componentRef.setInput('initialName', 'Needle');
    fixture.componentRef.setInput('source', null);
    fixture.detectChanges();
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    expect((root(fixture).querySelector('input[type="text"]') as HTMLInputElement).value).toBe(
      'Needle',
    );
    expect(radios(fixture)).toHaveLength(0);
  });

  it('holds what was typed while the screen re-reads what it is holding', () => {
    // The screen refreshes its listing after every save, which hands the layer
    // a fresh source object for the same record. A Commander who chose "save as
    // a new build", hit a full quota and is being told to try again must not
    // find their choice — or their name — quietly back where it started.
    const fixture = render({
      initialName: 'Anaconda explorer',
      initialNote: 'Long-range fit.',
      source: source(),
    });
    type(fixture, 'Anaconda explorer copy');
    radios(fixture)[1]!.click();
    fixture.detectChanges();

    fixture.componentRef.setInput('source', source());
    fixture.componentRef.setInput('failure', 'Nothing was written.');
    fixture.detectChanges();

    expect((root(fixture).querySelector('input[type="text"]') as HTMLInputElement).value).toBe(
      'Anaconda explorer copy',
    );
    expect(radios(fixture)[1]!.checked).toBe(true);
  });

  it('falls back to saving anew where the record it would replace has gone', () => {
    // A record removed in another tab takes the replacing card away. The
    // selection made on that card cannot outlive it: a write with no target is
    // not the save that is still available.
    const fixture = render({ initialName: 'Anaconda explorer', source: source() });
    const requests: SaveRequest[] = [];
    fixture.componentInstance.saveRequested.subscribe((request) => requests.push(request));

    fixture.componentRef.setInput('source', null);
    fixture.detectChanges();
    saveButton(fixture).click();

    expect(requests).toEqual([{ name: 'Anaconda explorer', note: null, overwrite: false }]);
  });
});
