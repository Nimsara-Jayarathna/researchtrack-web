# ResearchTrack — Landing Page Business-Value Audit & Redesign Blueprint

**Audit target:** `researchtrack-web-main(3).zip`, archived snapshot dated October 10, 2026  
**Audit basis:** Frontend source, routes, components, tests, and bundled documentation. This is a static source review, **not** a production UX study or live backend end-to-end verification.

## Executive recommendation

Reposition ResearchTrack from "a dashboard with GitHub, Jira and meeting minutes" to **a connected research supervision and project-delivery workspace**. Emphasize evidence-backed progress visibility, decisions requiring supervisor attention, milestone accountability, submission review, and student/supervisor coordination. Integrations are enabling capabilities, not the entire product proposition.

The existing four-section homepage gives almost no impression of the supervisor dashboard, versioned submission workflows, or governance that are actually implemented in the frontend. The public hero has no main action or product screenshot; public header has only Login/Register; a FinalCTASection exists but is not rendered. Rebuild the *public storytelling layer* while retaining the functioning app's visual tokens and auth APIs where practical.

## 1. Verified implementation and communication gaps

| Capabilities found in frontend | Representative source | Homepage state | Recommended user benefit |
| --- | --- | --- | --- |
| Supervisor portfolio view: active, at-risk, behind, upcoming milestones, Jira status | `src/features/supervisor/components/dashboard/DashboardStatsSection.tsx`, `DashboardAttentionSection.tsx` | Not explained | Know which projects require attention before they slip |
| Scored attention list informed by lifecycle status, Jira signal, milestone deadlines and inactivity | `src/features/supervisor/utils/dashboard/scoring.ts` | Not explained | Prioritize supervision across multiple teams |
| Supervisor-led project creation, team assignment and lifecycle/milestone management | `src/features/supervisor/pages/CreateProjectPage.tsx`; `src/features/supervisor/projectDetails.shared.ts` | "Students register their research project" in How It Works conflicts with the available create route | Establish project responsibilities and planned delivery |
| GitHub commits, contributors, branches, PRs, multiple repository selection and authorization flow | `src/features/supervisor/components/projectDetails/SupervisorProjectGitHubTab.tsx`; `docs/features/owner-granted-github-access.md` | One generic card | See development activity in the project context, without chasing repository links |
| Jira health, sprint progress, workload, issue hierarchy and refresh | `src/features/supervisor/components/ProjectDetail/jira/JiraHealthOverview.tsx`; `JiraTabSection.tsx` | One generic card | Understand work status, bottlenecks and team distribution |
| Student meeting-channel proposals and meeting-record submissions; supervisor approvals | `src/features/meetings/components/StudentMeetingChannelsSection.tsx`, `StudentMeetingRecordsSection.tsx`, `SupervisorMeetingRecordsSection.tsx` | "Meeting Minutes" card misses approvals | Maintain a reviewed record of discussions and decisions |
| Research submission requirements, due dates, uploads, preview, version history, supervisor approve/reject with feedback and resubmission path | `src/features/submissions/components/StudentSubmissionsSection.tsx`, `SupervisorSubmissionRequirementsSection.tsx`, `SubmissionDetailModal.tsx` | Completely missing | Close the loop from document submission to review and revision |
| Project files | `src/features/projectfiles/` and `FilesTabSection.tsx` | Missing | Keep project material accessible by project and role |
| Student workspace with overview, team, milestones, submissions, GitHub, Jira, meetings | `src/features/student/pages/StudentProjectDetailsPage.tsx` | Generic student benefits | Give student teams clear responsibilities and visibility |

**Boundaries:** UI code shows intended features, not that every flow is healthy in production. Some capabilities rely on connected GitHub/Jira accounts and backend permissions. Do not imply automated milestone-to-Jira two-way linking, constant real-time streaming, AI predictions, public demo mode, institutional adoption statistics, or multi-university support without separate verification.

## 2. Concrete problems in the present landing implementation

