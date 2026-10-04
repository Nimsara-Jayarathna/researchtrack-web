# Submission Review, Feedback, Resubmission, and Version History

This frontend uses the existing private-S3 upload-session flow. Review and resubmission add business-state rules; they do not introduce a second file-upload implementation.

## End-to-end validation

1. Sign in as the owning Supervisor and create an OPEN submission requirement.
2. Sign in as a Student member of the project and submit a valid file. Confirm the submission becomes `PENDING_REVIEW` with Version 1.
3. Sign in as the Supervisor. Open **Submissions**. The item should appear in **Submission Review**.
4. Open the submission and preview/download Version 1. Record `CHANGES_REQUESTED` with feedback.
5. Sign in as the Student. Confirm the feedback is visible and **Upload revised version** is available only while the requirement is OPEN.
6. Upload the revision. Confirm the same S3 upload-session flow creates Version 2 and returns the logical submission to `PENDING_REVIEW`.
7. As Supervisor, open the submission. Confirm Version 2 is CURRENT, Version 1 remains downloadable, and the Version 1 formal review remains attached to Version 1.
8. Approve Version 2. Confirm the submission becomes `APPROVED`, Version 2 is marked APPROVED, and the Student cannot upload again.
9. Repeat with `REJECTED` on another submission and confirm normal resubmission stays locked.
10. Add Student and Supervisor comments. Confirm they are append-only and do not change submission status.

## Concurrency/security checks

- Review with a stale VersionId must return `409 Conflict` and the UI must reload rather than retrying against a different version.
- A Student calling the formal review endpoint must be denied by the Supervisor-only policy.
- A non-member/cross-project user must not list, preview, download, comment on, or mutate the submission.
- Two Students must not be able to create the same next version concurrently.
- `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `CLOSED`, and `ARCHIVED` states must not permit a revised upload.
- `CHANGES_REQUESTED + OPEN` is the only normal resubmission state.
