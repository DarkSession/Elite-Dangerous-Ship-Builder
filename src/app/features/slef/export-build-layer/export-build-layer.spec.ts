import {
  element,
  query,
  renderComponent,
  textOf,
} from '../../../ui/components/ui-component.spec-helpers';
import type { SlefExportView } from '../../../application/slef/slef.presenter';
import { ExportBuildLayer } from './export-build-layer';

const BASE: SlefExportView = {
  title: 'Export build · Anaconda',
  modeLabel: 'Format',
  modes: [
    { mode: 'link', label: 'Share link', description: 'Read-only link.', selected: false },
    { mode: 'slef', label: 'SLEF JSON', description: 'Interchange format.', selected: true },
  ],
  fieldLabel: 'SLEF payload',
  payload: '[{"header":{}}]',
  metadata: 'SLEF v1 · 41 modules · 4.1 kB',
  generating: null,
  stale: null,
  validation: null,
  link: 'The export carries a link back to this exact build.',
  actions: [
    { action: 'download', label: 'Download', status: null, failed: false },
    { action: 'copy', label: 'Copy', status: null, failed: false },
  ],
};

function render(overrides: Partial<SlefExportView> = {}) {
  return renderComponent(ExportBuildLayer, { view: { ...BASE, ...overrides } });
}

describe('the SLEF export layer', () => {
  it('draws the payload as a readable, selectable, labelled field', () => {
    const fixture = render();
    const field = query(fixture, 'textarea') as HTMLTextAreaElement;

    expect(field.readOnly).toBe(true);
    expect(field.disabled).toBe(false);
    expect(field.value).toBe(BASE.payload);
    expect(textOf(element(fixture).querySelector('label'))).toContain('SLEF payload');
  });

  it('states what the payload is, beneath it', () => {
    expect(textOf(query(render(), '.slef-export__meta'))).toBe(BASE.metadata);
  });

  it('says an invalid build is invalid, and exports it anyway', () => {
    const fixture = render({ validation: 'The Almanac reports this build as invalid.' });

    expect(textOf(element(fixture))).toContain('reports this build as invalid');
    expect((query(fixture, 'textarea') as HTMLTextAreaElement).value).toBe(BASE.payload);
  });

  it('explains whether a link travelled with the payload', () => {
    expect(textOf(query(render(), '.slef-export__link'))).toContain('carries a link');
    expect(
      textOf(query(render({ link: 'The export carries no link.' }), '.slef-export__link')),
    ).toContain('no link');
  });

  it('says the payload is being prepared, rather than showing an empty field', () => {
    const fixture = render({ payload: '', metadata: null, generating: 'Preparing this export' });

    expect(textOf(element(fixture))).toContain('Preparing this export');
  });

  it('says why the payload went away when the build moved on', () => {
    const fixture = render({
      payload: '',
      metadata: null,
      stale: 'This build has changed since the export was made. Make it again.',
    });

    expect(textOf(element(fixture))).toContain('has changed since the export was made');
  });

  it('always offers Download and Copy, and Share only when it was offered', () => {
    const drawn = render();
    expect([...element(drawn).querySelectorAll('button')].map((one) => textOf(one))).toEqual([
      'Download',
      'Copy',
    ]);

    const withShare = render({
      actions: [...BASE.actions, { action: 'share', label: 'Share', status: null, failed: false }],
    });
    expect([...element(withShare).querySelectorAll('button')].map((one) => textOf(one))).toEqual([
      'Download',
      'Copy',
      'Share',
    ]);
  });

  it('reports a failed delivery without taking the payload away', () => {
    const fixture = render({
      actions: [
        { action: 'download', label: 'Download', status: null, failed: false },
        { action: 'copy', label: 'Copy', status: 'The payload could not be copied.', failed: true },
      ],
    });

    expect(textOf(element(fixture))).toContain('could not be copied');
    expect((query(fixture, 'textarea') as HTMLTextAreaElement).value).toBe(BASE.payload);
  });

  it('emits one intent per action and performs none of them', () => {
    const fixture = render({
      actions: [...BASE.actions, { action: 'share', label: 'Share', status: null, failed: false }],
    });
    const emitted: string[] = [];
    fixture.componentInstance.downloadRequested.subscribe(() => emitted.push('download'));
    fixture.componentInstance.copyRequested.subscribe(() => emitted.push('copy'));
    fixture.componentInstance.shareRequested.subscribe(() => emitted.push('share'));

    for (const button of element(fixture).querySelectorAll('button')) {
      button.click();
    }

    expect(emitted).toEqual(['download', 'copy', 'share']);
  });

  it('offers no delivery of a payload that is not there', () => {
    const fixture = render({ payload: '', metadata: null });

    for (const button of element(fixture).querySelectorAll('button')) {
      expect(button.hasAttribute('disabled')).toBe(true);
    }
  });
});