1. **Product differentiation is weak.** `HeroSection.tsx` sells "GitHub commits / meeting minutes / Jira" instead of the full supervision cycle.
2. **No hero CTA.** `HeroSection.tsx` has a headline, two text paragraphs, and decorative logo artwork but no login, registration, or section exploration action.
3. **No real product proof.** The hero's most visible graphic is the ResearchTrack logo in a glass container, not the real supervisor dashboard.
4. **Only three generic cards.** `FeaturesSection.tsx` shows GitHub Tracking, Jira Integration, and Meeting Minutes. Risk review, milestone management, submission feedback/versioning, and supervisor/student coordination are absent.
5. **Risky marketing claims.** `HowItWorksSection.tsx` asserts student-led project creation and automatic Jira/milestone alignment. Current routes provide project creation to supervisors, while Jira is predominantly analytics/sync-oriented.
6. **Unsubstantiated timing claims.** "Real time" appears in multiple cards. Displayed activity can be cached or synced; don't promise instantaneous updates until end-to-end proven.
7. **Missing close.** `FinalCTASection.tsx` exists but `LandingPage.tsx` doesn't import or render it.
8. **Public navigation lacks discovery.** `PublicLayout.tsx` top bar only offers Login and Register. No section anchors, feature menu, support or overview links in the public header.
9. **No public footer in LandingPage/PublicLayout.** This reduces discoverability of support, terms and privacy even though those routes exist.
10. **Thin public metadata.** `index.html` provides only the generic `ResearchTrack` title; no descriptive metadata or sharing cards were found in the checked entry file.
11. **Repetitive art direction.** Hero and sections reuse translucent white rounded containers, blue glow, deep shadows. Without varied composition or authentic screenshots, content and hierarchy look flat.
12. **Outdated content contract.** `docs/features/landing.md` describes a two-section, card-grid landing and page-navigation handlers, while actual code has four sections and modal authentication. Update docs as part of redesign.
13. **Coverage focuses on registration, not marketing behavior.** `src/features/landing/pages/LandingPage.test.tsx` verifies registration config fetch success/error but not CTA location, section navigation, or accurate feature messaging.

## 3. Positioning strategy

**Category:** Research project supervision and delivery management workspace for academic supervisors and student teams.

**Core promise:** All project context in one place, with clearer progress visibility and a recorded route from plans to reviews.

**Priority audience:** Academic supervisors overseeing multiple groups. **Secondary audience:** Final-year research students/team leaders. **Future audience, if built:** program/faculty administrators — do not claim an administrative console today.

**Three outcomes:**

- **See progress:** project health, milestones, code activity and Jira work in context.
- **Act earlier:** spot delays, overloaded teams, overdue work and unreviewed submissions.
- **Keep decisions accountable:** meeting records, submission versions and supervisor feedback.

Avoid marketing claims about saved hours, adoption counts, security certifications, AI intelligence or automated grading unless verified.

## 4. Proposed information architecture and near-final copy

### Public header

Logo | Product | Features | How it works | For supervisors | For students | Sign in | Get started

In-page navigation should use real section anchors and preserve normal keyboard behavior. "Get started" should use the existing registration flow. "Sign in" should use the existing login flow. Do not build dead-end demo/book-a-call buttons.

### Section 1 — Hero

**Eyebrow:** RESEARCH SUPERVISION, CONNECTED

**Headline:** One workspace. Complete visibility into every research project.

**Supporting copy:** Bring project milestones, development activity, meetings and submission reviews into one connected workflow. Keep student teams aligned, understand project health, and make supervision decisions with better context.

**Primary action:** Get started  
**Secondary action:** Explore the platform

**Hero media:** Real (sanitized) supervisor dashboard screenshot or faithful UI recreation using project health, attention list, and upcoming milestone cards. Do not show fabricated product features or real student data. Optional micro-caption: "Supervisor project overview".

### Section 2 — Outcomes, not feature inventory

Title: **From scattered updates to a clear picture of progress.**

Three editorial columns:

1. **See where every project stands** — Compare milestones, progress and delivery risk across the groups you supervise.
2. **Know what needs attention** — Surface overdue milestones, stalled activity and work requiring review.
3. **Keep everyone accountable** — Connect meeting history, student contributions and submission decisions with the project record.

### Section 3 — Show actual supervisor experience

Title: **Supervise more effectively, without losing the details.**

Large product showcase: real dashboard with callouts to "Projects needing attention", "Upcoming milestones", "Project health", "Jira status". One clean image with annotations is better than six fake dashboards.

### Section 4 — Core workflow stories (four alternating feature panels)

- **Plan and track research milestones.** Set up projects, assign student teams, track lifecycle progress, and review deadlines.
- **Connect the evidence of development.** View linked GitHub contributions and pull requests alongside Jira work, sprint progress and workload analytics.
- **Turn supervision meetings into traceable records.** Track meeting channels and records, with student-submitted entries subject to supervisor approval.
- **Manage submissions from first upload to final decision.** Set requirements, receive project submissions, give review decisions and feedback, and retain version history where revisions occur.

