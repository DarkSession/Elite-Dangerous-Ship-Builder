# Feature Specification: Cost and Materials

**Feature Branch**: `009-cost-and-materials`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "the ships cost, rebuy amount, material requirements."

## Scope

This specification covers what a planned build **costs to own**: the credits for the hull and its
modules, the rebuy that follows from them, and the engineering materials a Commander must gather
before any of it can actually be built.

It is one area of the statistics family. [Feature 003](../003-ship-statistics/spec.md) is the
contract every figure here obeys — the requirement that a build be active at all (its FR-000),
provenance, units, the honesty rules for unavailable figures, the recompute obligation, and the
viewing conditions. Everything it states applies here without being restated, and nothing here
relaxes it. Nothing in this area is offered before a hull is chosen.

The engineering choices that generate a material bill are made in
[feature 002](../002-module-outfitting/spec.md), which shows on each module what its own engineering
costs in total — every roll from unengineered to the grade selected, under its FR-012b; this feature
consolidates those per-module totals across the whole build. A recorded source purchase
price arrives with an import and leaves with an export under
[feature 004](../004-slef-export/spec.md); this feature keeps it distinct from catalogue retail.

## Clarifications

### Session 2026-08-16

- Q: When some of a build's modules have no catalogue price, should the modules total and the rebuy
  still be shown as "at least" figures with the unpriced modules named, or reported as unavailable?
  → A: Lower bounds throughout. The package's modules sum is documented as a floor when anything is
  unpriced, and the rebuy is taken from that same floor, so both are presented as figures the build
  costs _at least_, with every unpriced module named. This holds whether one module or every module
  in the build is unpriced — a floor is a true statement and a useful one, where "unavailable" would
  discard the prices the catalogue does carry.
- Q: Should each entry in the material list carry the material's category (raw, manufactured or
  encoded) and its grade, or only its name and the quantity needed? → A: Grade only, and shown as an
  image. Each entry carries the material's grade from the package's catalogue; the category and the
  line are deliberately not shown. The grade appears as an image rather than a number or a word,
  which keeps rarity readable at a glance and free of translation. The package publishes no material
  artwork, so the image is the application's own, from the design system under principle VII, and it
  carries a text alternative through the localisation layer so the grade reaches a screen reader as
  well as the eye.
- Q: When the list states how many engineering operations lie behind it, should one operation mean
  one roll at an engineer, one blueprint grade, or one blueprint applied to one module? → A: None of
  them — the operations count is dropped, and FR-007 states only how many distinct materials the list
  covers. What the list totals is confirmed: the materials to take a module from unengineered to the
  grade selected, where each grade in between contributes its own recipe as many times as that grade
  requires, and the recipes differ from grade to grade. The rolls behind that are process detail a
  Commander does not act on; what they are gathering for is the whole build's engineering, so no
  count of rolls, grades or engineering jobs is presented.
- Q: Should the material list be something the Commander can take out of the application — copied or
  downloaded as text — or is reading it on screen the whole of it? → A: On screen only. Copying and
  downloading the list are out of scope for this area; a Commander who needs it later re-opens the
  build, which [feature 004](../004-slef-export/spec.md) already makes durable as a link. User story
  2's claim that the list is "taken away and used elsewhere" is corrected accordingly rather than
  left standing as an unmet promise.
- Q: Should the credit side show what each fitted module costs, or only the hull value, the modules
  total and the rebuy? → A: Totals only. A per-module price belongs where modules are chosen —
  [feature 002](../002-module-outfitting/spec.md) already shows each module's retail cost as it is
  offered and fitted — so repeating it here would duplicate that area rather than add to this one.
  The only modules this area names individually remain the unpriced ones under FR-003, because their
  absence is what qualifies the totals.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - What the build costs in credits (Priority: P1)

A Commander who has finished planning wants the bill: what the hull and modules cost, and what the
rebuy will be if they lose the ship.

**Why this priority**: The credit total decides whether a build is a plan or a fantasy, and the rebuy
decides whether a Commander can afford to fly it. Neither can be judged from a parts list.

**Independent Test**: Load a build and confirm hull value, total modules value and rebuy are shown at
catalogue retail, and that a module the catalogue carries no price for is named, with the totals
presented as lower bounds rather than counted as zero.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views its costs, **Then** hull value, total
   modules value and rebuy are shown at catalogue retail.
