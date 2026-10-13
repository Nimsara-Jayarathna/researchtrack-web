# ResearchTrack landing page — product-led public experience

Updated October 13, 2026. Public URL: `/` for unauthenticated users. Authenticated users retain their existing role-specific routing.

## Product positioning

**One workspace. Complete visibility into every project.**

ResearchTrack is a connected research-supervision and project-delivery workspace for student research teams and academic supervisors. The website leads with outcomes (visibility, accountability, feedback) rather than presenting GitHub, Jira and meeting minutes as its only features.

Product messaging is grounded in frontend code. Claims about real-time updates, autonomous AI insights, universal signup, automatic milestone-to-Jira writeback, institutional endorsements and performance metrics are intentionally absent.

## Component tree

```text
LandingPage
└── PublicLayout(landing)
    ├── LandingHeader (sticky desktop navigation, mobile menu, auth actions)
    └── main
        ├── existing auth config/error modals (unchanged)
        ├── HeroSection (h1, registration CTA, #platform anchor, ProductPreview)
        ├── ProductShowcaseSection (#platform)
        ├── FeaturesSection (#features)
        ├── WorkflowShowcaseSection (#workflow)
        ├── HowItWorksSection (#steps)
        ├── WhoItsForSection (#audiences)
        ├── TrustStrip
        └── FinalCTASection (#get-started) + footer
```

`ProductPreview` and `ProjectJourneyPreview` are static illustrations of code-backed supervisor dashboard concepts. **All project names and numeric values are fictional examples**, not live data or a screenshot. It makes no requests and is not connected to a real student, supervisor, or institution. Before a public launch, obtain redacted screenshots from a representative, working deployment and evaluate replacing the static illustration with authentic captures.

`WorkflowShowcaseSection` also uses explicitly labeled example representations rather than live data.

## Auth and navigation contracts

The following existing behaviors are preserved:

- `Get started` / `Register` calls `authApi.getRegisterConfig()` before opening the existing `RegistrationPanel`, honoring eligibility restrictions.
- Configuration fetch failures block registration, show the existing `RequestStateModal`, and offer retry.
- `Sign in` opens the existing `LoginPanel` modal; direct `/login` and `/register` routes still use route-driven modal state and close navigation.
- Logged-in users still redirect through `RootRoute` to their role home.
- Header section links scroll to real anchors (`#platform`, `#features`, `#workflow`, `#audiences`). Mobile menu uses actual button actions, aria-expanded and close-on-select.
- Footer links resolve to existing `/support`, `/legal/privacy`, and `/legal/terms` routes.

The landing-specific header does **not** modify the shared authenticated `TopBar` or role-specific application screens. `PublicLayout` retains its original non-landing public header mode.

## Feature claims and source of truth

| Marketing theme | Implementation evidence |
|---|---|
| Portfolio health and attention | `src/features/supervisor/components/dashboard/DashboardStatsSection.tsx` and `DashboardAttentionSection.tsx` |
| Milestone tracking | Supervisor project setup/details and student project details |
| Connected GitHub activity | Supervisor project GitHub tab and owner-granted access flows |
| Jira health and task progress | Supervisor Jira project detail components |
| Meeting record review | `src/features/meetings/components` |
| Submission requirements, reviews, revisions | `src/features/submissions/components` |
| Role-aware access | `src/app/routes/routes.tsx` and auth state/guards |

Optional integrations are described as conditional, not required. Source code demonstrates frontend intent and does not prove production API availability or permissions.

## UX and accessibility

- One semantic `h1`; section-specific `h2` and feature-level `h3` headings.
- Reusable marketing heading classes in `src/styles/globals.css` are scoped to new public classes.
- Anchor destinations account for sticky navigation via `scroll-mt-24`; native smooth scrolling is disabled when `prefers-reduced-motion` is set.
- Mobile menu uses buttons, navigation landmarks, aria-expanded/aria-controls, and close-on-navigation behavior.
- All actions have visible text; decorative icons use `aria-hidden`.
- Page uses semantic lists and actual `<button>` elements for actions. Avoid fake interactive cards.

## Validation commands

```bash
npm ci
npm run verify
npm test
npm run build
```

Key regression tests: `src/features/landing/pages/LandingPage.test.tsx` and `src/features/landing/components/LandingHeader.test.tsx`.

Manual checks in a configured environment: 360px/768px/1280px layouts; browser keyboard navigation and Escape behavior in existing auth modals; `prefers-reduced-motion`; failed register config/retry; direct `/login`/`/register` paths; actual privacy/support links; Lighthouse accessibility/performance and production integrations.

## Future capture and claim approval

Replace the illustrative supervisor preview with sanitized actual captures only after validation on a controlled backend. Check the landing copy whenever new features, role permissions, or integration behavior changes. Never publish unverified numerical claims or testimonials.
