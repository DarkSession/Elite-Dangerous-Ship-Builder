import { TestBed } from '@angular/core/testing';
import { AppFrame } from './app-frame/app-frame';
import { StatusNotice } from './status/status-notice';
import { UnavailableValue } from './unavailable-value/unavailable-value';
import { BUNDLED_ENGLISH } from '../../i18n/locale-registry';
import { LocaleStore } from '../../i18n/locale.store';
import {
  describedText,
  element,
  query,
  renderComponent,
  textOf,
} from './ui-component.spec-helpers';

describe('StatusNotice', () => {
  it('names the tone in text, so colour is never the only signal', () => {
    const fixture = renderComponent(StatusNotice, {
      tone: 'error',
      message: 'Draw exceeds output.',
    });

    expect(textOf(query(fixture, '.status__tone'))).toBe(BUNDLED_ENGLISH['status.error']);
  });

  it('names every tone it supports', () => {
    const expected = {
      info: BUNDLED_ENGLISH['status.info'],
      success: BUNDLED_ENGLISH['status.success'],
      warning: BUNDLED_ENGLISH['status.warning'],
      error: BUNDLED_ENGLISH['status.error'],
      loading: BUNDLED_ENGLISH['status.loading'],
    } as const;

    for (const [tone, label] of Object.entries(expected)) {
      const fixture = renderComponent(StatusNotice, { tone, message: 'A message.' });

      expect(textOf(query(fixture, '.status__tone')), tone).toBe(label);
    }
  });

  it('lets a capability supply a better name for the state', () => {
    const fixture = renderComponent(StatusNotice, {
      tone: 'warning',
      message: 'Draw is close to the limit.',
      toneLabel: 'Near limit',
    });

    expect(textOf(query(fixture, '.status__tone'))).toBe('Near limit');
  });

  it('exposes an error as an alert and everything else as a status', () => {
    expect(
      query(renderComponent(StatusNotice, { tone: 'error', message: 'x' }), '.status').getAttribute(
        'role',
      ),
    ).toBe('alert');
    expect(
      query(renderComponent(StatusNotice, { tone: 'info', message: 'x' }), '.status').getAttribute(
        'role',
      ),
    ).toBe('status');
  });

  it('is ordinary content rather than a live region', () => {
    const fixture = renderComponent(StatusNotice, { tone: 'info', message: 'x' });

    expect(query(fixture, '.status').getAttribute('aria-live')).toBeNull();
  });

  it('associates a detail with the notice', () => {
    const fixture = renderComponent(StatusNotice, {
      tone: 'error',
      message: 'Draw exceeds output.',
      detail: 'Fit a larger plant.',
    });

    expect(describedText(query(fixture, '.status'))).toContain('Fit a larger plant.');
  });

  it('marks itself as a visual carrier so the sweep checks its text equivalent', () => {
    const fixture = renderComponent(StatusNotice, { tone: 'info', message: 'x' });

    expect(query(fixture, '.status').getAttribute('data-visual-carrier')).toBe('status-tone');
  });
});

describe('UnavailableValue', () => {
  it('states the absence in words rather than as a zero or a dash', () => {
    const fixture = renderComponent(UnavailableValue, {});
    const text = textOf(element(fixture));

    expect(text).toBe(BUNDLED_ENGLISH['unavailable.value']);
    expect(text).not.toContain('0');
    expect(text).not.toContain('—');
  });

  it('includes a known reason in the stated value', () => {
    const fixture = renderComponent(UnavailableValue, {
      reason: 'No value is available for this.',
    });

    expect(textOf(query(fixture, '.unavailable__text'))).toContain(
      'No value is available for this.',
    );
  });

  it('associates the reason with the value', () => {
    const fixture = renderComponent(UnavailableValue, { reason: 'No canonical text exists.' });

    expect(describedText(query(fixture, '.unavailable'))).toContain('No canonical text exists.');
  });

  it('keeps incomplete distinct from unavailable', () => {
    const incomplete = renderComponent(UnavailableValue, { kind: 'incomplete' });
    const unavailable = renderComponent(UnavailableValue, { kind: 'unavailable' });

    expect(textOf(element(incomplete))).toBe(BUNDLED_ENGLISH['incomplete.value']);
    expect(textOf(element(incomplete))).not.toBe(textOf(element(unavailable)));
  });

  it('gives the absence context when a label is supplied', () => {
    const fixture = renderComponent(UnavailableValue, { label: 'Total range' });

    expect(textOf(query(fixture, '.unavailable__label'))).toBe('Total range');
  });
});

