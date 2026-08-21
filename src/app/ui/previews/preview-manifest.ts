import { type Type } from '@angular/core';
import {
  COMPONENT_STATES,
  type ComponentId,
  type ComponentState,
  type ComponentVariant,
  type UiComponentContract,
} from '../component-contract';

/**
 * The component preview manifest.
 *
 * Every exported `src/app/ui/` component has exactly one declaration here, and
 * every declaration accounts for all five required states — with a fixture, or
 * with a nonempty machine-readable reason the component's contract cannot
 * represent that state (FR-004).
 *
 * The N/A escape exists for contracts that genuinely cannot hold a state (a
 * static text equivalent has no loading state). It is not a way to skip a
 * fixture that is awkward to build, and the repository policy checker treats a
 * blank or missing rationale as a failure.
 *
 * This registry is imported by the tooling-only preview application and by the
 * policy checker. It is never referenced by a product route.
 */

/** One rendered state of one component. */
export interface PreviewStateDeclaration {
  readonly state: ComponentState;
  /**
   * Immutable presentation inputs for this state, or `null` when the state is
   * declared not applicable.
   *
   * Fixtures are presentation data. A fixture may query real package data, but
   * a copied mock value never becomes an application fact (constitution II).
   */
  readonly fixture: Readonly<Record<string, unknown>> | null;
  /** Required when `fixture` is `null`; forbidden otherwise. */
  readonly naReason: string | null;
  /** Cross-cutting conditions this state is additionally rendered under. */
  readonly variants: readonly ComponentVariant[];
  /** Named behaviours shared by the policy checker and the Playwright suite. */
  readonly expectations: readonly string[];
  /**
   * True when this state may only be rendered on its own.
   *
   * A modal layer makes everything behind it inert and removes it from the
   * accessibility tree — which is exactly what it is supposed to do, and
   * exactly why it cannot share a page with the rest of the catalogue. An
   * isolated state is reached by its own address instead, so the sweep still
   * scans it.
   */
  readonly isolated?: boolean;
}

/** Everything the preview application needs to render one component. */
export interface PreviewDeclaration {
  readonly componentId: ComponentId;
  /** Human-readable group, used for catalogue navigation only. */
  readonly group: string;
  readonly contract: UiComponentContract;
  /** The component actually rendered — the production export, never a copy. */
  readonly component: Type<unknown>;
  readonly states: readonly PreviewStateDeclaration[];
}

/** A problem with a declaration, named precisely enough to fix. */
export interface PreviewManifestViolation {
  readonly componentId: ComponentId;
  readonly state: ComponentState | null;
  readonly reason: string;
}

const registry = new Map<ComponentId, PreviewDeclaration>();

/**
 * Registers one component's previews.
 *
 * Called at module load from the manifest's own imports, so registration cannot
 * drift from the exported component list without the checker noticing.
 */
export function registerPreview(declaration: PreviewDeclaration): void {
  if (registry.has(declaration.componentId)) {
    throw new Error(
      `Duplicate preview declaration for component "${declaration.componentId}". ` +
        'Each exported UI component has exactly one declaration.',
    );
  }
  registry.set(declaration.componentId, declaration);
}

/** Every registered declaration, in registration order. */
export function previewDeclarations(): readonly PreviewDeclaration[] {
  return [...registry.values()];
}

/** One declaration by component id. */
export function previewDeclaration(componentId: ComponentId): PreviewDeclaration | null {
  return registry.get(componentId) ?? null;
}

/** A stable address for one component state, used by the preview app and tests. */
export function previewAddress(componentId: ComponentId, state: ComponentState): string {
  return `${componentId}--${state}`;
}

/**
 * Validates every registered declaration against the manifest rules.
 *
 * Returns the violations rather than throwing, so the checker can report all of
 * them at once instead of one per run.
 */
