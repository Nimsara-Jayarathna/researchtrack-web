# SCRUM-70 final submission UI polish

This update applies the final Student and Supervisor submission hierarchy refinements to the supplied SCRUM-70 frontend.

## Collapsed cards

- Requirement identity is clearly labelled.
- Requirement status remains secondary while submission status is visually dominant.
- Version, file name, file size, and deadline use a stable responsive metadata grid instead of a free-flowing sentence.
- Deadlines occupy the far-right metadata column on desktop, including the `No deadline` state.
- Long filenames truncate without moving size/deadline metadata.
- Submitted versions show the historical submitter snapshot and the role held at submission time. A previous Project Leader therefore remains labelled as Project Leader even after leadership changes.
- Project Leaders use the crown treatment; delegated submitters use the member treatment.
- Completed cards stay scan-focused. Document preview remains inside expanded/details views.
- Supervisor cards now use the same accordion and section hierarchy as Student cards. Pending-review cards retain the high-value `Review submission` action.

## Expanded cards

- Requirement constraints are grouped in a compact details block.
- Current-version information is document-first rather than field-heavy.
- Supervisor decision/feedback remains a separate workflow block.
- Administrative Supervisor actions remain secondary and are exposed after expansion.
- Smooth accordion transitions and one-at-a-time expansion behavior are preserved.

## Submission details modal

- Requirement status and submission status are explicitly separated.
- The current version appears once and is not repeated inside history.
- Current-version layout prioritizes filename, size, submitter, submission time, and Preview/Download.
- `V1/V2/V3` are written as `Version 1/2/3` in detailed views.
- `Formal decision`/`Formal review` wording is replaced with `Supervisor decision` and `Review outcome`.
- History is renamed to `Previous versions` and contains only earlier versions.
- When no older version exists, the modal explains that this is the first submitted version.
- Previous-version cards are shorter and use natural reading order rather than a database-style field grid.
- Supervisor feedback is only rendered when feedback exists.

## Validation

- All 466 TypeScript/TSX source files were parsed with the TypeScript compiler API: 0 syntax errors.
- All relative and `@/` imports were checked: 0 missing internal imports.
- Full `npm ci`/CI could not be run in the execution environment because the npm cache does not contain the existing `zxcvbn` dependency required by the repository.
