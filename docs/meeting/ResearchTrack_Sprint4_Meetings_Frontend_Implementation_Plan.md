# ResearchTrack Sprint 4 — Meeting Management
## Frontend Implementation Plan — FINAL IMPLEMENTATION CONTRACT

> **Status:** Frozen implementation plan for Stories 20–23  
> **Target application:** `researchtrack-web`  
> **Current feature:** `src/features/meetings`  
> **Purpose:** This document is the frontend implementation source of truth for Sprint 4 Meeting Management. The existing meeting UI is already substantial; implementation must preserve and connect it rather than rebuild it from scratch.

---

# 1. Why this document exists

The current ResearchTrack Sprint 4 frontend already contains a SuperviseSuite-derived meeting feature with:

```text
src/features/meetings/

components/
    MeetingChannelDeleteConfirmModal.tsx
    MeetingChannelFormModal.tsx
    MeetingChannelsTable.tsx

    MeetingRecordDeleteConfirmModal.tsx
    MeetingRecordDetailsModal.tsx
    MeetingRecordFormModal.tsx
    MeetingRecordsTable.tsx

    MeetingSectionSkeleton.tsx

    SupervisorMeetingChannelsSection.tsx
    SupervisorMeetingRecordsSection.tsx

    StudentMeetingChannelsSection.tsx
    StudentMeetingRecordsSection.tsx

hooks/
    requestModal.ts
    useRequestModalControls.ts
    useSupervisorMeetingChannelsState.ts
    useSupervisorMeetingRecordsState.ts
    useStudentMeetingChannelsState.ts
    useStudentMeetingRecordsState.ts

lib/
    linkOrIdentifier.ts
    platformDisplay.ts
    sortMeetingChannels.ts
    sortMeetingRecords.ts

types.ts
```

There are already component/helper tests.

Therefore the frontend task is not:

```text
delete everything
rebuild Meetings from zero
```

It is:

```text
preserve working UI/business behavior
+
replace legacy role-specific endpoint assumptions
+
connect to canonical MeetingService
+
align validation and authorization behavior
+
finish robust loading/error/cache/testing
```

This document freezes that approach.

---

# 2. Stories covered by this frontend

## Story 20 — Supervisor Meeting Channel Management

Supervisor UX:

```text
View project channels
Add channel
Edit channel
Delete channel
Approve Student PENDING channel
Open/copy URL
Refresh list
See submitter/status
```

---

## Story 21 — Supervisor Meeting History Management

Supervisor UX:

```text
View project meeting history
Record supervision meeting
Open meeting details
Edit record
Delete record
Review Student PENDING records
Approve record
See creator/approval metadata
Refresh history
```

---

## Story 22 — Student Meeting Channel Management

Student UX:

```text
View project channels
Propose new channel
Open/copy link
See PENDING / APPROVED
Refresh
```

Student does not see:

```text
Edit
Delete
Approve
```

---

## Story 23 — Student Meeting History Management

Student UX:

```text
View shared project meeting history
Record meeting
Select optional channel
Open record details
See PENDING / APPROVED
See Supervisor approval metadata
Refresh history
```

Student does not see:

```text
Edit
Delete
Approve
```

---

# 3. Current frontend contract that already exists

Current types already define:

```ts
MeetingChannelPlatform =
  | "GOOGLE_MEET"
  | "ZOOM"
  | "TEAMS"
  | "WHATSAPP"
  | "OTHER";

MeetingChannelStatus =
  | "PENDING"
  | "APPROVED";

MeetingRecordStatus =
  | "PENDING"
  | "APPROVED";
```

Current `MeetingChannel` already expects:

```text
id
projectId
platform
channelName
linkOrIdentifier
addedBy
addedByName
addedByRole
status
approvedBy
approvedByName
approvedAt
createdAt
updatedAt
```

Current `MeetingRecord` already expects:

```text
id
projectId
meetingDate
durationMinutes
discussionSummary
discussionDetails
channelId
addedBy
addedByName
addedByRole
status
approvedBy
approvedByName
approvedAt
createdAt
updatedAt
```

These field names should be preserved unless both frontend and backend contracts are deliberately migrated together.

---

# 4. Non-negotiable frontend decisions

## 4.1 Reuse the existing meeting components

Do not replace working components just to change styling or architecture.

Keep and improve:

```text
MeetingChannelFormModal
MeetingChannelsTable
MeetingChannelDeleteConfirmModal

MeetingRecordFormModal
MeetingRecordsTable
MeetingRecordDetailsModal
MeetingRecordDeleteConfirmModal

SupervisorMeetingChannelsSection
SupervisorMeetingRecordsSection
StudentMeetingChannelsSection
StudentMeetingRecordsSection
```

---

## 4.2 Move meeting networking out of generic role project API

Current code places meeting calls inside:

```text
features/shared/api/createRoleProjectApi.ts
```

and generates legacy-style URLs:

```text
/api/supervisor/projects/{projectId}/meeting-channels
/api/student/projects/{projectId}/meeting-channels

/api/supervisor/projects/{projectId}/meeting-records
/api/student/projects/{projectId}/meeting-records
```

The final MeetingService API is:

```text
/api/v1/projects/{projectId}/meetings/channels
/api/v1/projects/{projectId}/meetings/records
```

Therefore create a meeting-specific shared API module.

Recommended:

```text
src/features/meetings/api/meetingApi.ts
```

The same API client is used by both Supervisor and Student UI.

The authenticated backend role determines permissions.

---

## 4.3 Do not create separate Student/Supervisor API contracts

Do not create:

```text
studentMeetingApi
supervisorMeetingApi
```

with duplicated networking logic.

Use one:

```text
meetingApi
```

and different UI hooks/sections.

Role separation remains in presentation/actions, not duplicate HTTP clients.

---

## 4.4 Server remains authoritative

Frontend permissions improve UX.

They are not security.

The backend must still reject Student management calls.

Frontend must never send:

```text
addedBy
addedByRole
status
approvedBy
approvedByName
approvedAt
```

in create/update payloads.

---

## 4.5 Shared meeting history

Do not build separate screens/data stores called:

```text
SupervisorMeetingHistoryData
StudentMeetingHistoryData
```

Both roles query the same MeetingRecord collection.

The role-specific sections decide which actions appear.

---

# 5. Recommended frontend structure

Target structure:

```text
src/features/meetings/

api/
    meetingApi.ts
    meetingApi.test.ts

components/
    MeetingChannelDeleteConfirmModal.tsx
    MeetingChannelFormModal.tsx
    MeetingChannelsTable.tsx

    MeetingRecordDeleteConfirmModal.tsx
    MeetingRecordDetailsModal.tsx
    MeetingRecordFormModal.tsx
    MeetingRecordsTable.tsx

    MeetingSectionSkeleton.tsx

    SupervisorMeetingChannelsSection.tsx
    SupervisorMeetingRecordsSection.tsx

    StudentMeetingChannelsSection.tsx
    StudentMeetingRecordsSection.tsx

hooks/
    shared/
        useMeetingChannelsData.ts
        useMeetingRecordsData.ts

    requestModal.ts
    useRequestModalControls.ts
    useSupervisorMeetingChannelsState.ts
    useSupervisorMeetingRecordsState.ts
    useStudentMeetingChannelsState.ts
    useStudentMeetingRecordsState.ts

lib/
    linkOrIdentifier.ts
    platformDisplay.ts
    sortMeetingChannels.ts
    sortMeetingRecords.ts
    meetingPermissions.ts

types.ts
```

Do not move files solely for aesthetics if the current folder structure works.

The main required structural change is the dedicated meeting API boundary.

---

# 6. Canonical API paths

Define a helper:

```ts
function meetingBasePath(projectId: string) {
  return `/api/v1/projects/${projectId}/meetings`;
}
```

Use:

```text
GET    {base}/channels
POST   {base}/channels
PATCH  {base}/channels/{channelId}
DELETE {base}/channels/{channelId}
POST   {base}/channels/{channelId}/approve

GET    {base}/records
POST   {base}/records
PATCH  {base}/records/{recordId}
DELETE {base}/records/{recordId}
POST   {base}/records/{recordId}/approve
```

Do not keep role prefix in the final meeting URL.

---

# 7. meetingApi design

Recommended public API:

```ts
export const meetingApi = {
  getProjectMeetingChannels,
  createProjectMeetingChannel,
  updateProjectMeetingChannel,
  deleteProjectMeetingChannel,
  approveProjectMeetingChannel,

  getProjectMeetingRecords,
  createProjectMeetingRecord,
  updateProjectMeetingRecord,
  deleteProjectMeetingRecord,
  approveProjectMeetingRecord,

  invalidateProjectMeetingChannels,
  invalidateProjectMeetingRecords,
  invalidateProjectMeetings,
  clearCache,
};
```

This can preserve the current function names to minimize refactoring.

---