2. **Given** a build carrying a recorded source purchase price, **When** the Commander views its
   costs, **Then** that price is kept distinct from the catalogue retail figures rather than mixed
   into them.
3. **Given** a build assembled in the application rather than imported, **When** the Commander views
   its costs, **Then** hull value, modules value and rebuy are shown for it.
4. **Given** a module the catalogue carries no price for, **When** the Commander views the costs,
   **Then** that module is named as unpriced and the modules total and rebuy are shown as figures the
   build costs at least, rather than as exact figures or counted as zero.
5. **Given** the rebuy figure, **When** the Commander reads it, **Then** the insurance rate it
   assumes is stated alongside it.

---

### User Story 2 - What the build costs in materials (Priority: P1)

A Commander with a fully engineered build wants the single list of materials they need to gather
before they can sit down at the engineers and actually roll it.

**Why this priority**: The material bill is what turns a plan into a shopping trip, and it is the
figure that decides whether an engineered build is worth starting. Reading it off thirty-four slots
by hand is exactly the work a planner exists to remove.

**Independent Test**: Load an engineered build and confirm a consolidated list of the materials
required for every blueprint and experimental effect in the build is produced, with per-material
totals, and that grade 5 rolls account for the grades beneath them.

**Acceptance Scenarios**:

1. **Given** an engineered build, **When** the Commander views its material requirements, **Then**
   every blueprint grade and experimental effect in the build contributes its materials to a single
   consolidated list, with each material named, totalled and carrying its grade as an image with a
   text alternative.
2. **Given** a module engineered to grade 5, **When** its materials are listed, **Then** the list
   accounts for the grades that must be rolled to reach grade 5, not grade 5 alone.
3. **Given** the consolidated list, **When** the Commander reads it, **Then** the number of distinct
   materials it covers is stated, so the size of the gathering task is legible before reading the
   list.
4. **Given** a material in the list, **When** the Commander asks what needs it, **Then** the modules
   and grades that require it are identifiable.
5. **Given** a blueprint whose material costs the catalogue does not carry, **When** the material
   list is shown, **Then** that blueprint is named as missing from the list rather than silently
   contributing nothing.
6. **Given** a build containing a pre-engineered module, **When** the Commander views the material
   list, **Then** that module contributes no material cost and the list says why it is absent.

---

### Edge Cases

- A rebuy figure where the build's source purchase price differs from catalogue retail: the
  retail-based figure is shown, and the recorded source price is presented as a distinct value rather
  than mixed into it.
- A build whose material requirements include a pre-engineered module: the pre-applied engineering
  contributes no material cost, because the Commander does not roll it, and the list says why that
  module is absent.
- A build with no engineering at all: the material list is reported as empty because nothing needs
  rolling, distinct from a list that could not be produced.
- An experimental effect applied without a blueprint beneath it, where the game permits it: its
  materials still reach the list.
- The same blueprint applied to several modules: each application contributes its own materials, and
  the consolidated total reflects every one of them rather than the blueprint once.
- A build imported at a partial engineering quality: the application treats the selected grade as
  complete at 100% before producing the same grade-based material list as any other build —
  consistent with feature 002's application-wide quality rule.
- A build where every module is unpriced: the modules total and rebuy carry the hull alone and are
  presented as lower bounds with every unpriced module named, rather than as exact figures or as zero
  credits.
- A build the package cannot resolve to a known hull: it reports no hull value and no rebuy, so both
  are shown as unavailable with that reason rather than as zero. Every hull in the catalogue carries
  a price, so this arises from an unresolved hull rather than from a gap in the catalogue — unlike
  modules, a few of which genuinely carry no price and are handled by FR-003.
- A Commander reading the application in a language the package does not carry material names in:
  the names appear in the language the package provides and the application says so, rather than
  presenting untranslated text as though it were translated.
- The material list on a phone: it stays legible and scrolls within its own container rather than
  forcing the page sideways.

## Requirements _(mandatory)_

### Functional Requirements

#### Credits

- **FR-001**: The application MUST display hull value, total modules value and rebuy at catalogue
  retail, keeping any recorded source purchase price distinct from them.
- **FR-002**: Credit figures MUST come from the package's calculation for the build, for a build
  assembled in the application as well as one imported from a capture. The application MUST NOT
  assemble a total from catalogue prices or compute a rebuy percentage locally.
