# Owner-granted GitHub repository access (SCRUM-17 / US-203)

An authenticated owning supervisor requests access to one exact repository. A repository owner or administrator can open the bearer link anonymously and authorize the existing ResearchTrack GitHub App flow. Creating a request does not create a repository connection.

## Requester

In the existing repository modal, choose **Request Access**, enter a GitHub repository URL, and choose **Generate Request**. The existing URL helper normalizes the URL and disables generation for invalid input. The API receives both `projectId` and `repositoryUrl`. The UI displays the generated share link, normalized repository, and expiry and preserves the copy interaction. The requester does not sign into GitHub. The generated-link panel does not poll status automatically; refresh project data to see a completed link.

## Owner

`/github/request-access?token=...` validates the token before enabling **Continue to GitHub**. It displays only the fixed repository, lifecycle, and expiry. There is no repository editor or selector. The public validation API can display terminal `COMPLETED`, `FAILED`, or `EXPIRED` states, but none can continue.

Continue calls the backend and accepts only an HTTPS `github.com/apps/{slug}/installations/new` URL containing a single nonempty `state` parameter. The backend creates server-bound installation state and verifies the installation and exact repository before linking. Browser project/repository values cannot replace this context.

## Result

The existing backend callback redirects requested flows to `/github/access-updated?githubSetup=success|failed&githubFlow=INSTALLATION_REQUESTED&githubRequestId=...` (plus safe tab/error parameters). It does not include the raw owner token.

The anonymous result is informational: a query string alone is not proof of a completed connection. The owner can reopen the original bearer link to check the persisted status. If the original requester is signed in as a supervisor, the page loads the authenticated request status and shows **Repository linked** only for `COMPLETED`. Pending, failed, and expired statuses cannot become linked claims. Project navigation for requested flows comes from this authenticated response. Requested flows never enter unrestricted repository selection, including failed callbacks with injected project parameters.

`INSTALLATION_DIRECT` retains its existing project callback and repository-selection behavior. No second OAuth/PKCE architecture was introduced.

## Actual APIs

The frontend calls these paths; the backend also exposes `/api/v1/github/...` aliases:

| Method | Path | Authentication |
| --- | --- | --- |
| POST | `/api/github/access-requests` | Supervisor and Project Service authorization; body `{ projectId, repositoryUrl }` |
| GET | `/api/github/access-requests/{requestId}` | Authorized original requester |
| GET | `/api/github/access-requests/validate?token=...` | Anonymous bearer |
| POST | `/api/github/access-requests/continue?token=...` | Anonymous bearer |
| GET | `/api/github/access-source/install/callback` | GitHub callback; backend validates stored state |

There is no SCRUM-17 public completion-summary or acknowledgement endpoint. Legacy summary helpers used elsewhere are not the requested-flow completion contract.

## Safety and configuration

- The backend uses 32 CSPRNG bytes for owner tokens and installation state, persists SHA-256 hashes, and enforces `GitHub__StateExpiryMinutes` (1–30 minutes).
- Share and result URLs use trusted `GitHub__FrontendReturnOrigin`; App identity and credentials remain backend-only.
- The deployed `nginx/nginx.conf` disables access logging and caching for `/github/request-access`, and sends `Referrer-Policy: no-referrer`. API diagnostic errors redact token/state/code query values.
- Existing project capacity remains configurable (currently five linked and five enabled repositories). One request targets one repository; it does not reduce global project capacity.
- Successful completion uses the existing Story 11 sync queue and scheduled recovery. No new sync engine was added.

## Automated evidence and manual QA

Frontend tests cover normalized create payloads, invalid URL rejection, owner-link validation/terminal states, trusted redirect checks, requested results without repository selection, forged success versus authenticated terminal status, failed returns with injected project context, direct repository review, and diagnostic token redaction.

Using a non-production GitHub App and disposable private repositories:

1. Generate/copy a request for an exact repository as the owning supervisor.
2. Open it signed out; check repository/expiry, and confirm that the owner cannot edit the target.
3. Authorize the exact repository, then reopen the original link and verify `COMPLETED`. Refresh the project and verify canonical metadata/default branch and a sync attempt.
4. Repeat with only a different repository, denial, expiry, invalid state, replay, and revoked access. Existing connections must remain unchanged.
5. Test another distinct repository within capacity, an exact duplicate, and concurrent attempts at the limit.
6. Confirm direct installation still opens its repository selector. Inspect browser/API/proxy logs for bearer or credential leakage.
