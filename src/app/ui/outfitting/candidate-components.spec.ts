import { candidateMembership } from '../../application/outfitting/candidate-membership';
import {
  applyQuery,
  groupCandidates,
  openCandidateQuery,
  type CandidateSectionView,
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

/**
 * What the chooser promises a reader.
 *
 * The list is rendered from the real package expansion rather than from a
 * hand-written row, because the things being asserted — that a section is
 * announced, that an absent figure is a word, that a restriction is text — are
 * only worth asserting against the shapes the Almanac actually produces.
 */

const COLLATOR = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

function sectionsFor(slotKey: string, query = ''): readonly CandidateSectionView[] {
  const state = applyQuery(
    openCandidateQuery(
      candidateMembership(defaultBuild(), slotKey, 1, packageText('en')),
      'en',
      COLLATOR,
    ),
    query,
  );
  return groupCandidates(state.results, COLLATOR);
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

    // The reward marker is the canvas's chip, and its reason is present for a
    // reader even where the sentence is not drawn.
    expect(textOf(items[1]!)).toContain('Reward only');
    expect(textOf(element(fixture))).toContain('ELITE_HORIZONS_V_PLANETARY_LANDINGS');
  });
});

describe('candidate list', () => {
  it('names each section and each group without drawing either', () => {
    const fixture = renderComponent(CandidateList, {
      sections: sectionsFor(FIXTURE_SLOTS.hardpoint),
      label: 'Modules for this mount',
    });

    const headings = element(fixture).querySelectorAll('h3, h4');
    expect(headings.length).toBeGreaterThan(1);
    for (const heading of Array.from(headings)) {
      expect(heading.classList.contains('visually-hidden')).toBe(true);
    }

    // The unique rewards are announced as their own section, which is the only
    // place that structure is stated — the canvas draws one flat list.
    expect(textOf(element(fixture))).toContain('Unique rewards');
  });

  it('gives every row a name that distinguishes it from its neighbours', () => {
    const fixture = renderComponent(CandidateList, {
      sections: sectionsFor(FIXTURE_SLOTS.hardpoint, 'multi-cannon'),
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
    const sections = sectionsFor(FIXTURE_SLOTS.hardpoint);
    const variants = sections
      .flatMap((section) => section.groups)
      .flatMap((group) => group.choices)
      .filter((choice) => choice.kind === 'variant');
    const fitted = variants[0];
    expect(fitted).toBeDefined();

    const fixture = renderComponent(CandidateList, {
      sections,
      label: 'Modules for this mount',
      fittedSymbol: fitted!.module.symbol,
      fittedVariant: fitted!.variant,
    });

    expect(element(fixture).querySelectorAll('.candidate--fitted')).toHaveLength(1);
  });

  it('states the selection rather than only colouring it', () => {
    const sections = sectionsFor(FIXTURE_SLOTS.hardpoint, 'multi-cannon');
    const chosen = sections[0]!.groups[0]!.choices[0]!;
    const fixture = renderComponent(CandidateList, {
      sections,
      label: 'Modules for this mount',
      selectedKey: chosen.key,
    });

    const radio = query(fixture, 'input[type="radio"]') as HTMLInputElement;
    expect(radio.checked).toBe(true);
  });

  it('says a fitted module is fitted, in words, beside the ground that shows it', () => {
    // The canvas marks the fitted row with its amber ground and writes nothing
    // on it. The word is here all the same and read rather than drawn, so the
    // state is never carried by the colour alone.
    const sections = sectionsFor(FIXTURE_SLOTS.hardpoint, 'multi-cannon');
    const fitted = sections[0]!.groups[0]!.choices[0]!;
    const fixture = renderComponent(CandidateList, {
      sections,
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
      sections: sectionsFor(FIXTURE_SLOTS.core),
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
      sections: sectionsFor(FIXTURE_SLOTS.core),
      label: 'Modules for this mount',
    });

    const header = query(fixture, '.candidates__columns');
    expect(header.getAttribute('aria-hidden')).toBe('true');
    // `MODULE · CLASS` and the five figure columns, as the canvas heads them.
    expect(header.querySelectorAll('.candidates__column').length).toBe(7);
  });
});
