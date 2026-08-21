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
import { ResponsiveCatalogueView } from '../components/catalogue-view/responsive-catalogue-view';
import { ChoiceDialog } from '../components/choice-dialog/choice-dialog';
import { CollectionToolbar } from '../components/collection-toolbar/collection-toolbar';
import { ConfirmDialog } from '../components/confirm-dialog/confirm-dialog';
import { RecordManager } from '../components/record-manager/record-manager';
import { RecordNoteEditor } from '../components/note-editor/record-note-editor';
import { ResponsiveRecordList } from '../components/record-list/responsive-record-list';
import { SavedBuildCard } from '../components/saved-build-card/saved-build-card';
import { ShareLinkPanel } from '../components/share-link-panel/share-link-panel';
import { FactList } from '../components/fact-list/fact-list';
import { HullArtwork } from '../components/hull-artwork/hull-artwork';
import { HullSummaryCard } from '../components/hull-summary-card/hull-summary-card';
import { SlotLayout } from '../components/slot-layout/slot-layout';
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

// ---------------------------------------------------------------------------
// Feature 001 additions: the catalogue, hull-detail and decision surfaces.
// ---------------------------------------------------------------------------

/** One hull, as every catalogue fixture below shows it. */
const ANACONDA = {
  symbol: 'Anaconda',
  name: { text: 'Anaconda', language: 'en', translationState: 'localized', disclosureKey: null },
  manufacturer: {
    text: 'Faulcon DeLacy',
    language: 'en',
    translationState: 'localized',
    disclosureKey: null,
  },
  size: 'Large',
  hardpoints: '1 huge, 4 large, 2 medium, 1 small',
  price: '146,969,450 CR',
  selected: false,
} as const;

/** The same hull with every fact the package could fail to supply missing. */
const UNAVAILABLE_HULL = { ...ANACONDA, symbol: 'Unknown', size: null, price: null } as const;

const CATALOGUE_COLUMNS = [
  {
    field: 'name',
    label: 'Ship',
    sortActionLabel: 'Sort by Ship, descending',
    sorted: true,
    direction: 'ascending',
  },
  {
    field: 'manufacturer',
    label: 'Manufacturer',
    sortActionLabel: 'Sort by Manufacturer, ascending',
    sorted: false,
    direction: 'ascending',
  },
  {
    field: 'size',
    label: 'Size',
    sortActionLabel: 'Sort by Size, ascending',
    sorted: false,
    direction: 'ascending',
  },
  {
    field: 'hardpoints',
    label: 'Hardpoints',
    sortActionLabel: 'Sort by Hardpoints, ascending',
    sorted: false,
    direction: 'ascending',
  },
  {
    field: 'price',
    label: 'Retail price',
    sortActionLabel: 'Sort by Retail price, ascending',
    sorted: false,
    direction: 'ascending',
    numeric: true,
  },
] as const;

const TOOLBAR_BASE = {
  sizeChoices: [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ],
  manufacturerOptions: [
    { value: '', label: 'Any' },
    { value: 'Faulcon DeLacy', label: 'Faulcon DeLacy' },
    { value: 'Gutamaya', label: 'Gutamaya' },
  ],
  hardpointOptions: [
    { value: '', label: 'Any' },
    { value: '4', label: 'Class 4' },
    { value: '3', label: 'Class 3' },
  ],
  sortOptions: [
    { value: 'name', label: 'Ship' },
    { value: 'price', label: 'Retail price' },
  ],
} as const;

