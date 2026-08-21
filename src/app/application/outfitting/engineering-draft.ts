import type { OutfittingModule } from '@elite-dangerous-almanac/core/ships/modules';
import type {
  AvailableBlueprint,
  ShipLoadout,
} from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { captureCheckpoint, restoreCheckpoint } from '../../domain/build/modeled-build-checkpoint';
import type { EditOperation } from '../../domain/outfitting/build-edit-transaction';
import {
  engineeringCost,
  type EngineeringCostView,
} from '../../domain/outfitting/engineering-cost';
import type { BuildEditIntent } from './build-edit-intent';
import { engineeringView, type EngineeringView } from './engineering-view';
import { fittedModuleView, type ModuleTextResolver } from './fitted-module-view';

/**
 * The Commander choosing the package's explicit no-blueprint entry.
 *
 * Kept distinct from `null` all the way through, because they are two different
 * facts and only one of them is an instruction: `null` means nothing has been
 * chosen yet, and `'none'` means "remove the engineering". Collapsing them would
 * make opening the editor look like asking to strip the module, and it would
 * make the apply control's meaning depend on state a Commander cannot see
 * (data model, "EngineeringView and EngineeringDraft").
 */
export const NO_BLUEPRINT = 'none';

/** What a Commander has chosen. Selection only — never build state. */
export interface EngineeringSelection {
  readonly blueprintFdname: string | typeof NO_BLUEPRINT | null;
  readonly grade: number | null;
  /** `null` is an explicit "no effect", which is a choice, not an omission. */
  readonly effectFdname: string | null;
}

/**
 * One package module field the editor compares.
 *
 * A fixed, ordered table rather than whatever the package's modifier block
 * happens to name. A journal modifier label — `FSDOptimalMass`, `DamagePerSecond`
 * — is a package identity with no translation anywhere in the Almanac, and
 * echoing one as a column heading would ship an untranslatable English string
 * into a German screen. These are the fields the canvas's panel draws, each
 * carrying an application-owned localized label the way the chooser's columns
 * already do (FR-020, localization contract).
 */
export const COMPARED_ATTRIBUTES = [
  'damage',
  'thermalLoad',
  'clipSize',
  'powerDraw',
  'mass',
  'integrity',
] as const;

export type ComparedAttribute = (typeof COMPARED_ATTRIBUTES)[number];

/** One row of the comparison. Either side may be unavailable, and stays so. */
export interface AttributeComparison {
  readonly attribute: ComparedAttribute;
  readonly current: number | null;
  readonly candidate: number | null;
}

/**
 * What the draft would produce, read off a build nobody is looking at.
 *
 * `unavailable` is not a failure to render around: it is the package declining
 * to resolve the article, or refusing the selection outright, and either way
 * there is no candidate to describe. No value is estimated in its place.
 */
export type EngineeringPreview =
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'known'; readonly attributes: readonly AttributeComparison[] };

/**
 * One mount's engineering editor, as a value.
 *
 * The draft holds *selection* and the package answers it produced; it holds no
 * build. Opening it, changing it and abandoning it spend no revision and record
 * no history, which is why a Commander can look at what a grade 5 would cost
 * and walk away having changed nothing (FR-018).
 *
 * `baseBuildRevision` is what makes that safe in the other direction. A draft
 * built against a build that has since changed describes menus that were true a
 * revision ago; applying it would be applying a decision to a build the
 * Commander is no longer looking at, so a stale draft refuses and rebuilds
 * instead (data model, "EngineeringDraft").
 */