Use one truthful product capture in each story where possible. Replace generalized illustration with authentic application visuals. Integration provider marks should be contextual and not imply endorsements.

### Section 5 — Two audience journeys

**For supervisors:** Oversee several projects, prioritize risk, monitor delivery evidence, manage milestones, approve meeting records and review submissions.

**For student teams:** See assigned milestones, view connected development activity, document meeting outcomes, submit requirements, and respond to feedback.

CTA: "Get started" or "Sign in" appropriate to account status. Do not claim students create projects until a verified student project-creation workflow exists.

### Section 6 — How it works

1. **Supervisor creates the project** — Establish the research workspace, team and milestones.
2. **Connect supporting tools** — Link GitHub repositories and Jira as permitted by the integration setup.
3. **Students collaborate and submit work** — Track activity, meeting records and required research deliverables.
4. **Supervisors review and guide progress** — Use health signals, feedback and milestone status to keep delivery moving.

Phrase optional connected services as optional rather than mandatory to use ResearchTrack.

### Section 7 — Responsible trust / support strip

Show: role-based student/supervisor experience, permission-aware repository connection, contact/support link, privacy policy, terms. Verify exact security semantics and policy content before stronger claims.

### Section 8 — Closing CTA and footer

**Headline:** Give every research project a clearer path forward.

**Copy:** Bring the work, milestones and reviews into one place — so progress is easier to see and guidance is easier to act on.

Buttons: **Get started** / **Sign in**. Footer links: Support, Privacy, Terms. Include copyright/brand as appropriate.

## 5. Design direction

**Aim:** Credible academic platform with modern B2B product clarity — not a generic frosted-glass SaaS theme.

- **Hierarchy:** Distinct open hero, product-led overview, calm detail sections and a decisive final conversion area. Reduce the "every section is a floating glass card" treatment.
- **Typography:** Larger meaningful hero display, restrained supporting text, spacious section breaks and sharper line lengths. Use brand personality through typography and a limited accent system.
- **Color:** Retain accessible blue/sky brand direction but introduce warmer white/ink neutrals and use bright accents sparingly for meaningful signals.
- **UI proof:** Feature real app states with synthetic/redacted data and visible annotations: health, milestones, GitHub activity, Jira sprint views, submission review. One central dashboard screenshot is mandatory for the hero.
- **Product narratives:** Alternate screenshot/text layouts, not an endless row of equal feature cards.
- **Motion:** Subtle reveal and hover interactions only; honor reduced-motion preferences. Avoid constant floating logo animation as dominant visual interest.
- **Responsive:** Hero stacks, comparison panels become vertical, navigation collapses, screenshots remain legible with focused crops. Avoid shrinking a full dashboard into illegible mobile thumbnails.
- **Accessible:** Semantic sections, a single h1, heading hierarchy, keyboard-reachable controls, labeled navigation, visible focus rings, descriptive image alt text, contrast and reduced-motion checks.

## 6. Technical implementation plan

### Phase 0 — Claim validation and assets

- Confirm which frontend workflows function in the currently deployed backend, including review statuses, sync schedules and institutional registration limitations.
- Produce sanitized screenshots (or component renders) from actual app UI. No invented metrics or testimonials.
- Decide whether "Get started" should display any institutional eligibility note based on registration config (avoid exposing misleading universal signup).

### Phase 1 — Rewrite the conversion foundation

- Refactor `HeroSection.tsx` to accept `onRegister` and `onExplore` callbacks, preserving the existing `LandingPage` registration and login behavior.
- Add in-page anchor links to marketing sections and a responsive marketing nav. Adapt `PublicLayout.tsx` or create `LandingHeader.tsx` if changing shared public layout would affect auth/legal pages.
- Ensure `FinalCTASection.tsx` is rendered, with existing callback wiring, and update its generic/student-specific text.
- Add a standard footer with links to `/support`, `/legal/privacy`, `/legal/terms`.

### Phase 2 — Full product storytelling