registerPreview({
  componentId: 'collection-toolbar',
  group: 'Catalogue',
  component: CollectionToolbar,
  contract: contract(
    'collection-toolbar',
    {
      role: 'group',
      visibleNameMatchesAccessibleName: true,
      exposedStates: ['selected', 'invalid', 'disabled'],
      relationships: ['label', 'description'],
      textEquivalents: ['active constraints', 'sort field and direction', 'match count'],
    },
    ['default', 'empty', 'error'],
  ),
  states: [
    state(
      'default',
      {
        ...TOOLBAR_BASE,
        search: 'cutter',
        selectedSizes: ['large'],
        selectedManufacturer: 'Gutamaya',
        selectedHardpointClass: '4',
        priceMin: '1000000',
        priceMax: '',
        sort: {
          field: 'price',
          direction: 'descending',
          text: 'Sorted by Retail price, descending',
          toggleLabel: 'Sort by Retail price, ascending',
        },
        constraints: [
          { id: 'query', label: 'Search: cutter', removeLabel: 'Remove filter: Search: cutter' },
          { id: 'size:large', label: 'Size: Large', removeLabel: 'Remove filter: Size: Large' },
        ],
        countText: '2 of 48 hulls shown',
      },
      [
        'every active constraint is named and individually removable',
        'the current sort field and direction are stated in words',
        'the match count is text, not only a live announcement',
      ],
      ['normal', 'expanded-copy', 'rtl', 'german-format', 'long-identity'],
    ),
    state(
      'empty',
      {
        ...TOOLBAR_BASE,
        search: '',
        selectedSizes: [],
        selectedManufacturer: '',
        selectedHardpointClass: '',
        priceMin: '',
        priceMax: '',
        sort: {
          field: 'name',
          direction: 'ascending',
          text: 'Sorted by Ship, ascending',
          toggleLabel: 'Sort by Ship, descending',
        },
        constraints: [],
        countText: '48 of 48 hulls shown',
      },
      [
        'states that no filters are active rather than showing an empty region',
        'keeps every control reachable with nothing selected',
      ],
    ),
    notApplicable(
      'loading',
      'The catalogue is installed with the package, so the toolbar never waits for it.',
    ),
    state(
      'error',
      {
        ...TOOLBAR_BASE,
        search: 'no such hull',
        selectedSizes: [],
        selectedManufacturer: '',
        selectedHardpointClass: '',
        priceMin: '',
        priceMax: '',
        sort: {
          field: 'name',
          direction: 'ascending',
          text: 'Sorted by Ship, ascending',
          toggleLabel: 'Sort by Ship, descending',
        },
        constraints: [
          {
            id: 'query',
            label: 'Search: no such hull',
            removeLabel: 'Remove filter: Search: no such hull',
          },
        ],
        countText: '0 of 48 hulls shown',
      },
      [
        'a constrained result of zero is stated as a count, not as a failure',
        'the constraint that produced it remains removable',
      ],
    ),
    notApplicable(
      'disabled',
      'A toolbar with no reachable controls would leave a Commander unable to widen a search they cannot see the results of.',
    ),
  ],
});

registerPreview({
  componentId: 'responsive-catalogue-view',
  group: 'Catalogue',
  component: ResponsiveCatalogueView,
  contract: contract(
    'responsive-catalogue-view',
    {
      role: 'table',
      visibleNameMatchesAccessibleName: true,
      exposedStates: ['selected', 'current'],
      relationships: ['label'],
      textEquivalents: ['sort direction', 'selected hull', 'unavailable fact'],
    },
    ['default', 'empty'],
  ),
  states: [
    state(
      'default',
      {
        caption: 'Hulls in the Almanac',
        columns: CATALOGUE_COLUMNS,
        hulls: [ANACONDA, { ...ANACONDA, symbol: 'Adder', selected: true }, UNAVAILABLE_HULL],
        openLabel: (hull: { symbol: string }) => `View ${hull.symbol}`,
      },
      [
        'the wide composition is a real table with scoped column and row headers',
        'each column header is a named bidirectional sort button',
        'the narrow composition restates every label as a definition list',
        'the selected hull is named in text as well as marked',
        'an unavailable fact is stated in words, never as a zero',
        'the manifest owns its own overflow; the document never scrolls sideways',
      ],
      ['normal', 'expanded-copy', 'rtl', 'long-identity'],
    ),
    state(
      'empty',
      {
        caption: 'Hulls in the Almanac',
        columns: CATALOGUE_COLUMNS,
        hulls: [],
        openLabel: (hull: { symbol: string }) => `View ${hull.symbol}`,
        emptyLabel: 'No hull matches these filters.',
      },
      ['says why there is nothing to show rather than rendering an empty frame'],
    ),
    notApplicable('loading', 'The catalogue ships with the package, so the list is never pending.'),
    notApplicable(
      'error',
      'A constrained result of zero is an empty state; a catalogue that failed to load cannot occur.',
    ),
    notApplicable(
      'disabled',
      'A read-only list of hulls has no disabled state; the sort actions are always available.',
    ),
  ],
});

