# Landing page — branded animation and application-based product previews

Updated 2026-10-13. This document applies to the public landing page only.

## Purpose

The landing page should be a credible window into the implemented ResearchTrack workflows. Previous illustrations used generic three-counter dashboards and abstract numbered stage cards. This iteration replaces them with marketing-safe replicas of the actual application's sections, while keeping the real authenticated application untouched.

**Important:** These are JSX/CSS static previews, not screenshots, real project information, or interactive feature demos. Sample names, numbers, activity graphs and statuses are fictional. Visible labels disclose this. Do not present them as real customer metrics or claim all workflows have been verified against a live backend.

## Component-to-product map

| Marketing component | Source of truth in the actual application | Representation in the landing page |
| --- | --- | --- |
| `BrandConstellation.tsx` | `public/logo.png`, `src/components/brand/Logo.tsx` | Real brand mark surrounded by four capability labels |
| `ProductPreview.tsx` | `features/supervisor/pages/SupervisorDashboardPage.tsx`, `components/dashboard/DashboardStatsSection.tsx`, `DashboardProjectHealthSection.tsx`, `DashboardAttentionSection.tsx`, `DashboardUpcomingMilestonesSection.tsx` | Seven dashboard metrics, project health, attention and upcoming milestones |
| `ProjectJourneyPreview.tsx` | `features/supervisor/pages/ProjectDetailsPage.tsx`, `components/ui/ProjectHeroCard.tsx`, `components/ui/PageTabs.tsx`, milestone and integration components | Project header, KPI indicators, true project tab names, milestones, GitHub/Jira, meetings, submissions |
| `WorkflowAppSnapshot.tsx` / `plan` | `features/supervisor/components/ProjectCreate/{CreateProjectWizard,StudentsStepSection,MilestonesStepSection}.tsx` | Supervisor-led project creation wizard and team selection |
| `WorkflowAppSnapshot.tsx` / `connect` | `features/supervisor/components/projectDetails/SupervisorProjectGitHubTab.tsx`, `features/shared/jira/JiraProjectDataView.tsx` | Dedicated GitHub and Jira views with summary statistics |
| `WorkflowAppSnapshot.tsx` / `collaborate` | `features/supervisor/components/ProjectDetail/MeetingsTabSection.tsx`, `features/meetings/components/SupervisorMeetingRecordsSection.tsx` | Channels / History selection and review items |
| `WorkflowAppSnapshot.tsx` / `review` | `features/submissions/components/SupervisorSubmissionRequirementsSection.tsx` | Needs-review and revision groupings; status and version context |
| `AppPreviewUI.tsx` | Authenticated `AppShell`, `TopBar`, `PageTabs`, `Card` and badge styles | Shared preview window, app bar, static tabs, cards and status chips |

## Animation behavior

- Real existing logo asset; do not replace it with AI-generated logo artwork.
- Logo assembles with an entrance animation, gentle floating motion, two slow rings, and subtle connection labels. Hover softly emphasizes the mark.
- Modern browsers supporting CSS scroll timelines progressively fade the brand and reveal the app preview when scrolling. Older browsers keep both fully visible.
- `prefers-reduced-motion: reduce` disables all custom entrance/orbit/pulse/scroll animations and smooth scrolling.
- All animation CSS is in `src/styles/globals.css`, scoped with `.landing-brand-*` and `.landing-preview-reveal`; authenticated pages are unaffected.
- No canvas, heavy rendering libraries, external font/image assets, auth calls, polling, or scroll listeners are used.

## Ongoing maintenance

1. When changes are made to authenticated project tabs, supervisor health stats or submission review states, update the corresponding marketing preview labels and layout.
2. Keep the numeric fixtures fictional; never copy production records, emails, commit messages, repository secrets or personal details into marketing code.
3. Product previews are deliberately static; their tab-like labels are spans rather than buttons. Do not imply tab interactivity unless a real demo experience is built.
4. Preserve the registration-config gate, auth callbacks and route links on the landing page.
5. Keep a visible fictional-data disclosure and accurate feature claims.
6. Keep mobile layouts readable and check horizontal overflow at 320, 375, 768, 1280 and 1440px widths.

## Verification

After `npm ci` succeeds in a network-enabled development environment:

```bash
npm run format
npm run landing:check
npm run landing:smoke
npm run verify
npm test
npm run build
```

Also visually QA in the browser: inspect hero balance, logo motion, reduced-motion preference, screen-reader descriptions, overflow, landing anchors, sign-in/registration and error/retry states, and 4 story views. Verify integration claims with the connected backend independently before releasing the marketing page.

The offline `landing:check` parses TSX and validates wiring, route anchors and disclaimers; `landing:smoke` transpiles and executes the static JSX view trees. Neither substitutes for React/Vitest, compiler semantic checks or actual browser QA.
