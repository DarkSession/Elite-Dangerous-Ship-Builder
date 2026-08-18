# Screen Definition: Help, Licences and Provenance

## Purpose and route

`/help` is the single durable destination for application behavior, shipped identities, provenance,
licences and package-defect reporting. It is eager and build-independent. Browser Back returns to the
originating capability; route activation neither reads nor writes active build/persistence data.

## Composition

The screen composes feature 011's shared shell, page heading, section navigation, section/article,
definition-list, inline notice, disclosure, internal action and external-navigation primitives. If a
shared legal-document disclosure or external-navigation warning does not exist, extend `src/app/ui/`
and preview it before the screen consumes it.

Semantic/DOM order is fixed:

1. `main` and one visible page heading;
2. local section navigation;
3. “How this application behaves” with seven help topics;
4. “Versions” with application, bundled Almanac and release/build facts;
5. “Data and calculation provenance” with legal targets and package-defect action;
6. “Licences and notices” coverage index;
7. three complete legal-document disclosures.

Wide layouts may position the in-page navigation beside the document and may place short topic/fact
groups in fluid columns. DOM/reading order never changes. Tablet narrows the grid; mobile, landscape
constraints, text expansion and 400% zoom use one complete stack.

## Help topics

Each topic has a localised visible heading and concise body. Topics describe:

- what fragment build links contain and what deliberate sharing does;
- no accounts, uploads or telemetry;
- browser-local/session persistence and site-data clearing;
- bundled offline text versus same-origin artwork cached after opening;
- completed engineering-grade normalization;
- hull catalogue facts versus fitted-build/view-condition results;
- Almanac ownership of game values/calculations and the absence of a live-currency claim.

No topic repeats a package diagnostic, adds a game fact, predicts an unaccepted feature or describes
storage as cloud backup.

## Versions and provenance

The identity fact list uses distinct labels and never a combined “version” string:

- Application version: exact root manifest value.
- Bundled Almanac version: exact installed package value.
- Build: “Release” only with validated release evidence; otherwise “Non-release build” and exact
  safe build ID.

Provenance facts identify application code, Almanac code, catalogue/game data, calculations,
Frontier data/imagery and other upstream material. Each fact points to the relevant complete legal
document through the coverage index. “Bundled” is visible wherever the Almanac version/data is
described; no text says “current,” “live,” “latest game” or “live catalogue.”

The package-defect action is visually separate from local legal navigation. Its visible label and
associated text say it reports Almanac data/calculation defects and leaves the application. The
external icon, if the design system uses one, supplements rather than replaces that text.

## Legal documents

The coverage index first explains scope in application-localised language:

| Coverage                                                     | Complete source document                   |
| ------------------------------------------------------------ | ------------------------------------------ |
| Application code/documentation and app-specific Frontier use | root application `LICENSE`                 |
| Almanac code/documentation and redistributed data scope      | installed Almanac `LICENSE`                |
| Other source terms and package Frontier media-usage notice   | installed Almanac `THIRD_PARTY_NOTICES.md` |

Each native disclosure shows localised owner/source/coverage framing and an associated “Original
English legal text” disclosure. The exact body is a text node in a programmatic English region. Use a
wrapping preformatted treatment that preserves characters/line breaks without fixed-width overflow.
Do not auto-link URLs inside the exact body, because that would change the artifact's presentation
and create numerous unidentified external actions; separately designed localised links provide the
only external navigation.

## States

| State                          | Presentation                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| Release identity               | Two separate versions and explicit release status; no build ID required on screen                 |
| Non-release identity           | Two separate versions, prominent textual non-release status and build ID                          |
| Default legal overview         | Coverage index visible; complete document disclosures collapsed                                   |
| One/all documents expanded     | Exact text already present; expansion adds no request/loading state                               |
| Alternate locale               | All owned framing translated; legal text remains unchanged and associated with English disclosure |
| Expanded/RTL fixture           | Owned text expands/reverses around stable legal English region without truncation/overflow        |
| Offline reload                 | Same full content after production app shell install; no stale/loading/error notice               |
| Missing/empty/drifted artifact | No runtime screen; build/release fails with source-specific diagnostic                            |

## Responsive behavior

- Content width uses shared readable-measure/layout tokens; no fixed mock dimensions.
- `pre`/legal content uses shared typography/spacing tokens, `white-space: pre-wrap`, safe overflow
  wrapping and `max-inline-size: 100%` semantics from a reusable component.
- No document-level horizontal scrolling occurs at any supported viewport, portrait/landscape, 200%
  text or 400% zoom. A component-local horizontal scrollbar is not acceptable for legal prose because
  it would make long reading impractical at zoom.
- In-page navigation wraps/stacks and never becomes the sole way to reach a section.
- All summary, internal and external actions meet the shared 44 CSS px target and work by touch and
  pointer without hover.
- Motion is unnecessary; any shared disclosure transition is disabled/reduced under
  `prefers-reduced-motion` and conveys no state by motion alone.

## Accessibility and announcements

- Section headings and articles expose a coherent screen-reader outline. Definition terms/values and
  owner/source/language descriptions are programmatically associated.
- Native disclosure exposes its expanded state. Summaries name the exact document owner/type rather
  than repeating “Read more.”
- Opening a document does not need a live announcement beyond native state. Route changes use the
  shared route-title/heading behavior; no long legal body is injected into a live region.
- Non-release state, untranslated English and external navigation are explicit text, never carried by
  color, icon or position.
- Manual screen-reader validation covers locating help globally, reading identities/provenance,
  expanding each document, identifying its language/scope and finding the warned external action.
- Axe covers overview and every expanded state in all projects but is not treated as proof of reading
  order or exact text.

## Component-system impact

Reuse feature 011 shell navigation, page/section, fact list, notice, disclosure and action components.
If missing, add reusable `LegalDocument`, `VersionFacts`, `ContextHelpLink` and
`ExternalNavigationLink` primitives under `src/app/ui/`; none reads manifests, Router, locale/browser
globals or package files. Components receive complete inputs and emit navigation/disclosure intent.
