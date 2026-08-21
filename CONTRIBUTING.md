# Contributing

## Branching Model

- `main`: stable production-ready branch, pull requests only.
- `develop`: integration branch for completed sprint work, pull requests only.
- Create feature and bugfix branches from `develop`.
- Do not push directly to `main`.
- Do not push directly to `develop` except for repository administration changes agreed by the team.
- Use Squash and Merge for `feature/*` and `bugfix/*` pull requests into `develop`.
- See `docs/devops/branching-strategy.md` for the full ResearchTrack Git strategy.

## Branch Naming Convention

Use:

- `<type>/RT-xx-short-title`

Allowed types:

- `feature`
- `bugfix`
- `hotfix`

Examples:

- `feature/RT-08-github-connection`
- `bugfix/RT-41-login-validation`
- `hotfix/RT-52-production-login-failure`

## Commit Message Convention

Use:

- `feat: ...`
- `fix: ...`
- `chore: ...`
- `docs: ...`
- `refactor: ...`
- `test: ...`

Keep messages short and meaningful.

## Local Verification

- Before PR, run `npm run verify` and `npm test`.
- `verify` runs: `format:check`, `lint`, and `typecheck`.
- `npm test` runs the full unit test suite — must exit 0.

## Artifacts Never to Commit

- `node_modules/`
- `dist/`
- `target/`
- `.env` (use `.env.example` when needed)
- IDE files:
  - `.idea/`
  - `.vscode/`

## PR Expectations

- Keep pull requests small and focused (single purpose).
- Require at least 1 approval before merge (aligned with branch protection settings).
- Clearly describe what changed and how it was tested locally.
- Include Jira reference, affected areas, API/configuration changes, screenshots for UI changes, and known limitations.
