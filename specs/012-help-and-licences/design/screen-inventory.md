# Screen Inventory: Help, Licences and Provenance

Feature 012 adds one modal layer and two embedded entry-surface patterns. It adds no route or
standalone page. All three compose the shared feature 011 design system.

## Inventory

| Surface                                  | Kind                   | Appears in                                                                 | Purpose                                                                 |
| ---------------------------------------- | ---------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Application-frame Help · About entry     | persistent embedded UI | every capability, no-build state and narrow action/navigation menu         | opens the shared modal without navigation                               |
| Contextual Help, data and licences entry | reusable embedded UI   | package-backed artwork/value regions and layers whose contracts require it | opens the same modal with optional in-memory context/topic position     |
| Help · About modal                       | shared modal layer     | above the current capability                                               | presents help, identities, provenance, exact disclaimer and two actions |

The application frame owns the single modal instance. A capability may emit an open intent but may
not embed a private modal, legal copy or route.

## Requirement mapping

| Requirement | Application-frame entry | Contextual entry                   | Help · About modal                                           | Build/source-distribution gate   |
| ----------- | ----------------------- | ---------------------------------- | ------------------------------------------------------------ | -------------------------------- |
| FR-001      | global/no-build access  | —                                  | in-place, eager, offline dialog                              | initial-bundle assertion         |
| FR-002      | fallback access         | artwork/value access               | common provenance/legal destination                          | —                                |
| FR-003      | —                       | —                                  | one exact excerpt and one warned GitHub `LICENSE` legal link | URL/text verification            |
| FR-004      | —                       | —                                  | clearly separates MIT from package/Frontier rights           | package-mirror equality          |
| FR-005      | —                       | —                                  | renders generated exact excerpt/destination                  | release fails on source mismatch |
| FR-006      | —                       | —                                  | localised framing plus labelled English excerpt              | byte/hash verification           |
| FR-007      | —                       | —                                  | separate app/Almanac versions and non-release ID             | manifest identity checks         |
| FR-008      | —                       | provenance route                   | bounded catalogue/calculation statement                      | wording/manifest tests           |
| FR-009      | —                       | package-defect route when relevant | warned Almanac issue action                                  | exact URL/no-state check         |
| FR-010      | opens complete help     | optional topic hint                | all seven accepted topics                                    | catalogue completeness           |
| FR-011      | universal route         | capability-specific route          | complete common destination                                  | inventory coverage check         |

Every FR has at least one user-facing owner or release-gate owner. No requirement depends on a
standalone help page.

## Shared states

| Surface          | Required states                                                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frame entry      | wide visible action, narrow menu item, no-build, active-build, translated/expanded, RTL                                                            |
| Contextual entry | artwork context, value context, layer context, long translated label, touch/pointer                                                                |
| Modal            | release, non-release + build ID, global/contextual invocation, offline, alternate locale, RTL, expanded text, reduced motion, 200% text, 400% zoom |

There is no runtime loading, missing-disclaimer, destination-error or stale-artifact state. Those
conditions fail generation/release.

## Accessibility, responsive and localisation baseline

These are inherited obligations, not new requirements. They are governed by feature 011's accepted
FR-011 (available on desktop, tablet and mobile in portrait and landscape), FR-012 (in-scope WCAG 2.2
AA contrast and target size), FR-015 (conformance statements name the excluded criteria) and FR-021
(every primary journey runs at three viewports in Chromium and Firefox), and by constitution
principles V, VI and VII. They are listed here so every task that exists to satisfy them maps to an
accepted requirement rather than to nothing.

- One `dialog` with `aria-modal="true"`, a visible accessible name and an always-available close.
  The dialog is a nested landmark over the capability, never a replacement `main`.
- Semantic order is title, purpose, Help topics, Versions and data, then Licence — the same order at
  every viewport and in every locale.
- Wide viewports use a centered bounded modal; narrow viewports use a full-width bottom sheet. Both
  are responsive states of one surface. The header stays pinned over a vertically scrolling body.
- At 200% text, actual 400% zoom and landscape phones every section and action stays reachable and
  the document has no horizontal overflow. The disclaimer wraps; it is never clipped or truncated.
- Every action meets feature 011's target-size token. Nothing essential depends on hover, motion,
  colour, icon, shape, dimming or placement; open and closed state is textual.
- `prefers-reduced-motion` makes the open and close transitions immediate without removing content.
- Owned framing resolves through feature 011 localisation and survives expansion and RTL. The
  Frontier excerpt stays in a labelled `lang="en"` region and is never mirrored or translated.
- Conformance is reported qualified, naming excluded criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3,
  2.4.7 and 2.4.11. An unqualified WCAG 2.2 AA claim is prohibited (feature 011 FR-015).
- The automated axe sweep is a floor. The manual assistive-technology protocol is the proof, and it
  is release-blocking until recorded.

## Cross-feature placement

