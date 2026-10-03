# ResearchTrack Sprint 4 — Research Submission Management
## Frontend Implementation Plan — FINAL IMPLEMENTATION CONTRACT

**Status:** FINAL / implementation source of truth  
**Scope:** Stories 24–27 — Submission half of Sprint 4  
**Target frontend:** `researchtrack-web`  
**Storage interaction:** browser uploads/downloads directly to Azure Blob Storage using short-lived backend-issued SAS URLs  
**Backend API root:** `/api/v1/projects/{projectId}/submissions/...`

---

# 1. Why this document exists

This document freezes the frontend design for Sprint 4 Research Submission Management.

When implementation starts, do not redesign the feature from scratch. Implement this plan against the backend contract defined in:

```text
ResearchTrack_Sprint4_Submissions_Backend_Implementation_Plan.md
```

The frontend should reuse useful patterns already present in ResearchTrack while replacing the old generic `Project Files` experience with a true `Submissions` experience.

---

# 2. Current frontend baseline

The current ResearchTrack web base already contains an older SuperviseSuite-derived project-files implementation:

```text
src/features/projectfiles/
    api/studentFilesApi.ts
    api/supervisorFilesApi.ts
    components/FileList.tsx
    components/FileListItem.tsx
    components/FileListSkeleton.tsx
    components/UploadFileModal.tsx
    components/DeleteConfirmModal.tsx
    hooks/useStudentProjectFiles.ts
    hooks/useSupervisorProjectFiles.ts
    hooks/useUploadFileModalState.ts
    lib/uploadFileUtils.ts
    types.ts
```

Student project details currently render:

```text
StudentFilesTabSection
```

Supervisor project details currently render:

```text
FilesTabSection
```

The old feature uses role-specific API routes such as:

```text
/api/student/projects/{projectId}/files
/api/supervisor/projects/{projectId}/files
```

and follows an S3-style contract:

```text
presignedUrl
s3Key
confirmUpload(...)
```

The useful UX pieces should be reused/refactored, but the final Sprint 4 feature must stop behaving like a generic shared file repository.

---

# 3. Final stories covered by this frontend

## Story 24 — Supervisor Submission Requirement Management

Supervisor creates and manages required deliverables.

## Story 25 — Student Research Document Submission

Student sees requirements and uploads the initial file directly to Azure Blob Storage.

## Story 26 — Supervisor Submission Review & Feedback

Supervisor opens submitted versions, previews/downloads them, comments, and formally approves / requests changes / rejects.

## Story 27 — Student Resubmission & Version History

Student reads feedback, uploads the next version only when changes are requested, and views complete version/review history.

---

# 4. Non-negotiable frontend decisions

## 4.1 Replace the generic Files experience with Submissions

The final user-facing tab should be `Submissions`, not `Project Files`.

Internally migrate toward:

```text
src/features/submissions/
```

Do not keep two competing active user experiences (`projectfiles` and `submissions`) once Sprint 4 is complete.

## 4.2 Use canonical project submission APIs

Do not create new role-prefixed backend contracts.

Use:

```text
/api/v1/projects/{projectId}/submissions/...
```

The server determines authorization from JWT + project access.

## 4.3 Direct upload remains browser → Azure

Do not POST document bytes through `apiClient` / Gateway.

Use:

```text
Frontend → SubmissionService: request upload session
Frontend → Azure Blob: upload bytes
Frontend → SubmissionService: complete upload session
```

## 4.4 The frontend never stores a SAS URL long-term

SAS URLs are ephemeral operation values.

Do not place them into persistent project state/local storage.

## 4.5 Version history is immutable

The UI must clearly represent V1/V2/V3 as separate immutable versions.

Never make resubmission look like “replace existing file”.

---

# 5. Recommended feature structure