# 8. Cache design

Current `createRoleProjectApi` already maintains project-scoped in-memory caches and in-flight request deduplication.

Preserve those useful behaviors inside `meetingApi`.

Recommended caches:

```ts
cachedMeetingChannelsByProjectId
inFlightMeetingChannelsByProjectId

cachedMeetingRecordsByProjectId
inFlightMeetingRecordsByProjectId
```

Cache key:

```text
projectId
```

because role-specific API responses are not supposed to return different data collections.

Permissions differ in allowed operations, not list data.

---

# 9. Cache invalidation contract

## Channel create

After success:

```text
insert/replace returned channel
sort channels
```

or invalidate and reload.

## Channel update

Replace same ID and sort.

## Channel delete

Remove same ID.

Records do not need to reload only because a channel is deleted if the backend response model does not embed channel objects.

If record UI derives channel labels from a separate channel map, invalidate both where necessary.

## Channel approval

Replace same ID and re-sort.

Because `PENDING -> APPROVED` changes ordering.

---

## MeetingRecord create

Insert/replace and re-sort.

## MeetingRecord update

Replace same ID and re-sort.

## MeetingRecord delete

Remove same ID.

## MeetingRecord approval

Replace same ID and re-sort.

Because `PENDING -> APPROVED` changes ordering.

---

# 10. Session cache clearing

Continue using:

```text
registerSessionCacheClearer
```

Meeting caches must clear on logout/session change.

Do not allow data from one authenticated account to remain in memory for the next account.

---

# 11. Type contract

Keep existing `types.ts` shapes.

Recommended small improvements only:

```ts
export type MeetingActorRole = "SUPERVISOR" | "STUDENT";
```

Then reuse:

```ts
addedByRole: MeetingActorRole;
```

Keep status unions:

```ts
"PENDING" | "APPROVED"
```

Do not add rejected states.

---

# 12. MeetingChannel form rules

Current form should continue collecting:

```text
Platform
Channel name
Channel URL
```

Validation must match backend.

## Platform

Required and one of:

```text
Google Meet
Zoom
Microsoft Teams
WhatsApp
Other
```

Payload values:

```text
GOOGLE_MEET
ZOOM
TEAMS
WHATSAPP
OTHER
```

---

## Channel name

Frontend validation:

```text
required
trim
max 255
```

---

## Link

Current helper `linkOrIdentifier.ts` should implement the final rule:

```text
required
absolute URL
http or https
max 1024
```

The UI label should preferably say:

```text
Meeting link
```

or:

```text
Channel link
```

even if the API field remains `linkOrIdentifier`.

Do not suggest that arbitrary non-URL identifiers are accepted if the backend now requires a URL.

---

# 13. MeetingChannel table

Keep:

```text
Platform
Channel name
Link
Added by
Status
Actions
```

Recommended display behavior:

```text
PENDING badge
APPROVED badge
```

Supervisor actions:

```text
PENDING:
    Approve
    Edit
    Delete
    Open/copy link

APPROVED:
    Edit
    Delete
    Open/copy link
```

Student actions:

```text
Open/copy link
```

No hidden Student approve/edit/delete shortcuts.

---

# 14. Meeting channel sorting

Use existing helper:

```text
sortMeetingChannels.ts
```

Freeze rule:

```text
PENDING first
CreatedAt descending
```

The frontend sort should be defensive even though backend also returns sorted data.

---

# 15. Story 20 — Supervisor Meeting Channel Management UX

Supervisor section should provide:

```text
Meeting Channels
[Add Channel] [Refresh]

table/list
```

## Empty state

Example:

```text
No meeting channels have been added yet.
Add a channel used for research supervision meetings.
```

Supervisor receives the primary action.

---

## Create flow

```text
Add Channel
    ↓
MeetingChannelFormModal
    ↓
validate
    ↓
POST
    ↓
APPROVED response
    ↓
close modal
    ↓
update cache
    ↓
success feedback
```

Expected Supervisor success copy:

```text
Meeting channel added.
```

Do not say "submitted for approval" for Supervisor.

---

## Edit flow

```text
Edit
  ↓
prefilled form
  ↓
PATCH
  ↓
replace cached item
  ↓
success
```

Editing a PENDING Student channel must preserve pending state unless the user explicitly presses Approve separately.

---

## Delete flow

Use existing confirmation modal.

The confirmation should make clear:

- the channel will be removed;
- historical MeetingRecords will remain;
- those records may no longer show a linked channel.

---

## Approve flow