- **FR-003**: A module the catalogue carries no price for MUST be named as unpriced, and the modules
  total and rebuy MUST be presented as lower bounds — what the build costs at least — rather than as
  exact figures or as zero. This holds whether one module or every module in the build is unpriced.
- **FR-004**: The rebuy figure MUST state the insurance rate it assumes.

#### Materials

- **FR-005**: The application MUST display a consolidated list of the engineering materials the build
  requires, aggregating every blueprint grade and experimental effect across every engineered module,
  with each material named, totalled and carrying its grade.
- **FR-005a**: A material's grade MUST be presented as an image rather than as a number or a word,
  and that image MUST carry a text alternative resolved through the localisation layer, so the grade
  is available to a screen reader as well as by sight.
- **FR-006**: The material list MUST cover taking each module from unengineered to its applied grade,
  not the applied grade alone: every grade in between contributes its own recipe, as many times as
  that grade requires, and the recipes differ from grade to grade. What the list presents is the
  totals that climb produces — one quantity per material for the whole build. The climb itself MUST
  NOT be itemised: no per-grade breakdown, no ordering of the rolls, no route through the engineers.
  A Commander gathers materials, and the quantity they need is the same whatever order they spend it
  in, so the journey is process detail the list deliberately leaves out. This matches what
  [feature 002](../002-module-outfitting/spec.md)'s FR-012b shows on a single module.
- **FR-007**: The application MUST state how many distinct materials the list covers. No count of
  rolls, grades or engineering jobs is presented: the list answers what the build's engineering costs
  in materials, not how many operations produce it.
- **FR-008**: Each material in the list MUST be traceable to the modules and grades that require it.
- **FR-009**: Blueprints or effects whose material costs the catalogue does not carry MUST be named
  as missing from the material list rather than contributing nothing silently.
- **FR-010**: Pre-engineered modifications MUST NOT contribute material costs, and their exclusion
  MUST be stated.
- **FR-011**: A build with no engineering MUST have its material list reported as empty because
  nothing requires rolling, distinctly from a list that could not be produced.

### Device Requirements

- **FR-012**: The cost summary and the material list MUST be fully readable on desktop, tablet and
  mobile, in both portrait and landscape, scrolling within their own container rather than widening
  the page.
- **FR-013**: The modules and grades behind a material, and the slot behind an unpriced module, MUST
  be reachable by touch as well as by pointer and keyboard, never by hover alone.

### Testing Requirements

- **FR-014**: Credit presentation MUST be unit-tested against assembled and imported builds,
  including the unpriced-module case and its lower-bound presentation, a build in which every module
  is unpriced, and the unresolved-hull and recorded-source-price cases.
- **FR-015**: Material aggregation MUST be unit-tested against builds with repeated blueprints,
  multi-grade rolls, experimental effects and pre-engineered modules, and against a build with no
  engineering at all.
- **FR-016**: Each user story's primary journey MUST have a Playwright end-to-end test that runs
  against desktop, tablet and mobile viewports, in Chromium and in Firefox.

### Key Entities

- **Cost summary**: Hull value, modules value and rebuy at catalogue retail, each either exact or a
  stated lower bound when a fitted module is unpriced, with the insurance rate the rebuy assumes,
  distinct from any recorded source purchase price.
- **Material requirement**: One material, its grade, and the total quantity the build's engineering
  needs, traceable to the modules and grades that require it.
- **Engineering operation**: One blueprint at its selected grade applied to one module, or one
  experimental effect — the unit the material list aggregates over. Its cost covers every grade
  beneath the selected one; the operations themselves are never counted on screen.

## Upstream dependencies

Every figure this specification requires is computed by `@elite-dangerous-almanac/core`, re-verified
against the installed `0.1.0-beta.8` on 2026-08-16. No figure here is blocked; one piece of **text**
is, and is raised upstream.