```text
src/features/submissions/

api/
    submissionApi.ts

types.ts

components/
    SubmissionStatusBadge.tsx
    RequirementStatusBadge.tsx
    SubmissionRequirementCard.tsx
    SubmissionRequirementList.tsx
    SubmissionRequirementFormModal.tsx
    SubmissionRequirementActionMenu.tsx

    StudentSubmissionSection.tsx
    SubmissionUploadModal.tsx
    SubmissionUploadProgress.tsx
    PdfLocalPreview.tsx

    SupervisorSubmissionReviewSection.tsx
    SubmissionReviewQueue.tsx
    SubmissionReviewModal.tsx

    SubmissionDetailsModal.tsx
    SubmissionVersionHistory.tsx
    SubmissionVersionItem.tsx
    SubmissionComments.tsx

    SubmissionListSkeleton.tsx

hooks/
    useSubmissionRequirements.ts
    useSupervisorSubmissionRequirements.ts
    useStudentSubmissions.ts
    useSupervisorSubmissions.ts
    useSubmissionDetail.ts
    useSubmissionUpload.ts
    useSubmissionReview.ts
    useSubmissionComments.ts

lib/
    submissionFileValidation.ts
    azureBlobUpload.ts
    submissionStatus.ts
    submissionPermissions.ts
    submissionDates.ts
```

Use existing ResearchTrack shared UI primitives:

- `SectionCard`,
- `Button`,
- `IconActionButton`,
- `RequestStateModal`,
- `ErrorState`,
- existing skeleton conventions,
- existing API error model.

---

# 6. Migration strategy from `projectfiles`

Do not delete the old implementation before the new feature is wired.

Recommended sequence:

1. create new `features/submissions`,
2. reuse/refactor generic file helpers that remain valid,
3. connect Student submissions UI,
4. connect Supervisor requirements/review UI,
5. update project-details tabs/types,
6. update tests/mocks,
7. remove obsolete `features/projectfiles` imports,
8. delete old projectfiles feature after no production code references it.

Reusable concepts from old code:

```text
bytesToHumanSize
extension detection
MIME mapping
drag/drop modal patterns
RequestStateModal usage
skeleton patterns
safe download interaction
```

Concepts to remove/rename:

```text
ProjectFile
s3Key
presignedUrl as S3-specific terminology
studentFilesApi
supervisorFilesApi
FileList as generic final UX
Supervisor direct project-file deletion
```

---

# 7. Tab migration

Current tab keys include `files`.

Preferred low-risk migration:

### Phase A

Keep internal tab key `files` temporarily if changing routing/state everywhere is risky, but change visible label/component to `Submissions`.

### Phase B

When all project-detail types/tests are updated, rename internal tab key to:

```text
submissions
```

Final state should use `submissions` consistently if practical within Sprint 4.

Update:

- Supervisor project detail tab definitions,
- Student project detail tab definitions,
- project detail response types,
- mock project data,
- page tests,
- tab tests,
- navigation labels.

---

# 8. TypeScript domain types

Recommended core types:

```ts
export type SubmissionRequirementStatus = "OPEN" | "CLOSED" | "ARCHIVED";

export type ResearchSubmissionStatus =
  | "PENDING_REVIEW"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "REJECTED";

export type SubmissionReviewDecision =
  | "APPROVED"
  | "CHANGES_REQUESTED"
  | "REJECTED";
```

Requirement:

```ts
export type SubmissionRequirement = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  allowedFileTypes: string[];
  maxFileSizeBytes: number;
  status: SubmissionRequirementStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string | null;
  submissionSummary: SubmissionSummary | null;
};
```

Version:

```ts
export type SubmissionVersion = {
  id: string;
  submissionId: string;
  versionNumber: number;
  originalFileName: string;
  fileExtension: string;
  contentType: string;
  fileSizeBytes: number;
  uploadedBy: string;
  uploadedByName: string;
  submissionNote: string | null;
  submittedAt: string;
  isLate: boolean;
  review: SubmissionReview | null;
  isCurrent: boolean;
  isApproved: boolean;
};
```

Submission:

```ts
export type ResearchSubmission = {
  id: string;
  projectId: string;
  requirementId: string;
  status: ResearchSubmissionStatus;
  versionCount: number;
  currentVersionId: string;
  approvedVersionId: string | null;
  lastSubmittedAt: string;
  approvedAt: string | null;
  requirement: SubmissionRequirementSummary;
  versions: SubmissionVersion[];
};
```

