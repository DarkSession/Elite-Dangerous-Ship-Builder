<!--
Describe the change and the evidence that it works. Keep it plain and short.
How the work was done — review cycles, subagent findings, commit-by-commit
narration — does not belong here. See AGENTS.md → "Pull requests".
-->

## What this changes

<!--
A few plain sentences on what is different now: the behaviour, screen or
capability, not a walk through the diff. For a visual change, attach before
and after.
-->

## Why

<!-- The problem this solves. Name the feature and spec directory it comes from. -->

Closes #

## Validation

<!-- What was actually run, and the result. Say what was not run, and why. -->

- [ ] `pnpm run check` passes (format, typecheck, build, policy, unit tests with coverage, Playwright)
- [ ] Coverage threshold untouched; no test skipped, focused or quarantined
- [ ] Desktop, tablet and mobile checked where the change is visual or adds a journey
- [ ] Every string the application owns goes through the localisation layer
- [ ] No backend, upload or telemetry; no library result corrected, clamped or re-derived here

Not ticked, and why:

## Notes for the reviewer

<!--
Optional. Trade-offs, a follow-up worth its own issue, anything a reviewer
would otherwise have to guess. Delete this section if there is nothing to say.
-->
