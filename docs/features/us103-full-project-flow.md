# US-103 Frontend — Full Project Creation and Role-Aware Reads

The existing three-step Supervisor creation experience is preserved:

1. Project basics.
2. Registered student assignment and optional leader selection.
3. Initial milestones.

US-103 network alignment:

- Student directory search → `GET /api/v1/users/students?query=...`.
- Supervisor create → `POST /api/v1/projects` with the complete existing payload.
- Supervisor list/read → `GET /api/v1/projects` and `GET /api/v1/projects/{id}`.
- Student list/read → the same two Project resource endpoints; ProjectService filters by STUDENT membership.

Supervisor and Student pages/cards/details remain separate view layers. Only the shared backend Project resource is unified. Later mutation/integration calls are intentionally left on their existing contracts until their owning stories are migrated.
