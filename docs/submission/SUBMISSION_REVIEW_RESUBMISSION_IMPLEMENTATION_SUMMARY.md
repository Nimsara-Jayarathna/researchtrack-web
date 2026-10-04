# ResearchTrack Submission Workflow UX + Review Update

## Scope

The secure direct-S3 submission and immutable-version model is retained. This update removes the separate comments feature and makes the Supervisor/Student submission screens workflow-first rather than CRUD-first.

## Supervisor experience

- One Research Submissions workspace with summary counts and grouped workflow sections.
- Order: Needs review -> Waiting on revision -> Open requirements -> Completed reviews -> Closed/archived.
- Pending-review items expose `Review submission` as the primary action.
- Approved/rejected submissions are intentionally lower in the page.
- Edit/Close/Reopen/Archive/Delete are secondary actions in an overflow menu.
- Requirement status and submission status are visually separated.
- Current version metadata is compact and prominent.
- Submission detail shows the current version, formal review controls, and immutable version history.
- Separate submission comments UI/API usage is removed.

## Requirement editor

- Replaced `datetime-local` with coordinated Due date + Due time controls.
- Added explicit `No deadline` behavior.
- Prevents selection/saving of new past deadlines.
- File types use clearer selectable chips; maximum file size remains explicit.
- When history exists, the UI explains that file constraints apply only to future uploads.

## Student experience

- Order: Changes requested/open unsubmitted first -> Pending review -> Completed -> Closed/archived.
- `CHANGES_REQUESTED` feedback remains prominent and the revised upload action stays primary.
- Preview/download/version history continue to use the existing secure S3 download-grant flow.
- Separate submission comments UI/API usage is removed.

## Backend alignment

The backend now treats formal `SubmissionReview.Feedback` as the authoritative Supervisor message. Existing direct-S3 upload, resubmission, concurrency protection, and immutable versions remain unchanged. A forward migration removes the old `submission_comments` table.