export function validatePreviewManifest(
  declarations: readonly PreviewDeclaration[] = previewDeclarations(),
): readonly PreviewManifestViolation[] {
  const violations: PreviewManifestViolation[] = [];

  for (const declaration of declarations) {
    const declared = new Set(declaration.states.map((state) => state.state));

    for (const required of COMPONENT_STATES) {
      if (!declared.has(required)) {
        violations.push({
          componentId: declaration.componentId,
          state: required,
          reason: 'The state has neither a fixture nor an N/A rationale.',
        });
      }
    }

    if (declared.size !== declaration.states.length) {
      violations.push({
        componentId: declaration.componentId,
        state: null,
        reason: 'The same state is declared more than once.',
      });
    }

    for (const state of declaration.states) {
      const hasFixture = state.fixture !== null;
      const hasReason = typeof state.naReason === 'string' && state.naReason.trim().length > 0;

      if (!hasFixture && !hasReason) {
        violations.push({
          componentId: declaration.componentId,
          state: state.state,
          reason: 'A state declared not applicable needs a nonempty rationale.',
        });
      }

      if (hasFixture && state.naReason !== null) {
        violations.push({
          componentId: declaration.componentId,
          state: state.state,
          reason: 'A state cannot have both a fixture and an N/A rationale.',
        });
      }

      if (hasFixture && state.expectations.length === 0) {
        violations.push({
          componentId: declaration.componentId,
          state: state.state,
          reason: 'A rendered state declares at least one named expectation.',
        });
      }
    }
  }

  return violations;
}

/** Clears the registry. Test support only. */
export function resetPreviewManifest(): void {
  registry.clear();
}

// ---------------------------------------------------------------------------
// Declarations
//
// One per exported `src/app/ui/` component. Every required state is accounted
// for: with a fixture, or with a machine-readable reason the component's
// contract cannot represent it.
//
// The N/A rationales below are about contracts, not convenience. A link has no
// busy state because navigation is the platform's, not the component's; a
// metric group has no error state because an absent value is an *unavailable*
// value, which is a different thing it renders honestly rather than an error it
// reports.
// ---------------------------------------------------------------------------

import { AnnouncementOutlet } from '../announcements/announcement-outlet';
import { ActionButton } from '../components/action/action-button';
import { ActionLink } from '../components/action/action-link';
import { ActionLayer } from '../components/app-frame/action-layer';
import { AppFrame } from '../components/app-frame/app-frame';
import { ChoiceGroup } from '../components/choice-group/choice-group';
import { Collection } from '../components/collection/collection';
import { Disclosure } from '../components/disclosure/disclosure';
import { GameText } from '../components/game-text/game-text';
import { Layer } from '../components/layer/layer';
import { MetricGroup } from '../components/metric-group/metric-group';
import { Panel } from '../components/panel/panel';
import { SelectField } from '../components/select-field/select-field';
import { StatusNotice } from '../components/status/status-notice';
import { DataTable } from '../components/table/data-table';
import { TabGroup } from '../components/tab-group/tab-group';
import { TextField } from '../components/text-field/text-field';
import { TextareaField } from '../components/textarea-field/textarea-field';
import { UnavailableValue } from '../components/unavailable-value/unavailable-value';

/** A state rendered from a fixture. */
function state(
  name: ComponentState,
  fixture: Readonly<Record<string, unknown>>,
  expectations: readonly string[],
  variants: readonly ComponentVariant[] = ['normal'],
  isolated = false,
): PreviewStateDeclaration {
  return { state: name, fixture, naReason: null, variants, expectations, isolated };
}

/** A state this component's contract cannot represent, and why. */
function notApplicable(name: ComponentState, reason: string): PreviewStateDeclaration {
  return { state: name, fixture: null, naReason: reason, variants: [], expectations: [] };
}

/**
 * The cross-cutting conditions every control is rendered under.
 *
 * `reduced-motion` is on the list for components that do not animate as well as
 * for those that do, because the assertion it carries is that *nothing* changes
 * when motion is removed — which is only evidence if it is checked where a
 * regression could introduce motion, not only where motion already exists.
 */
const CONTROL_VARIANTS: readonly ComponentVariant[] = [
  'normal',
  'expanded-copy',
  'rtl',
  'reduced-motion',
  'long-identity',
];

function contract(
  componentId: string,
  semantics: UiComponentContract['semantics'],
  states: readonly ComponentState[],
  variants: readonly ComponentVariant[] = CONTROL_VARIANTS,
): UiComponentContract {
  return { componentId, semantics, states, variants };
}