Upload session:

```ts
export type SubmissionUploadSession = {
  uploadSessionId: string;
  uploadUrl: string;
  expiresAt: string;
  versionNumber: number;
  maxFileSizeBytes: number;
};
```

Never call Azure blob identity `s3Key` in final TypeScript.

---

# 9. API client design

Create one API module:

```text
src/features/submissions/api/submissionApi.ts
```

Do not split role APIs unless there is a strong code-organization reason. The backend path is shared.

Recommended functions:

```ts
listRequirements(projectId)
getRequirement(projectId, requirementId)
createRequirement(projectId, payload)
updateRequirement(projectId, requirementId, payload)
closeRequirement(projectId, requirementId)
reopenRequirement(projectId, requirementId)
archiveRequirement(projectId, requirementId)
deleteRequirement(projectId, requirementId)

listSubmissions(projectId)
getSubmission(projectId, submissionId)

createUploadSession(projectId, requirementId, payload)
completeUploadSession(projectId, uploadSessionId)

getVersionDownloadUrl(projectId, submissionId, versionId, disposition)

reviewSubmission(projectId, submissionId, payload)

listComments(projectId, submissionId)
addComment(projectId, submissionId, payload)
```

The `apiClient` is used only for ResearchTrack JSON APIs.

The Azure file upload itself is separate.

---

# 10. Azure browser upload implementation

Recommended implementation: add the Azure Blob JavaScript client library and use the SAS URL returned by SubmissionService.

New dependency:

```text
@azure/storage-blob
```

Implement:

```text
lib/azureBlobUpload.ts
```

Conceptual flow:

```ts
const client = new BlockBlobClient(uploadUrl);

await client.uploadData(file, {
  blobHTTPHeaders: {
    blobContentType: contentType,
  },
  onProgress: ({ loadedBytes }) => {
    // update progress percentage
  },
});
```

Why this is preferred over the current plain `fetch` helper:

- Azure-specific headers/behavior are handled cleanly,
- upload progress is available,
- the existing UI can display actual progress,
- storage code remains isolated from React components.

If the team chooses plain `fetch` instead, it must correctly set Azure Blob requirements such as `x-ms-blob-type: BlockBlob`; do not silently reuse the old S3 PUT helper unchanged.

---

# 11. Upload UI state machine

`useSubmissionUpload` should have explicit stages:

```text
IDLE
FILE_SELECTED
VALIDATING
REQUESTING_UPLOAD_SESSION
UPLOADING_TO_AZURE
CONFIRMING_UPLOAD
SUCCESS
ERROR
```

UI should communicate the real stage.

Example:

```text
Preparing secure upload...
Uploading to storage... 42%
Finalizing submission...
Submission received and pending Supervisor review.
```

Do not show `Upload complete` immediately after Azure PUT; the business submission is only complete after the backend `/complete` call succeeds.

---

# 12. File selection validation

Reuse/refactor the existing helpers from `projectfiles/lib/uploadFileUtils.ts`.

Validate before requesting an upload session:

- non-empty file,
- filename length,
- requirement max size,
- requirement allowed extension,
- supported MIME/extension.

Backend remains authoritative.

The frontend error should be human readable, e.g.:

```text
This requirement accepts PDF or DOCX files up to 20 MB.
```

---

# 13. Local preview before upload

For PDF only:

1. create an object URL with `URL.createObjectURL(file)`,
2. render preview in a controlled modal/panel,
3. revoke object URL on file change/modal close/unmount.

For DOCX/PPTX/ZIP:

show:

```text
filename
extension/type
file size
```

Do not attempt to implement a complex Office document renderer in Sprint 4.

---

# 14. Story 24 — Supervisor Submission Requirement Management UX

Supervisor `Submissions` tab should begin with requirement management.

Recommended section:

```text
Submission Requirements

[ + New Requirement ]   [ Refresh ]
```

Requirement card/table fields:

```text
Title
Description summary
Due date
Allowed file types
Maximum size
Status
Submission status
Last submitted
Actions
```

Actions by status/history:

