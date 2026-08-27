import englishCatalogue from '../../i18n/locales/en.json';
import { candidateMembership } from '../../application/outfitting/candidate-membership';
import {
  applyQuery,
  groupFamilies,
  openCandidateQuery,
  type CandidateFamilyView,
} from '../../application/outfitting/candidate-query';
import {
  FIXTURE_SLOTS,
  defaultBuild,
  packageText,
} from '../../domain/outfitting/outfitting.fixtures';
import {
  accessibleName,
  describedText,
  element,
  query,
  renderComponent,
  textOf,
} from '../components/ui-component.spec-helpers';
import { AcquisitionBadge } from './acquisition-badge';
import { CandidateList } from './candidate-list';
import { CandidateSearch } from './candidate-search';
import { declareMeasurement, declareResizeObserver } from '../measurement.spec-helpers';

/**
 * What the chooser promises a reader.
 *
 * The list is rendered from the real package expansion rather than from a
 * hand-written row, because the things being asserted — that a family control
 * publishes its state, that an absent figure is a word, that a restriction is
 * text — are only worth asserting against the shapes the Almanac produces.
 */

const COLLATOR = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

/**
 * The real family list for a mount, opened as the tests need it.
 *
 * `open: 'all'` is the ordinary case here: most of these assertions are about
 * what a *row* draws, and a row a closed family is holding is not in the
 * document at all.
 */
function familiesFor(
  slotKey: string,
  query = '',
  open: 'all' | 'none' = 'all',
): readonly CandidateFamilyView[] {
  const state = applyQuery(
    openCandidateQuery(
      candidateMembership(defaultBuild(), slotKey, 1, packageText('en')),
      'en',
      COLLATOR,
    ),
    query,
  );
  const ids =
    open === 'none'
      ? new Set<(typeof state.results)[number]['presentation']['familyId']>()
      : new Set(state.results.map((choice) => choice.presentation.familyId));
  return groupFamilies(state.results, ids);
}

/**
 * The same list under canvas 1c's rail, since jsdom lays nothing out on its own.
 *
 * `observeManifest` reads the host's own box and the root text size, so the
 * rail is reached by giving it a box wide enough for one — the same device the
 * sticky-banner spec uses, and for the same reason: the measurement is the
 * thing under test, and a component that decided its own manifest from a flag
 * would not be testing the decision at all.
 */
let declared: readonly (() => void)[] = [];

function withHostWidth(width: number): void {
  withoutHostWidth();
  // Both declarations, and the rule about which prototype carries the width,
  // come from `measurement.spec-helpers`: undoing one of these by assignment
  // leaves the genuine method behind as an own property on
  // `HTMLElement.prototype`, shadowing the level other specs patch.
  declared = [declareResizeObserver(), declareMeasurement({ width, right: width })];
}

function withoutHostWidth(): void {
  for (const undo of declared) {
    undo();
  }
  declared = [];
}

/** Every choice a family list holds, flattened. */
function choicesOf(families: readonly CandidateFamilyView[]) {
  return families.flatMap((family) => family.choices);
}

