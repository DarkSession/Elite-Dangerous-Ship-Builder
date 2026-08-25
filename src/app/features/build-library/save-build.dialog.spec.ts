import { TestBed } from '@angular/core/testing';
import { DocumentAdapter } from '../../platform/browser/document.adapter';
import { provideLocalization } from '../../i18n/i18n.providers';
import { SaveBuildDialog } from './save-build.dialog';

class SilentDocumentAdapter {
  commitRootState(): void {}
}

function render(inputs: Record<string, unknown> = {}) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [SaveBuildDialog],
    providers: [
      provideLocalization(),
      { provide: DocumentAdapter, useValue: new SilentDocumentAdapter() },
    ],
  });
  const fixture = TestBed.createComponent(SaveBuildDialog);
  for (const [name, value] of Object.entries({ open: false, ...inputs })) {
    fixture.componentRef.setInput(name, value);
  }
  fixture.detectChanges();
  return fixture;
}

const text = (fixture: ReturnType<typeof render>) =>
  ((fixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s+/g, ' ');

const buttons = (fixture: ReturnType<typeof render>) => [
  ...(fixture.nativeElement as HTMLElement).querySelectorAll('button'),
];

describe('SaveBuildDialog', () => {
  it('starts from the record’s own name', () => {
    const fixture = render({ initialName: 'Anaconda explorer' });
    const field = (fixture.nativeElement as HTMLElement).querySelector('input')!;

    expect(field.value).toBe('Anaconda explorer');
  });

  it('warns about a duplicate name and still allows the save', () => {
    const fixture = render({ initialName: 'Anaconda explorer', duplicateCount: 2 });

    expect(text(fixture)).toContain('2 saved builds already use this name');
    const asNew = buttons(fixture).find((button) => button.textContent?.includes('new build'))!;
    expect(asNew.hasAttribute('disabled')).toBe(false);
  });

  it('offers replacing only when the build came from a named record', () => {
    const withoutSource = render({ initialName: 'A name' });
    expect(buttons(withoutSource).some((button) => button.textContent?.includes('Replace'))).toBe(
      false,
    );

    const withSource = render({ initialName: 'A name', canOverwrite: true });
    expect(buttons(withSource).some((button) => button.textContent?.includes('Replace'))).toBe(
      true,
    );
  });

  it('says why replacing is unavailable, rather than hiding the reason', () => {
    const fixture = render({
      initialName: 'A name',
      overwriteUnavailable: 'This browser cannot coordinate between tabs.',
    });

    expect(text(fixture)).toContain('cannot coordinate between tabs');
  });

  it('distinguishes saving as new from replacing what was opened', () => {
    const fixture = render({ initialName: 'A name', canOverwrite: true });
    const requests: { name: string; overwrite: boolean }[] = [];
    fixture.componentInstance.saveRequested.subscribe((request) => requests.push(request));

    buttons(fixture)
      .find((button) => button.textContent?.includes('Replace'))!
      .click();
    buttons(fixture)
      .find((button) => button.textContent?.includes('new build'))!
      .click();

    expect(requests).toEqual([
      { name: 'A name', overwrite: true },
      { name: 'A name', overwrite: false },
    ]);
  });

  it('says what each choice does to the stored builds', () => {
    // One of these removes an entry and the other does not. A Commander has to
    // be able to tell which before pressing it, not after (FR-008, T150a).
    const fixture = render({ initialName: 'A name', canOverwrite: true });

    const shown = text(fixture);
    expect(shown).toContain('The saved build is replaced by these edits');
    expect(shown).toContain('the unsaved entry they were kept in is removed');
    expect(shown).toContain('Both are kept');
  });

  it('associates each outcome with the button it belongs to', () => {
    const fixture = render({ initialName: 'A name', canOverwrite: true });
    const element = fixture.nativeElement as HTMLElement;

    for (const choice of element.querySelectorAll('edsb-action-button[aria-describedby]')) {
      const described = choice.getAttribute('aria-describedby')!;
      expect(element.querySelector(`#${described}`)?.textContent?.trim().length).toBeGreaterThan(0);
    }
    expect(element.querySelectorAll('edsb-action-button[aria-describedby]')).toHaveLength(2);
  });

  it('says nothing about outcomes when there is no choice to make', () => {
    // Nothing is being replaced, so there is no second outcome to weigh: the
    // title already says the build is being saved.
    const fixture = render({ initialName: 'A name' });

    expect(text(fixture)).not.toContain('Both are kept');
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        'edsb-action-button[aria-describedby]',
      ),
    ).toHaveLength(0);
  });

  it('refuses to save a build with no name at all', () => {
    const fixture = render({ initialName: '' });
    const requests: unknown[] = [];
    fixture.componentInstance.saveRequested.subscribe((request) => requests.push(request));

    for (const button of buttons(fixture)) {
      button.click();
    }

    expect(requests).toEqual([]);
  });

  it('trims the name it saves', () => {
    const fixture = render({ initialName: '' });
    const requests: { name: string }[] = [];
    fixture.componentInstance.saveRequested.subscribe((request) => requests.push(request));

    const field = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    field.value = '  Anaconda explorer  ';
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    buttons(fixture)
      .find((button) => button.textContent?.includes('new build'))!
      .click();

    expect(requests[0]?.name).toBe('Anaconda explorer');
  });

  it('emits a dismissal separately from a save', () => {
    const fixture = render({ initialName: 'A name' });
    let dismissals = 0;
    fixture.componentInstance.dismissed.subscribe(() => (dismissals += 1));

    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.layer__dismiss')!.click();

    expect(dismissals).toBe(1);
  });
});