```text
OPEN
  Edit
  Close
  Archive
  Delete only if no submission exists

CLOSED
  Edit where permitted
  Reopen
  Archive

ARCHIVED
  View only
```

Form fields:

```text
Title *
Instructions / Description
Due Date / Time optional
Allowed File Types * multi-select
Maximum File Size *
```

Validation must mirror backend.

---

# 15. Story 24 Supervisor states

## Empty

```text
No submission requirements yet.
Create the first requirement for this research project.
```

## Populated

Show OPEN first, then CLOSED, then ARCHIVED, with sensible due-date ordering.

## Loading

Use a submission-specific skeleton, not a full blocking page spinner.

## Error

Use existing `ErrorState` / request-modal conventions.

---

# 16. Story 25 — Student Research Document Submission UX

Student Submissions tab shows requirements as the main navigation surface.

Example:

```text
Final Thesis
Due: Nov 30, 2026
Allowed: PDF, DOCX
Maximum: 20 MB
Status: NOT SUBMITTED

[ Submit Document ]
```

For requirement with submission:

```text
Final Thesis
Current status: PENDING REVIEW
Current version: V1
Submitted: Oct 27, 2026

[ View Details ]
```

Do not show a generic free-floating `Upload file` button unrelated to a requirement.

Every upload starts from a specific requirement.

---

# 17. Student action matrix

Derived UI actions:

| Requirement / Submission state | Student action |
|---|---|
| OPEN + no submission | Submit Document |
| OPEN + PENDING_REVIEW | View only / comment |
| OPEN + CHANGES_REQUESTED | Upload Revised Version |
| OPEN + APPROVED | View/download only |
| OPEN + REJECTED | View/download only |
| CLOSED | No upload |
| ARCHIVED | Historical view only |

Frontend may calculate button visibility, but backend remains authoritative.

---

# 18. Submission upload modal

Replace the generic `UploadFileModal` with submission-aware `SubmissionUploadModal`.

Header includes:

```text
Submit Final Thesis
or
Resubmit Final Thesis — Version 2
```

Show requirement constraints:

```text
Allowed: PDF, DOCX
Maximum: 20 MB
Due: Nov 30, 2026
```

Inputs:

```text
File *
Submission note optional
```

The user must not manually choose version number.

Version comes from backend upload session.

---

# 19. Student upload sequence

```text
1. choose file
2. local validation
3. optional preview
4. create upload session via SubmissionService
5. receive blob-scoped SAS URL
6. upload directly to Azure with progress
7. call complete endpoint
8. receive updated submission
9. refresh/invalidate requirement/submission state
10. show PENDING_REVIEW success message
```

If Azure upload succeeds but complete fails:

- do not show successful submission,
- show `Finalization failed` state,
- allow retry of complete if upload session is still valid,
- do not automatically re-upload the entire file unless backend says session is unusable.

The upload hook should retain `uploadSessionId` during the operation to support this.

---

# 20. Story 26 — Supervisor review queue

Supervisor needs an obvious review surface, not just a list of all versions.

Recommended section:

```text
Pending Review
```

Cards/rows:

```text
Requirement title
Current version (V2)
Submitted by
Submitted date/time
Late badge if applicable
File name/type/size
```

Actions:

```text
Preview
Download
Review
```

Sort pending review first, oldest pending submission first or newest first according to UX choice; use one deterministic rule and test it.

Recommended: oldest pending first so waiting submissions are not buried.

---

# 21. Supervisor review modal

The review modal/detail panel should include:

```text
Requirement information
Current status
Current version
Filename
Uploader
Submitted at
Late status
Submission note
PDF preview when supported
Previous versions
Previous formal feedback
Comments
```

Formal actions:

```text
Approve
Request Changes
Reject
```

Decision input behavior:

### Approve

Feedback optional.

Require confirmation because approval locks the submission.

### Request Changes

Feedback required.

Button disabled until non-blank feedback passes validation.

### Reject

Feedback required.

Require stronger confirmation because rejection locks normal resubmission.

Do not represent comments as formal feedback.

---

# 22. Review concurrency behavior

The review request sends `versionId`.

