# Project API call standardization

This refinement makes project feature requests route-owned instead of eager.

- Project overview no longer fetches meeting channels or meeting records only to render analytics.
- Student overview no longer fetches repository detail data; repository calls are enabled by the GitHub route.
- Files remain owned by the Files tab and use embedded project file data when available.
- Meeting channels/records remain owned by the Meetings tab and its active inner tab.
- Shared meeting hooks now auto-attempt initial loading once per project. A failed GET stays in the error state instead of creating an automatic retry loop. Explicit Retry/Refresh remains available.
- Existing API-level meeting request de-duplication/cache behavior remains intact.

The blocking request model was not changed.