registerPreview({
  componentId: 'hull-summary-card',
  group: 'Catalogue',
  component: HullSummaryCard,
  contract: contract(
    'hull-summary-card',
    {
      role: 'article',
      visibleNameMatchesAccessibleName: true,
      exposedStates: ['current'],
      relationships: ['label', 'unavailable-reason'],
      textEquivalents: ['selected state', 'unavailable fact'],
    },
    ['default', 'empty'],
  ),
  states: [
    state(
      'default',
      { hull: { ...ANACONDA, selected: true }, openLabel: 'View Anaconda' },
      [
        'each fact is paired with the label that names it',
        'the selected state is named in words and exposed as aria-current',
        'the opening action names the hull it opens',
      ],
      ['normal', 'expanded-copy', 'rtl', 'canonical-untranslated', 'long-identity'],
    ),
    state(
      'empty',
      { hull: UNAVAILABLE_HULL, openLabel: 'View Unknown' },
      ['every absent fact is stated in words rather than as a zero'],
      ['normal', 'unavailable-text'],
    ),
    notApplicable('loading', 'A card renders facts the package already holds.'),
    notApplicable(
      'error',
      'An absent fact is an unavailable value, which the card renders; it reports no error of its own.',
    ),
    notApplicable(
      'disabled',
      'Every hull can be opened; a card that could not would hide a hull from the catalogue.',
    ),
  ],
});

registerPreview({
  componentId: 'fact-list',
  group: 'Hull',
  component: FactList,
  contract: contract(
    'fact-list',
    {
      role: 'group',
      visibleNameMatchesAccessibleName: true,
      exposedStates: [],
      relationships: ['label', 'unit', 'viewing-condition', 'unavailable-reason'],
      textEquivalents: ['unit', 'measurement condition', 'unavailable value'],
    },
    ['default', 'empty'],
  ),
  states: [
    state(
      'default',
      {
        label: 'Hull specifications',
        facts: [
          {
            id: 'maximum-speed',
            label: 'Speed',
            value: '183',
            unit: 'm/s',
            condition: 'at 4 ENG pips',
          },
          {
            id: 'hardness',
            label: 'Hull hardness',
            value: '65',
            unit: 'rating, no unit',
            condition: null,
          },
          {
            id: 'base-shield',
            label: 'Base shield strength',
            value: null,
            unit: 'MJ',
            condition: null,
          },
        ],
      },
      [
        'every value is related to its unit and its measurement condition',
        'a figure with no unit is marked as a rating rather than given one',
        'an unavailable value is stated in words, never as a zero',
      ],
      ['normal', 'expanded-copy', 'rtl', 'german-format', 'unavailable-text'],
    ),
    state(
      'empty',
      { label: 'Hull specifications', facts: [], emptyLabel: 'The Almanac supplies no figures.' },
      ['says there is nothing rather than rendering an empty list'],
    ),
    notApplicable(
      'loading',
      'Hull facts are installed with the package and resolve synchronously.',
    ),
    notApplicable(
      'error',
      'An absent figure is an unavailable value, not an error the list reports.',
    ),
    notApplicable('disabled', 'A list of published facts is not interactive.'),
  ],
});

registerPreview({
  componentId: 'hull-artwork',
  group: 'Hull',
  component: HullArtwork,
  contract: contract(
    'hull-artwork',
    {
      role: 'figure',
      visibleNameMatchesAccessibleName: false,
      exposedStates: [],
      relationships: ['description'],
      textEquivalents: ['the illustration itself', 'loading state', 'unavailable state'],
    },
    ['default', 'loading', 'error'],
  ),
  states: [
    state(
      'default',
      {
        source: 'assets/ships/Anaconda/illustration.svg',
        label: 'Illustration of the Anaconda',
        state: 'available',
      },
      [
        'the illustration carries a text equivalent naming the hull',
        'the area is reserved at a fixed ratio so nothing shifts on load',
      ],
      ['normal', 'rtl', 'reduced-motion'],
    ),
    notApplicable(
      'empty',
      'Every hull the package carries has an illustration; an absent one is the error state, not an empty one.',
    ),
    state(
      'loading',
      {
        source: 'assets/ships/Anaconda/illustration.svg',
        label: 'Illustration of the Anaconda',
        state: 'loading',
      },
      ['the pending state is stated in text', 'the reserved area holds its size'],
    ),
    state(
      'error',
      {
        source: 'assets/ships/Anaconda/illustration.svg',
        label: 'Illustration of the Anaconda',
        state: 'temporarily-unavailable',
      },
      [
        'the absence is explained as temporary and the hull is still named',
        'a retry is offered that does not reload the page',
        'no action elsewhere on the screen is disabled by it',
      ],
      ['normal', 'expanded-copy', 'rtl'],
    ),
    notApplicable(
      'disabled',
      'An illustration is decoration with a text equivalent; it never gates anything, so it has nothing to disable.',
    ),
  ],
});