export interface EngineeringDraft {
  readonly slotKey: string;
  readonly baseBuildRevision: number;
  /** The package's exact menu for this mount, in the package's own order. */
  readonly blueprints: readonly AvailableBlueprint[];
  readonly selectedBlueprintFdname: string | typeof NO_BLUEPRINT | null;
  /** The selected recipe's route. `null` when nothing, or `'none'`, is selected. */
  readonly selectedRoute: AvailableBlueprint['route'] | null;
  /** Always one of the selected descriptor's own grades, or `null`. */
  readonly selectedGrade: number | null;
  /** Exactly the effects the package offers this mount. */
  readonly effects: readonly string[];
  readonly selectedEffectFdname: string | null;
  /** What the module carries now, for the editor to show beside the choice. */
  readonly current: EngineeringView;
  readonly preview: EngineeringPreview;
  readonly cost: EngineeringCostView;
  /**
   * Whether the package offers this mount any engineering at all.
   *
   * An empty menu is a complete, correct answer — the cargo hatch, a fuel tank,
   * a final Guardian article — and it is not the same as the editor failing to
   * read one. The editor says so rather than drawing an empty list (FR-009).
   */
  readonly packageEmpty: boolean;
  /** True on an article the package will accept no further engineering on. */
  readonly finalArticle: boolean;
}

/**
 * The selection an editor opens with: whatever the module already carries.
 *
 * Opening the editor is not a decision, so it proposes the state the Commander
 * is already in. A module with no engineering opens with nothing selected —
 * *not* with `'none'`, which would be the editor proposing to strip a module
 * that has nothing to strip.
 */
export function openingSelection(current: EngineeringView): EngineeringSelection {
  return {
    blueprintFdname: current.blueprintFdname,
    grade: current.currentGrade,
    effectFdname: current.effectFdname,
  };
}

/**
 * Builds the draft for one mount at one revision.
 *
 * `null` when the mount is empty: there is no module to engineer, and an editor
 * over nothing would be a surface with nothing behind it.
 */
export function openEngineeringDraft(
  loadout: ShipLoadout,
  slotKey: string,
  buildRevision: number,
  selection: EngineeringSelection,
  text: ModuleTextResolver,
): EngineeringDraft | null {
  const fitted = loadout.fittedModuleAt(slotKey);
  if (fitted === null) {
    return null;
  }

  const module = fittedModuleView(fitted, text);
  const current = engineeringView(module);
  const blueprints = loadout.availableBlueprints(slotKey);
  const effects = loadout.availableExperimentalEffects(slotKey);

  const descriptor =
    selection.blueprintFdname === null || selection.blueprintFdname === NO_BLUEPRINT
      ? null
      : (blueprints.find((candidate) =>
          sameIdentity(candidate.fdname, selection.blueprintFdname),
        ) ?? null);

  // A grade is only a grade if the selected descriptor offers it. Anything else
  // is a number the package never published for this recipe, and the package
  // would refuse it — after the Commander had been offered it.
  const selectedGrade =
    descriptor !== null && selection.grade !== null && descriptor.grades.includes(selection.grade)
      ? selection.grade
      : null;

  // Likewise for the effect: the menu is the package's, and a selection that
  // has fallen off it is no selection.
  const selectedEffectFdname =
    selection.effectFdname !== null &&
    effects.some((candidate) => sameIdentity(candidate, selection.effectFdname))
      ? selection.effectFdname
      : null;

  const resolved: EngineeringSelection = {
    blueprintFdname:
      selection.blueprintFdname === NO_BLUEPRINT ? NO_BLUEPRINT : (descriptor?.fdname ?? null),
    grade: selectedGrade,
    effectFdname: selectedEffectFdname,
  };

  return {
    slotKey,
    baseBuildRevision: buildRevision,
    blueprints,
    selectedBlueprintFdname: resolved.blueprintFdname,
    selectedRoute: descriptor?.route ?? null,
    selectedGrade,
    effects,
    selectedEffectFdname,
    current,
    preview: previewOf(loadout, slotKey, resolved, current, module.effectiveArticle),
    cost: engineeringCost({
      blueprintFdname: resolved.blueprintFdname === NO_BLUEPRINT ? null : resolved.blueprintFdname,
      grade: selectedGrade,
      effectFdname: selectedEffectFdname,
      currentBlueprintFdname: current.blueprintFdname,
      currentGrade: current.currentGrade,
      currentEffectFdname: current.effectFdname,
      purchaseVariant: current.purchaseVariant,
    }),
    packageEmpty: blueprints.length === 0 && effects.length === 0,
    finalArticle: current.purchaseVariant?.engineeringLocked === true,
  };
}

