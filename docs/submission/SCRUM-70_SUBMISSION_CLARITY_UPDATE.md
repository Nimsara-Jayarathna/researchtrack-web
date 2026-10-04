# SCRUM-70 Submission Clarity + Shared Student/Supervisor UX Update

This frontend update applies the same compact card hierarchy to Student and Supervisor submission views and makes submission/version terminology explicit.

## Student cards
- Stronger workflow section shells with icons, descriptions, and counts.
- Compact collapsed cards show Requirement, requirement status, submission status, full `Version N` wording, current filename/size/deadline, and submitter/responsible Student.
- Project Leaders use the existing crown visual language; assigned submitters use the member icon.
- Preview is no longer shown in the collapsed card.
- Submit / Upload revised version remains visible when the logged-in Student has an action to perform.
- Expanded cards contain requirement details, responsible submitter, Supervisor decision/feedback, current version actions, and Submission details.

## Supervisor cards
- Same compact accordion layout and section hierarchy as Student view.
- Requirement and submission status are visually separated.
- Current version uses full `Version N` wording.
- Submitter identity uses the leader/assigned-submitter icon language.
- Review/View submission remains the primary workflow action; requirement management stays secondary.
- Expanded cards contain requirement details, responsibility, current-version metadata, and the next workflow action.

## Submission details modal
- Requirement title is explicitly labelled as `Requirement`.
- Requirement status and submission status are labelled separately.
- `Current submission` is now `Current version`.
- `V1/V2/V3` badges are replaced by `Version 1/2/3` wording in detailed views.
- `Formal decision` is now `Supervisor decision`.
- `Formal review` is now `Review outcome`.
- Current version is shown once only and is no longer duplicated in history.
- `Version history` is now `Previous versions` and contains only earlier versions.
- When there are no earlier versions, the UI shows `No previous versions yet. This is the first submitted version.`
- Historical versions explicitly label Submitted file, Submitted by, Submitted on, Review outcome, and Supervisor feedback.

## Other wording
- Upload success points users to Submission details instead of generic version-history language.
- Requirement editing explains that earlier submitted versions are not changed.
- No internal storage/S3/upload-session terminology is exposed.

## Validation performed in this environment
- Parsed all 466 TS/TSX source files with the TypeScript compiler: 0 syntax errors.
- No backend or database migration changes are required for this UI pass.
