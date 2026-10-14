# ResearchTrack Workspace Refinement V4

Date: 2026-10-15. Baseline: ResearchTrack Modernized Frontend V3.

## Purpose

Bring the actual supervisor/student project experience closer to the polished landing-page visual standards, without copying fictional landing data into the authenticated application or changing project business logic.

## Delivered

| Area | Change |
|---|---|
| Supervisor projects | Replaced tall three-tile metadata blocks with compact icon-labelled facts; progress now appears once; human-readable milestone dates; contextual action hints rather than permanently expanded delivery-signal boxes. |
| Student projects | Compact card; supervisor, batch, semester, milestone date and last activity retained; progress appears once; preserved project routing. |
| Project detail hero | Reduced hero spacing, suppressed identical title/summary duplication, kept lifecycle control. |
| Project detail metrics | Smaller four-column fact row with a single displayed progress value and progress bar (both roles). |
| Authenticated navigation | Private active tabs now use a subtle sky-blue highlighted surface in line with the landing design; compact one-row desktop header; retained role badge, account action and mobile menu. |
| Loading | Shared `ProjectsPageView` shows one grid row of adaptive skeletons: one at base widths, two at `xl`, three at `2xl`. It does not pretend to know actual project count. The existing cards remain visible during refetch with an updating indicator. |
| Date semantics | Date-only API fields are parsed as local calendar dates, not UTC timestamps; prevents day shift in display. |
| Risk semantics | Lifecycle, reported progress and milestone date stay separate. A past date alone is no longer declared an overdue *milestone* without a milestone-completion signal. |
| QA | Dedicated Vitest regression cases and offline `v4:check` source audit. |

## Invariants

- No API endpoint, request shape, response parser, authorization, project calculation, lifecycle update, GitHub/Jira integration, routing, or persistent data model changed.
- Marketing/landing previews remain separate from real authenticated data.
- No hidden project count is inferred from skeletons.
- Project list filters, search, error and empty states retain existing functionality.

## Run the complete checks before merging

```bash
npm ci
npm run format
npm run v4:check
npm run v4:smoke
npm run workspace:check
npm run landing:check
npm run landing:smoke
npm run ci
```

Review in the browser at desktop 1440 and 1280px, laptop 1024px, tablet 768px and phone 390px. Confirm supervisor/student list, empty state, API failure, 1/2/20 projects, lifecycle links, account/mobile navigation, and milestone dates. Check initial load and refresh with slow-network throttling. Source-only checks do not replace visual QA or a real build.