registerPreview({
  componentId: 'action-button',
  group: 'Actions',
  component: ActionButton,
  contract: contract(
    'action-button',
    {
      role: 'button',
      visibleNameMatchesAccessibleName: true,
      exposedStates: ['pressed', 'busy', 'disabled'],
      relationships: [],
      textEquivalents: ['pressed state', 'busy state'],
    },
    ['default', 'loading', 'disabled'],
  ),
  states: [
    state('default', { label: 'Save build', emphasis: 'primary' }, [
      'visible name equals accessible name',
      'meets the target-size baseline',
    ]),
    notApplicable(
      'empty',
      'A button always carries a visible label; a button with no name is a defect, not a state.',
    ),
    state('loading', { label: 'Save build', busy: true, busyLabel: 'Working' }, [
      'exposes aria-busy',
      'keeps its label while busy',
    ]),
    notApplicable(
      'error',
      'A button reports no error of its own. An error belongs to the field or the operation it acts on.',
    ),
    state('disabled', { label: 'Save build', disabled: true }, [
      'exposes the disabled state natively',
      'remains readable at the audited contrast floor',
    ]),
  ],
});

registerPreview({
  componentId: 'action-link',
  group: 'Actions',
  component: ActionLink,
  contract: contract(
    'action-link',
    {
      role: 'link',
      visibleNameMatchesAccessibleName: true,
      exposedStates: ['disabled'],
      relationships: [],
      textEquivalents: ['external destination'],
    },
    ['default', 'disabled'],
  ),
  states: [
    state(
      'default',
      { label: 'Licences', href: '/licences' },
      ['visible name equals accessible name', 'is underlined, not identified by colour alone'],
      CONTROL_VARIANTS,
    ),
    notApplicable('empty', 'A link always carries a visible label and a destination.'),
    notApplicable(
      'loading',
      'Navigation belongs to the platform, so the link has no busy state of its own.',
    ),
    notApplicable('error', 'A link reports no error; a failed navigation is the route’s state.'),
    state('disabled', { label: 'Licences', href: '/licences', disabled: true }, [
      'exposes aria-disabled',
    ]),
  ],
});

registerPreview({
  componentId: 'text-field',
  group: 'Fields',
  component: TextField,
  contract: contract(
    'text-field',
    {
      role: 'textbox',
      visibleNameMatchesAccessibleName: true,
      exposedStates: ['invalid', 'busy', 'disabled'],
      relationships: ['label', 'description', 'error'],
      textEquivalents: ['invalid state'],
    },
    ['default', 'empty', 'loading', 'error', 'disabled'],
  ),
  states: [
    state(
      'default',
      { label: 'Build name', value: 'Anaconda explorer', description: 'Shown in saved builds.' },
      ['label is programmatically associated', 'description is associated by aria-describedby'],
      ['normal', 'expanded-copy', 'rtl', 'reduced-motion', 'nested-relationships'],
    ),
    state('empty', { label: 'Build name', value: '' }, [
      'renders with no value and keeps its label',
    ]),
    state('loading', { label: 'Build name', value: '', busy: true }, ['exposes aria-busy']),
    state(
      'error',
      { label: 'Build name', value: '', error: 'Enter a name for this build.' },
      ['exposes aria-invalid', 'error text is associated with the control'],
      ['normal', 'expanded-copy', 'rtl', 'reduced-motion', 'nested-relationships'],
    ),
    state('disabled', { label: 'Build name', value: 'Anaconda explorer', disabled: true }, [
      'exposes the disabled state natively',
    ]),
  ],
});

registerPreview({
  componentId: 'select-field',
  group: 'Fields',
  component: SelectField,
  contract: contract(
    'select-field',
    {
      role: 'combobox',
      visibleNameMatchesAccessibleName: true,
      exposedStates: ['invalid', 'busy', 'disabled'],
      relationships: ['label', 'description', 'error'],
      textEquivalents: ['invalid state'],
    },
    ['default', 'empty', 'loading', 'error', 'disabled'],
  ),
  states: [
    state(
      'default',
      {
        label: 'Language',
        value: 'en',
        options: [
          { value: 'en', label: 'English' },
          { value: 'de', label: 'Deutsch' },
        ],
      },
      ['label is programmatically associated', 'the selected option is exposed'],
      ['normal', 'expanded-copy', 'rtl', 'german-format'],
    ),
    state('empty', { label: 'Language', options: [] }, [
      'renders with no options and keeps its label',
    ]),
    state(
      'loading',
      { label: 'Language', options: [{ value: 'en', label: 'English' }], busy: true },
      ['exposes aria-busy'],
    ),
    state(
      'error',
      {
        label: 'Language',
        options: [{ value: 'en', label: 'English' }],
        error: 'Choose a language.',
      },
      ['exposes aria-invalid', 'error text is associated with the control'],
    ),
    state(
      'disabled',
      { label: 'Language', options: [{ value: 'en', label: 'English' }], disabled: true },
      ['exposes the disabled state natively'],
    ),
  ],
});