registerPreview({
  componentId: 'slot-layout',
  group: 'Hull',
  component: SlotLayout,
  contract: contract(
    'slot-layout',
    {
      role: 'group',
      visibleNameMatchesAccessibleName: true,
      exposedStates: [],
      relationships: ['label'],
      textEquivalents: ['slot size', 'slot restriction'],
    },
    ['default', 'empty'],
  ),
  states: [
    state(
      'default',
      {
        label: 'Slot layout',
        groups: [
          {
            kind: 'core',
            label: 'Core internals',
            slots: [
              { key: 'PowerPlant', size: 'Size 8', restriction: null },
              { key: 'MainEngines', size: 'Size 7', restriction: null },
            ],
          },
          {
            kind: 'optional',
            label: 'Optional internals',
            slots: [
              { key: 'Slot14_Size1', size: 'Size 1', restriction: null },
              {
                key: 'Military01',
                size: 'Size 5',
                restriction: 'Takes reinforcement packages only',
              },
            ],
          },
        ],
      },
      [
        'mounts are grouped by kind under their own headings',
        'the game’s own slot key is shown verbatim and bidi-isolated',
        'a restricted mount says what it accepts',
      ],
      ['normal', 'expanded-copy', 'rtl', 'long-identity'],
    ),
    state(
      'empty',
      {
        label: 'Slot layout',
        groups: [],
        emptyLabel: 'The Almanac supplies no slot layout for this hull.',
      },
      ['an absent layout is stated rather than rendered as an empty region'],
    ),
    notApplicable('loading', 'A hull’s layout is installed with the package.'),
    notApplicable(
      'error',
      'An absent layout is an unavailable value the empty state names, not an error.',
    ),
    notApplicable('disabled', 'A read-only layout is not interactive.'),
  ],
});

registerPreview({
  componentId: 'confirm-dialog',
  group: 'Decisions',
  component: ConfirmDialog,
  contract: contract(
    'confirm-dialog',
    {
      role: 'dialog',
      visibleNameMatchesAccessibleName: true,
      exposedStates: [],
      relationships: ['label', 'description'],
      textEquivalents: ['destructive intent'],
    },
    ['default', 'error'],
  ),
  states: [
    state(
      'default',
      {
        open: true,
        title: 'Replace the build you are working on?',
        description:
          'Your current Anaconda build has unsaved changes. Opening this Cutter build discards them.',
        confirmLabel: 'Discard and open',
        cancelLabel: 'Keep what I have',
        dismissLabel: 'Close',
      },
      [
        'both outcomes are named in their own words, never OK and Cancel',
        'the description is associated with the dialog',
        'the background is inert and absent from the accessibility tree',
      ],
      ['normal', 'expanded-copy', 'rtl', 'long-identity'],
      true,
    ),
    notApplicable('empty', 'A confirmation always names a subject and two outcomes.'),
    notApplicable(
      'loading',
      'The decision is the Commander’s; nothing is pending while it is open.',
    ),
    state(
      'error',
      {
        open: true,
        title: 'Delete “Anaconda explorer”?',
        description: 'This removes the saved build from this browser. It cannot be undone.',
        confirmLabel: 'Delete this build',
        cancelLabel: 'Keep this build',
        dismissLabel: 'Close',
        destructive: true,
      },
      [
        'the destructive outcome is carried by the wording, not only by emphasis',
        'the record being deleted is named',
      ],
      ['normal', 'expanded-copy', 'rtl'],
      true,
    ),
    notApplicable(
      'disabled',
      'A dialog with no usable answer would trap a Commander in a decision they cannot make.',
    ),
  ],
});