For `PENDING` only:

```text
Approve
   ↓
POST /approve
   ↓
status = APPROVED
   ↓
row reorders
```

Disable duplicate clicks while request is in progress.

---

# 16. Story 22 — Student Meeting Channel Management UX

Student section uses the same channel data.

Student UI:

```text
Meeting Channels
[Propose Channel] [Refresh]
```

or the current equivalent wording.

When Student creates:

```text
POST
  ↓
PENDING
```

Success copy should explain:

```text
Meeting channel submitted for Supervisor approval.
```

Student can see:

```text
PENDING
APPROVED
```

Student cannot see:

```text
Edit
Delete
Approve
```

---

# 17. MeetingRecord form

Current form collects:

```text
Meeting date
Duration minutes
Meeting channel (optional)
Discussion summary
Discussion details (optional)
```

Keep this model.

---

# 18. MeetingRecord form validation

## Meeting date

Required.

Do not add frontend future-date rejection unless backend/business requirements are changed.

Use:

```text
YYYY-MM-DD
```

payload.

---

## Duration

Rules:

```text
required
integer
> 0
```

Do not add a UI-only maximum not enforced by backend.

---

## Discussion summary

Rules:

```text
required
trim
max 1024
```

---

## Discussion details

Rules:

```text
optional
max 5000
```

---

## Channel

Optional.

The selector must only contain channels returned for the same current project.

Do not allow arbitrary channel ID entry in the UI.

---

# 19. Channel selector behavior

The inherited business logic allows a record to reference a same-project channel even if that channel is `PENDING`.

Therefore the selector may show both:

```text
PENDING
APPROVED
```

channels.

Recommended label:

```text
Weekly Zoom Meeting — Approved
Student Proposed Teams Link — Pending
```

This avoids hiding the channel state.

---

# 20. MeetingRecord table

Keep columns similar to:

```text
Meeting date
Duration
Discussion summary
Channel
Added by
Status
Actions
```

Use consistent badge rendering.

Supervisor actions:

```text
View
Approve when PENDING
Edit
Delete
```

Student actions:

```text
View
```

---

# 21. MeetingRecord sorting

Reuse:

```text
sortMeetingRecords.ts
```

Freeze order:

```text
PENDING first
MeetingDate descending
CreatedAt descending
```

This makes pending Student records visible for Supervisor review while retaining a useful history order.

---

# 22. Story 21 — Supervisor Meeting History Management UX

Supervisor section provides:

```text
Meeting History
[Record Meeting] [Refresh]
```

The same table contains:

```text
Supervisor-created APPROVED records
Student-created PENDING records
Student-created APPROVED records
```

Do not split pending Student records into another database-backed page.

A visual "Pending review" grouping/filter is acceptable if desired, but it must use the same MeetingRecord data.

---

# 23. Supervisor Record Meeting flow

```text
Record Meeting
      ↓
MeetingRecordFormModal
      ↓
validate
      ↓
POST
      ↓
APPROVED response
      ↓
update cache
      ↓
success
```

Supervisor success:

```text
Meeting record added.
```

---

# 24. Supervisor review flow

For Student-created `PENDING` row:

```text
View
Approve
Edit
Delete
```

Recommended review sequence:

```text
View
   ↓
MeetingRecordDetailsModal
   ↓
read summary/details/channel/submitter
   ↓
Approve
```

Direct table approval is still acceptable if already implemented.

Do not create a meeting rejection modal.

---

# 25. MeetingRecordDetailsModal

Must display:

```text
Meeting date
Duration
Discussion summary
Discussion details
Channel when available

Added by
Added by role
Created at

Status

Approved by when available
Approved at when available
```

If the linked channel has been deleted:

```text
Channel: —
```

or:

```text
No linked channel
```

The modal must still render normally.

---

# 26. Supervisor edit flow

Supervisor may edit:

```text
meetingDate
durationMinutes
discussionSummary
discussionDetails
channelId
```

Do not make status/creator fields editable.

If editing a Student `PENDING` record:

```text
status stays PENDING
```

until explicit approval.

---

# 27. Supervisor delete flow

Use existing delete confirmation modal.

Flow:

```text
Delete
  ↓
confirm
  ↓
DELETE
  ↓
remove cached record
```

Cancel must make no change.

---

# 28. Story 23 — Student Meeting History Management UX

Student section provides:

```text
Meeting History
[Record Meeting] [Refresh]
```

Student sees the shared project history.

When Student creates a record:

```text
status = PENDING
```