registerPreview({
  componentId: 'textarea-field',
  group: 'Fields',
  component: TextareaField,
  contract: contract(
    'textarea-field',
    {
      role: 'textbox',
      visibleNameMatchesAccessibleName: true,
      exposedStates: ['invalid', 'busy', 'disabled'],
      relationships: ['label', 'description', 'error'],
      textEquivalents: ['invalid state'],
    },
    ['default', 'empty', 'loading', 'error', 'disabled'],
  ),
  states: [
    state(
      'default',
      { label: 'SLEF payload', value: '{"header":{"appName":"EDSB"}}' },
      ['label is programmatically associated', 'stays resizable so 200% text does not clip'],
      ['normal', 'expanded-copy', 'rtl', 'reduced-motion', 'long-identity'],
    ),
    state('empty', { label: 'SLEF payload', value: '' }, ['renders empty and keeps its label']),
    state('loading', { label: 'SLEF payload', value: '', busy: true }, ['exposes aria-busy']),
    state('error', { label: 'SLEF payload', value: '{', error: 'This is not valid SLEF.' }, [
      'exposes aria-invalid',
      'error text is associated with the control',
    ]),
    state('disabled', { label: 'SLEF payload', value: '', disabled: true }, [
      'exposes the disabled state natively',
    ]),
  ],
});

registerPreview({
  componentId: 'choice-group',
  group: 'Fields',
  component: ChoiceGroup,
  contract: contract(
    'choice-group',
    {
      role: 'group',
      visibleNameMatchesAccessibleName: true,
      exposedStates: ['checked', 'invalid', 'disabled'],
      relationships: ['label', 'description', 'error'],
      textEquivalents: ['checked state'],
    },
    ['default', 'empty', 'error', 'disabled'],
  ),
  states: [
    state(
      'default',
      {
        legend: 'Measured under',
        kind: 'radio',
        selected: ['laden'],
        choices: [
          { value: 'laden', label: 'Laden' },
          { value: 'unladen', label: 'Unladen', description: 'No cargo and no fuel.' },
        ],
      },
      [
        'the legend names what the group asks',
        'each choice label is associated with its control',
        'a choice description is associated by aria-describedby',
      ],
      ['normal', 'expanded-copy', 'rtl', 'reduced-motion', 'nested-relationships'],
    ),
    state('empty', { legend: 'Measured under', choices: [] }, [
      'renders with no choices and keeps its legend',
    ]),
    notApplicable(
      'loading',
      'The group renders the choices it is given. Loading belongs to whatever supplies them.',
    ),
    state(
      'error',
      {
        legend: 'Measured under',
        choices: [{ value: 'laden', label: 'Laden' }],
        error: 'Choose a measurement condition.',
      },
      ['exposes aria-invalid on the group', 'error text is associated with the group'],
    ),
    state(
      'disabled',
      { legend: 'Measured under', choices: [{ value: 'laden', label: 'Laden' }], disabled: true },
      ['the fieldset disables every choice at once'],
    ),
  ],
});

registerPreview({
  componentId: 'tab-group',
  group: 'Navigation',
  component: TabGroup,
  contract: contract(
    'tab-group',
    {
      role: 'tablist',
      visibleNameMatchesAccessibleName: true,
      exposedStates: ['selected', 'disabled'],
      relationships: [],
      textEquivalents: ['selected state'],
    },
    ['default', 'empty', 'disabled'],
  ),
  states: [
    state(
      'default',
      {
        label: 'Build sections',
        selectedId: 'power',
        selectedLabel: 'Selected',
        tabs: [
          { id: 'power', label: 'Power' },
          { id: 'defence', label: 'Defence' },
          { id: 'mobility', label: 'Mobility' },
        ],
      },
      [
        'the selected tab exposes aria-selected',
        'the selected state has visible text, not only a colour and a border',
        'a narrow container scrolls the strip instead of the document',
      ],
      ['normal', 'expanded-copy', 'rtl', 'reduced-motion', 'long-identity'],
    ),
    state('empty', { label: 'Build sections', selectedId: '', tabs: [] }, [
      'renders with no tabs and keeps its accessible name',
    ]),
    notApplicable(
      'loading',
      'Tabs render the set they are given; loading belongs to the panel each tab controls.',
    ),
    notApplicable('error', 'A tab strip reports no error; the panel it controls does.'),
    state(
      'disabled',
      {
        label: 'Build sections',
        selectedId: 'power',
        tabs: [{ id: 'power', label: 'Power' }],
        disabled: true,
      },
      ['every tab exposes the disabled state'],
    ),
  ],
});

