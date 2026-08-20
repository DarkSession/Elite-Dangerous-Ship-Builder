# Component State Preview Matrix: Ship Statistics and Status

Every new or extended component is previewed through feature 011 at desktop, tablet and mobile
widths. Portrait/landscape behavior is exercised in product E2E; previews cover width, text expansion,
RTL and reduced motion. “N/A” means the component cannot semantically own that state.

| Component                  | Default/populated                      | Empty                             | Loading                      | Error                                     | Disabled                                              | Required variants                                |
| -------------------------- | -------------------------------------- | --------------------------------- | ---------------------------- | ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| `ViewingConditionsControl` | defaults and changed valid draft       | N/A                               | N/A                          | invalid parse/range/step/total            | Apply disabled for unchanged/invalid draft            | all loads, 0/4 boundaries, expanded/RTL labels   |
| `StructuralFacts`          | all valid/complete combinations        | no active build handled by parent | pending skeleton/placeholder | projection failure handled by parent      | N/A                                                   | text-only meaning independent of color           |
| `IssueList`                | targeted and untargeted ordered issues | none reported                     | pending parent state         | canonical helper fallback/disclosure      | untargeted item has no action                         | long params/string arrays, RTL/wrap              |
| `PowerHeadline`            | exact draw and capacity                | N/A                               | pending                      | owner unavailable and app failure parent  | detail action unavailable only while pending          | deployed/retracted, zero/Infinity                |
| `MetricHeadlineCard`       | exact positive/zero                    | N/A                               | pending                      | owner incomplete/unavailable              | detail action unavailable only while pending          | infinite where owner supports; native conditions |
| `AssemblyRequirements`     | retail/materials and Merc Coin present | materials none; Merc Coin absent  | pending                      | unpriced/missing recipe owner states      | unavailable actions only when no target               | long material names, currency separation         |
| `StatusRail`               | full compact projection                | zero counts/Merc Coin absent      | current revision pending     | application failure                       | open action disabled only without capability provider | long locale, compact state text                  |
| `StatusCapability`         | full ready projection                  | no issues/qualifications          | current revision pending     | application failure                       | no active build uses workspace empty state            | all result combinations and target behavior      |
| `StatusCountAnnouncer`     | changed settled counts                 | initial/unchanged silence         | silent                       | blocking app failure uses separate prompt | N/A                                                   | rapid coalescing and plural forms                |

Preview assertions include no visual literal outside tokens, no hard-coded owned text, accessible
name/role/state, 44 CSS-pixel interactive targets, no clipping/overflow and no information conveyed
by color/shape/position alone.
