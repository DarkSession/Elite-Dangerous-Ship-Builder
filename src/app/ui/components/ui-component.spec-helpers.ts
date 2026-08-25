import { type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { DocumentAdapter } from '../../platform/browser/document.adapter';
import { provideLocalization } from '../../i18n/i18n.providers';

/** A document adapter that records nothing — component tests are not locale tests. */
class SilentDocumentAdapter {
  commitRootState(): void {}
}

/**
 * Renders a shared component with the production localization providers.
 *
 * The same providers the product and the preview application use, so a test
 * cannot pass against a message boundary that does not exist in either.
 */
export function renderComponent<T>(
  component: Type<T>,
  inputs: Record<string, unknown> = {},
): ComponentFixture<T> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideLocalization(),
      { provide: DocumentAdapter, useValue: new SilentDocumentAdapter() },
    ],
  });

  const fixture = TestBed.createComponent(component);
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
  fixture.detectChanges();
  return fixture;
}

/** The rendered root element. */
export function element<T>(fixture: ComponentFixture<T>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

/** Queries one element, failing the test rather than returning null. */
export function query<T>(fixture: ComponentFixture<T>, selector: string): HTMLElement {
  const found = element(fixture).querySelector<HTMLElement>(selector);
  if (found === null) {
    throw new Error(`No element matched "${selector}".`);
  }
  return found;
}

/** Normalised text content, the way an accessible-name computation would read it. */
export function textOf(node: Element | null): string {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * The text of an element with every hidden subtree left out.
 *
 * `textContent` reads the whole tree, including the parts marked away from the
 * accessibility tree. Anything under `aria-hidden="true"` is not named, so a
 * name computed from it would assert something no reader is told.
 */
function namedTextOf(node: Element | null): string {
  if (node === null) {
    return '';
  }
  const copy = node.cloneNode(true) as Element;
  for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) {
    hidden.remove();
  }
  return textOf(copy);
}

/**
 * The text a screen reader would use to name an element.
 *
 * Not a full accessible-name computation — enough to assert the parity the
 * component contract promises between what is seen and what is announced.
 */
export function accessibleName(node: HTMLElement): string {
  const label = node.getAttribute('aria-label');
  if (label !== null && label.trim().length > 0) {
    return label.replace(/\s+/g, ' ').trim();
  }
  const labelledBy = node.getAttribute('aria-labelledby');
  if (labelledBy !== null) {
    return labelledBy
      .split(/\s+/)
      .map((id) => namedTextOf(node.ownerDocument.getElementById(id)))
      .join(' ')
      .trim();
  }
  return namedTextOf(node);
}

/** The text of the elements a control is described by. */
export function describedText(node: HTMLElement): string {
  const ids = node.getAttribute('aria-describedby');
  if (ids === null) {
    return '';
  }
  return ids
    .split(/\s+/)
    .map((id) => textOf(node.ownerDocument.getElementById(id)))
    .join(' ')
    .trim();
}