registerPreview({
  componentId: 'panel',
  group: 'Containers',
  component: Panel,
  contract: contract(
    'panel',
    {
      role: 'region',
      visibleNameMatchesAccessibleName: true,
      exposedStates: [],
      relationships: ['label', 'description'],
      textEquivalents: [],
    },
    ['default', 'empty'],
  ),
  states: [
    state(
      'default',
      { heading: 'Power and heat', description: 'Draw against the plant’s output.' },
      ['the region is named by its visible heading', 'the description is associated'],
      ['normal', 'expanded-copy', 'rtl', 'reduced-motion'],
    ),
    state('empty', { heading: 'Power and heat' }, [
      'renders with no body content and stays a named region',
    ]),
    notApplicable('loading', 'The panel is a container; its content owns any loading state.'),
    notApplicable('error', 'The panel is a container; its content owns any error state.'),
    notApplicable('disabled', 'A region is not interactive, so it cannot be disabled.'),
  ],
});

registerPreview({
  componentId: 'collection',
  group: 'Containers',
  component: Collection,
  contract: contract(
    'collection',
    {
      role: 'list',
      visibleNameMatchesAccessibleName: true,
      exposedStates: ['current', 'disabled'],
      relationships: ['description'],
      textEquivalents: ['selected state'],
    },
    ['default', 'empty', 'disabled'],
  ),
  states: [
    state(
      'default',
      {
        label: 'Saved builds',
        selectedLabel: 'Selected',
        items: [
          {
            id: 'a',
            label: 'Anaconda explorer',
            detail: 'Exploration',
            activatable: true,
            selected: true,
          },
          { id: 'b', label: 'Krait combat', detail: 'Combat', activatable: true },
        ],
      },
      [
        'a semantic list states how many items there are',
        'the selected item exposes aria-current and names the state in text',
        'an item’s own controls sit beside its activation target, not inside it',
      ],
      ['normal', 'expanded-copy', 'rtl', 'reduced-motion', 'long-identity'],
    ),
    state('empty', { label: 'Saved builds', items: [], emptyLabel: 'No saved builds yet.' }, [
      'states the empty condition in text rather than rendering nothing',
    ]),
    notApplicable(
      'loading',
      'The collection renders the items it is given; loading belongs to the source.',
    ),
    notApplicable(
      'error',
      'The collection reports no error; the source that failed to supply items does.',
    ),
    state(
      'disabled',
      {
        label: 'Saved builds',
        items: [{ id: 'a', label: 'Anaconda explorer', activatable: true, disabled: true }],
      },
      ['a disabled item exposes the state natively'],
    ),
  ],
});

registerPreview({
  componentId: 'data-table',
  group: 'Containers',
  component: DataTable,
  contract: contract(
    'data-table',
    {
      role: 'table',
      visibleNameMatchesAccessibleName: true,
      exposedStates: ['selected'],
      relationships: ['label', 'unit'],
      textEquivalents: ['selected row state'],
    },
    ['default', 'empty'],
  ),
  states: [
    state(
      'default',
      {
        caption: 'Power draw by module',
        columns: [
          { key: 'module', label: 'Module', rowHeader: true },
          { key: 'draw', label: 'Draw', unit: 'MW', numeric: true },
        ],
        rows: [
          { id: '1', cells: { module: 'Power Plant', draw: '12.4' } },
          { id: '2', cells: { module: 'Thrusters', draw: '5.2' } },
        ],
      },
      [
        'a caption names the table',
        'header cells scope to their column and row so a value is heard with its label',
        'the unit is announced with every value in the column',
        'wide content scrolls inside the table’s own labelled region',
      ],
      ['normal', 'expanded-copy', 'rtl', 'german-format', 'long-identity'],
    ),
    state(
      'empty',
      {
        caption: 'Power draw by module',
        columns: [{ key: 'module', label: 'Module', rowHeader: true }],
        rows: [],
        emptyLabel: 'No modules are fitted.',
      },
      ['states the empty condition in text'],
    ),
    notApplicable(
      'loading',
      'The table renders the rows it is given; loading belongs to the source.',
    ),
    notApplicable(
      'error',
      'The table reports no error; the source that failed to supply rows does.',
    ),
    notApplicable('disabled', 'A table is not interactive, so it cannot be disabled.'),
  ],
});