**Material names carry no locale.** The package's i18n surface covers modules, blueprints and
experimental effects; materials are not among them, and each material has a single English display
name. Under constitution principle VI a private translation table here is prohibited, so material
names appear in the language the package provides and the application states that, exactly as
feature 003 does for the package's English-only diagnostics. A materials locale is requested as
[Elite-Dangerous-Almanac#275](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/275),
asking for a `getMaterialName(symbol, locale)` on the same contract as the module, blueprint and
effect accessors that already exist.

Costs for an assembled build arrived in `0.1.0-beta.4`: `retailCredits()` computes hull value,
modules value and rebuy for a build assembled in the application, not only for an imported capture,
and lists the modules the catalogue carries no price for. The older `hullValue`, `modulesValue` and
`rebuy` accessors remain null for an assembled build, so `retailCredits()` is the accessor this
feature depends on. A recorded source purchase price remains a distinct value, exported only when
asked for by name.

Two properties of that accessor are what FR-003 and FR-004 report rather than restate. Its modules
sum counts only the modules it could price and is documented as a lower bound whenever its unpriced
list is non-empty, and its rebuy is five percent of that same priced total — so both figures inherit
the floor, which is why FR-003 presents them as lower bounds rather than as exact figures. The five
percent is the package's own rate, and is the rate FR-004 states.

The material list is composed from the package's own functions rather than summed here: the
per-blueprint cost it reports already prices the whole climb from unengineered, charging each grade
its own recipe as many times as that grade requires, which satisfies FR-006, and merging the lists
across a build's modules is the package's operation too.
Walking the build's fitted modules to feed those functions is application code; the arithmetic is
not, which is what feature 003's FR-001 requires.

**Composed under feature 003's FR-001a**: the count FR-007 requires — how many distinct materials the
list covers — is a count of entries in a collection the package returns. No game rule is involved,
and no quantity is added to another.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Every credit figure matches the value `@elite-dangerous-almanac/core` computes for the
  same build — zero divergence across the reference corpus, for assembled and imported builds alike.
- **SC-002**: The consolidated material list for a build equals the sum of the materials the package
  reports for each of its blueprint grades and experimental effects — verified across a corpus
  including repeated blueprints, multi-grade rolls and pre-engineered modules.
- **SC-003**: A Commander can go from an engineered build to a complete gathering list in one
  interaction.
- **SC-004**: Every material in the list is traceable to the modules that require it — zero
  untraceable entries across the corpus.
- **SC-005**: For every unpriced module, missing blueprint cost and pre-engineered module, the
  omission is named — zero silent contributions of nothing across the corpus.
- **SC-006**: The cost summary and material list are readable on desktop, tablet and mobile
  viewports — the same end-to-end suite passes on all three, with no horizontal page scrolling at any
  of them, and every material's grade is available as text to a screen reader at each of them.

## Assumptions

- Credit costs are quoted at catalogue retail. Shipyard and module discounts, and a configurable
  insurance rate, are out of scope here; they would be a further upstream capability request rather
  than local arithmetic.
- The credit side reports totals, not a price per fitted module. Each module's retail cost is shown
  by [feature 002](../002-module-outfitting/spec.md) where modules are offered and fitted, which is
  where a Commander weighs one against another; the only modules named here are the unpriced ones.
- Material requirements cover engineering blueprints and experimental effects. Sourcing information —
  where a material is found, or trader exchange rates — is out of scope for this feature even where
  the package's materials catalogue carries it.
- A material's grade is shown; its category and its line are not. The package's catalogue carries
  those two as well, so either is available if it is ever wanted, but grade alone answers the question
  the list is for — how rare each entry is — and the omissions are a considered exclusion rather than
  a gap.
- The grade image is the application's own artwork, held in the design system under principle VII.
  The package publishes artwork for ships only and carries none for materials, so nothing here waits
  on it.
- The material list states how many distinct materials it covers, not a grand total of units summed
  across them. A single number adding units of selenium to units of iron describes nothing a
  Commander can act on, so it is deliberately not required. Neither is any count of rolls, grades or
  engineering jobs: those describe the process rather than what has to be gathered.
- What a Commander already holds in their material storage is not modelled. The list is what the
  build needs, not what remains to be gathered — tracking inventory would require state this
  application does not keep.
- The material list is read on screen. Copying it to the clipboard and downloading it as a file are
  both out of scope here; a Commander who wants it again re-opens the build, which
  [feature 004](../004-slef-export/spec.md) makes durable as a link.
- Material names are game text and belong to `@elite-dangerous-almanac/core` under constitution
  principle VI. The package carries locales for modules, blueprints and experimental effects but not
  for materials, which have a single English display name. Until that lands, material names appear in
  the language the package provides and the application says so, rather than presenting untranslated
  text as a translation.
- Which figures are prominent and how the material list is grouped are decided at plan time against
  the design system, per constitution principle VII.