/**
 * Moves the selection to one blueprint, keeping the grade where the new recipe
 * offers it.
 *
 * A recipe that does not offer the grade the Commander was looking at falls to
 * that recipe's own highest grade rather than to nothing, because a complete
 * grade is what this application models and the editor's whole subject is which
 * complete grade to apply. `'none'` clears the grade entirely: there is no
 * grade of not being engineered.
 */
export function withBlueprint(
  draft: EngineeringDraft,
  fdname: string | typeof NO_BLUEPRINT,
): EngineeringSelection {
  if (fdname === NO_BLUEPRINT) {
    // Clearing removes the effect with the blueprint, because that is what the
    // package's `clearEngineering` does. Leaving an effect selected would show
    // a choice the operation is about to discard.
    return { blueprintFdname: NO_BLUEPRINT, grade: null, effectFdname: null };
  }

  const descriptor = draft.blueprints.find((candidate) => sameIdentity(candidate.fdname, fdname));
  if (descriptor === undefined) {
    return currentSelection(draft);
  }

  const grade =
    draft.selectedGrade !== null && descriptor.grades.includes(draft.selectedGrade)
      ? draft.selectedGrade
      : (descriptor.grades.at(-1) ?? null);

  return {
    blueprintFdname: descriptor.fdname,
    grade,
    effectFdname: draft.selectedEffectFdname,
  };
}

/** Moves the selection to one grade of the selected recipe. */
export function withGrade(draft: EngineeringDraft, grade: number): EngineeringSelection {
  return { ...currentSelection(draft), grade };
}

/** Moves the selection to one effect, or to the explicit no-effect. */
export function withEffect(draft: EngineeringDraft, fdname: string | null): EngineeringSelection {
  return { ...currentSelection(draft), effectFdname: fdname };
}

/** The draft's own selection, as the value the transitions build from. */
export function currentSelection(draft: EngineeringDraft): EngineeringSelection {
  return {
    blueprintFdname: draft.selectedBlueprintFdname,
    grade: draft.selectedGrade,
    effectFdname: draft.selectedEffectFdname,
  };
}

/** True when the draft describes a build that has since changed. */
export function draftIsStale(draft: EngineeringDraft, buildRevision: number): boolean {
  return draft.baseBuildRevision !== buildRevision;
}

/**
 * The one decision applying this draft makes, or none.
 *
 * Three intents rather than one, because the package offers three operations
 * and they are not interchangeable. `'none'` dispatches `clearEngineering` and
 * never `applyBlueprint` with an empty recipe — the package has a word for
 * removing engineering and using a different call with a hole in it would blur
 * what was asked for (data model, "EngineeringDraft").
 *
 * An effect change on its own is `setExperimentalEffect`, which is what keeps a
 * fixed reward's hand-set modifier block and its purchase identity intact:
 * re-applying the blueprint would roll the recipe and lose both (FR-012).
 */
export function engineeringIntent(draft: EngineeringDraft): BuildEditIntent | null {
  return selectionIntent(draft.slotKey, currentSelection(draft), draft.current);
}

/**
 * Which of the three operations one selection asks for, against what is fitted.
 *
 * Shared with the preview so a Commander is shown the result of the operation
 * that would actually run. Previewing an effect-only change as though it were a
 * fresh `applyBlueprint` would show a fixed reward rolled into an ordinary
 * module — the exact loss FR-012 exists to prevent — and then commit something
 * else entirely.
 */
