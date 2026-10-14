# ResearchTrack — Authenticated Workspace Visual Modernization

Implementation handoff • October 2026

## Objective

Bring the authenticated supervisor and student experience closer to the premium, application-aligned marketing preview, without replacing real business logic with the preview's fictional sample data. The design system improves consistency; the backend remains the sole source of truth for status, risk, due dates, and integrations.

## Scope implemented

### Shared foundation

- Introduced `src/styles/workspace.css`, scoped under `.workspace-shell` and imported in `src/index.css`. Public landing content does not inherit authenticated-only surface styling.
- Standardized background and surface geometry, subdued shadows, legible metadata/typography, native focus states, and motion reduction.
- Refined common `Card`, `SectionCard`, `PageHeader`, `PageTabs`, `Button`, `StatusBadge`, `DataTable`, `TableSurface`, `ProjectHeroCard`, `RoleBadge`, and lifecycle tile styling.
- Added reusable `ProgressMeter` with accessible progress semantics and explicit unknown states, and `WorkspaceNotice` for informative empty states.
- Updated the private top navigation to expose `aria-current="page"` and align hover/focus treatment.

### Supervisor dashboard

- Reorganized seven existing KPI indicators into **four primary portfolio** metrics plus **three supporting milestone/Jira** metrics. Counts and Jira connectivity fallbacks still derive from the original API response.
- Added icons and restrained semantic accents; removed unnecessarily wide all-caps metadata treatment.
- Improved project-health table header, row hierarchy, hover/focus states, status chips, progress bars, and desktop horizontal overflow handling. Mobile project cards remain available.
- Added local lifecycle filtering and sorting (default, lifecycle risk, project name, reported progress), using existing loaded data. No API contracts or routes were changed.
- Suppressed pagination controls when there is only one page. Retained original pagination behavior for multiple pages and reset to the first page on query/filter/sort changes.
- Reorganized risk/attention cards around the original scoring output and reason strings. The UI does **not** fabricate risk explanations.
- Differentiated no configured milestones from no approaching deadlines, using existing project data.

### Project lists and detail workspaces

- Refined shared list heading/search/filter layouts for both roles.
- Improved supervisor and student project cards with consistent surfaces, focus states, and progress indicators.
- Updated supervisor and student project details KPIs and shared project hero sections.
- Existing project tabs and reusable section cards (meetings, submissions, etc.) inherit the unified workspace design.

## Signal semantics and important limitations

The screenshot's apparent contradiction (`Behind` lifecycle + `100%` reported progress + `Healthy` Jira) is not corrected by this UI change. These signals can refer to different concepts, so it would be unsafe to overwrite their business rules in a visual modernization effort. The interface labels the percentage as **reported progress** and presents **attention reasons** from existing scoring rules. A separate backend/product review is needed to validate the semantics and communicate them in user-facing help text.

A missing percentage now renders **Not reported**, rather than silently turning missing data into `0%` in updated components.

All dashboard metrics, project links, actions, role-based access, submission workflows, authentication, and integration services remain connected to existing application code. No invented customer metrics were added.

## Changed/additional implementation map

| Area | Representative files |
|---|---|
| Scoped design foundation | `src/styles/workspace.css`, `src/app/layout/AppShell.tsx` |
| Shared UI | `src/components/ui/*`, `src/components/lifecycle/LifecycleTiles.tsx` |
| Supervisor metrics | `src/features/supervisor/components/dashboard/DashboardStatsSection.tsx`, `DashboardStatCard.tsx` |
| Project health | `src/features/supervisor/components/dashboard/DashboardProjectHealthSection.tsx`, `src/features/supervisor/hooks/dashboard/useSupervisorDashboardViewModel.ts` |
| Attention/deadline cards | `DashboardAttentionSection.tsx`, `DashboardUpcomingMilestonesSection.tsx` |
| Project lists | `src/features/projects/components/ProjectsPageView.tsx`, supervisor/student project cards |
| Project details | `SupervisorProjectDetailsHeader.tsx`, shared `ProjectHeroCard.tsx`, project KPI components |
| Regression coverage | `ProgressMeter.test.tsx`, `DashboardPolish.test.tsx`, `scripts/workspace-source-check.cjs` |

## Verification commands

```bash
npm ci
npm run format
npm run verify
npm test
npm run build
npm run landing:check
npm run landing:smoke
npm run workspace:check
```

### Required manual review

Check **1280px / 1440px desktop**, 1024px and narrow tablet layouts, and mobile navigation on `/supervisor`, `/supervisor/projects`, project details (all tabs), `/student/projects`, student project details, meetings and submission panels. Test long titles, empty lists, loading, failed Jira, disconnected Jira, no milestones, paging with 6+ projects, filters/sorts, keyboard focus, and reduced motion. Validate real backend values for `Not reported`, `Behind` and Jira states.

## Explicitly not changed

- Backend contracts, authentication and account state, authorization/route guards.
- Project lifecycle scoring, GitHub/Jira computations or synchronizations.
- Create/edit/delete workflows, API service calls, project membership, submissions, and meeting approval business rules.
- Public landing narrative or animation design.

## Validation limitations at handoff

The sandbox did not have the frontend npm dependency tree and could not retrieve all required packages. Static TSX transpilation and structural checks passed, but complete TypeScript semantic checks, ESLint, Prettier, Vitest, Vite production build, and real-browser review **were not completed**. Do not treat this as production-verified until the commands above pass in CI and screenshots have been reviewed.
