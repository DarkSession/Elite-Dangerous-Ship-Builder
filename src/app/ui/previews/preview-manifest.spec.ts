import { COMPONENT_STATES } from '../component-contract';
import { previewDeclarations, validatePreviewManifest } from './preview-manifest';

describe('preview manifest', () => {
  it('registers at least one declaration', () => {
    expect(previewDeclarations().length).toBeGreaterThan(0);
  });

  it('has no violations', () => {
    expect(validatePreviewManifest()).toEqual([]);
  });

  it('accounts for every required state on every component', () => {
    for (const declaration of previewDeclarations()) {
      const declared = declaration.states.map((state) => state.state).sort();

      expect(declared, `component ${declaration.componentId}`).toEqual(
        [...COMPONENT_STATES].sort(),
      );
    }
  });

  it('gives every non-applicable state a nonempty rationale', () => {
    for (const declaration of previewDeclarations()) {
      for (const state of declaration.states) {
        if (state.fixture === null) {
          expect(
            state.naReason?.trim().length ?? 0,
            `${declaration.componentId} / ${state.state}`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it('gives every rendered state at least one named expectation', () => {
    for (const declaration of previewDeclarations()) {
      for (const state of declaration.states) {
        if (state.fixture !== null) {
          expect(
            state.expectations.length,
            `${declaration.componentId} / ${state.state}`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it('registers each component exactly once', () => {
    const ids = previewDeclarations().map((declaration) => declaration.componentId);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('addresses every state uniquely', () => {
    const addresses = previewDeclarations().flatMap((declaration) =>
      declaration.states.map((state) => `${declaration.componentId}--${state.state}`),
    );

    expect(new Set(addresses).size).toBe(addresses.length);
  });

  describe('validation rules', () => {
    const contract = {
      componentId: 'x',
      semantics: {
        role: 'button',
        visibleNameMatchesAccessibleName: true,
        exposedStates: [],
        relationships: [],
        textEquivalents: [],
      },
      states: [],
      variants: [],
    } as const;

    const declaration = (states: unknown[]) => ({
      componentId: 'x',
      group: 'g',
      contract,
      component: class {} as never,
      states: states as never,
    });

    it('rejects a missing required state', () => {
      const violations = validatePreviewManifest([
        declaration([
          { state: 'default', fixture: {}, naReason: null, variants: [], expectations: ['a'] },
        ]),
      ]);

      expect(violations.map((violation) => violation.state).sort()).toEqual([
        'disabled',
        'empty',
        'error',
        'loading',
      ]);
    });

    it('rejects a state that is neither rendered nor explained', () => {
      const violations = validatePreviewManifest([
        declaration(
          COMPONENT_STATES.map((state) => ({
            state,
            fixture: null,
            naReason: state === 'default' ? '   ' : 'reason',
            variants: [],
            expectations: [],
          })),
        ),
      ]);

      expect(violations).toContainEqual({
        componentId: 'x',
        state: 'default',
        reason: 'A state declared not applicable needs a nonempty rationale.',
      });
    });

    it('rejects a state claiming both a fixture and an N/A rationale', () => {
      const violations = validatePreviewManifest([
        declaration(
          COMPONENT_STATES.map((state) => ({
            state,
            fixture: {},
            naReason: state === 'empty' ? 'not applicable' : null,
            variants: [],
            expectations: ['a'],
          })),
        ),
      ]);

      expect(violations).toContainEqual({
        componentId: 'x',
        state: 'empty',
        reason: 'A state cannot have both a fixture and an N/A rationale.',
      });
    });

    it('rejects a rendered state with no named expectation', () => {
      const violations = validatePreviewManifest([
        declaration(
          COMPONENT_STATES.map((state) => ({
            state,
            fixture: {},
            naReason: null,
            variants: [],
            expectations: state === 'loading' ? [] : ['a'],
          })),
        ),
      ]);

      expect(violations).toContainEqual({
        componentId: 'x',
        state: 'loading',
        reason: 'A rendered state declares at least one named expectation.',
      });
    });

    it('rejects a duplicated state', () => {
      const violations = validatePreviewManifest([
        declaration([
          ...COMPONENT_STATES.map((state) => ({
            state,
            fixture: {},
            naReason: null,
            variants: [],
            expectations: ['a'],
          })),
          { state: 'default', fixture: {}, naReason: null, variants: [], expectations: ['a'] },
        ]),
      ]);

      expect(violations).toContainEqual({
        componentId: 'x',
        state: null,
        reason: 'The same state is declared more than once.',
      });
    });
  });
});