Success copy:

```text
Meeting record submitted for Supervisor approval.
```

Student can open details.

Student cannot:

```text
Approve
Edit
Delete
```

---

# 29. Student status visibility

A Student-submitted row should visibly show:

```text
Pending
```

until approved.

After Supervisor approval and refresh:

```text
Approved
```

The same record ID remains.

Do not create a duplicate "approved copy."

---

# 30. Approval metadata UX

When approved:

```text
Approved by: Supervisor Name
Approved at: Oct 3, 2026 ...
```

When pending:

```text
Awaiting Supervisor approval
```

Do not show empty placeholder approval metadata as though an approval happened.

---

# 31. Role permission utility

Add or centralize a small utility if it simplifies components:

```ts
type MeetingPermissions = {
  canCreateChannel: boolean;
  canManageChannel: boolean;
  canApproveChannel: boolean;
  canCreateRecord: boolean;
  canManageRecord: boolean;
  canApproveRecord: boolean;
};
```

For current Sprint 4:

```text
Supervisor:
  create channel = true
  manage channel = true
  approve channel = true
  create record = true
  manage record = true
  approve record = true

Student:
  create channel = true
  manage channel = false
  approve channel = false
  create record = true
  manage record = false
  approve record = false
```

This is UI behavior only.

Backend remains authoritative.

---

# 32. Shared hooks

The current code has separate role state hooks.

That is acceptable because UI behavior differs.

But common network loading should be factored where useful:

```text
hooks/shared/useMeetingChannelsData.ts
hooks/shared/useMeetingRecordsData.ts
```

Responsibilities:

```text
load
refresh
loading
error
data
```

Role-specific hooks then add:

```text
create
edit
delete
approve
modal state
role-specific success/error copy
```

Do not over-refactor if it destabilizes working UI.

---

# 33. Request modal behavior

Keep:

```text
useRequestModalControls
requestModal
```

for:

```text
confirm delete
request error
success state
```

or equivalent current behavior.

Avoid browser-native `alert()` / `confirm()` if the project already has modal patterns.

---

# 34. Loading behavior

Use the existing:

```text
MeetingSectionSkeleton
```

for initial loads.

Rules:

```text
initial no-data load -> skeleton
manual refresh with existing data -> preserve data and show lightweight refreshing state
mutation -> disable only affected action where practical
```

Do not blank the entire meeting tab during every mutation.

---

# 35. Empty states

## Supervisor channels

```text
No meeting channels have been added.
```

Include add action.

## Student channels

```text
No meeting channels are available yet.
```

Include proposal action if permitted.

## Supervisor records

```text
No meeting records have been added.
```

Include record action.

## Student records

```text
No meeting history is available yet.
```

Include record action.

---

# 36. Error states

Differentiate:

```text
403
You do not have access to this project's meeting information.

404
The meeting item no longer exists.

400
Show validation/business message.

network/server
Could not load/update meeting information. Try again.
```

Do not interpret every failure as an empty list.

If refresh fails while valid cached data exists:

- retain visible data;
- show non-destructive error/refresh feedback.

---

# 37. Link opening / copy behavior

Only render link action for valid http/https values.

Open external link with safe browser behavior:

```text
target="_blank"
rel="noopener noreferrer"
```

Clipboard action should show success feedback.

Do not render raw values into unsafe HTML.

React text rendering should remain escaped.

---

# 38. Date/time presentation

`meetingDate` is a date-only field.

Do not shift it because of local timezone conversion.

For:

```text
createdAt
approvedAt
updatedAt
```

use the existing ResearchTrack date/time formatting utilities.

Avoid inconsistent custom formatting inside meeting components.

---

# 39. API migration strategy

Current calls are inside:

```text
createRoleProjectApi.ts
```

Migration steps:

```text
1. Create features/meetings/api/meetingApi.ts.
2. Move meeting cache/in-flight maps there.
3. Move all meeting functions there.
4. Change paths to canonical /api/v1/projects/.../meetings/...
5. Update Supervisor meeting hooks/sections to import/use meetingApi.
6. Update Student meeting hooks/sections to import/use meetingApi.
7. Remove meeting methods from createRoleProjectApi.ts.
8. Remove duplicated meeting cache clearing there.
9. Register meetingApi.clearCache with session cache clearing.
10. Run full frontend tests.
```

Do not leave both old and new paths active indefinitely.

---

# 40. Transitional compatibility rule

During implementation only, a short transitional wrapper is acceptable:

```ts
supervisorApi.getProjectMeetingChannels = meetingApi.getProjectMeetingChannels
studentApi.getProjectMeetingChannels = meetingApi.getProjectMeetingChannels
```

if this reduces churn.

But the actual HTTP path must be canonical.

Final networking ownership should be `features/meetings/api`.

---

# 41. Story 20 frontend implementation order

## 20.1 Create shared meeting API

Move channel networking/cache first.

## 20.2 Connect Supervisor channel list

Verify current table against backend response.

## 20.3 Connect create/edit/delete

Reuse current form/delete modal.

## 20.4 Connect approve

Ensure row status and ordering update.

## 20.5 Align validation

Make `linkOrIdentifier.ts` match backend exactly.

## 20.6 Complete tests

No Story 20 completion until tests and CI pass.

---

# 42. Story 21 frontend implementation order

## 21.1 Move record networking to meetingApi

Preserve cache behavior.

## 21.2 Connect Supervisor record list

Verify history ordering.

## 21.3 Connect Record Meeting modal

Create -> approved.

## 21.4 Connect details

Render complete metadata.

## 21.5 Connect edit/delete

Reuse current components.

## 21.6 Connect Student-record approve

Pending -> approved and re-sort.

## 21.7 Complete tests

---

# 43. Story 22 frontend implementation order

Most UI already exists.

Complete:

```text
Student channel list uses meetingApi
Student create uses canonical API
success copy says approval required
status badges accurate
no edit/delete/approve controls
refresh works
validation matches backend
```

Do not fork a new Student meeting feature.

---

# 44. Story 23 frontend implementation order

Complete:

```text
Student history uses meetingApi
Student create record
optional channel select
PENDING success state
record details
approval metadata after refresh
no edit/delete/approve actions
```

Reuse existing record components wherever role props already support it.

---

# 45. Existing file migration decisions

## `features/meetings/types.ts`

Keep.

Only small type cleanup if useful.

---

## `MeetingChannelFormModal.tsx`

Keep.

Align max lengths and URL rules.

Preserve create/edit mode behavior.

---

## `MeetingChannelsTable.tsx`

Keep.

Make action visibility explicitly role/permission driven.

Verify pending approval action is Supervisor only.

---

## `MeetingChannelDeleteConfirmModal.tsx`

Keep.

Use Supervisor only.

Update copy if needed to explain historical records are preserved.

---

## `MeetingRecordFormModal.tsx`

Keep.

Align required/optional fields and max lengths.

Ensure channel selector accepts same-project channels.

---

## `MeetingRecordsTable.tsx`

Keep.

Use shared data and role-specific actions.

---

## `MeetingRecordDetailsModal.tsx`

Keep.

Ensure all creator/approval metadata is rendered.

Handle missing channel safely.

---

## `MeetingRecordDeleteConfirmModal.tsx`

Keep.

Supervisor only.

---

## `sortMeetingChannels.ts`

Keep.

Verify:

```text
PENDING first
CreatedAt DESC
```

---

## `sortMeetingRecords.ts`

Keep.

Verify:

```text
PENDING first
MeetingDate DESC
CreatedAt DESC
```

---

## `linkOrIdentifier.ts`

Keep/refine.

Make it the frontend implementation of the frozen URL contract.

---

## `platformDisplay.ts`

Keep.

Map server platform constants to readable UI labels.

---

# 46. Frontend test strategy

Do not rely only on manual QA.

Existing tests should be preserved and extended.

---

# 47. MeetingChannelFormModal tests

Test:

```text
renders create form
renders edit values
platform required
channel name required
channel name max length
URL required
invalid URL rejected
non-http/https rejected
valid http URL accepted
valid https URL accepted
submit disabled during request
```

---

# 48. MeetingChannelsTable tests

Test Supervisor:

```text
pending badge
approved badge
approve action on pending
no approve on approved
edit action
delete action
open/copy link
```

Test Student:

```text
pending badge
approved badge
no approve
no edit
no delete
open/copy link
```

---

# 49. MeetingRecordFormModal tests

Test:

```text
date required
duration required
duration > 0
summary required
summary max 1024
details max 5000
channel optional
channel selection payload
create mode
edit mode
```

---

# 50. MeetingRecordsTable tests

Test Supervisor:

```text
view
approve pending
edit
delete
```

Test Student:

```text
view
no approve
no edit
no delete
```

Also test:

```text
pending before approved
date ordering
missing channel
```

---

# 51. MeetingRecordDetailsModal tests

Test:

```text
summary
details
date
duration
channel
added by
role
created at
pending state
approved by
approved at
missing channel
```

---

# 52. meetingApi tests

Mock `apiClient`.

Test exact paths:

```text
GET /api/v1/projects/{id}/meetings/channels
POST /api/v1/projects/{id}/meetings/channels
PATCH /api/v1/projects/{id}/meetings/channels/{id}
DELETE /api/v1/projects/{id}/meetings/channels/{id}
POST /api/v1/projects/{id}/meetings/channels/{id}/approve

GET /api/v1/projects/{id}/meetings/records
POST /api/v1/projects/{id}/meetings/records
PATCH /api/v1/projects/{id}/meetings/records/{id}
DELETE /api/v1/projects/{id}/meetings/records/{id}
POST /api/v1/projects/{id}/meetings/records/{id}/approve
```

Also test:

```text
cache reuse
force refresh
in-flight request reuse
cache mutation after create
cache mutation after update
cache remove after delete
re-sort after approve
clearCache
```

---

# 53. Role section tests

## SupervisorMeetingChannelsSection

Test:

```text
initial load
skeleton
empty
create
edit
delete
approve
refresh
request failure
```

## StudentMeetingChannelsSection

Test:

```text
initial load
empty
propose
pending success
refresh
no management actions
```

## SupervisorMeetingRecordsSection

Test:

```text
history load
create approved record
view details
edit
delete
approve Student record
refresh
```

## StudentMeetingRecordsSection

Test:

```text
history load
create pending record
view details
refresh approval state
no management actions
```

---

# 54. Frontend CI gate

Before the meeting implementation is considered complete:

```text
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

or the repository's existing:

```text
npm run ci
```

All existing Sprint 1–3 frontend tests must continue to pass.

Do not accept meeting code that passes only new tests while breaking GitHub/Jira/project flows.

---

# 55. QA/manual test matrix

## Supervisor channel

```text
create
edit
delete
approve Student channel
repeat approve handling
invalid form
refresh
```

## Student channel

```text
view
propose
pending state
Supervisor approve
refresh -> approved
no manager controls
```

## Supervisor history

```text
record meeting
record with channel
record without channel
view details
edit
delete
approve Student record
```

## Student history

```text
record meeting
pending state
view details
Supervisor approve
refresh -> approved
```

## Shared edge cases

```text
channel deleted after historical record exists
network failure with cached data
403
404 after stale row
very long allowed text
empty data
rapid double click
route between projects
logout/login cache clearing
```

---

# 56. UX wording

Recommended terminology:

```text
Meeting Channels
Meeting History
Record Meeting
Add Channel / Propose Channel
Pending
Approved
Awaiting Supervisor approval
Approve
Edit
Delete
Refresh
```

Avoid introducing:

```text
Reject
Request Changes
Resubmit
Version
```

inside Meeting Management.

Those belong to Submission Management.

---

# 57. Supervisor tab layout

Recommended Supervisor Meetings area:

```text
Meetings
│
├── Meeting Channels
│      [Add Channel] [Refresh]
│      channel table
│
└── Meeting History
       [Record Meeting] [Refresh]
       meeting record table
```

Pending Student items are visually obvious through status badges and pending-first ordering.

---

# 58. Student tab layout

Recommended Student Meetings area:

```text
Meetings
│
├── Meeting Channels
│      [Propose Channel] [Refresh]
│      channel table
│
└── Meeting History
       [Record Meeting] [Refresh]
       meeting record table
```

Students see no Supervisor management controls.

---

# 59. Responsive behavior

Existing tables must remain usable at smaller widths.

Where the existing design already uses responsive wrappers/cards, preserve them.

Minimum expectations:

```text
no horizontal page overflow from long link
long discussion summary does not break layout
action buttons remain reachable
modals fit mobile viewport
```

Do not introduce a separate mobile feature architecture.

---

# 60. Accessibility

Preserve project accessibility patterns:

```text
form labels linked to inputs
buttons have clear accessible names
modal focus behavior
status not communicated by color alone
external-link actions named clearly
validation errors associated with fields where possible
```

Pending/Approved should always have text labels.

---

# 61. Security rules visible from frontend

Frontend must:

```text
never send actor ID as authoritative input
never send addedByRole
never send status
never send approvedBy
never trust hidden buttons as authorization
never render meeting links as HTML
never persist meeting data across logout without cache clear
```

All requests use the authenticated ResearchTrack API client.

---

# 62. Race-condition behavior

## Approve double click

Disable approve action while request is active.

If a repeated request reaches backend and returns business error:

- show controlled message;
- refresh the row/list.

## Delete stale row

If backend returns not found:

- remove/reload stale data;
- do not crash.

## Edit stale row

Show controlled failure and refresh if appropriate.

---

# 63. Request cancellation / route change

If current API infrastructure supports cancellation:

- avoid updating state after unmount;
- avoid showing Project A results after navigation to Project B.

Existing `projectId` cache keys and hooks must respect route changes.

---

# 64. No optimistic approval status

Do not visually mark an item `APPROVED` before backend success.

Approval must use:

```text
request
  ↓