describe('candidate search', () => {
  it('binds a real label and its instructions to the field', () => {
    const fixture = renderComponent(CandidateSearch, { resultCount: 12 });
    const input = query(fixture, 'input');
    const label = query(fixture, 'label');

    // The canvas draws the words in the placeholder and no label above it. The
    // label is here all the same, a real `<label>` bound to the control.
    expect(label.getAttribute('for')).toBe(input.id);
    expect(textOf(label).length).toBeGreaterThan(0);
    expect(input.getAttribute('placeholder')).not.toBeNull();
    // And the instructions say what the search actually covers, so a Commander
    // who types a symbol and gets nothing knows why.
    expect(describedText(input)).toContain('class');
  });

  it('announces the result count politely rather than drawing it here', () => {
    const fixture = renderComponent(CandidateSearch, { resultCount: 12 });
    const live = query(fixture, '[role="status"]');

    expect(textOf(live)).toContain('12');
    expect(live.classList.contains('visually-hidden')).toBe(true);
  });

  it('offers a way back to the whole list only when there is something to clear', () => {
    const without = renderComponent(CandidateSearch, { resultCount: 12, canClear: false });
    expect(element(without).querySelector('.search__clear')).toBeNull();

    const withClear = renderComponent(CandidateSearch, { resultCount: 0, canClear: true });
    expect(textOf(query(withClear, '.search__clear')).length).toBeGreaterThan(0);
  });

  it('names a modifier key rather than shipping one platform’s glyph everywhere', () => {
    const fixture = renderComponent(CandidateSearch, { resultCount: 1 });
    const hint = query(fixture, '.search__shortcut');

    // Whichever platform this runs on, the hint is a sentence in the reader's
    // language and is hidden from assistive technology: it names a convenience,
    // and the field is already reachable and already named.
    expect(hint.getAttribute('aria-hidden')).toBe('true');
    expect(textOf(hint)).toMatch(/K/);
  });
});

describe('acquisition badge', () => {
  it('says nothing when the package puts no restriction on a module', () => {
    const fixture = renderComponent(AcquisitionBadge, { labels: [] });

    expect(element(fixture).querySelector('.acquisition')).toBeNull();
  });

  it('renders every stacked restriction as text, not as a colour', () => {
    const fixture = renderComponent(AcquisitionBadge, {
      labels: [
        {
          kind: 'communityGoal',
          packageValue: 'communityGoal',
          messageKey: 'outfitting.acquisition.communityGoal',
          params: null,
        },
        {
          kind: 'uniqueReward',
          packageValue: 'communityGoal',
          messageKey: 'outfitting.acquisition.uniqueReward',
          params: null,
        },
        {
          kind: 'entitlement',
          packageValue: 'ELITE_HORIZONS_V_PLANETARY_LANDINGS',
          messageKey: 'outfitting.acquisition.entitlement',
          params: { token: 'ELITE_HORIZONS_V_PLANETARY_LANDINGS' },
        },
      ],
    });

    const items = element(fixture).querySelectorAll('.acquisition__item');
    expect(items.length).toBe(3);

    // The reward is stated in words rather than drawn. Its chip is withdrawn —
    // the canvas replaced it with the icon of the route the article is earned
    // through, and that icon is on the community-goal label above it, where the
    // package value it was projected from actually lives.
    expect(textOf(items[1]!)).toContain('reward');
    expect(element(fixture).querySelector('.acquisition__chip--reward')).toBeNull();
    expect(items[0]!.querySelector('.acquisition__route')).not.toBeNull();
    expect(textOf(element(fixture))).toContain('ELITE_HORIZONS_V_PLANETARY_LANDINGS');
  });

  it('lets a mark be asked what it means, without a title', () => {
    const fixture = renderComponent(AcquisitionBadge, {
      labels: [
        {
          kind: 'powerplay',
          packageValue: 'powerplay',
          messageKey: 'outfitting.acquisition.powerplay',
          params: null,
        },
      ],
    });

    const item = element(fixture).querySelector('.acquisition__item')!;
    const tooltip = item.querySelector('edsb-tooltip')!;
    const mark = item.querySelector('.acquisition__route')!;

    // Canvas 1c gives every one of these icons a tip. It hangs on the design
    // system's tooltip rather than on a `title`, which touch cannot reach at
    // all, and it carries the mark's own short gloss.
    expect(tooltip.querySelector('[role="tooltip"]')?.textContent?.trim()).toBe(
      englishCatalogue['outfitting.acquisition.short.powerplay'],
    );
    expect(mark.getAttribute('title')).toBeNull();
    // Still presentational: the tip is a way to see a restriction the row
    // already states in words, never a second announcement of it.
    expect(mark.getAttribute('alt')).toBe('');
    expect(tooltip.getAttribute('aria-hidden')).toBe('true');
    // No control of any kind inside the mark. The badge is projected into the
    // ledger row's own select button, so a button here would be a button inside
    // a button — invalid, and `nested-interactive` to an accessibility scan.
    expect(tooltip.querySelector('button, [role="button"], [tabindex]')).toBeNull();
    expect(textOf(item as HTMLElement)).toContain(
      englishCatalogue['outfitting.acquisition.powerplay'],
    );
  });

  it('acts on the mark and never on the row the mark is drawn in', () => {
    // A chooser row is a `label` around its own radio, and taking one at wide
    // width fits the module. A tap asking what an icon means must not fit the
    // article it is drawn on, so the press stops at the mark.
    const fixture = renderComponent(AcquisitionBadge, {
      labels: [
        {
          kind: 'powerplay',
          packageValue: 'powerplay',
          messageKey: 'outfitting.acquisition.powerplay',
          params: null,
        },
      ],
    });

    const mark = element(fixture).querySelector<HTMLElement>('.tooltip__trigger--mark')!;
    const press = new MouseEvent('click', { bubbles: true, cancelable: true });
    let reachedTheRow = false;
    element(fixture).addEventListener('click', () => {
      reachedTheRow = true;
    });

    mark.dispatchEvent(press);
    fixture.detectChanges();

    expect(reachedTheRow).toBe(false);
    expect(press.defaultPrevented).toBe(true);
    // And it still did its own job.
    expect(element(fixture).querySelector('.tooltip__tip--shown')).not.toBeNull();
  });
});