registerPreview({
  componentId: 'choice-dialog',
  group: 'Decisions',
  component: ChoiceDialog,
  contract: contract(
    'choice-dialog',
    {
      role: 'dialog',
      visibleNameMatchesAccessibleName: true,
      exposedStates: [],
      relationships: ['label', 'description'],
      textEquivalents: ['which version each choice keeps'],
    },
    ['default', 'error'],
  ),
  states: [
    state(
      'default',
      {
        open: true,
        title: 'This build was changed in another tab',
        description: 'Another tab saved “Anaconda explorer” after you opened it.',
        choices: [
          {
            id: 'overwrite',
            label: 'Replace the other tab’s version',
            outcome: 'Your version is kept. The version the other tab saved is replaced.',
          },
          {
            id: 'keep-both',
            label: 'Keep both versions',
            outcome: 'Both versions are kept, as two separate saved builds.',
          },
          {
            id: 'cancel',
            label: 'Do not save',
            outcome: 'Nothing is saved. The other tab’s version is kept.',
            emphasis: 'quiet',
          },
        ],
        dismissLabel: 'Close',
      },
      [
        'each choice states which version survives, in visible associated text',
        'the choices are a semantic list',
        'the emitted value is a stable identity, never the translated label',
      ],
      ['normal', 'expanded-copy', 'rtl', 'long-identity'],
      true,
    ),
    notApplicable(
      'empty',
      'A decision with no choices is not a decision; the dialog is only shown when there are ways out.',
    ),
    notApplicable(
      'loading',
      'The decision is the Commander’s; nothing is pending while it is open.',
    ),
    state(
      'error',
      {
        open: true,
        title: 'This build was changed in another tab',
        description: 'The build changed again while you were deciding.',
        choices: [
          {
            id: 'overwrite',
            label: 'Replace the other tab’s version',
            outcome: 'Your version is kept. The newest stored version is replaced.',
          },
          {
            id: 'cancel',
            label: 'Do not save',
            outcome: 'Nothing is saved. The newest stored version is kept.',
            emphasis: 'quiet',
          },
        ],
        dismissLabel: 'Close',
      },
      [
        'a third revision refreshes the question rather than overwriting silently',
        'the refreshed outcome text names what is now stored',
      ],
      ['normal', 'expanded-copy', 'rtl'],
      true,
    ),
    notApplicable(
      'disabled',
      'A dialog with no usable answer would trap a Commander in a decision they cannot make.',
    ),
  ],
});

// ---------------------------------------------------------------------------
// Feature 001 additions: the saved-build library surfaces.
// ---------------------------------------------------------------------------

/** One hull name, presented the way the library receives it. */
const ANACONDA_NAME = ANACONDA.name;

const NAMED_BUILD = {
  id: 'record-1',
  name: 'Anaconda explorer',
  hull: ANACONDA_NAME,
  modified: '12 August 2026, 14:20',
  validation: { label: 'Complete', tone: 'success' },
  note: 'Neutron route to Colonia. Swap the AFMU before the return leg.',
  actions: [
    { id: 'open', label: 'Open Anaconda explorer', emphasis: 'primary' },
    { id: 'rename', label: 'Rename Anaconda explorer' },
    { id: 'duplicate', label: 'Duplicate Anaconda explorer' },
    { id: 'delete', label: 'Delete Anaconda explorer', emphasis: 'danger' },
  ],
} as const;

/** A build that was never named and carries no note of its own. */
const WORKING_BUILD = {
  ...NAMED_BUILD,
  id: 'record-working',
  name: null,
  note: null,
  actions: [{ id: 'open', label: 'Open the working build', emphasis: 'primary' }],
} as const;

registerPreview({
  componentId: 'saved-build-card',
  group: 'Library',
  component: SavedBuildCard,
  contract: contract(
    'saved-build-card',
    {
      role: 'article',
      visibleNameMatchesAccessibleName: true,
      exposedStates: [],
      relationships: ['label', 'description'],
      textEquivalents: ['validation verdict', 'working state'],
    },
    ['default', 'empty', 'error'],
  ),
  states: [
    state(
      'default',
      { build: NAMED_BUILD },
      [
        'every action names the record it acts on, so no label reads as a bare verb',
        'the recorded verdict is words with a tone, never a coloured dot',
        'each fact is paired with the label that names it',
      ],
      ['normal', 'expanded-copy', 'rtl', 'german-format', 'long-identity'],
    ),
    state(
      'empty',
      { build: WORKING_BUILD },
      [
        'a build with no name is shown as a working build rather than given an invented one',
        'an absent note is omitted rather than rendered as an empty field',
      ],
      ['normal', 'expanded-copy', 'rtl'],
    ),
    notApplicable(
      'loading',
      'A record is read from this browser’s own storage before the card is given it; there is nothing left to wait for.',
    ),
    state(
      'error',
      {
        build: {
          ...NAMED_BUILD,
          validation: { label: 'Power draw exceeds the plant’s output', tone: 'error' },
        },
      },
      [
        'the verdict recorded when the build was saved is stated in words',
        'an invalid build is still openable, renameable and deletable',
      ],
      ['normal', 'expanded-copy', 'rtl'],
    ),
    notApplicable(
      'disabled',
      'A stored build a Commander could not act on would be a build stranded in their own library.',
    ),
  ],
});

