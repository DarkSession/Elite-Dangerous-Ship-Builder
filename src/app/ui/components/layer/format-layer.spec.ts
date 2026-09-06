import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormatLayer } from './format-layer';
import { stubNativeDialog } from './layer.spec-helpers';

@Component({
  imports: [FormatLayer],
  template: `
    <ednb-format-layer title="Export this build" dismissLabel="Close" [open]="true">
      <fieldset formats><legend>Format</legend></fieldset>
      <p class="payload">A payload.</p>
    </ednb-format-layer>
  `,
})
class Host {}

function render() {
  stubNativeDialog();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('FormatLayer', () => {
  it('puts the format list in the region beside the content', () => {
    const host = render();

    expect(host.querySelector('.format-layer__list fieldset')).not.toBeNull();
    expect(host.querySelector('.format-layer__content fieldset')).toBeNull();
  });

  it('puts the chosen format in the content region', () => {
    const host = render();

    expect(host.querySelector('.format-layer__content .payload')).not.toBeNull();
  });

  it('is drawn inside a layer that names itself', () => {
    const host = render();

    expect(host.querySelector('dialog')).not.toBeNull();
    expect(host.textContent).toContain('Export this build');
  });
});