describe('candidate list', () => {
  it('names each family, counts it, and publishes whether it is open', () => {
    const families = familiesFor(FIXTURE_SLOTS.hardpoint, '', 'none');
    const fixture = renderComponent(CandidateList, {
      families,
      label: 'Modules for this mount',
    });

    const controls = Array.from(element(fixture).querySelectorAll('.family'));
    expect(controls.length).toBe(families.length);
    expect(controls.length).toBeGreaterThan(1);

    controls.forEach((control, index) => {
      const family = families[index]!;
      const name = accessibleName(control as HTMLElement);

      // The Almanac's own name, and the count spoken beside the drawn figure.
      expect(name).toContain(family.name.text!);
      expect(name).toContain(String(family.count));
      // Closed state is programmatic, never the caret alone (FR-022).
      expect(control.getAttribute('aria-expanded')).toBe('false');
      expect(control.getAttribute('aria-controls')).not.toBeNull();
    });

    // A closed family contributes its control and no rows at all, which is what
    // puts a screenful in front of a Commander instead of hundreds of cards.
    expect(element(fixture).querySelectorAll('.candidate')).toHaveLength(0);
  });

  it('opens a family into a named region holding exactly its rows', () => {
    const families = familiesFor(FIXTURE_SLOTS.hardpoint, 'multi-cannon');
    const fixture = renderComponent(CandidateList, {
      families,
      label: 'Modules for this mount',
    });

    const control = query(fixture, '.family');
    expect(control.getAttribute('aria-expanded')).toBe('true');

    const region = element(fixture).querySelector(`#${control.getAttribute('aria-controls')}`)!;
    expect(region.getAttribute('aria-labelledby')).toBe(control.id);
    expect(region.querySelectorAll('.candidate')).toHaveLength(families[0]!.count);
  });

  it('draws no section or group heading at all', () => {
    const fixture = renderComponent(CandidateList, {
      families: familiesFor(FIXTURE_SLOTS.hardpoint),
      label: 'Modules for this mount',
    });

    // Both levels are withdrawn with their headings: a reward is marked on its
    // own row inside its family instead (FR-024, decision 14).
    expect(element(fixture).querySelectorAll('h3, h4')).toHaveLength(0);
    expect(textOf(element(fixture))).not.toContain('Unique rewards');
    expect(textOf(element(fixture))).not.toContain('Standard modules');

    // And the fact the heading used to stand for is still on the row: the icon
    // of the route the article is earned through, with the sentence that says
    // so beside it for anyone who cannot see an icon.
    const marked = Array.from(
      element(fixture).querySelectorAll('.candidate:has(.acquisition__route)'),
    );
    expect(marked.length).toBeGreaterThan(0);

    // A reward among them, marked by its route and explained in the sentence
    // beside it. The mount also offers Powerplay articles, which carry a route
    // icon of their own and a different sentence — so the reward is found by
    // what it says rather than by the fact that it is marked.
    const reward = marked.find((row) => textOf(row).includes('It is not sold anywhere'));
    expect(reward).toBeDefined();
  });

  it('reports one family opened, and reports nothing else', () => {
    const families = familiesFor(FIXTURE_SLOTS.hardpoint, '', 'none');
    const toggled: string[] = [];
    const fixture = renderComponent(CandidateList, {
      families,
      label: 'Modules for this mount',
    });
    fixture.componentInstance.familyToggled.subscribe((id: string) => toggled.push(id));

    (query(fixture, '.family') as HTMLButtonElement).click();

    expect(toggled).toEqual([families[0]!.familyId]);
  });

  it('gives every row a name that distinguishes it from its neighbours', () => {
    const fixture = renderComponent(CandidateList, {
      families: familiesFor(FIXTURE_SLOTS.hardpoint, 'multi-cannon'),
      label: 'Modules for this mount',
    });

    const names = Array.from(element(fixture).querySelectorAll('input[type="radio"]')).map(
      (radio) => accessibleName(radio as HTMLElement),
    );

    expect(names.length).toBeGreaterThan(1);
    expect(new Set(names).size).toBe(names.length);
  });

  it('tells two rewards of one module apart, rather than marking both', () => {
    // The Almanac sells the same blaster through the Merc-Coin shop at grade 1
    // and through a community goal at grade 5. They share a symbol and a name,
    // so a row that matched on either marked two articles as the one in the
    // mount (wave 4).
    const families = familiesFor(FIXTURE_SLOTS.hardpoint);
    const variants = choicesOf(families).filter((choice) => choice.kind === 'variant');
    const fitted = variants[0];
    expect(fitted).toBeDefined();

    const fixture = renderComponent(CandidateList, {
      families,
      label: 'Modules for this mount',
      fittedSymbol: fitted!.module.symbol,
      fittedVariant: fitted!.kind === 'variant' ? fitted!.variant : null,
    });

    expect(element(fixture).querySelectorAll('.candidate--fitted')).toHaveLength(1);
  });

  it('states the selection rather than only colouring it', () => {
    const families = familiesFor(FIXTURE_SLOTS.hardpoint, 'multi-cannon');
    const chosen = families[0]!.choices[0]!;
    const fixture = renderComponent(CandidateList, {
      families,
      label: 'Modules for this mount',
      selectedKey: chosen.key,
    });

    const radio = query(fixture, 'input[type="radio"]') as HTMLInputElement;
    expect(radio.checked).toBe(true);
  });

  it('brings the fitted row to the middle of the list rather than leaving it found', () => {
    // The seeded family can be anywhere in the Almanac's order, so the row a
    // Commander came to see can open three quarters of the way down a list of
    // seventy-seven. It is scrolled to, not merely rendered.
    //
    // What is asserted is that the list's own box is the thing scrolled. There
    // is no layout in this environment, so the arithmetic lands on zero and the
    // figure proves nothing; which element is written to proves the rest. A
    // `scrollIntoView` here would walk every scrollable ancestor up to the
    // document, and at a short viewport the document is what scrolls.
    const families = familiesFor(FIXTURE_SLOTS.hardpoint, 'multi-cannon');
    const fitted = families[0]!.choices[0]!;
    const scrolled: string[] = [];
    const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop')!;

    Object.defineProperty(Element.prototype, 'scrollTop', {
      ...descriptor,
      set(this: Element, value: number) {
        scrolled.push(this.className);
        descriptor.set?.call(this, value);
      },
    });

    try {
      renderComponent(CandidateList, {
        families,
        label: 'Modules for this mount',
        fittedSymbol: fitted.module.symbol,
      });
    } finally {
      Object.defineProperty(Element.prototype, 'scrollTop', descriptor);
    }

    expect(scrolled).toEqual(['candidates__body']);
  });

  it('leaves the list where it is while a query is narrowing it', () => {
    // A search must not drag the scroller back to a row a Commander has typed
    // past, and the fitted row leaving and re-entering the results is exactly
    // when that would happen.
    const families = familiesFor(FIXTURE_SLOTS.hardpoint, 'multi-cannon');
    const fitted = families[0]!.choices[0]!;
    const scrolled: string[] = [];
    const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop')!;

    Object.defineProperty(Element.prototype, 'scrollTop', {
      ...descriptor,
      set(this: Element, value: number) {
        scrolled.push(this.className);
        descriptor.set?.call(this, value);
      },
    });

    try {
      renderComponent(CandidateList, {
        families,
        label: 'Modules for this mount',
        fittedSymbol: fitted.module.symbol,
        searching: true,
      });
    } finally {
      Object.defineProperty(Element.prototype, 'scrollTop', descriptor);
    }

    expect(scrolled).toEqual([]);
  });

  it('says a fitted module is fitted, in words, beside the ground that shows it', () => {
    // The canvas marks the fitted row with its amber ground and writes nothing
    // on it. The word is here all the same and read rather than drawn, so the
    // state is never carried by the colour alone.
    const families = familiesFor(FIXTURE_SLOTS.hardpoint, 'multi-cannon');
    const fitted = families[0]!.choices[0]!;
    const fixture = renderComponent(CandidateList, {
      families,
      label: 'Modules for this mount',
      fittedSymbol: fitted.module.symbol,
    });

    const row = query(fixture, '.candidate--fitted');
    expect(textOf(row)).toContain('Fitted');
    expect(row.querySelector('.candidate__state')).toBeNull();
  });

  it('writes a word where the Almanac published no figure, never a zero', () => {
    // A core internal carries no weapon damage, so the damage column is absent
    // rather than nought on every one of its rows.
    const fixture = renderComponent(CandidateList, {
      families: familiesFor(FIXTURE_SLOTS.core),
      label: 'Modules for this mount',
    });

    const firstRow = query(fixture, '.candidate');
    const facts = firstRow.querySelectorAll('.candidate__fact');
    expect(facts.length).toBe(5);

    const damage = textOf(facts[0]!);
    expect(damage).not.toMatch(/\b0\b/);
    expect(damage.length).toBeGreaterThan(textOf(facts[0]!.querySelector('.fact__label')).length);
  });

  it('draws the column names once, and hides them from a reader who hears them per row', () => {
    const fixture = renderComponent(CandidateList, {
      families: familiesFor(FIXTURE_SLOTS.core),
      label: 'Modules for this mount',
    });

    const header = query(fixture, '.candidates__columns');
    expect(header.getAttribute('aria-hidden')).toBe('true');
    // `MODULE · CLASS` and the five figure columns, as canvas 1d heads them.
    expect(header.querySelectorAll('.candidates__column').length).toBe(7);
  });
});

