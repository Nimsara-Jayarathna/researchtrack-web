# ResearchTrack — landing page visual integration (v2)

**Date:** 13 October 2026  
**Input:** Previously redesigned `ResearchTrack_Full_Landing_Redesign_Source.zip`  
**Scope:** Public marketing landing page, test scripts and documentation. Authenticated app services/routes/components are left intact.

## Delivered

- **Animated brand experience** in the hero's formerly unused right-hand space, using the real `public/logo.png` through the existing `LogoMark` component. Soft connected-signals callouts, orbit rings, glow, entrance motion and hover interaction. CSS-only animations, reduced-motion handling and progressive scroll-based emphasis.
- **Responsive hero composition**: text and CTAs in the left column, identity on the right, supervisor preview underneath, with `min-w-0`/overflow protection.
- **Authentic supervisor preview**: seven stats (the same categories the real dashboard uses), project health, attention and upcoming milestone panels. No fabricated live performance evidence.
- **Project details preview**: application-style project page structure, the actual supervisor tab names, milestones, team context, GitHub/Jira status and review areas.
- **Four application-shaped workflow snapshots**: real supervisor project creation wizard, GitHub/Jira project analytics, meeting history/approvals, and grouped submission review/revisions. Replaces repetitive abstract stage mockups.
- **Reusable presentation primitives** in `AppPreviewUI.tsx`, so the marketing mockups stay coherent as authenticated designs evolve.
- **Regression coverage**: a new Vitest file for the marketing visuals, expanded offline structural checks, and a dependency-light TSX component execution smoke test.
- **Implementation reference**: `docs/features/landing-real-product-visuals.md` with screen-to-preview mapping and maintenance guidance.

## Real behavior vs illustrative behavior

Public CTA actions still call the existing registration-config-gated flow; sign-in and routes remain as before. The previews are **static snapshots rendered in React JSX with invented demo fixtures** and visible disclosure. They do not request backend data, impersonate real users, claim real-time status, or introduce fake click targets.

## Validation limitations

Static-source/TSX structure and offline JSX execution pass. CSS syntax parses. The full TypeScript semantic check, lint, Vitest suite, Vite production bundle and actual rendered browser UI were not completed because project dependencies could not be retrieved in the execution environment. See `LANDING_VALIDATION_RESULTS.md` for exact results and release gating steps.

## Release gates (must pass before production)

```bash
npm ci
npm run format
npm run landing:check
npm run landing:smoke
npm run verify
npm test
npm run build
```

Then inspect the landing in browser widths 320/375/768/1280/1440, check reduced-motion/keyboard behavior, verify footer and CTA routes, and smoke-test the authenticated supervisor/student flows against a staging backend.
