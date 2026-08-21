import { NgComponentOutlet } from '@angular/common';
import {
  ApplicationConfig,
  Component,
  computed,
  provideBrowserGlobalErrorListeners,
  signal,
} from '@angular/core';
import { provideLocalization } from '../../../../src/app/i18n/i18n.providers';
import {
  type PseudoLocaleMode,
  providePseudoLocale,
  pseudoInputs,
} from '../../../../src/app/i18n/testing/pseudo-locales';
import type { ComponentVariant } from '../../../../src/app/ui/component-contract';
import {
  type PreviewDeclaration,
  type PreviewStateDeclaration,
  previewAddress,
  previewDeclarations,
} from '../../../../src/app/ui/previews/preview-manifest';

/** One rendered cell of the catalogue: a component in one declared state. */
interface PreviewCell {
  readonly address: string;
  readonly declaration: PreviewDeclaration;
  readonly state: PreviewStateDeclaration;
}

/**
 * Root of the tooling-only component preview application.
 *
 * It renders the production `src/app/ui/` exports against the production tokens
 * and localization providers — never a copy, never a reimplementation — so what
 * a reviewer or an axe scan sees here is what a Commander sees in the product
 * (design-system contract, "Preview manifest").
 *
 * This application is not a product route, is not reachable from product
 * navigation and is not part of the production build graph. Nothing it renders
 * carries a build or any Commander data.
 *
 * Addressing: every cell has a stable `componentId--state` id, so a test can
 * navigate straight to one state. `?address=` isolates a single cell, and
 * `?variant=` applies one cross-cutting condition to the whole page. Viewport
 * and orientation come from the Playwright project, never from the URL.
 */
@Component({
  selector: 'ui-preview-root',
  imports: [NgComponentOutlet],
  templateUrl: './preview-app.html',
  styleUrl: './preview-app.scss',
})
export class PreviewApp {
  readonly #query = signal(readQuery());

  /** Every declared state, or the single isolated one the address names. */
  readonly cells = computed<readonly PreviewCell[]>(() => {
    const wanted = this.#query().address;
    const all = previewDeclarations().flatMap((declaration) =>
      declaration.states.map((state) => ({
        address: previewAddress(declaration.componentId, state.state),
        declaration,
        state,
      })),
    );
    // A state that takes over the page — a modal layer — renders only when it
    // is addressed on its own, so it cannot make the rest of the catalogue
    // inert. The sweep visits those addresses individually.
    return wanted === null
      ? all.filter((cell) => cell.state.isolated !== true)
      : all.filter((cell) => cell.address === wanted);
  });

  /** The cross-cutting condition applied to the whole page, if any. */
  readonly variant = computed<ComponentVariant>(() => this.#query().variant);

  /**
   * Addresses that render only on their own.
   *
   * Listed so the sweep can discover and visit them: an isolated state must
   * still be scanned, and a state nothing links to is a state nothing checks.
   */
  readonly isolatedAddresses = computed<readonly string[]>(() =>
    this.#query().address !== null
      ? []
      : previewDeclarations().flatMap((declaration) =>
          declaration.states
            .filter((state) => state.isolated === true)
            .map((state) => previewAddress(declaration.componentId, state.state)),
        ),
  );

  /** True when nothing is registered yet — the honest state of an empty manifest. */
  readonly isEmpty = computed(() => this.cells().length === 0);

  readonly direction = computed(() => (this.variant() === 'rtl' ? 'rtl' : 'ltr'));

  /** A state declared not applicable renders its rationale instead of a fixture. */
  isRendered(state: PreviewStateDeclaration): boolean {
    return state.fixture !== null;
  }

  /**
   * The fixture as component inputs.
   *
   * A shallow copy, because `NgComponentOutlet` wants a mutable record and a
   * fixture is immutable by contract — handing it the declaration itself would
   * let a component write back into the manifest.
   */
  inputsFor(state: PreviewStateDeclaration): Record<string, unknown> {
    // The pseudo transform is applied here as well as to the catalogue: a
    // fixture passes display text to a component directly, so a catalogue-only
    // transform would leave every rendered component in plain English.
    return pseudoInputs(state.fixture ?? {}, pseudoMode(this.variant()));
  }
}

function readQuery(): { address: string | null; variant: ComponentVariant } {
  const params = new URLSearchParams(globalThis.location?.search ?? '');
  const variant = params.get('variant');
  return {
    address: params.get('address'),
    variant: (variant ?? 'normal') as ComponentVariant,
  };
}

/** The pseudo-locale one catalogue variant applies, or `null` for none. */
export function pseudoMode(variant: ComponentVariant): PseudoLocaleMode | null {
  if (variant === 'expanded-copy' || variant === 'rtl') {
    return variant;
  }
  return null;
}

export const previewAppConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideLocalization(),
    // Read once at bootstrap: the condition applies to the whole page, and a
    // pseudo-locale that could be switched on mid-session would be a selectable
    // locale, which is exactly what these must never be.
    ...providePseudoLocale(pseudoMode(readQuery().variant)),
  ],
};
