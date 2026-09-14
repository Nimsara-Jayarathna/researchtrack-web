# Owner-granted GitHub repository access

## Purpose

This feature lets an authorized ResearchTrack project member request access to a specific GitHub repository when that member cannot grant the ResearchTrack GitHub App access. A repository owner or administrator completes the GitHub authorization step; ResearchTrack activates the project connection only after the backend verifies that the resulting installation contains the exact repository named in the request.

A pending request is not an active repository connection. A private repository URL by itself is never treated as proof of access.

## User flow

### Project member

1. Open the Research Project repository controls and choose **Owner-Granted Access**.
2. Enter the intended GitHub repository URL in the form `https://github.com/{owner}/{repository}`.
3. Review the normalized owner/repository name and submit the request.
4. Copy the generated, expiring authorization link and share it with an appropriate repository owner or administrator.
5. Keep seeing the request as **Pending** until the backend reports a terminal result.

The UI must not imply that creating or sharing the request linked the repository.

### Repository owner or administrator

1. Open the shared ResearchTrack URL.
2. The public request page validates the opaque request token with the backend and displays only the minimum context needed to make a safe decision: the ResearchTrack project, requested repository, request status, and expiry.
3. Choose **Continue to GitHub**.
4. Complete the backend-generated GitHub App installation or repository-selection flow.
5. Return through the backend callback and view the outcome.

The frontend never asks for, receives, stores, or logs a GitHub password, personal access token, App private key, OAuth client secret, GitHub user token, or installation access token.

## Required UI states

| State | Member experience | Owner/admin experience |
| --- | --- | --- |
| `PENDING` | Show the shareable link and expiry; do not show an active connection. | Allow continuation while the request remains valid. |
| `COMPLETED` | Refresh project repository data and show the verified repository/default branch and initial-sync status. | Show a success result without permitting the token to be consumed again. |
| `FAILED` | Explain that access was not granted or verification failed; keep the project unlinked. | Show a safe failure result with no credentials or sensitive GitHub response data. |
| `EXPIRED` | Offer creation of a new request; keep the project unlinked. | Reject continuation and direct the requester to create a new link. |

Malformed, unknown, consumed, expired, or replayed tokens use a non-success state. They must never fall back to normal repository URL linking.

## Frontend routes

- `/github/request-access?token=...` is the public owner/admin landing page. It validates the token before enabling **Continue to GitHub**.
- `/github/access-updated?token=...` is the public result page. It reads the backend-derived result and must not infer success from query-string values supplied by GitHub or the browser.
- The authenticated Research Project repository controls create the request, expose its status/expiry, and refresh the project after successful completion.

Both public pages are intentionally outside the ResearchTrack authentication guard so the repository owner does not need the requester's ResearchTrack account. Possession of the request URL permits only this narrowly scoped, time-bounded authorization flow; it does not grant general project access.

## Backend API contract consumed by the web app

Endpoint names must follow the Gateway's versioning conventions. The feature needs these operations even if compatibility aliases are retained:

| Operation | Authentication | Required behavior |
| --- | --- | --- |
| Create request for a project and repository | ResearchTrack project member | Accept the target repository URL/full name and return an opaque request URL, status, and expiry. |
| Get request status | ResearchTrack project member | Return `PENDING`, `COMPLETED`, `FAILED`, or `EXPIRED` for display. |
| Validate public request token | Public, token-scoped | Return safe project/repository context, status, and expiry; never return secrets or a stored token hash. |
| Continue public request | Public, token-scoped | Return only a backend-generated GitHub authorization URL after atomically validating the request. |
| Read public completion result | Public, token-scoped | Return the backend-verified result; do not accept repository identity from the browser. |

The create request payload must identify both the Research Project and the exact intended repository. A project-only request is insufficient for this story.

## Validation and safety requirements

- Normalize only supported `github.com/{owner}/{repository}` URLs and show the normalized full name before submission.
- Do not determine repository access in browser code.
- Redirect only to an HTTPS GitHub authorization URL returned by the backend. Existing local URL validation should remain defensive, not authoritative.
- Do not place GitHub credentials in frontend environment variables, browser storage, telemetry, or application state.
- Treat callback/query parameters as untrusted display inputs until exchanged and verified by the backend.
- Disable duplicate submits while a mutation is in flight, but rely on backend idempotency for correctness.
- If the owner grants a different repository, denies access, or the request expires, show failure/expiry and leave the active project connection unchanged.
- After `COMPLETED`, invalidate cached project/GitHub data so the verified metadata and initial synchronization state are loaded from the backend.

## Acceptance criteria mapping

| Acceptance criterion | Web responsibility |
| --- | --- |
| AC1 | Collect the exact repository, submit it in project context, and render the returned request as pending. |
| AC2 | Display the backend-issued opaque link and expiry without exposing credentials. |
| AC3 | Carry the opaque token through the public start/result pages; do not reconstruct project context locally. |
| AC4 | Render success only from a backend result that confirms the requested repository. |
| AC5 | Render wrong-repository, denied, expired, and failed outcomes without showing an active connection. |
| AC6 | Refresh project repository/default-branch and synchronization data after completion. |
| AC7 | Reject invalid/replayed links in the UI based on the backend response and provide no link action. |

## QA checklist

- Create a request for a repository as an authorized project member and verify the project and normalized repository shown are correct.
- Open a valid link in a signed-out browser and continue to GitHub.
- Complete authorization for the exact repository and verify the project shows the repository/default branch only after backend confirmation.
- Grant a different repository and confirm that no active connection appears.
- Exercise denial, malformed token, expired token, already-consumed token, and callback replay paths.
- Refresh and repeat the success callback; confirm no duplicate link or duplicate completion is shown.
- Confirm secrets and GitHub tokens are absent from URLs, browser storage, UI error details, and frontend logs.

## Scope boundary

This document covers only the owner-granted access request. It does not bypass GitHub organization policy, grant GitHub roles, accept personal access tokens, or make an ordinary private repository URL an authorization mechanism.