If backend returns 409 because a stale version/state was reviewed:

1. close/disable stale action,
2. refresh submission detail,
3. show a message such as:

```text
This submission changed before your review was saved. The latest version has been loaded.
```

Do not blindly retry a formal review against a different version.

---

# 23. Story 26 comments UX

Comments are a lightweight conversation.

Component:

```text
SubmissionComments
```

Display:

```text
Author
Role badge
Timestamp
Comment
optional related version
```

Input:

```text
Add a comment...
[Send]
```

Append comment after API success.

Comments are not editable/deletable in Sprint 4.

Use max-length indicator if appropriate.

---

# 24. Story 27 — Student changes-requested state

When Supervisor requests changes, surface it prominently.

Example:

```text
CHANGES REQUESTED

Supervisor feedback
"Please update Chapter 3 methodology and correct the diagram numbering."

Reviewed Oct 28, 2026

[ Upload Revised Version ]
```

Do not make the Student search version history to discover that action is required.

---

# 25. Version history component

Create:

```text
SubmissionVersionHistory
SubmissionVersionItem
```

Newest version first.

Each version displays:

```text
Version number
CURRENT marker
APPROVED marker when applicable
Original filename
File type
File size
Uploaded by
Submitted time
Late badge
Submission note
Formal review decision
Supervisor feedback
Reviewed by / time
Download
Preview for PDF
```

Example:

```text
V3   CURRENT · APPROVED
final-thesis.pdf
Uploaded by Student A · Oct 30
Supervisor: Approved

V2
thesis-v2.pdf
Supervisor: Changes Requested
"Correct methodology..."

V1
thesis-draft.pdf
Supervisor: Changes Requested
"Restructure Chapter 2..."
```

Old versions remain downloadable according to authorization.

---

# 26. Status badges

Create one central mapping in `submissionStatus.ts`.

Required labels:

```text
NOT SUBMITTED
PENDING REVIEW
CHANGES REQUESTED
APPROVED
REJECTED
OPEN
CLOSED
ARCHIVED
LATE
```

Avoid defining different colors/wording independently in multiple components.

Use the existing design system badge styles where possible.

---

# 27. Download / preview behavior

Never attempt to build a permanent Azure URL from storage account/container/blob identifiers.

Always request:

```text
GET .../versions/{versionId}/download-url
```

For PDF preview:

```text
disposition=inline
```

Open in controlled preview/new tab as appropriate.

For explicit download:

```text
disposition=attachment
```

The URL is short-lived; if it expires, request a new one.

---

# 28. Frontend data/cache approach

Follow the existing ResearchTrack hook/cache patterns rather than adding a new state library solely for Sprint 4.

Recommended cached units:

```text
requirements by projectId
submission list by projectId
submission detail by projectId + submissionId
comments by submissionId
```

After mutations:

### Requirement create/update/status change

Refresh requirements.

### Upload complete

Refresh requirements + submissions + affected detail.

### Formal review

Refresh pending review list + affected detail + requirement summary.

### Comment add

Append/refetch comments only.

Do not clear useful cached data during a transient refresh failure.

---

# 29. Loading behavior

Keep the universal ResearchTrack loading philosophy already established.

Use:

- skeletons for initial data loading,
- inline button progress for mutations,
- `RequestStateModal` where an explicit long-running mutation state benefits the user,
- upload progress UI for Azure transfer.

Do not replace project content with a blocking modal for normal background reads.

---

# 30. Error behavior

Distinguish:

```text
validation error
forbidden/project access error
conflict/state changed
Azure upload failed
upload finalization failed
expired upload session
backend unavailable
```

Examples:

```text
This requirement is closed and no longer accepts uploads.

A newer submission state exists. Refreshing the submission.

The file reached storage, but ResearchTrack could not finalize the submission. Retry finalization.
```

Do not show raw Azure error XML/SDK messages to users.

---

# 31. Submission permissions utility

Create a small pure helper so action visibility is deterministic and testable.

Example:

```text
canCreateInitialSubmission(requirement, submission)
canResubmit(requirement, submission)
canReview(role, submission)
canManageRequirement(role, requirement)
canDeleteRequirement(requirement)
```