registerPreview({
  componentId: 'responsive-record-list',
  group: 'Library',
  component: ResponsiveRecordList,
  contract: contract(
    'responsive-record-list',
    {
      role: 'list',
      visibleNameMatchesAccessibleName: true,
      exposedStates: [],
      relationships: ['label'],
      textEquivalents: ['group membership', 'why a record cannot be opened'],
    },
    ['default', 'empty', 'error'],
  ),
  states: [
    state(
      'default',
      {
        label: 'Saved builds',
        groups: [
          {
            id: 'working',
            label: 'Working builds',
            builds: [WORKING_BUILD],
            emptyLabel: 'No working builds.',
          },
          {
            id: 'named',
            label: 'Named builds',
            builds: [NAMED_BUILD, { ...NAMED_BUILD, id: 'record-2', name: 'Krait combat' }],
            emptyLabel: 'No named builds yet.',
          },
        ],
      },
      [
        'each group carries its own heading and stays in one reading order',
        'the narrow and wide compositions present the same records in the same order',
      ],
      ['normal', 'expanded-copy', 'rtl', 'long-identity'],
    ),
    state(
      'empty',
      {
        label: 'Saved builds',
        groups: [
          {
            id: 'named',
            label: 'Named builds',
            builds: [],
            emptyLabel: 'No builds are saved in this browser.',
          },
        ],
      },
      ['an empty group says so in text rather than collapsing to nothing'],
    ),
    notApplicable(
      'loading',
      'The list renders the records it is given; reading them from storage belongs to the library store.',
    ),
    state(
      'error',
      {
        label: 'Saved builds',
        groups: [
          {
            id: 'named',
            label: 'Named builds',
            builds: [NAMED_BUILD],
            emptyLabel: 'No named builds yet.',
          },
        ],
        unavailableLabel: 'Builds this version cannot open',
        unavailable: [
          {
            id: 'record-future',
            explanation: 'This build was saved by a newer version of the application.',
            detail: 'Last changed 2 August 2026',
          },
        ],
      },
      [
        'a record that cannot be opened is listed with what is known about it, never hidden',
        'the explanation says why, so a Commander knows the build is still theirs',
      ],
      ['normal', 'expanded-copy', 'rtl'],
    ),
    notApplicable(
      'disabled',
      'The list is a container; a record’s own actions carry any disabled state.',
    ),
  ],
});

registerPreview({
  componentId: 'record-manager',
  group: 'Library',
  component: RecordManager,
  contract: contract(
    'record-manager',
    {
      role: 'group',
      visibleNameMatchesAccessibleName: true,
      exposedStates: ['checked'],
      relationships: ['label', 'description'],
      textEquivalents: ['why room is needed', 'what each record is'],
    },
    ['default', 'empty', 'error'],
  ),
  states: [
    state(
      'default',
      {
        reason: 'This browser keeps 20 working builds. Discard one to make room for another.',
        records: [
          { id: 'record-1', label: 'Anaconda explorer', detail: 'Anaconda — 12 August 2026' },
          { id: 'record-2', label: 'Krait combat', detail: 'Krait Mk II — 9 August 2026' },
          { id: 'record-3', label: 'Working build', detail: 'Cutter — 2 August 2026' },
        ],
        selected: ['record-3'],
      },
      [
        'every record is listed and selected individually — nothing is preselected',
        'each record carries enough detail to decide without opening it',
        'the discard action stays inert until something is chosen',
      ],
      ['normal', 'expanded-copy', 'rtl', 'german-format', 'long-identity'],
    ),
    state('empty', { records: [], selected: [] }, [
      'says there is nothing to discard rather than offering an empty choice',
    ]),
    notApplicable(
      'loading',
      'The records were already read to reach the limit that opened this; none of them is pending.',
    ),
    state(
      'error',
      {
        reason: 'This browser has no room left to save builds. Discard one to continue.',
        records: [
          { id: 'record-1', label: 'Anaconda explorer', detail: 'Anaconda — 12 August 2026' },
        ],
        selected: [],
      },
      [
        'a full store is explained in words a Commander can act on',
        'nothing is discarded automatically, however full the store is',
      ],
      ['normal', 'expanded-copy', 'rtl'],
    ),
    notApplicable(
      'disabled',
      'The manager only opens when room has to be made; a disabled one would leave a Commander unable to make it.',
    ),
  ],
});

