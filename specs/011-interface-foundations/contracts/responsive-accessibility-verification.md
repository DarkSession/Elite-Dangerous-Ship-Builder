# Contract: Responsive and Accessibility Verification

## Browser/profile matrix

Every primary journey and relevant state runs in both Chromium and Firefox at:

| Profile          | Viewport | Input/orientation |
| ---------------- | -------- | ----------------- |
| Desktop          | 1440×900 | pointer           |
| Tablet portrait  | 834×1112 | touch, portrait   |
| Tablet landscape | 1112×834 | touch, landscape  |
| Mobile portrait  | 390×844  | touch, portrait   |
| Mobile landscape | 844×390  | touch, landscape  |

`E2E_CHROMIUM_PATH` and `E2E_FIREFOX_PATH` may select compatible preinstalled executables without
removing or renaming projects.

## Automated coverage

For every product screen/relevant state and every UI preview declaration:

- run `@axe-core/playwright` against in-scope WCAG A/AA rules;
- assert expected landmarks, heading structure, visible/matching names, state and label/error/unit
  relationships;
- assert document `scrollWidth <= clientWidth` and that any component-owned overflow is labelled,
  bounded and does not create document-level overflow;
- verify interactive targets meet the shared 44 CSS-pixel baseline except a documented WCAG 2.2
  target-size exception;
- verify visible text alternatives for visual states and game-text language disclosure;
- verify root `lang`/`dir`, locale-formatted outputs and no raw keys/placeholders;
- emulate reduced motion and confirm nonessential animation is absent without lost meaning;
- exercise doubled copy, RTL fixtures and 200% text sizing.

Do not suppress a broad WCAG tag. Disable an axe rule only when its sole criterion is one of the seven
constitutional exclusions, document the rule-to-criterion mapping and retain semantic assertions
required by the feature spec.

## Manual gates

Automation is supplemented by versioned scripts/results for each primary capability:

- NVDA with Firefox on desktop;
- TalkBack with Chromium on mobile;
- a tablet screen reader when composition/interaction differs materially;
- actual 400% browser zoom, because CSS zoom/page-scale emulation is not a faithful cross-engine
  substitute;
- pointer and single-touch completion in both orientations.

Scripts verify landmark/heading navigation, visible/matching control names, state/error
relationships, visual text equivalents, announcement urgency/deduplication, language selection and
canonical-game-text disclosure. The repository states the keyboard exclusions in the recorded
conformance scope.

## Static/build gates

`pnpm run check` retains format, full typecheck, production build, script tests, 80% unit coverage and
Playwright, and adds:

- explicit TypeScript `strict` and Angular strict-template checks;
- design-token/display-text/preview-manifest policy validation;
- English/German catalogue completeness and interpolation validation;
- production-output assertion that the preview host is absent;
- service-worker/offline validation for bundled English and loaded locale assets.

No browser, state, axe violation or policy error may be skipped/quarantined to pass.