- Replace `FEATURE_CARDS` with outcome-led value blocks and truthful workflow feature sections.
- Replace `HowItWorksSection.tsx` data with the actual supervisor-to-student journey.
- Expand `WhoItsForSection.tsx` with supervisor and student outcomes and clear permission boundaries.
- Add modular components for `ValuePillars`, `ProductShowcase`, `WorkflowShowcase`, and `TrustStrip` as needed; avoid overly complex monolithic JSX.
- Share one content/config module for public messaging, if practical, so copy cannot drift across components.

### Phase 3 — SEO, conversion QA, documentation

- Improve `index.html` with descriptive title, meta description, social card metadata, favicon (existing), and appropriate canonical if a stable public domain is known.
- Add section/CTA tests, mobile nav tests, registration/login modal regression tests, and content assertions that prevent outdated false claims.
- Validate navigation to real existing routes, keyboard accessibility, responsive layouts, reduced-motion styles, and performance budgets.
- Update `docs/features/landing.md` with component tree, message hierarchy, content claims and CTA flow.

**Do not:** change the authenticated supervisor/student workflows during a marketing-page redesign unless a true regression requires it. Do not insert demo data into production API responses. Do not build unimplemented features solely to support landing claims.

## 7. Acceptance criteria for a finished redesign

1. Within five seconds, a visitor can tell **who ResearchTrack serves**, **what it solves**, and **what action to take**.
2. Above the fold, there is a visible, working CTA and a truthful product preview.
3. An academic supervisor can discover project risk, milestone oversight, meeting approvals and submission review without opening an account.
4. A student can understand what is assigned to them and how feedback/submission workflows work.
5. All marketing capability statements can be tied to code plus confirmed backend functionality.
6. Login and registration still work via existing modal/config flow; failures retain user-visible recovery.
7. Every public navigation item and footer link has a real destination.
8. Screenshots have sanitized content, alt text, and clear captions; no fabricated customer logos, performance claims, or testimonials.
9. Desktop, tablet and mobile layouts are readable and responsive; focus, contrast and reduced-motion checks pass.
10. Repository checks (`npm run verify`, `npm test`, `npm run build`) pass in a configured environment.

## 8. Prioritization

| Priority | Work | Reason |
| --- | --- | --- |
| P0 | Correct inaccurate copy, write outcome-led hero, add hero CTA and real product media | First impression and credibility |
| P0 | Expose risk overview, milestone tracking, submission review + version history, meetings approvals | Major currently-hidden differentiators |
| P1 | Supervisor/student journeys, clear product workflow, accurate integration story | Helps adoption understanding |
| P1 | Public navigation and closing CTA/footer | Conversion and trust |
| P1 | Typography/layout system with fewer glass panels and better product screenshots | Design credibility |
| P2 | SEO/social metadata, optional FAQ, instrumentation of CTA funnel | Discoverability and measurement |
| P2 | Doc/test coverage for all new public components | Prevents drift and regressions |

## 9. Key code references

- `src/features/landing/pages/LandingPage.tsx:158-164` — current section order; FinalCTA absent.
- `src/features/landing/components/HeroSection.tsx:1-33` — copy and decorative logo, no CTA.
- `src/features/landing/components/FeaturesSection.tsx:5-24` — exactly three promoted feature cards.
- `src/features/landing/components/HowItWorksSection.tsx:5-37` — potentially inaccurate student-creation and Jira-alignment statements.
- `src/features/landing/components/FinalCTASection.tsx` — implementation exists but is not used.
- `src/app/layout/PublicLayout.tsx:17-27` — only Login/Register public actions.
- `src/features/supervisor/components/dashboard/DashboardStatsSection.tsx` — delivery health indicators.
- `src/features/supervisor/utils/dashboard/scoring.ts` — ranked attention signals.
- `src/features/submissions/components/SubmissionDetailModal.tsx` — supervisor review and previous versions.
- `src/features/meetings/components/StudentMeetingRecordsSection.tsx` — meeting record approval workflow.
- `index.html:3-8` — basic page metadata.
- `docs/features/landing.md` — documentation out of sync with actual page.

### Confidence and limitations

**High confidence:** landing structure/copy, missing hero CTA, unrendered FinalCTA, current page routes, frontend component implementations.  
**Moderate confidence:** business impact and design weakness are expert judgments based on source and styles, not measured user behavior.  
**Needs validation:** active production deployment, backend availability, precise automation semantics, sync refresh rates, institution eligibility, commercial positioning, security guarantees and adoption metrics.  
**Visual limitation:** no fully rendered browser screenshots were evaluated in this audit; layout recommendations are grounded in JSX/Tailwind source and UI patterns.
