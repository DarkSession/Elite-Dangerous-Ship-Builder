import { TestBed } from '@angular/core/testing';
import { EmptyState } from './empty-state';

function render(inputs: Readonly<Record<string, unknown>>) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [EmptyState] });
  const fixture = TestBed.createComponent(EmptyState);
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('EmptyState', () => {
  it('names the absence in a heading a reader can land on', () => {
    const host = render({ title: 'No build is open.' });

    const heading = host.querySelector('h2');
    expect(heading?.textContent?.trim()).toBe('No build is open.');
  });

  it('draws no paragraph where there is no description to draw', () => {
    const host = render({ title: 'No build is open.' });

    expect(host.querySelector('.empty__description')).toBeNull();
  });

  it('draws the description under the heading where it is given one', () => {
    const host = render({
      title: 'No build is open.',
      description: 'Choose a hull to start one.',
    });

    expect(host.querySelector('.empty__description')?.textContent?.trim()).toBe(
      'Choose a hull to start one.',
    );
  });

  it('carries the alignment it was asked for', () => {
    expect(render({ title: 'Nothing here' }).querySelector('.empty--centre')).not.toBeNull();
    expect(
      render({ title: 'Nothing here', align: 'leading' }).querySelector('.empty--leading'),
    ).not.toBeNull();
  });
});