describe('AppFrame', () => {
  it('exposes the banner and main landmarks', () => {
    const fixture = renderComponent(AppFrame, {});

    expect(query(fixture, 'header').getAttribute('aria-label')).toBe(
      BUNDLED_ENGLISH['shell.banner.label'],
    );
    expect(element(fixture).querySelectorAll('main').length).toBe(1);
  });

  // The reference's command bar carries the screen's own name and no product
  // name, so that name is the document's one `h1` (canvas 1a/1b/1c).
  it('renders the screen name supplied to it as the document heading', () => {
    const fixture = renderComponent(AppFrame, { routeContext: 'Anaconda explorer' });
    const headings = [...element(fixture).querySelectorAll('h1')];

    expect(headings).toHaveLength(1);
    expect(textOf(headings[0])).toBe('Anaconda explorer');
  });

  it('synthesizes no heading for a route that names none', () => {
    const fixture = renderComponent(AppFrame, {});

    expect(element(fixture).querySelector('h1')).toBeNull();
  });

  it('carries the screen count beside that name', () => {
    const fixture = renderComponent(AppFrame, {
      routeContext: 'Ship Builder',
      routeCount: '48 of 48 hulls shown',
    });

    expect(textOf(query(fixture, '.frame__count'))).toBe('48 of 48 hulls shown');
  });

  it('omits navigation entirely when the route set provides none', () => {
    const fixture = renderComponent(AppFrame, {});

    expect(element(fixture).querySelector('nav')).toBeNull();
  });

  it('names the tool region and marks the tool a Commander is in', () => {
    const fixture = renderComponent(AppFrame, {
      tools: [
        { id: 'ship', label: 'Ship Builder', href: '/ships', current: true },
        { id: 'equipment', label: 'Equipment Builder', href: '/equipment' },
      ],
    });
    const nav = query(fixture, 'nav');
    const entries = element(fixture).querySelectorAll('.frame__tool');

    // The shell's one navigation landmark. The primary navigation row it used
    // to sit beside held exactly one entry, the saved builds, and went when
    // they became an action (Commander request 2026-09-04).
    expect(nav.getAttribute('aria-label')).toBe(BUNDLED_ENGLISH['shell.tools.label']);
    expect(entries[0]?.getAttribute('aria-current')).toBe('true');
    expect(entries[1]?.getAttribute('aria-current')).toBeNull();
  });

  it('gives every action visible text in both compositions', () => {
    // The frame renders the wide row and the folded layer together and lets a
    // media query present one of them, so neither composition needs a viewport
    // measurement taken in TypeScript. A unit test has no stylesheet, so both
    // are in the DOM here — which is exactly what makes this the right place to
    // check that the two carry the same actions and the same words.
    const fixture = renderComponent(AppFrame, {
      actions: [
        { id: 'save', label: 'Save', emphasis: 'primary' },
        { id: 'language', label: 'Language' },
      ],
    });
    const labelsIn = (selector: string): string[] =>
      [...element(fixture).querySelectorAll(`${selector} .action__label`)].map((node) =>
        textOf(node),
      );

    expect(labelsIn('.frame__actions')).toEqual(['Save', 'Language']);
    expect(labelsIn('edsb-action-layer')).toEqual(['Save', 'Language']);
    expect(textOf(query(fixture, '.action-layer__trigger-label'))).toBe(
      BUNDLED_ENGLISH['shell.actions.open'],
    );
  });

  it('closes the folded action layer when one of its actions is taken', () => {
    const fixture = renderComponent(AppFrame, { actions: [{ id: 'save', label: 'Save' }] });
    const emitted: string[] = [];
    fixture.componentInstance.actionSelected.subscribe((id) => emitted.push(id));

    query(fixture, '.action-layer__trigger').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.actionsOpen()).toBe(true);

    query(fixture, 'edsb-action-layer .action').click();
    fixture.detectChanges();

    expect(emitted).toEqual(['save']);
    expect(fixture.componentInstance.actionsOpen()).toBe(false);
  });

  it('emits action intent rather than acting', () => {
    const fixture = renderComponent(AppFrame, { actions: [{ id: 'save', label: 'Save' }] });
    const emitted: string[] = [];
    fixture.componentInstance.actionSelected.subscribe((id) => emitted.push(id));

    query(fixture, '.frame__actions button').click();

    expect(emitted).toEqual(['save']);
  });

  it('emits nothing for a disabled action', () => {
    const fixture = renderComponent(AppFrame, {
      actions: [{ id: 'save', label: 'Save', disabled: true }],
    });
    let emissions = 0;
    fixture.componentInstance.actionSelected.subscribe(() => (emissions += 1));

    fixture.componentInstance.selectAction({ id: 'save', label: 'Save', disabled: true });

    expect(emissions).toBe(0);
  });

  it('renders visible feedback in ordinary reading order, before main', () => {
    const fixture = renderComponent(AppFrame, {
      status: { tone: 'error', message: 'This build could not be saved.' },
    });
    const status = query(fixture, '.frame__status');
    const main = query(fixture, 'main');

    expect(textOf(status)).toContain('This build could not be saved.');
    expect(status.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps every standing notice, so one does not hide another', () => {
    const fixture = renderComponent(AppFrame, {
      status: { tone: 'info', message: 'A newer version is available.' },
    });
    // A language that could not be loaded and a version waiting to be applied
    // are independent facts, and a region that showed only the first would drop
    // the other without saying so.
    TestBed.inject(LocaleStore).commitFallbackToEnglish('de-DE', 'load-failed', 'browser');
    fixture.detectChanges();

    const notices = query(fixture, '.frame__status').querySelectorAll('edsb-status-notice');

    expect(notices.length).toBe(2);
    expect(textOf(notices[0])).toContain('A newer version is available.');
    expect(textOf(notices[1])).toContain('de-DE');
  });

  it('mounts exactly two live regions and no more', () => {
    const fixture = renderComponent(AppFrame, {
      status: { tone: 'info', message: 'A message.' },
    });

    expect(element(fixture).querySelectorAll('[aria-live]').length).toBe(2);
  });

  it('keeps the outlets silent until something is announced', () => {
    const fixture = renderComponent(AppFrame, {});
    const assertive = query(fixture, '[data-announcement-outlet="assertive"]');
    const polite = query(fixture, '[data-announcement-outlet="polite"]');

    expect(textOf(assertive)).toBe('');
    expect(textOf(polite)).toBe('');
  });
});