/**
 * Canvas 1c's manifest since the 2026-08-25 revision: a rail, and one pane.
 *
 * The accordion above is canvas 1d and is unchanged. What is asserted here is
 * everything the revision made different — the shape, the exclusive selection,
 * the missing caret and the three columns a row is drawn in.
 */
describe('the wide manifest', () => {
  /** Wide enough for the rail, in the units the observer measures in. */
  const RAIL_WIDTH = 44 * 16;

  beforeEach(() => withHostWidth(RAIL_WIDTH));
  afterEach(() => withoutHostWidth());

  function railFixture(slotKey: string = FIXTURE_SLOTS.hardpoint) {
    const families = familiesFor(slotKey, '', 'none');
    // The rail always has a selection: the state that feeds it seeds one, and
    // the component falls back to the first family rather than painting an
    // empty pane. Handed a list with nothing revealed, it draws the first.
    return { families, fixture: renderComponent(CandidateList, { families, label: 'Modules' }) };
  }

  it('draws a rail of every family beside a pane of exactly one', () => {
    const { families, fixture } = railFixture();

    expect(element(fixture).getAttribute('data-manifest')).toBe('rail');

    const rail = Array.from(element(fixture).querySelectorAll('.family--rail'));
    expect(rail.length).toBe(families.length);
    expect(rail.length).toBeGreaterThan(1);

    // Exactly one selected, always, and the state is programmatic rather than
    // the amber edge alone (FR-022).
    const pressed = rail.filter((row) => row.getAttribute('aria-pressed') === 'true');
    expect(pressed).toHaveLength(1);

    rail.forEach((row, index) => {
      const name = accessibleName(row as HTMLElement);
      expect(name).toContain(families[index]!.name.text!);
      expect(name).toContain(String(families[index]!.count));
    });

    const pane = query(fixture, '.candidates__pane');
    expect(pane.getAttribute('aria-labelledby')).toBe(pressed[0]!.id);
    expect(pane.querySelectorAll('.candidate')).toHaveLength(families[0]!.count);
  });

  it('draws no caret at this width, because there is nothing to expand', () => {
    const { fixture } = railFixture();

    expect(element(fixture).querySelectorAll('.family__caret')).toHaveLength(0);
    // And no `aria-expanded` either: a rail row is a selection, not a
    // disclosure, and publishing both states would be two answers to one
    // question.
    expect(element(fixture).querySelectorAll('.family--rail[aria-expanded]')).toHaveLength(0);
  });

  it('heads and draws three columns, and withdraws the other four', () => {
    const { fixture } = railFixture(FIXTURE_SLOTS.core);

    const header = query(fixture, '.candidates__columns');
    // `MODULE`, `CLASS`, `COST`, and no damage, mass, power or weapon draw
    // (FR-024's 2026-08-25 narrowing, SC-006).
    expect(header.querySelectorAll('.candidates__column').length).toBe(3);

    const row = query(fixture, '.candidates__pane .candidate');
    expect(row.querySelectorAll('.candidate__fact')).toHaveLength(1);
    expect(row.querySelector('.candidate__cost')).not.toBeNull();
  });

  it('reports the manifest it measured, so the revealed set can be seeded for it', () => {
    const { fixture } = railFixture();
    const reported: string[] = [];
    fixture.componentInstance.manifestChanged.subscribe((manifest: string) =>
      reported.push(manifest),
    );

    expect(fixture.componentInstance.manifest()).toBe('rail');
    // Whatever it has already reported, what it reports from here is the rail:
    // the subscription is late, so the assertion is on the signal it publishes
    // and on the next report rather than on a replay it never had.
    fixture.detectChanges();
    expect(reported.every((manifest) => manifest === 'rail')).toBe(true);
  });

  it('asks for one family when a rail row is chosen, exactly as the accordion does', () => {
    const { families, fixture } = railFixture();
    const chosen: string[] = [];
    fixture.componentInstance.familyToggled.subscribe((familyId: string) => chosen.push(familyId));

    const rows = Array.from(element(fixture).querySelectorAll('.family--rail'));
    (rows[2] as HTMLElement).click();

    // The component asks; what exclusive selection means is the state's rule,
    // not the row's (`candidate-query.ts`, `toggleFamily`).
    expect(chosen).toEqual([families[2]!.familyId]);
  });

  /**
   * Renders the rail with a laid-out box, and reports what was scrolled.
   *
   * There is no layout in this environment, so every box is zero and a rule
   * written in terms of "is this row inside that box" cannot be exercised
   * without one. The rail is given a 470px box — the canvas's own bound — and
   * the selected row is placed at `rowTop`, which is the whole of what the rule
   * reads. Everything else keeps the real measurement, which is zero.
   */
  function railScrollFixture(
    rowTop: number,
    { press = false, rowHeight = 44 }: { press?: boolean; rowHeight?: number } = {},
  ): string[] {
    const scrolled: string[] = [];
    const scrollTop = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop')!;
    // On `HTMLElement.prototype`, and layered over whatever `withHostWidth`
    // declared rather than beside it: that helper patches this level precisely
    // so nothing can shadow it, and a rect declared on `Element.prototype` here
    // would be the thing shadowed (`measurement.spec-helpers.ts`). The width it
    // declares is what decides this is the rail manifest at all, so it has to
    // survive.
    const declared = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'getBoundingClientRect',
    )!;
    const measure = declared.value as (this: Element) => DOMRect;

    Object.defineProperty(Element.prototype, 'scrollTop', {
      ...scrollTop,
      set(this: Element, value: number) {
        scrolled.push(this.className);
        scrollTop.set?.call(this, value);
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      ...declared,
      value(this: Element): DOMRect {
        const rect = measure.call(this);
        if (this.classList.contains('candidates__rail')) {
          return Object.assign(rect, { top: 0, bottom: 470, height: 470 });
        }
        if (this.classList.contains('family--rail')) {
          return this.getAttribute('aria-pressed') === 'true'
            ? Object.assign(rect, { top: rowTop, bottom: rowTop + rowHeight, height: rowHeight })
            : Object.assign(rect, { top: 0, bottom: 0, height: 0 });
        }
        return rect;
      },
    });

    try {
      const { families, fixture } = railFixture();
      if (press) {
        // What the state does with a toggle, standing in for it: a rebuilt list
        // of rebuilt families with the asked-for one revealed. It has to be new
        // objects, because that is what makes `revealedFamily()` change and the
        // reveal effect run at all — a press answered with the identical array
        // re-runs nothing, and a test written that way would pass whether or
        // not the press is weighed.
        fixture.componentInstance.familyToggled.subscribe((familyId: string) => {
          fixture.componentRef.setInput(
            'families',
            families.map((family) => ({ ...family, open: family.familyId === familyId })),
          );
        });

        const pressed = element(fixture).querySelector<HTMLElement>(
          '.family--rail[aria-pressed="true"]',
        )!;
        // Only what the press causes is under test; the opening scroll is not.
        scrolled.length = 0;
        pressed.click();
        fixture.detectChanges();
      }
    } finally {
      Object.defineProperty(Element.prototype, 'scrollTop', scrollTop);
      Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', declared);
    }

    return scrolled;
  }

  it('brings a revealed family into the rail when it sits below the fold', () => {
    // Seventy-seven families in a box that holds ten: the family holding what
    // is fitted can be the sixtieth of them, and until it is scrolled to, the
    // pane changes while the rail goes on showing a different ten
    // (Commander request 2026-08-27).
    expect(railScrollFixture(2400)).toEqual(['candidates__rail']);
  });

  it('leaves a family the Commander pressed exactly where they pressed it', () => {
    // The rule, and the reason it is about who revealed the family rather than
    // about where the row happens to be: the rail is a 470px box of 44px rows,
    // so the row at either edge is routinely clipped, and a Commander can press
    // a clipped row. Re-centring under the finger that pressed it is the fault
    // the scroll exists to remove, in the other direction (reported in review,
    // 2026-08-27).
    expect(railScrollFixture(2400, { press: true })).toEqual([]);
  });

  it('leaves a revealed family alone when it is already whole in the rail', () => {
    // Restraint rather than rule: nothing to bring into view, so nothing moves.
    expect(railScrollFixture(120)).toEqual([]);
  });
});