registerPreview({
  componentId: 'metric-group',
  group: 'Values',
  component: MetricGroup,
  contract: contract(
    'metric-group',
    {
      role: 'group',
      visibleNameMatchesAccessibleName: true,
      exposedStates: [],
      relationships: ['label', 'description', 'unit', 'viewing-condition'],
      textEquivalents: ['unavailable value'],
    },
    ['default', 'empty'],
  ),
  states: [
    state(
      'default',
      {
        label: 'Jump summary',
        metrics: [
          {
            id: 'range',
            label: 'Jump range',
            value: '20.45',
            unit: 'ly',
            condition: 'Laden',
            description: 'Maximum single jump with a full tank.',
          },
          {
            id: 'total',
            label: 'Total range',
            value: null,
            unavailableLabel: 'Unavailable',
          },
        ],
      },
      [
        'each value is related to its unit and measurement condition',
        'an unavailable value is stated, never rendered as a zero',
        'numeric values are bidi-isolated so a right-to-left context cannot reorder them',
      ],
      ['normal', 'expanded-copy', 'rtl', 'german-format', 'unavailable-text'],
    ),
    state('empty', { label: 'Jump summary', metrics: [], emptyLabel: 'Nothing to show.' }, [
      'states the empty condition in text',
    ]),
    notApplicable(
      'loading',
      'Metrics render the values they are given; loading belongs to the source.',
    ),
    notApplicable(
      'error',
      'An absent value is an unavailable value, which this component renders honestly. It is not an error the group reports.',
    ),
    notApplicable('disabled', 'A description list is not interactive, so it cannot be disabled.'),
  ],
});

registerPreview({
  componentId: 'status-notice',
  group: 'Feedback',
  component: StatusNotice,
  contract: contract(
    'status-notice',
    {
      role: 'status',
      visibleNameMatchesAccessibleName: true,
      exposedStates: [],
      relationships: ['description'],
      textEquivalents: ['tone'],
    },
    ['default', 'loading', 'error'],
  ),
  states: [
    state(
      'default',
      { tone: 'info', message: 'This build has not been saved.' },
      ['the tone is named in text, so colour is never the only signal'],
      ['normal', 'expanded-copy', 'rtl', 'reduced-motion'],
    ),
    notApplicable('empty', 'A notice with no message is not rendered at all.'),
    state('loading', { tone: 'loading', message: 'Loading language' }, [
      'the loading tone is named in text',
    ]),
    state(
      'error',
      {
        tone: 'error',
        message: 'Power draw exceeds the plant’s output.',
        detail: 'Reduce draw or fit a larger plant.',
      },
      ['exposes an alert role', 'the detail is associated with the notice'],
      ['normal', 'expanded-copy', 'rtl', 'reduced-motion'],
    ),
    notApplicable('disabled', 'A notice is not interactive, so it cannot be disabled.'),
  ],
});

registerPreview({
  componentId: 'unavailable-value',
  group: 'Values',
  component: UnavailableValue,
  contract: contract(
    'unavailable-value',
    {
      role: 'text',
      visibleNameMatchesAccessibleName: true,
      exposedStates: [],
      relationships: ['unavailable-reason'],
      textEquivalents: ['absence of a value'],
    },
    ['default'],
  ),
  states: [
    state(
      'default',
      {
        kind: 'unavailable',
        label: 'Total range',
        reason: 'The Almanac supplies no value for this.',
      },
      [
        'the absence is stated in words rather than as a zero or a dash',
        'the reason is programmatically associated',
      ],
      ['normal', 'expanded-copy', 'rtl', 'unavailable-text'],
    ),
    notApplicable('empty', 'This component *is* the empty state of a value.'),
    notApplicable('loading', 'An unavailable value is settled, not pending.'),
    notApplicable(
      'error',
      'An unavailable value is not an error: the Almanac has no value to give, which is a fact rather than a failure.',
    ),
    notApplicable('disabled', 'Static text is not interactive, so it cannot be disabled.'),
  ],
});