successful response
  ↓
replace cached row
  ↓
re-sort
```

Same principle for destructive delete.

---

# 65. No separate "history sync"

Meeting data is first-party ResearchTrack database state.

Do not implement:

```text
scheduled meeting synchronization
manual sync job
freshness timestamps like Jira
```

The Refresh button is simply:

```text
forceRefresh current MeetingService query
```

---

# 66. Story 20 frontend Definition of Done

```text
[ ] canonical channel API is used.
[ ] Supervisor channel list loads.
[ ] Supervisor create works.
[ ] Supervisor edit works.
[ ] Supervisor delete works.
[ ] Supervisor approve works.
[ ] Student PENDING rows are visible.
[ ] validation matches backend.
[ ] loading/empty/error states work.
[ ] component/API tests pass.
[ ] frontend CI passes.
```

---

# 67. Story 21 frontend Definition of Done

```text
[ ] canonical MeetingRecord API is used.
[ ] Supervisor history loads.
[ ] Supervisor record-meeting flow works.
[ ] detail modal works.
[ ] edit works.
[ ] delete works.
[ ] Student pending record approval works.
[ ] approval metadata renders.
[ ] missing deleted channel does not break history.
[ ] sorting is correct.
[ ] tests and CI pass.
```

---

# 68. Story 22 frontend Definition of Done

```text
[ ] Student channels use canonical API.
[ ] Student can view channels.
[ ] Student can propose a channel.
[ ] response appears PENDING.
[ ] approved state appears after Supervisor action + refresh.
[ ] no edit/delete/approve controls are exposed.
[ ] validation is correct.
[ ] tests and CI pass.
```

---

# 69. Story 23 frontend Definition of Done

```text
[ ] Student history uses canonical API.
[ ] Student can view shared project history.
[ ] Student can create MeetingRecord.
[ ] optional channel works.
[ ] created record appears PENDING.
[ ] approval status updates after refresh.
[ ] details show creator/approval metadata.
[ ] no edit/delete/approve controls are exposed.
[ ] tests and CI pass.
```

---

# 70. Full frontend implementation sequence

```text
STEP 1
Create shared meetingApi
move cache/network code
switch canonical paths

STEP 2
Story 20 Supervisor channels
wire + verify

STEP 3
Story 21 Supervisor records/history
wire + verify

STEP 4
Story 22 Student channels
wire shared API + permissions

STEP 5
Story 23 Student history
wire shared API + permissions

STEP 6
remove legacy role-prefixed meeting networking

STEP 7
complete tests

STEP 8
npm run ci

STEP 9
manual cross-role regression
```

---

# 71. Frozen frontend business flow

```text
                   SHARED MEETING API
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
       Meeting Channels           Meeting Records
              │                         │
       ┌──────┴──────┐           ┌─────┴─────┐
       │             │           │           │
Supervisor UI    Student UI  Supervisor UI Student UI
manage/approve    view/add    manage/review  view/add
```

The frontend roles are different experiences over the same backend data.

---

# 72. Implementation guardrails

During implementation:

1. Do not rebuild the existing meeting components unnecessarily.
2. Do not retain role-prefixed HTTP endpoints as the final architecture.
3. Do not create duplicate Supervisor/Student networking clients.
4. Do not add meeting rejection/resubmission states.
5. Do not add a separate history dataset.
6. Do not make Student management controls merely "disabled"; omit them from Student UI.
7. Do not rely on hidden controls for authorization.
8. Do not add frontend-only validation rules that conflict with backend.
9. Do not allow a deleted channel reference to crash record history.
10. Do not clear useful existing data during a transient refresh failure.
11. Do not bypass the existing ResearchTrack API client/session/cache conventions.
12. Do not declare Stories 20–23 complete until `npm run ci` passes.

This README is the frontend source of truth for Sprint 4 Meeting Management.
