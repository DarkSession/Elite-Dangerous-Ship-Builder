# Component State Preview Matrix

Every new or extended presentation component has a feature-011 preview declaration. “N/A” means the
state cannot occur for that component's accepted input contract; it is recorded rather than silently
omitted.

| Component/region                    | Populated/default                                      | Empty                                                                     | Pending                                 | Error                                   | Disabled/special states                                                                      |
| ----------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------- | --------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------- |
| Offence capability composition      | Complete totals, capacitor and multiple weapons        | Workspace no-build is feature 001 owned; confirmed no-weapons ready state | Current revision, no stale figures      | Projection or missing-port alert        | Unavailable coverage; expanded language; RTL; reduced motion                                 |
| Weapon totals                       | Positive burst/sustained rates and costs               | Exact package zero with confirmed-empty context                           | Parent pending                          | Parent failure                          | All-disabled zero; genuine-zero weapon; incomplete coverage qualification                    |
| Damage-type output                  | All required types plus unclassified and AX overlay    | Required numeric zeroes; unclassified omitted/no damage                   | Parent pending                          | Parent failure                          | AX zero/positive; negative is N/A under current package result contract                      |
| Capacitor endurance                 | Finite drain with all six fields                       | N/A: package always returns a result for active build                     | Parent pending                          | Parent failure                          | Immediate; positive-draw infinity; zero-draw infinity; zero capacity                         |
| Distributor observation             | Powered exact observation                              | Absent distributor                                                        | Parent pending                          | Missing owner port/integration mismatch | Disabled; shed; unavailable                                                                  |
| Weapon output collection            | Multiple identities in package order                   | Confirmed no weapons                                                      | Parent pending                          | Parent failure                          | Some/all disabled; unavailable coverage; duplicate symbols in distinct exact slots           |
| Weapon output entry                 | Finite ammo/range/piercing, details collapsed/expanded | N/A: entry exists only for returned weapon                                | Collection pending                      | Collection failure                      | Genuine zero; disabled; continuous; no ammo; unlimited; zero reserve; optional fields absent |
| Compact Offence Status contribution | Positive sustained DPS and enabled firing condition    | Exact zero/no fitted weapons                                              | Feature 003 provider pending            | Feature 003 projection failure          | All disabled; genuine zero; qualified coverage; selected hardpoints retracted                |
| Exact-slot action                   | Returned weapon exact slot                             | N/A                                                                       | Disabled while current snapshot pending | N/A: parent owns failure                | Disabled weapon action still enabled; duplicate-symbol slots                                 |

## Required preview variants

Every applicable row is rendered at:

1. desktop 1440×900;
2. tablet portrait 834×1112;
3. tablet landscape 1112×834;
4. mobile portrait 390×844;
5. mobile landscape 844×390.

The catalogue also includes:

- 200% text and actual 400% browser-zoom protocol references;
- longest complete English/German message fixtures and a test expanded-text fixture;
- RTL root direction with mixed localized labels and numeric values;
- reduced-motion preference;
- pointer and touch activation for disclosures and exact-slot actions;
- localized/canonical-fallback/unavailable game-text states;
- screen-reader names, relationships and announcement behavior;
- no document-level horizontal overflow and only labelled internal overflow where necessary.

## Data fixtures

Fixtures are produced from live pinned Almanac results or typed feature-owned presentation states.
They cover:

- enabled and all-disabled Sidewinder weapons;
- confirmed-empty and unavailable hardpoint coverage;
- a genuine zero-damage returned weapon;
- conventional, unclassified and anti-xeno damage;
- effective range, absent effective range, projectile boundary zero and absent piercing;
- no ammunition, finite ammunition, zero reserve and unlimited reserve;
- finite, immediate and both infinite capacitor meanings;
- each accepted deployed distributor observation.

No preview hard-codes a game value as an application rule. Sample package results are fixture inputs,
not a second catalogue.

## Verification

Feature 011's preview manifest/policy gate fails when a component or applicable state is absent.
Playwright loads every preview in Chromium and Firefox, applies automated accessibility checks and
asserts semantic names/state and document overflow. Manual screen-reader and actual-zoom checks cover
the composed capability because automated preview checks are a floor, not proof of comprehension.