registerPreview({
  componentId: 'disclosure',
  group: 'Containers',
  component: Disclosure,
  contract: contract(
    'disclosure',
    {
      role: 'button',
      visibleNameMatchesAccessibleName: true,
      exposedStates: ['expanded', 'disabled'],
      relationships: ['label'],
      textEquivalents: ['expanded state'],
    },
    ['default', 'empty', 'disabled'],
  ),
  states: [
    state(
      'default',
      { label: 'Why is this unavailable?', expanded: true, stateLabel: 'Showing' },
      [
        'exposes aria-expanded and controls its content',
        'is a persistent alternative to a hover tooltip, reachable by tap',
      ],
      ['normal', 'expanded-copy', 'rtl', 'reduced-motion'],
    ),
    state('empty', { label: 'Why is this unavailable?', expanded: false }, [
      'collapsed content is hidden from the accessibility tree, not merely invisible',
    ]),
    notApplicable(
      'loading',
      'The disclosure shows content it is given; loading belongs to that content.',
    ),
    notApplicable('error', 'The disclosure reports no error of its own.'),
    state('disabled', { label: 'Why is this unavailable?', disabled: true }, [
      'exposes the disabled state natively',
    ]),
  ],
});

registerPreview({
  componentId: 'layer',
  group: 'Layers',
  component: Layer,
  contract: contract(
    'layer',
    {
      role: 'dialog',
      visibleNameMatchesAccessibleName: true,
      exposedStates: ['expanded'],
      relationships: ['label', 'description'],
      textEquivalents: [],
    },
    ['default', 'empty'],
  ),
  states: [
    state(
      'default',
      {
        title: 'Import a build',
        description: 'Paste a SLEF payload to load it.',
        dismissLabel: 'Close',
        open: true,
        presentation: 'dialog',
      },
      [
        'has a visible title associated with the layer',
        'background content is inert and absent from the accessibility tree',
        'dismissal restores the invoking control',
      ],
      ['normal', 'expanded-copy', 'rtl', 'reduced-motion'],
      // Isolated: an open modal makes everything behind it inert, which is
      // correct behaviour and incompatible with sharing a catalogue page.
      true,
    ),
    state(
      'empty',
      { title: 'Import a build', dismissLabel: 'Close', open: false, presentation: 'dialog' },
      ['a closed layer renders nothing and holds no focus'],
    ),
    notApplicable('loading', 'The layer is a container; its content owns any loading state.'),
    notApplicable('error', 'The layer is a container; its content owns any error state.'),
    notApplicable('disabled', 'A layer is either open or closed; it has no disabled state.'),
  ],
});

registerPreview({
  componentId: 'app-frame',
  group: 'Shell',
  component: AppFrame,
  contract: contract(
    'app-frame',
    {
      role: 'banner',
      visibleNameMatchesAccessibleName: true,
      exposedStates: ['current'],
      relationships: ['label'],
      textEquivalents: ['current navigation entry'],
    },
    ['default', 'empty', 'error'],
  ),
  states: [
    state(
      'default',
      {
        routeContext: 'Anaconda explorer',
        navigation: [
          { id: 'ships', label: 'Shipyard', href: '/ships', current: true },
          { id: 'builds', label: 'Saved builds', href: '/builds' },
        ],
        actions: [
          { id: 'save', label: 'Save', emphasis: 'primary' },
          { id: 'language', label: 'Language' },
        ],
      },
      [
        'exposes banner, navigation and main landmarks',
        'every action keeps visible text — never an unlabelled ellipsis',
        'the current navigation entry exposes aria-current',
      ],
      ['normal', 'expanded-copy', 'rtl', 'reduced-motion', 'long-identity', 'nested-relationships'],
      // Isolated: the frame renders the banner and main landmarks, and a page
      // may only have one of each. A shell is a whole-page component.
      true,
    ),
    state(
      'empty',
      {},
      ['renders the landmarks with no route context, navigation or actions'],
      ['normal'],
      true,
    ),
    notApplicable(
      'loading',
      'The frame is always present; the route inside it owns any loading state.',
    ),
    state(
      'error',
      {
        routeContext: 'Anaconda explorer',
        status: { tone: 'error', message: 'This build could not be saved.' },
      },
      [
        'visible feedback is ordinary content in reading order, not a live region',
        'the shell landmarks and actions remain usable',
      ],
      ['normal'],
      true,
    ),
    notApplicable(
      'disabled',
      'The application frame is always available; it has no disabled state.',
    ),
  ],
});

