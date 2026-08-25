import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One labelled fact about the artifact a Commander is looking at. */
export interface VersionFact {
  /** Stable identity for tracking. Never shown. */
  readonly id: string;

  /** What the fact is, in the reader's own language. */
  readonly term: string;

  /** The fact itself, already settled by the layer that read the build. */
  readonly value: string;
}

/**
 * Which build this is, said in terms and definitions.
 *
 * The reference draws these as one compact line — `APP VERSION 4.2.1 · LIBRARY
 * VERSION 3.8.0.3` — and that is what this looks like. It is a description
 * list underneath, because each of these values means nothing without the
 * label beside it: a reader who meets `4.2.1` alone has been told a number,
 * not a version, and a screen reader that reads the group without its terms
 * has read out a list of numbers.
 *
 * That is also why release state is a fact here rather than a badge. A colour,
 * a position or a weight can carry it for some readers and for none of the
 * others; a term and its definition carry it for everyone, and the definition
 * is the word itself.
 *
 * The reference's interpunct is drawn as the space between facts rather than
 * as a character in the flow: a separator glyph is a thing a screen reader
 * announces between every pair of them.
 */
@Component({
  selector: 'edsb-version-facts',
  templateUrl: './version-facts.html',
  styleUrl: './version-facts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionFacts {
  /** The facts, in the order they are read. */
  readonly facts = input.required<readonly VersionFact[]>();
}