This helper is UX logic only; it does not replace server authorization.

---

# 32. Story 24 frontend implementation order

## 24.1 Create submission domain types/API client

Build shared type/API foundation.

## 24.2 Build Supervisor requirement list/card

Render requirement state and submission summary.

## 24.3 Build requirement create/edit modal

Implement validation, allowed types, max size, due date.

## 24.4 Add close/reopen/archive/delete actions

Use confirmations for destructive/locking actions.

## 24.5 Tests

Cover empty/populated/loading/error/permission/status behavior.

---

# 33. Story 25 frontend implementation order

## 25.1 Replace Student generic files view

Create `StudentSubmissionSection` based on requirements.

## 25.2 Refactor validation helpers

Move reusable helpers from projectfiles to submissions.

## 25.3 Add Azure upload client

Add `@azure/storage-blob` and `azureBlobUpload.ts`.

## 25.4 Build SubmissionUploadModal

Add drag/drop, requirement constraints, note and PDF preview.

## 25.5 Build `useSubmissionUpload`

Implement upload state machine and progress.

## 25.6 Refresh submission state after completion

Show PENDING_REVIEW result.

---

# 34. Story 26 frontend implementation order

## 26.1 Build Supervisor pending-review list

Pending review is prominent.

## 26.2 Build submission detail/review modal

Current + previous versions, preview/download.

## 26.3 Add formal decision controls

Approve / Request Changes / Reject with correct feedback validation.

## 26.4 Add comments

Shared `SubmissionComments` component.

## 26.5 Conflict/failure behavior

Handle stale version review 409 safely.

---

# 35. Story 27 frontend implementation order

## 27.1 Add changes-requested Student callout

Surface Supervisor feedback and Resubmit action.

## 27.2 Reuse upload modal in resubmit mode

Backend assigns V2/V3 number.

## 27.3 Build version history

Render all versions and reviews.

## 27.4 Add approved/rejected locked states

No upload controls.

## 27.5 Complete history/download/comment tests

---

# 36. Test strategy

The existing frontend uses Vitest + React Testing Library. Continue using that stack.

## Type/API tests

Test API path construction and request payload mapping where existing project style supports it.

## Validation helper tests

Cover:

- file size,
- extension,
- MIME,
- requirement-specific type set,
- filename length,
- bytes display.

## Upload hook tests

Mock API + Azure upload helper.

Scenarios:

- V1 happy path,
- Azure upload failure,
- complete failure after Azure success,
- progress updates,
- expired session,
- duplicate submit disabled,
- resubmission happy path.

## Supervisor requirement component tests

- empty,
- create,
- edit,
- close/reopen,
- archive,
- delete allowed,
- delete disabled/conflict when history exists.

## Review component tests

- approve,
- changes requires feedback,
- reject requires feedback,
- stale 409 refresh behavior,
- pending list,
- preview/download action.

## Student component tests

- NOT_SUBMITTED shows Submit,
- PENDING_REVIEW hides upload,
- CHANGES_REQUESTED shows Resubmit + feedback,
- APPROVED locked,
- REJECTED locked,
- CLOSED/ARCHIVED no upload.

## History tests

- V1/V2/V3 ordering,
- current marker,
- approved marker,
- late marker,
- review feedback,
- old version download.

---

# 37. Frontend CI gate

The completed feature must pass the existing frontend CI command:

```text
npm run ci
```

which currently runs:

```text
format:check
lint
typecheck
tests
build
```

Do not weaken CI rules to make the feature pass.

---

# 38. Dependency and bundle consideration

Adding `@azure/storage-blob` increases frontend bundle size.

Keep all Azure-specific usage inside `azureBlobUpload.ts`.

If bundle impact becomes a concern, lazy-load the uploader code only when the upload modal is used.

Do not spread Azure SDK imports across UI components.

---

# 39. Security rules visible from frontend

The frontend must never:

- request or display Azure account keys,
- store SAS URLs in localStorage/sessionStorage,
- log SAS URLs in production console logging,
- construct another user's blob name,
- rely on UI button visibility as authorization,
- submit a Supervisor review from Student UI,
- allow arbitrary blob URLs entered by users.