registerPreview({
  componentId: 'action-layer',
  group: 'Shell',
  component: ActionLayer,
  contract: contract(
    'action-layer',
    {
      role: 'group',
      visibleNameMatchesAccessibleName: true,
      exposedStates: ['expanded', 'disabled'],
      relationships: ['label'],
      textEquivalents: ['open and close state named in the trigger text'],
    },
    ['default', 'empty', 'disabled'],
    ['normal', 'expanded-copy', 'rtl', 'reduced-motion', 'long-identity'],
  ),
  states: [
    state(
      'default',
      {
        actions: [
          { id: 'save', label: 'Save build', emphasis: 'primary' },
          { id: 'share', label: 'Copy build link' },
          { id: 'language', label: 'Language' },
        ],
        label: 'Actions',
        openLabel: 'Menu',
        closeLabel: 'Close menu',
        expanded: true,
      },
      [
        'the trigger carries visible text naming what it does now',
        'every action inside keeps its own visible label',
        'the layer is related to its trigger by aria-controls and aria-expanded',
      ],
      ['normal', 'expanded-copy', 'rtl', 'reduced-motion', 'long-identity'],
    ),
    state(
      'empty',
      {
        actions: [],
        label: 'Actions',
        openLabel: 'Menu',
        closeLabel: 'Close menu',
        expanded: true,
      },
      ['an open layer with no actions shows an empty group rather than a broken trigger'],
      ['normal'],
    ),
    notApplicable(
      'loading',
      'The layer holds actions that are already known; it never loads them itself.',
    ),
    notApplicable(
      'error',
      'The layer presents actions; an action that fails reports through the shell status.',
    ),
    state(
      'disabled',
      {
        actions: [{ id: 'save', label: 'Save build' }],
        label: 'Actions',
        openLabel: 'Menu',
        closeLabel: 'Close menu',
        expanded: false,
        disabled: true,
      },
      [
        'the trigger exposes the disabled state rather than disappearing',
        'no action inside can be activated while the layer is disabled',
      ],
      ['normal'],
    ),
  ],
});

registerPreview({
  componentId: 'game-text',
  group: 'Localization',
  component: GameText,
  contract: contract(
    'game-text',
    {
      role: 'text',
      visibleNameMatchesAccessibleName: true,
      exposedStates: [],
      relationships: ['description'],
      textEquivalents: ['untranslated state', 'unavailable value'],
    },
    ['default', 'empty'],
    [
      'normal',
      'expanded-copy',
      'rtl',
      'reduced-motion',
      'canonical-untranslated',
      'unavailable-text',
      'long-identity',
    ],
  ),
  states: [
    // The canonical case is the default fixture deliberately: it renders the
    // package text, its accurate `lang`, the untranslated tag and the
    // associated disclosure all at once, so a reviewer sees the whole
    // provenance contract rather than the one case where there is nothing to
    // disclose.
    state(
      'default',
      {
        text: 'Mk II Cargo Rack',
        language: 'en',
        translationState: 'canonical',
        label: 'Module',
      },
      [
        'package text carries the language it is actually in, so it is pronounced correctly',
        'the untranslated state is named in words, not by styling alone',
        'the disclosure is associated with the value by aria-describedby',
        'the game noun itself is never translated by the application',
      ],
      ['normal', 'expanded-copy', 'rtl', 'canonical-untranslated', 'long-identity'],
    ),
    state(
      'empty',
      { text: null, translationState: 'unavailable', label: 'Module' },
      [
        'an absent package value is stated in words, never as a raw symbol',
        'no identity is used as display fallback',
      ],
      ['normal', 'unavailable-text'],
    ),
    notApplicable(
      'loading',
      'Package text resolves synchronously from the installed package; there is nothing to wait for.',
    ),
    notApplicable(
      'error',
      'Absent package text is an unavailable value, which this component renders, not an error it reports.',
    ),
    notApplicable('disabled', 'Text is not interactive and has no disabled state.'),
  ],
});

registerPreview({
  componentId: 'announcement-outlet',
  group: 'Feedback',
  component: AnnouncementOutlet,
  contract: contract(
    'announcement-outlet',
    {
      role: 'status',
      visibleNameMatchesAccessibleName: false,
      exposedStates: [],
      relationships: [],
      textEquivalents: [],
    },
    ['default'],
  ),
  states: [
    state('default', {}, [
      'exactly one assertive and one polite outlet exist',
      'both are visually hidden but present in the accessibility tree',
      'both are silent until a genuinely new event is published',
    ]),
    notApplicable(
      'empty',
      'An empty outlet is the resting state the default fixture already shows: the outlets are always mounted and start silent.',
    ),
    notApplicable('loading', 'An outlet publishes settled text; it has no loading state.'),
    notApplicable(
      'error',
      'An outlet carries an error’s text but has no error state of its own; the notice component renders the visible error.',
    ),
    notApplicable('disabled', 'A live region is not interactive, so it cannot be disabled.'),
  ],
});
