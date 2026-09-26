# SCRUM-210 / BUG-302 UI/UX stabilization

## Root causes addressed

- Jira empty states were implemented independently as plain text blocks while GitHub used a richer empty-state layout, producing inconsistent height, spacing, hierarchy, and role-specific presentation.
- The Jira issue modal used a max-height shell but kept all content, including timestamps, inside one scrolling region. Long descriptions could therefore push bottom metadata out of immediate view and made the modal feel content-sized instead of structurally stable.
- Project creation relied on native `required` attributes without showing required markers in the visual labels.
- Project tabs shared a component but lacked explicit tab semantics/focus treatment and used loose spacing that could look inconsistent as the available role-specific tab set changed.

## Stabilized implementation

- Added shared `IntegrationEmptyState` and reused it for GitHub and Jira empty states.
- Supervisor Jira empty state now exposes the existing connect flow directly; student Jira retains permission-safe guidance with the same visual layout.
- Reworked Jira issue details into a responsive fixed-height flex dialog (`min(90vh, 48rem)`) with a fixed header, independently scrollable body, and persistent metadata footer. Escape-to-close was added.
- Added visible accessible required markers to all fields that are actually `required`: title, summary, batch, and semester.
- Reduced the summary textarea from five to four rows and constrained the basics card to a deliberate maximum content width.
- Improved the character-limit state at the maximum value.
- Added tablist/tab semantics, selected state, keyboard focus styling, and consistent minimum tab height without changing role permissions or adding unauthorized tabs.

## Important scope decision

The supervisor has an `Integrations` tab and the student does not. This is permission/role behavior, not a visual defect. The fix intentionally preserves this functional difference while keeping the shared tab styling consistent.

## Project Basics academic period controls

The Project Basics step now requires deliberate academic-period selection instead of pre-filling editable text values.

- `Batch` uses the shared Select control and exposes five years starting at the browser's current year (`currentYear` through `currentYear + 4`).
- `Semester` uses the shared Select control and only permits `Semester 1` or `Semester 2`.
- Neither value is selected by default; the placeholders are `Select batch year` and `Select semester`.
- Step 1 remains disabled until title, summary, a valid batch year, and a valid semester are all selected.
- Semester is intentionally not inferred from the current date. Academic calendars can vary, so the supervisor must explicitly choose the intended semester.
- The year list is generated rather than hard-coded, so future years roll forward automatically without a source change.
