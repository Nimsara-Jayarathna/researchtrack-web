# Student submission S3 test flow

This frontend is wired to the SubmissionService routes under:

`/api/v1/projects/{projectId}/submissions`

## Preconditions

1. Run Gateway, AuthService, ProjectService, SubmissionService and the local MySQL dependencies.
2. Apply the SubmissionService migrations.
3. Configure the private S3 bucket and SubmissionService `Storage__*` values.
4. S3 CORS must allow the actual frontend origin, normally `http://localhost:5173`, for `PUT`, `GET`, and `HEAD` with the required request headers.
5. The Supervisor must create an `OPEN` submission requirement for the same Research Project.
6. Log in with a Student who belongs to that project.

## Student test

1. Open the Student project details page.
2. Select the **Submissions** tab. The URL/tab value remains `files` for route compatibility.
3. Confirm the OPEN requirement appears with accepted extensions, maximum size, and due date.
4. Select **Submit file**.
5. Choose a valid file. PDFs receive a local preview before upload.
6. Optionally add a submission note.
7. Select **Submit file** in the modal.
8. Confirm the UI progresses through:
   - Creating secure upload session
   - Uploading directly to S3
   - Verifying and recording submission
9. After completion, confirm the card shows:
   - `PENDING REVIEW`
   - Version 1
   - original filename and stored file size
   - uploader and submitted time
   - late marker when appropriate
   - Preview and Download actions
10. Refresh the page and confirm the same submission is loaded from the backend.

## Expected storage behavior

The browser PUTs bytes to the short-lived `pending/{uploadSessionId}` S3 object. SubmissionService verifies that object and promotes it server-side to the immutable version key before writing the completed V1 database records. The UI never receives AWS access-key credentials.

## Failure checks

- Empty, oversized, unsupported-extension, and MIME-mismatched files are blocked before upload.
- A CLOSED or ARCHIVED requirement has no submit action.
- After V1 succeeds, there is no delete, replace, or second-upload action in this story.
- If the direct S3 PUT fails after a session is created, the modal retains the same signed upload session and exposes **Retry S3 upload**.
- If S3 succeeds but backend finalization fails, the modal exposes **Retry finalization** and does not upload the file again.
- If the signed URL expires, **Reset expired upload** asks the backend to expire/release the session and then allows a fresh submission attempt.

Review decisions and revised V2/V3 uploads intentionally remain outside this story.
