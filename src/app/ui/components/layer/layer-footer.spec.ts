import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LayerFooter } from './layer-footer';

@Component({
  imports: [LayerFooter],
  template: `
    <ednb-layer-footer [rule]="rule" [spacing]="spacing">
      <p class="note">One saved build carries this name.</p>
      <button actions type="button">Cancel</button>
      <button actions type="button">Save</button>
    </ednb-layer-footer>
  `,
})
class Host {
  rule: 'none' | 'section' | 'quiet' = 'section';
  spacing: 'tight' | 'inline' = 'tight';
}

function render(rule?: Host['rule'], spacing?: Host['spacing']) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  if (rule) {
    fixture.componentInstance.rule = rule;
  }
  if (spacing) {
    fixture.componentInstance.spacing = spacing;
  }
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('LayerFooter', () => {
  it('gathers the answers into one row at the trailing edge', () => {
    const actions = render().querySelector('.footer__actions');

    expect(actions?.querySelectorAll('button').length).toBe(2);
  });

  it('keeps what is not an answer outside that row', () => {
    const host = render();

    expect(host.querySelector('.footer__actions .note')).toBeNull();
    expect(host.querySelector('.footer .note')).not.toBeNull();
  });

  it('draws the rule it was asked for and no other', () => {
    expect(render('section').querySelector('.footer--rule-section')).not.toBeNull();
    expect(render('quiet').querySelector('.footer--rule-quiet')).not.toBeNull();
    expect(render('none').querySelector('.footer--rule-none')).not.toBeNull();
  });

  it('sets the answers close together unless a caller asks otherwise', () => {
    // The two exchange layers draw a pair of answers tight. The save layer sets
    // its own at the inline measure, and lost that gap when the three footers
    // became one component.
    expect(render().querySelector('.footer')?.classList).toContain('footer--tight');
    expect(render('section', 'inline').querySelector('.footer')?.classList).toContain(
      'footer--inline',
    );
  });
});
