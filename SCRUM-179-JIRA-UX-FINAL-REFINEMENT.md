# SCRUM-179 Jira UX final refinement

- Fixed `SYNCED` Jira status normalization so shared GitHub-style sync badge renders `Synced` instead of `Status unavailable`.
- Reduced Jira section and metric-card vertical spacing.
- Added issue-type hierarchy filter: All, Epic, Story, Task, Bug, Subtask.
- Filters/search preserve ancestor context and auto-open matching hierarchy paths.
- Entire expandable issue row toggles expansion; chevron remains keyboard/button accessible.
- Strengthened restrained hierarchy surfaces: Epic and direct child levels are visually distinguishable without competing with workflow status colors.
- Kept hierarchy collapsed by default for large Jira projects.
- Preserved deterministic contributor identity chips and semantic status/metric colors.