registerPreview({
  componentId: 'record-note-editor',
  group: 'Library',
  component: RecordNoteEditor,
  contract: contract(
    'record-note-editor',
    {
      role: 'textbox',
      visibleNameMatchesAccessibleName: true,
      exposedStates: ['disabled'],
      relationships: ['label', 'description'],
      textEquivalents: [],
    },
    ['default', 'empty', 'disabled'],
  ),
  states: [
    state(
      'default',
      { note: 'Neutron route to Colonia. Swap the AFMU before the return leg.' },
      [
        'the note has its own save action, so editing one never marks the build as changed',
        'the label is programmatically associated with the control',
      ],
      ['normal', 'expanded-copy', 'rtl', 'long-identity'],
    ),
    state('empty', { note: null }, ['renders with no note and keeps its label and description']),
    notApplicable(
      'loading',
      'A note is read from this browser’s own storage with the record it belongs to.',
    ),
    notApplicable(
      'error',
      'Any text is a valid note: it is local metadata, never part of a build, a link or an export, so there is nothing for it to fail.',
    ),
    state('disabled', { note: 'Neutron route to Colonia.', disabled: true }, [
      'exposes the disabled state natively on the control and its save action',
    ]),
  ],
});

// ---------------------------------------------------------------------------
// Feature 001 additions: passing a build on.
// ---------------------------------------------------------------------------

/** A published link at roughly the length a real engineered build produces. */
const PUBLISHED_URL =
  'https://ships.example/build#b.1QAcOnR2yV9tGm4KpZ0xLbW7fEuHsJdCiNrTaMoPqXvYbZ3g5hKlD8eF';

registerPreview({
  componentId: 'share-link-panel',
  group: 'Sharing',
  component: ShareLinkPanel,
  contract: contract(
    'share-link-panel',
    {
      role: 'region',
      visibleNameMatchesAccessibleName: true,
      exposedStates: [],
      relationships: ['label', 'description'],
      textEquivalents: ['copy outcome', 'why a link was refused'],
    },
    ['default', 'empty', 'loading', 'error', 'disabled'],
  ),
  states: [
    state(
      'default',
      { state: 'published', url: PUBLISHED_URL, shareAvailable: true },
      [
        'the link text is present and selectable before anything is pressed',
        'the value scrolls inside its own labelled region, never the document',
        'the value is reachable without a pointer',
      ],
      ['normal', 'expanded-copy', 'rtl', 'reduced-motion', 'long-identity'],
    ),
    state('empty', { state: 'absent' }, [
      'says there is no build to link to rather than showing an empty box',
    ]),
    state('loading', { state: 'encoding' }, [
      'the pending state is named in text',
      'no stale link is shown while a new one is being prepared',
    ]),
    state(
      'error',
      {
        state: 'refused',
        refusal: {
          message: 'This build link names a hull or module the installed Almanac does not carry.',
          detail: 'The mount involved is Slot03_Size6.',
        },
        slefAvailable: false,
      },
      [
        'the refusal is the application’s own words, never an internal exception message',
        'the mount involved is named where the codec could name one',
        'a retry is offered, and the file alternative says plainly that it is not in this version',
      ],
      ['normal', 'expanded-copy', 'rtl'],
    ),
    state(
      'disabled',
      { state: 'published', url: PUBLISHED_URL, feedback: 'copy-failed', shareAvailable: false },
      [
        'a platform that cannot copy leaves the link text on screen and selectable',
        'the failure says what to do instead rather than only that it failed',
      ],
      ['normal', 'expanded-copy', 'rtl'],
    ),
  ],
});