---

# 40. UX rules that must remain consistent

1. `PENDING_REVIEW` means waiting for Supervisor; Student cannot upload another version.
2. `CHANGES_REQUESTED` means Student action is required; show feedback prominently.
3. `APPROVED` means locked accepted version; show exactly which version was approved.
4. `REJECTED` means locked; do not display Resubmit.
5. Late submission is a badge, not an upload blocker when the requirement remains OPEN.
6. CLOSED/ARCHIVED requirement disables upload.
7. Comments never silently change status.
8. Old versions never disappear when a new version is uploaded.

---

# 41. Recommended Supervisor tab layout

```text
SUBMISSIONS

[ Submission Requirements ]
  Final Thesis        OPEN      Due Nov 30   PENDING REVIEW
  Presentation        OPEN      Due Dec 05   NOT SUBMITTED
  Proposal            CLOSED                 APPROVED

[ Pending Review ]
  Final Thesis · V2
  Student A · submitted 2h ago
  [Preview] [Download] [Review]

[ Recent Submission Activity ] optional/simple
```

Do not overload Sprint 4 with analytics not required by the stories.

---

# 42. Recommended Student tab layout

```text
SUBMISSIONS

Final Thesis
Due Nov 30
PDF/DOCX · max 20 MB
Status: CHANGES REQUESTED
Supervisor feedback: ...
[Upload Revised Version]
[View History]

Presentation
Due Dec 05
Status: NOT SUBMITTED
[Submit Document]
```

Requirement cards are more useful than one generic file list.

---

# 43. Exact old-code migration decisions

## `features/projectfiles/types.ts`

Replace with submission domain types. Do not keep `ProjectFile` as the final domain model.

## `studentFilesApi.ts` / `supervisorFilesApi.ts`

Replace with shared `submissionApi.ts` using canonical routes.

## `UploadFileModal.tsx`

Reuse UX patterns, but replace with `SubmissionUploadModal.tsx` bound to a requirement and upload session.

## `useUploadFileModalState.ts`

Refactor into `useSubmissionUpload.ts`; add explicit Azure/finalization stages.

## `uploadFileUtils.ts`

Move generic validation helpers to `submissionFileValidation.ts`; replace `uploadFileToPresignedUrl` with Azure-specific upload abstraction.

## `FileList.tsx` / `FileListItem.tsx`

Do not use as final top-level UI. Replace with requirement cards and version history.

## Supervisor `FilesTabSection.tsx`

Replace with Supervisor Submissions tab/section containing requirements + review queue.

## `StudentFilesTabSection.tsx`

Replace with Student Submissions section containing requirement-driven actions.

---

# 44. Backend contract assumptions the frontend must not change

The frontend implementation must preserve:

```text
one logical submission per project+requirement
immutable versions
review applies to versionId
only CHANGES_REQUESTED permits resubmit
APPROVED and REJECTED are locked
requirement CLOSED/ARCHIVED prevents upload
SAS is temporary
complete endpoint is required after Azure upload
```

If a UI idea conflicts with these rules, change the UI, not the backend business rules.

---

# 45. Final frontend completion definition

The frontend portion is complete when this complete path works cleanly:

```text
Supervisor opens Submissions
        ↓
creates Final Thesis requirement
        ↓
Student sees requirement
        ↓
selects PDF
        ↓
sees local validation/preview
        ↓
secure upload session requested
        ↓
Azure upload progress shown
        ↓
backend finalization completes
        ↓
Student sees PENDING REVIEW
        ↓
Supervisor sees it in Pending Review
        ↓
previews/downloads current version
        ↓
requests changes with formal feedback
        ↓
Student immediately sees feedback + Resubmit
        ↓
uploads V2
        ↓
V1 stays in history
        ↓
Supervisor approves V2
        ↓
Student sees APPROVED + V2 approved marker
        ↓
both roles can inspect complete version/review/comment history
```

If this behavior is preserved and `npm run ci` passes, the frontend remains aligned with the finalized Sprint 4 submission design.
