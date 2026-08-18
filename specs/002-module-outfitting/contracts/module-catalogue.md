# Module Catalogue Contract

## Inputs

The query accepts only:

- the current `ShipLoadout`;
- one exact package `LoadoutSlot.key`;
- active locale and package-name resolver;
- the Commander query string.

It performs no storage, navigation or build mutation.

## Membership

1. Call `ShipLoadout.modulesForSlot(slotKey)` exactly once for the source revision.
2. Emit one stock choice for every returned package record.
3. Immediately after each stock record, obtain every
   `getPreEngineeredVariants(module.symbol)` record and emit each as a distinct variant choice.
4. Never query/filter `ALL_MODULES`, invent a variant, deduplicate routes or retain a candidate from a
   prior build revision.
5. Fit the exact retained package object through `setModule` or `setPreEngineeredVariant`; membership
   never substitutes a reconstructed object.

An unknown slot or unknown hull layout yields a structured unavailable/refused chooser, not an empty
claim. A package-valid empty array, including cargo hatch, means the package offers no replacement.
Opening a chooser while its query is loading does not imply a fit capability; distinguish
`notReplaceable`, `loading`, `packageEmpty`, `noMatches`, `stale` and `refused`.

## Identity

Stock choice identity is its package module symbol plus stock discriminant. Variant identity includes:

```text
base symbol + blueprint fdname + purchase grade + effect fdname/absence
  + acquisition + package variant ordinal
```

The ordinal prevents a future package release with otherwise equal route records from collapsing UI
identity. It is not exported as game identity.

## Sections, groups and order

Sections are ordered:

1. standard — stock, Mercenary and tech-broker choices;
2. unique rewards — community-goal and event-reward choices.

Within each section, arrange by:

1. displayed package module name using active-locale `Intl.Collator` with base sensitivity;
2. numeric class descending;
3. package `ModuleRating` order ascending (`A` through `I`);
4. stock before variants;
5. package stock ordinal, then variant ordinal.

The rating comparator is exhaustive over the imported package type. A newly introduced value fails
type/tests and requires package review rather than being silently placed. Sorting changes only the
view; no choice value is rewritten.

## Search

Index only:

- displayed package module name for the active locale;
- numeric class;
- package rating;
- package weapon mount type when present.

For both fields and query: Unicode NFKD-normalize, remove combining marks and locale-lowercase. Split
the folded query on Unicode whitespace and discard empty terms. A choice matches if and only if every
term occurs as a substring in at least one indexed field for that choice.

Search must not include symbol, blueprint/effect name, acquisition label, entitlement, stats or a
private synonym. Empty query returns the ordered full collection. Non-empty/no-match returns:

```ts
{ status: 'noMatches', query, results: [], canClear: true }
```

Clearing resets the query and restores all choices without changing selection or build.

The immutable index is rebuilt on slot, build revision or locale change. The browser-visible result
must settle within 100 ms for the largest pinned-package choice list.

## Candidate facts

Every choice has an explicit textual `fitted`, `stock` or `pre-engineered` state where applicable.
The wide manifest prioritizes the package-provided facts represented in canvas 1c—module identity,
class, rating, mount, mass, power, weapon draw, cost and relevant offensive value—but shows a column
only when that fact is in feature scope and supplied by the package. A labeled overflow container may
hold the wide table. Compact cards disclose the same in-scope facts progressively without hiding
identity, class/rating/mount, fitted state or restrictions. `null`/absence remains unavailable; no
zero, estimate, suitability delta or better/worse color is invented.

## Acquisition and entitlement labels

Before fitting:

- base entitlement comes from `OutfittingModule.entitlement`;
- variant acquisition comes from `PreEngineeredVariant.acquisition`.

After fitting:

- entitlement comes from `FittedModule.stats?.entitlement`;
- acquisition comes only from `FittedModule.preEngineeredVariant`.

Community-goal and event-reward variants receive route and unique-reward labels. Mercenary and
tech-broker variants receive route and not-ordinarily-available labels. Entitlement adds an independent
label, so one choice can expose multiple restrictions. If the package no longer identifies a fitted
variant after clearing engineering, its route labels disappear.

All prose is application-localized. Game names use package i18n leaf lookups; canonical fallback is
visibly disclosed as untranslated. The app never maintains private game-name or entitlement-name data.

## Verification

- For every representative slot, choice count equals stock results plus every package variant.
- Route-distinct variants remain distinct and preserve package order.
- Unique rewards are the final section; stock precedes variants inside a group.
- Multi-term, case- and accent-insensitive search covers exactly the four required fields.
- A candidate list rebuilt after a fit reflects new exclusive/count limits.
- The 481-choice 0.1.1 fixture settles below 100 ms in browser measurement.
