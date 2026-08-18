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

## Cross-feature placement

- Feature 011's application frame contains the visible global action and modal host.
- Features 001–010 use `ContextHelpLink`/open intent wherever their accepted contracts require
  package provenance or an answer covered by FR-010.
- Feature 012 owns the presenter, modal composition, topic catalogue and artifact manifest.
- Feature 011 owns primitive dialog semantics, visible-name actions, tokens, localisation, previews
  and the cross-browser accessibility harness.

## Verification inventory

Automated journeys open the modal from:

1. a no-build hull-catalogue capability through the wide frame action;
2. an active workspace through the narrow menu action;
3. a package artwork provenance entry; and
4. a package value/calculation provenance entry.

Each journey asserts one dialog instance, unchanged URL/build state, complete content, a working
close return and no automatic network request. All open states receive axe, semantic and overflow
checks in the complete Chromium/Firefox viewport-orientation matrix.
