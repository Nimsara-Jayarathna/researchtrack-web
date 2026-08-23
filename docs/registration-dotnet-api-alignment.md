# Registration .NET API Alignment

## Decision

ResearchTrack frontend targets the .NET backend only. There is no Java/SuperviseSuite runtime compatibility layer and no BFF.

The frontend migration is incremental by feature story:

1. `apiClient` owns the canonical ResearchTrack .NET response-envelope parsing.
2. Each feature API module owns its endpoint paths and request/response DTO types.
3. Hooks own feature flow/state.
4. UI components remain unchanged unless a story changes actual user-facing behavior.

## Story 1 scope

Only registration endpoints move to canonical Gateway paths:

- `GET /api/v1/auth/register/config`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/register/init`
- `POST /api/v1/auth/register/verify`
- `POST /api/v1/auth/register/complete`

Supervisor direct registration uses the same `/api/v1/auth/register` endpoint because the AuthService infers the role from the institutional email domain.

Login, refresh, logout, forgot-password and reset-password endpoints are intentionally not migrated in this story. They move with the authentication story.

## Canonical .NET envelope

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "traceId": "...",
    "timestamp": "..."
  }
}
```

Failure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed.",
    "fieldErrors": [
      {
        "field": "email",
        "errors": ["..."]
      }
    ]
  },
  "meta": {
    "traceId": "...",
    "timestamp": "..."
  }
}
```

`apiClient` unwraps `data` and normalizes .NET `fieldErrors` into the existing frontend form-error shape so presentation components do not need backend-specific changes.

## Future-story migration rule

When a .NET backend story is completed, migrate only that feature's API module to its `/api/v1/...` endpoints and update its DTO types/tests. Do not rewrite unrelated UI or endpoints in the same story.

Examples:

- Authentication story: migrate login/refresh/logout/password reset.
- Project story: migrate project API module.
- GitHub story: migrate GitHub API module.
- Jira story: migrate Jira API module.

When all features use the canonical .NET contract, any remaining temporary client-side compatibility mappings can be removed.
