# ResearchTrack Git Strategy

ResearchTrack uses a simple two-environment Git strategy.

## Permanent branches

| Branch | Purpose | Deployment |
| --- | --- | --- |
| `main` | Stable production-ready code | Production |
| `develop` | Integrated sprint work | Test |

Do not create permanent `qa`, `staging`, `production`, or `release` branches.

## Temporary branches

| Branch pattern | Starts from | Merges to | Use |
| --- | --- | --- | --- |
| `feature/RT-xx-name` | `develop` | `develop` | Normal Jira story work |
| `bugfix/RT-xx-name` | `develop` | `develop` | Defects found before production |
| `hotfix/RT-xx-name` | `main` | `main`, then `develop` | Urgent production fixes |

Delete temporary branches after merge.

## Feature and bugfix merge gate

`feature/*` and `bugfix/*` branches must merge to `develop` by pull request only.

Required before merge:

- Jira story or bug is identified.
- Scope matches acceptance criteria.
- Implementation is complete for affected frontend behavior.
- Build, lint, typecheck, and unit tests pass.
- GitHub Actions CI passes.
- No passwords, tokens, API credentials, or `.env` files are committed.
- API, configuration, or integration changes are documented when applicable.
- At least one teammate reviews the PR.
- Blocking review comments are resolved.
- No unresolved merge conflicts remain.

Use **Squash and Merge** for feature and bugfix PRs into `develop`.

## Test environment

Every push to `develop` represents the Test environment candidate.

Test validation includes:

- Functional QA
- Acceptance criteria verification
- Integration testing with backend contracts
- E2E testing for critical flows
- Regression testing
- Authentication and RBAC checks where affected
- GitHub and Jira integration validation where affected
- Defect validation

Fix Test defects through `bugfix/RT-xx-description` branches. Do not commit fixes directly to `develop`.

## Production release gate

`develop` merges to `main` by pull request only after release validation.

Required before merge:

- Agreed sprint or release scope is complete.
- Included stories meet acceptance criteria.
- CI is green.
- Unit, integration, E2E, and regression evidence is available as applicable.
- Critical defects are resolved.
- High or blocking security issues are resolved.
- Authentication and RBAC are verified where affected.
- Production configuration variables are identified.
- Secrets remain outside the repository.
- Documentation is updated when the change requires it.
- Team or QA approval is recorded.

## Versioning

Create official version tags only from `main`.

Use:

```text
vMAJOR.MINOR.PATCH
```

For example:

```text
v1.0.0
```
