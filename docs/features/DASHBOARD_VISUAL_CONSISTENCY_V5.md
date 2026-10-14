# ResearchTrack V5 — Dashboard and marketing-preview consistency

## Purpose

This release targets a specific mismatch reported with screenshots: the public landing page displayed an attractive, seven-metric, full-width supervisor dashboard illustration while the authenticated dashboard displayed a narrower, taller 4+3 set of differently styled metric cards. The public callout also overlapped the illustration's search field. The goal is visual consistency **without altering health, progress, lifecycle, project, milestone, authentication, or Jira calculations**.

## Changes

1. **Wider real workspace:** The authenticated `AppShell` and the private `TopBar` use the same `max-w-[1600px]` bounded container and coordinated horizontal padding. Public landing headers are unaffected. This lets the real dashboard make better use of larger displays while retaining margins and mobile padding.
2. **Adaptive seven-stat layout:** At small/medium widths the four primary metrics and three supporting metrics remain in readable groups. At Tailwind's `2xl` breakpoint the seven metrics become one continuous row. Labels remain in the DOM at all breakpoints; no metrics are hidden.
3. **One metric-card component:** `src/components/ui/DashboardStatCard.tsx` drives both the authenticated metrics and the landing-page product preview. It has a `preview` display-only scale option. The historical supervisor import path is retained through a compatibility re-export.
4. **Neutral disconnected states:** Jira counts show `Not linked` when no project is connected and `Unavailable` when dependency failure is reported. Both now use neutral (slate) visual accents instead of risk colors. Actual connected warning/danger counts keep their semantic colors.
5. **Clarified time/status definitions:** A small explanation identifies saved lifecycle status counts separately from attention scoring, which can include overdue milestones and inactivity. The `Upcoming milestones` metric excludes overdue dates, whereas the deadline section may display them. This explains why a dashboard may display zero upcoming and still highlight an overdue date. There is **no change to the backend/API numerical values**.
6. **Table breakpoints:** The seven-column table is shown when there is enough desktop width (`xl` and higher). At narrower widths, existing accessible project-health cards are shown, rather than squeezing or horizontally scrolling a table too early. Table columns were balanced for the wider layout.
7. **More faithful marketing sample:** The sample uses the real metric card and adds the real table's members, milestone, progress indicator, Jira health, and open-action information. The public preview remains clearly fictional and invokes no authenticated services.
8. **Non-obscuring hero annotation:** The “Know what needs review” callout is now a line below the preview instead of an absolutely positioned badge that covered the sample search field.
9. **Responsive search sizing:** The dashboard search field has bounded widths on medium and large screens while keeping a full-width form factor on phones.

## Deliberately unchanged

- Authentication and role authorization
- All API client/service modules, request payloads, and endpoints
- Lifecycle/status scoring, milestone completion and progress algorithms
- Jira health and availability calculations
- Project links, navigation targets, search/filter/sort interactions and pagination
- Registered marketing CTAs and the real ResearchTrack logo

## Caveats and important semantic differences

- The sample dashboard always uses **fictional** numbers. It isn't meant to mirror a signed-in account's count. A count difference between the landing page and live data is intentional; a **layout** difference is the inconsistency addressed here.
- Lifecycle counts depend on the application's saved lifecycle statuses. A Planning project may need attention because an associated milestone is overdue without being classified as `Behind` in the lifecycle totals.
- An `Upcoming milestones` value of zero does not mean there are no overdue deadlines. The distinction is explained visually and should remain separate unless backend product requirements change.
- An uploaded screenshot had a dark active navigation tab, whereas the uploaded `develop` repository already has a pale-blue active tab. Confirm the deployed commit and clear stale static assets/browser caches before attributing this to the new UI implementation.

## Verification

Run in a network-enabled environment with Node.js 20+:

```bash
npm ci
npm run v5:check
npm run landing:check
npm run landing:smoke
npm run workspace:check
npm run v4:check
npm run v4:smoke
npm run ci
```

Perform visual QA using actual supervisor data at approximately 390px, 768px, 1024px, 1280px, 1536px, and 1920px widths. Check an account with Jira linked and one without it, no project data, failed API responses, zero deadlines with overdue items, multi-project tables, keyboard focus, and reduced motion. Confirm the real data does not bleed into the fictional marketing preview.

The checked offline TSX/JS parsing and simulated rendering cannot substitute for a successful real Vite build, Vitest execution, and actual browser testing. The npm installation for this release was not successful in the working container.
