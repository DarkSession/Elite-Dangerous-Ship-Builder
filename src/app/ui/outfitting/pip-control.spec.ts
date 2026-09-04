import { TestBed } from '@angular/core/testing';
import { PipControl, type PipStepView } from './pip-control';

const STEPS: readonly PipStepView[] = [
  { id: 'systems-1', value: 1, fill: 1, label: 'Set systems to 1' },
  { id: 'systems-2', value: 2, fill: 0.5, label: 'Set systems to 2' },
  { id: 'systems-3', value: 3, fill: 0, label: 'Set systems to 3' },
  { id: 'systems-4', value: 4, fill: 0, label: 'Set systems to 4' },
];

function render(steps: readonly PipStepView[] = STEPS) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [PipControl] });
  const fixture = TestBed.createComponent(PipControl);
  fixture.componentRef.setInput('bank', 'systems');
  fixture.componentRef.setInput('label', 'Systems, 1.5 of 4 pips');
  fixture.componentRef.setInput('steps', steps);

  const requested: number[] = [];
  fixture.componentRef.instance.stepRequested.subscribe((value) => requested.push(value));
  fixture.detectChanges();

  return { host: fixture.nativeElement as HTMLElement, requested };
}

describe('PipControl', () => {
  it('names the group with the allocation it stands at', () => {
    const { host } = render();

    expect(host.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe(
      'Systems, 1.5 of 4 pips',
    );
  });

  it('gives every block a name that says what pressing it sets', () => {
    const { host } = render();

    const names = [...host.querySelectorAll('button')].map((step) =>
      step.getAttribute('aria-label'),
    );
    expect(names).toEqual([
      'Set systems to 1',
      'Set systems to 2',
      'Set systems to 3',
      'Set systems to 4',
    ]);
  });

  it('fills a block from its leading edge by the share it was given', () => {
    const { host } = render();

    const fills = [...host.querySelectorAll('.pips__fill')].map(
      (fill) => (fill as HTMLElement).style.inlineSize,
    );
    expect(fills).toEqual(['100%', '50%', '0%', '0%']);
  });

  it('reports the allocation a press asks for, and decides nothing itself', () => {
    const { host, requested } = render();

    host.querySelectorAll('button')[2]?.click();

    expect(requested).toEqual([3]);
  });

  it('carries the bank on the group, so the colour is chosen from data', () => {
    const { host } = render();

    expect(host.querySelector('.pips')?.getAttribute('data-bank')).toBe('systems');
  });

  it('draws nothing to press where a bank has no blocks', () => {
    const { host } = render([]);

    expect(host.querySelectorAll('button').length).toBe(0);
  });
});
