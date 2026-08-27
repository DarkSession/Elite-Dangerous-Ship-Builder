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

## Families and order

Every choice belongs to exactly one family: `module.familyId` for a stock choice, and the same value
for each of its pre-engineered variants. The id is read from the package record membership already
retains; it is never derived from a symbol, a display name or a slot. The family's displayed name is
`getOutfittingFamilyName(familyId, locale)` resolved through the standard package-text rule —
localized where the package has it, canonical English with the untranslated disclosure where it does
not. The application keeps no family table, no abbreviation and no singular/plural rewriting of the
package's own text.

Families appear in the order the package's family declaration gives them, and there is no grouping
level above them. Within a family, arrange by:

1. numeric class descending;
2. package article price descending, with a choice the package publishes no price for after every
   priced choice of the same class;
3. displayed package module name using active-locale `Intl.Collator` with base sensitivity;
4. package `ModuleRating` order ascending (`A` through `I`);
5. stock before variants;
6. package stock ordinal, then variant ordinal.

**Amended 2026-08-27 (Commander request): class and price lead, and the name is a tie-break.** The
price is `CandidateFacts.cost` — the package's own catalogue figure for that exact article, and the
same value the row's `COST` cell states. It is read, never computed: a Merc Coin price is not
converted into it and not weighed against it, so an article the package prices only in coin has no
credit price and takes the unpriced place rather than sorting as though it were free (FR-003). The
remaining four keys are unchanged and still make the order total, so the same package and the same
locale produce the same list every time.

The rating comparator is exhaustive over the imported package type. A newly introduced value fails
type/tests and requires package review rather than being silently placed. `OutfittingFamilyId` is checked
differently, and deliberately: a package release that adds a family must fail the installed-package
acceptance test by name rather than pass unnoticed. Compilation cannot catch it — a new id widens the
union and the package's own `OUTFITTING_FAMILIES` record together, so every exhaustive annotation
over them widens too, and the only way to make the compiler object would be a family table written
here, which is the one thing FR-020 forbids. The count of published families is asserted instead. Sorting changes only the view; no choice value is rewritten.

Standard and unique-reward sections are withdrawn (research decision 14). A community-goal or
event-reward choice stays in the family of the module it is built on and is identified there by the
`uniqueReward` acquisition label defined below; `CandidateSection` remains that label's input and is
no longer an ordering key or a heading.

## Open and closed families

Family open state is part of the query state and is seeded, never accumulated:

- opening a chooser seeds it with the family of the exact fitted stock or variant choice, matched on
  the whole variant as elsewhere in this contract, and with nothing at all when no available family
  contains that exact choice;
- a query that becomes non-empty or changes while non-empty replaces the seed with every family
  holding at least one match where the search matched no more than a screenful, and leaves every
  family closed where it matched more — a family holding a match is never absent either way, and a
  closed one states its own share of the matches;
- a query that returns to empty re-seeds the fitted-family default;
- a Commander toggle adds or removes exactly one family id.

Toggling reads nothing from the build and writes nothing to it. It is not an edit, not a decision and
not a history step, and it never invalidates the index or the retained package records.

Each family control publishes its name, its current choice count and its open state. When a search is
active the count is the number of matches in that family, not the family's full size, because that is
the number of rows the control is standing in front of.

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
must settle within 100 ms for the installed package's largest choice list, measured in Chromium
under 4x CPU throttling at the mobile viewport.

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
- Every choice appears in exactly one family, and every family id and name on screen came from the
  installed package.
- Stock precedes variants inside a family, and a reward keeps its labels on its own row now that no
  section carries them.
- The fitted choice's family, and only that one, is open on open and after a rebuild; none is open
  when the fitted choice has no available family.
- A non-empty search within a screenful leaves no match inside a closed family, and above a screenful leaves every family closed and none absent; clearing it restores the fitted default.
- Toggling a family produces no build revision and no history step.
- A family the active language does not name renders its canonical English name with the untranslated
  disclosure, and still groups, counts and opens.
- Multi-term, case- and accent-insensitive search covers exactly the four required fields.
- A candidate list rebuilt after a fit reflects new exclusive/count limits.
- The installed package's largest-choice fixture settles below 100 ms in the Chromium-only timing
  project; search behaviour itself is verified in every project.
