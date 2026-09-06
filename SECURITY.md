# Security policy

Nav Beacon is a static, client-side application. It has no backend, no accounts
and no telemetry, and it makes no request to any origin other than the one it is served from. A
build lives in the browser — in memory, in `localStorage` — or in a URL, and nothing is uploaded.

That shapes what a vulnerability is here. There is no server to break into and no stored account
data to steal. What can be attacked is the browser session of a Commander who opens a link, imports
a payload, or loads the site.

## Supported versions

The site at [navbeacon.app](https://navbeacon.app/) is the supported version. It is built from `main`
and republished by CI on every merge, so there is one live version at a time and no maintained
branch behind it.

A fix lands on `main` and deploys from there. A Commander gets it on the next visit, when the
service worker applies the published update. Older builds are not patched, and a build served from
somewhere else is not covered by this policy.

The version is shown in the application under **Help · About**. Name it in your report.

## Reporting a vulnerability

**Do not open a public issue, a pull request or a discussion for a vulnerability.**

Report it privately:
[Security → Advisories → Report a vulnerability](https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/security/advisories/new).
The report is visible only to you and the maintainers.

Include what you have:

1. What an attacker can do, and what a Commander loses by it.
2. Steps that reproduce it, with the payload — a build link, a SLEF file, a stored value.
3. The browser and version, the device class, and the application version from **Help · About**.
4. Anything that limits it: a setting it needs, an interaction it needs, a browser it fails on.

A working reproduction is what makes a report actionable. Scanner output on its own usually is not.

The project is maintained in spare time. The maintainers aim to acknowledge a report within five
working days and to say what they intend to do within fourteen. If you hear nothing, say so on the
same private report rather than making it public.

## What is in scope

- Code execution or script injection reached through anything the application parses: a build link,
  a pasted or imported SLEF payload, a stored record, or a URL parameter.
- Anything that makes the application send data to another origin, or that leaks build data to one.
  The constitution forbids the request in the first place, so an outbound request is a defect by
  itself.
- Reading or writing browser storage outside the key space this application owns, or one page
  corrupting another page's stored builds through the cross-tab channels.
- A defect in the service worker or the update path that serves a build a Commander cannot get rid
  of, or that keeps a fixed version out.
- A dependency vulnerability that reaches the shipped bundle.
- The repository's own automation: the workflows in [`.github/workflows/`](./.github/workflows), the
  scripts they run, and the handling of the preview deployment token.

## What is out of scope

- **Wrong game data, or a wrong calculated value.** Both come from
  [`@elite-dangerous-almanac/core`](https://github.com/DarkSession/Elite-Dangerous-Almanac). It is a
  defect, not a vulnerability, and it is fixed there. A security defect in the package is reported
  to the package as well; this application consumes the released fix and does not patch around it.
- **Missing response headers.** The site is hosted on GitHub Pages, which serves static files and
  does not let this project set headers. Report what the missing header would have prevented, rather
  than the header.
- **Reports against GitHub itself** — Pages, Actions or the platform. Those go to GitHub.
- Denial of service against a static site, volumetric testing, or automated scanning of the hosted
  site.
- An attack that needs the Commander to paste code into the browser console, or to already have
  control of the device or the browser profile.
- A build link or SLEF payload that a Commander is tricked into opening but that produces only a
  wrong or refused build. Malformed input has to fail visibly and safely; if it does not, that part
  is in scope.

## Disclosure

Work with the maintainers on a private report until a fix is deployed. When it is, the advisory is
published with what the defect was and which versions it affected.

Tell the maintainers in the report if you want to be credited in the advisory, and how. Nobody is
named without asking first.

There is no bounty programme. This is a hobby project with no revenue.

## Repository settings this policy depends on

Private reporting is what this document points at, so it has to stay on: **Settings → Advanced
Security → Private vulnerability reporting**, enabled for this repository.
