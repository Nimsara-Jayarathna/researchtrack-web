# SCRUM-179 Jira UI refinement

- Reduced shared Jira view vertical spacing.
- Kept the Jira secondary navigation centered.
- Jira hierarchy now starts collapsed; search still reveals matching ancestry.
- Added restrained root/hierarchy row treatment while retaining issue-type badges and connectors.
- Added deterministic contributor identity chips reused by Issues and Workload.
- Added shared semantic Jira metric cards: neutral total, cool To Do/assigned, blue active, amber unassigned, green Done/completed.
- Reused existing BlockingState and GitHub-style SyncStatusBadge/LastSyncedBadge presentation.
- Current Sprint status cards use the same semantic metric system and no longer duplicate the sync timestamp in a separate Snapshot field.
- Workload contributor bars continue to use status colors, while contributor chips identify people, keeping color meanings separate.
