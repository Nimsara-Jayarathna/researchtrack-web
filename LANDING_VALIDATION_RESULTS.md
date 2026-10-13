# ResearchTrack — real-product landing integration validation

**Baseline:** the first updated ResearchTrack landing archive (13 October 2026).  
**Iteration:** animated real-brand hero, application-aligned static product and workflow previews.

| Validation | Result | Detail |
| --- | --- | --- |
| TSX parser & structural marketing checks | **PASS** | `NODE_PATH=$(npm root -g) npm run landing:check`: 62 checks, including new hero, real application structure labels, static previews, anchors, legal links and registration gate |
| Offline TSX view-tree execution | **PASS** | `NODE_PATH=$(npm root -g) npm run landing:smoke`: 9 view trees transpiled and executed, 815 elements; validates static render composition without React runtime |
| CSS parse | **PASS** | Both global CSS files parse via locally available PostCSS |
| Real brand asset | **PASS** | Existing `/public/logo.png` used by `LogoMark`; unchanged |
| npm package install | **BLOCKED** | Package registry unavailable; offline install reports `ENOTCACHED` for `zxcvbn` tarball |
| Full TypeScript semantic check | **BLOCKED** | `tsc --noEmit`: dependencies missing (`node`, `vite/client` types) |
| ESLint | **BLOCKED** | `eslint: not found` |
| Vitest suite | **BLOCKED** | `vitest: not found`; new tests are authored but unexecuted |
| Vite production build | **BLOCKED** | Build depends on TypeScript and package resolution; no successful production artifact created |
| Actual browser/responsive/accessibility QA | **NOT RUN** | Static code validated; browser testing of the bundled app still required |
| Live backend/registered-user journey | **NOT RUN** | No backend or environment access; auth/integrations intentionally not modified |

Passing structural and synthetic rendering checks **does not certify production readiness**. Before deploying, execute the complete CI gates below in a networked environment, visually inspect viewport sizes and reduced-motion, and test the real login/registration and supervisor/student flows against staging.

```bash
npm ci
npm run format
npm run landing:check
npm run landing:smoke
npm run verify
npm test
npm run build
```

See `docs/features/landing-real-product-visuals.md` for the exact mapping between preview components and the actual authenticated application modules.
