import { element, query, renderComponent } from '../ui-component.spec-helpers';
import { ToolCard } from './tool-card';

const INPUTS = {
  name: 'Ship Builder',
  href: '/ships',
  subjects: 'Shipyard · Outfitting · Anatomy · Power',
  summary: 'Fit any ship slot by slot, set power priorities, apply engineering blueprints.',
  short: 'Ships, module slots, power priorities, engineering.',
};

describe('ToolCard', () => {
  it('is one link to the tool, named by the tool', () => {
    // The canvas makes the whole plate the target. A link inside a clickable
    // box would be two controls for one destination, and a reader moving
    // through a link list should hear the tool's name rather than its prose.
    const root = element(renderComponent(ToolCard, INPUTS));
    const links = root.querySelectorAll('a');

    expect(links.length).toBe(1);
    expect(links[0].getAttribute('href')).toBe('/ships');
    expect(links[0].querySelector('.tool-card__name')?.textContent?.trim()).toBe('Ship Builder');
  });

  it('carries both descriptions and the subject list in the document', () => {
    // Which one a Commander reads is the stylesheet's answer. A card that
    // chose from a measured width would say something different depending on
    // when it happened to render.
    const fixture = renderComponent(ToolCard, INPUTS);

    expect(query(fixture, '.tool-card__summary').textContent?.trim()).toBe(INPUTS.summary);
    expect(query(fixture, '.tool-card__short').textContent?.trim()).toBe(INPUTS.short);
    expect(query(fixture, '.tool-card__subjects').textContent?.trim()).toBe(INPUTS.subjects);
  });

  it('hides the go mark from a reader', () => {
    // The link already says where it goes; an arrow read aloud after the name
    // says it a second time (canvas 1b's `.hm-go`).
    expect(query(fixture(), '.tool-card__mark').getAttribute('aria-hidden')).toBe('true');
  });

  it('reports an activation rather than navigating itself', () => {
    // A shared component renders state and dispatches intent; the screen that
    // owns the card decides what a click means (constitution III).
    const fixture = renderComponent(ToolCard, INPUTS);
    const seen: MouseEvent[] = [];
    fixture.componentInstance.opened.subscribe((event) => seen.push(event));

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    query(fixture, '.tool-card').dispatchEvent(event);

    expect(seen).toEqual([event]);
  });

  function fixture() {
    return renderComponent(ToolCard, INPUTS);
  }
});