function selectionIntent(
  slotKey: string,
  selection: EngineeringSelection,
  current: EngineeringView,
): BuildEditIntent | null {
  const selected = selection.blueprintFdname;

  if (selected === NO_BLUEPRINT) {
    return { kind: 'clearEngineering', slotKey };
  }

  const effectChanged = !sameIdentity(selection.effectFdname, current.effectFdname);

  if (
    selected === null ||
    selection.grade === null ||
    (sameIdentity(selected, current.blueprintFdname) && selection.grade === current.currentGrade)
  ) {
    // Nothing about the recipe is moving. If the effect is, that is its own
    // operation; if it is not, there is no decision here at all.
    return effectChanged
      ? { kind: 'setExperimental', slotKey, effectFdname: selection.effectFdname }
      : null;
  }

  return {
    kind: 'applyEngineering',
    slotKey,
    blueprintFdname: selected,
    grade: selection.grade,
    effectFdname: selection.effectFdname,
  };
}

/**
 * The package operation one engineering intent performs on a candidate.
 *
 * Shared by the preview and by the store, so what a Commander was shown and
 * what is committed cannot be two different operations. `unsupported` from
 * `setExperimentalEffect` is reported through `onUnsupported` rather than
 * thrown: it is a structured refusal the package returns deliberately, and
 * turning it into an exception would lose the code and parameters that are the
 * whole reason it is structured (contract, "Refusals").
 */
export function engineeringOperation(
  intent: BuildEditIntent,
  onUnsupported?: (code: string, params: unknown) => void,
): EditOperation | null {
  switch (intent.kind) {
    case 'applyEngineering':
      return (candidate) => {
        candidate.applyBlueprint(intent.slotKey, intent.blueprintFdname, {
          grade: intent.grade,
          // Explicit, always. Every grade this application models is complete,
          // and letting the package's own default supply it would leave the one
          // number the whole feature turns on unstated (FR-013).
          quality: 1,
          // Omitted rather than passed as null when there is no effect: the
          // package reads the property once, and "not asked for" is the shape
          // its own signature is written in.
          ...(intent.effectFdname === null ? {} : { experimental: intent.effectFdname }),
        });
      };

    case 'setExperimental':
      return (candidate) => {
        const result = candidate.setExperimentalEffect(intent.slotKey, intent.effectFdname);
        if (result.kind === 'unsupported') {
          onUnsupported?.(result.code, result.params);
        }
      };

    case 'clearEngineering':
      return (candidate) => {
        candidate.clearEngineering(intent.slotKey);
      };

    default:
      return null;
  }
}

/**
 * The candidate this selection would produce, described against the current one.
 *
 * Built on a detached copy through the same checkpoint round trip every commit
 * uses, so what the preview measures is what would actually be installed rather
 * than an approximation of it. A refusal here is not surfaced as an error —
 * a half-chosen draft refusing is ordinary — it simply has nothing to show.
 */
function previewOf(
  loadout: ShipLoadout,
  slotKey: string,
  selection: EngineeringSelection,
  current: EngineeringView,
  currentArticle: OutfittingModule | null,
): EngineeringPreview {
  const intent = selectionIntent(slotKey, selection, current);
  if (intent === null) {
    return { kind: 'unavailable' };
  }

  const operation = engineeringOperation(intent);
  if (operation === null) {
    return { kind: 'unavailable' };
  }

  const restored = restoreCheckpoint(captureCheckpoint(loadout));
  if (!restored.ok) {
    return { kind: 'unavailable' };
  }

  try {
    operation(restored.loadout);
  } catch {
    return { kind: 'unavailable' };
  }

  const candidateArticle = restored.loadout.fittedModuleAt(slotKey)?.effectiveStats ?? null;
  if (candidateArticle === null && currentArticle === null) {
    return { kind: 'unavailable' };
  }

  const attributes = COMPARED_ATTRIBUTES.map((attribute) => ({
    attribute,
    current: currentArticle?.[attribute] ?? null,
    candidate: candidateArticle?.[attribute] ?? null,
    // A row neither side publishes is not a row: a multi-cannon has no
    // integrity figure to compare and drawing an empty one would suggest the
    // package lost it.
  })).filter((row) => row.current !== null || row.candidate !== null);

  return { kind: 'known', attributes };
}

/** Package identities are compared the way the package matches them. */
function sameIdentity(left: string | null, right: string | null): boolean {
  if (left === null || right === null) {
    return left === right;
  }
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}