- Feature 011's application frame contains the visible global action and modal host.
- Features 001–011 use `ContextHelpLink`/open intent wherever the [Release coverage
  ledger](#release-coverage-ledger) names a contextual entry.
- Feature 012 owns the presenter, modal composition, topic catalogue and artifact manifest.
- Feature 011 owns primitive dialog semantics, visible-name actions, tokens, localisation, previews
  and the cross-browser accessibility harness.

## Release coverage ledger

This is the exhaustive set required by FR-011. The `helpRouteCoverage` export inside feature 011's
shared `e2e/coverage-ledger.ts` transcribes it; it does not re-derive it, and it is the only part of
that file this feature owns. Every row is a current capability supplied by features 001–011, a package-backed
artwork or value surface named by an accepted screen contract, or a state that obscures the
application frame. **Frame entry** records whether FR-001's shared route is visible in that state;
where it is not, **contextual entry** names the route that substitutes for it under FR-011. A missing
capability or applicable surface is a release failure; representative sampling is not sufficient.

| Capability / surface                         | Owner | Frame entry                        | Contextual entry                     | Applies                |
| -------------------------------------------- | ----- | ---------------------------------- | ------------------------------------ | ---------------------- |
| Hull catalogue `/ships`                      | 001   | visible (wide action, narrow menu) | package hull-value region            | FR-001, FR-002, FR-011 |
| Hull detail `/ships/:symbol`                 | 001   | visible wide; obscured narrow      | package artwork and value regions    | FR-001, FR-002, FR-011 |
| Build workspace `/build`, including no-build | 001   | visible                            | —                                    | FR-001, FR-011         |
| Build library `/builds`                      | 001   | visible wide; obscured narrow      | layer entry                          | FR-001, FR-011         |
| Build-library conflict/delete confirmation   | 001   | obscured                           | layer entry                          | FR-011                 |
| Outfitting workspace ledger                  | 002   | visible                            | package module-value region          | FR-002                 |
| Module replacement                           | 002   | visible wide; obscured compact     | layer entry                          | FR-002, FR-011         |
| Engineering editor                           | 002   | visible wide; obscured compact     | layer entry                          | FR-002, FR-011         |
| Exact-slot layer (narrow)                    | 002   | obscured                           | layer entry                          | FR-011                 |
| Incoming-build normalisation refusal         | 002   | visible                            | —                                    | FR-011                 |
| Workspace quality-completion notice          | 002   | visible                            | `completedEngineeringGrades` hint    | FR-010                 |
| Status rail                                  | 003   | visible                            | package value region                 | FR-002                 |
| Status capability                            | 003   | visible                            | package value region                 | FR-002, FR-008         |
| Import Build layer                           | 004   | obscured                           | layer entry                          | FR-011                 |
| Export Build layer                           | 004   | obscured                           | layer entry, `buildLinkPrivacy` hint | FR-011                 |
| Shared replacement confirmation              | 001   | obscured                           | layer entry                          | FR-011                 |
| Import Outcome disclosure                    | 004   | visible                            | `completedEngineeringGrades` hint    | FR-010                 |
| Power and Heat capability                    | 005   | visible                            | package value region                 | FR-002, FR-008         |
| Defence Profile                              | 006   | visible                            | package value region                 | FR-002, FR-008         |
| Offence Profile                              | 007   | visible                            | package value region                 | FR-002, FR-008         |
| Drives & Mass                                | 008   | visible                            | package value region                 | FR-002, FR-008         |
| Assembly Requirements summary                | 009   | visible                            | package value region                 | FR-002                 |
| Cost and Materials detail                    | 009   | visible                            | package value region                 | FR-002, FR-008         |
| Hull Anatomy schematics and mount facts      | 010   | visible                            | package artwork and value regions    | FR-002, FR-008         |
| Hull Anatomy side availability/defect state  | 010   | visible                            | `offlineAssets` hint                 | FR-010                 |
| Application frame                            | 011   | owns the action                    | —                                    | FR-001                 |
| Language selector layer                      | 011   | visible wide; obscured narrow      | layer entry                          | FR-011                 |
| Global feedback/announcement host            | 011   | visible                            | —                                    | FR-011                 |

The **Applies** column carries this feature's requirement IDs; **Owner** carries the feature that
owns the surface — which is the feature whose template T022 changes, not necessarily the feature the
surface appears in. The shared replacement confirmation is feature 001's overlay reused by feature
004's import hosts, so it is owned by 001. Three rows apply only FR-010: they carry the shared route
like every other row, and their contextual entry is a topic hint rather than an FR-011 substitute
route. Feature 010's own inventory already
declares its `Help/provenance modal entry (feature 012)` row; the rows above are the reciprocal set.

**Excluded, deliberately**: feature 011's component preview application. Feature 011 registers its
own preview-catalogue entries in the shared `e2e/coverage-ledger.ts`; those entries are outside
`helpRouteCoverage` and their absence here is this exclusion, not a reconciliation failure. It is tooling-only, never
appears in product navigation or production output, and is therefore not a Commander-facing
capability. It is the only exclusion, and it is recorded here so its absence from the ledger reads as
a decision rather than an omission.

A row is added whenever a feature adds a capability, package-backed surface or obscuring layer. This
table and the `helpRouteCoverage` export of `e2e/coverage-ledger.ts` are checked against each other
before release.

## Verification inventory

Automated journeys open the modal from every row of the [Release coverage
ledger](#release-coverage-ledger) and include at least:

1. a no-build hull-catalogue capability through the wide frame action;
2. an active workspace through the narrow menu action;
3. a package artwork provenance entry; and
4. a package value/calculation provenance entry.

Each journey asserts one dialog instance, unchanged URL/build state, complete content, a working
close return, no automatic network request, and — FR-002's prohibition — that the surface itself
embeds no legal body and offers no help or legal destination of its own. The four classes above do not cap the ledger. All open
states receive axe, semantic and overflow checks in the complete Chromium/Firefox
viewport-orientation matrix.
