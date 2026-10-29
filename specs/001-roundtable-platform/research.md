# Phase 0 Research: Roundtable Platform

## Scale & Concurrency Assumption (resolves deferred spec clarification)

- **Decision**: Target an **MVP / small-to-medium scale** social platform:
  - Registered users: low thousands (e.g., up to ~5,000) over the system's early lifetime.
  - Communities: hundreds (e.g., up to ~500), each with tens to a few hundred members.
  - Concurrent active sessions at peak: tens (e.g., up to ~200), not thousands.
  - Content volume per community: hundreds to low thousands of discussion posts/comments and
    resources over time; no single community expected to exceed ~10,000 discussion documents
    or ~5,000 resource documents in the MVP horizon.
  - Messaging: mostly sparse, low-volume 1-on-1 conversations (tens of messages per conversation
    typical), consistent with the "optional real-time" scope decision.
- **Rationale**: The spec explicitly defers this to planning and describes a general-purpose
  community/discussion/resource-sharing app with no stated enterprise, multi-tenant, or
  high-throughput requirement. The constitution's MVP Scope Discipline principle (VII) and the
  simplicity of the pinned stack (single MongoDB instance, no caching/queueing layer, no
  sharding) both imply a small/medium deployment target rather than a large-scale one. This
  assumption keeps indexing, pagination, and query design simple (single-node Mongo, in-memory
  working sets) while still being safe to re-scale later if adoption grows.
- **Alternatives considered**:
  - *Enterprise scale* (millions of users, sharded Mongo, caching layer, search engine like
    Elasticsearch) — rejected: not implied anywhere in spec/constitution, would require
    introducing unpinned infrastructure (Redis, Elasticsearch, message queues), violating
    Scope Discipline (Principle VII) and the pinned Technology Constraints.
  - *Single-tenant/demo scale* (tens of users, no pagination needed) — rejected: the spec
    explicitly mandates fixed-page-size pagination for all list views (FR-016, FR-024, SC-009),
    which only makes sense if list sizes can meaningfully exceed one page; a demo-only scale
    assumption would under-specify the pagination/indexing work needed.
- **Resulting pragmatic MongoDB strategy**:
  - All list-returning queries (community search, discussion listing, resource listing,
    notifications, conversation/message history, moderation queue) use `skip`/`limit`
    (page-number-based) pagination with a fixed page size (default 20 items/page; configurable
    per-endpoint constant, never per-request from the client beyond page number).
  - Every paginated query is backed by a compound index covering its filter + sort fields, so
    `skip`/`limit` at this scale (bounded collections, low thousands of documents) remains fast
    without needing cursor/keyset pagination. If a community's content volume grows far beyond
    the MVP assumption in a future phase, keyset pagination can be introduced without changing
    the response contract.
  - Indexes (see data-model.md for full per-model list):
    - `User.email` — unique.
    - `Community.name` — unique; `Community.visibility` + `Community.name` (text) for search.
    - `Membership` — compound unique `(user, community)`; secondary index on `community` for
      member listing and on `user` for "my communities".
    - `Discussion`/`Resource` — compound `(community, createdAt desc)` for paginated listing;
      text index on title/body/tags for keyword search, scoped by a `community` filter.
    - `Notification` — compound `(user, createdAt desc)`; `(user, readAt)` for unread counts.
    - `Message` — compound `(conversation, createdAt asc)` for chronological paging.
    - `Report` — compound `(status, createdAt desc)` for the admin moderation dashboard.
  - Full-text search uses MongoDB's built-in `$text` index rather than an external search
    engine, consistent with the small/medium scale assumption and the constitution's prohibition
    on introducing unpinned infrastructure.

## Testing Framework (resolved — confirmed)

- **Decision (confirmed)**: Jest is the committed test framework for both backend (with
  `mongodb-memory-server` for isolated integration/contract tests) and frontend (Jest + React
  Testing Library). Backend and frontend `package.json` devDependencies and Jest config files
  are established during Phase 1 Setup.
- **Rationale**: Neither `constitution.md` nor `spec.md` pins a test framework. Jest is the
  de-facto default for Express + React/Vite projects and integrates cleanly with the pinned
  stack (Mongoose, Axios, Zustand) without adding meaningfully new tooling risk.
- **Alternatives considered**: Vitest (Vite-native, would be a reasonable alternative for the
  frontend since Vite is already pinned) — considered and rejected in favour of a single,
  uniform runner across backend and frontend. **This item is now resolved; no NEEDS
  CLARIFICATION remains.**

## File Upload Handling

- **Decision**: Use `multer` with `limits.fileSize` set per-route (5 MB for avatar uploads,
  10 MB for resource file uploads) and in-memory or local-disk storage (no S3/cloud storage
  integration, consistent with MVP scope); reject oversized uploads with a 413-style
  application error mapped to the `{ success: false, message }` envelope (FR-008, FR-017).
- **Rationale**: Express has no built-in multipart parser; `multer` is the standard, minimal,
  Express-idiomatic middleware for this and does not conflict with any pinned technology.
- **Alternatives considered**: `busboy` directly (lower-level, more boilerplate, rejected for
  unnecessary complexity); cloud object storage (S3/Cloudinary) — rejected as out of scope for
  MVP and not implied by spec/constitution; storing files as base64 in Mongo documents —
  rejected as poor practice for 5–10 MB payloads and bad for query/index performance.

## Notification Delivery Pattern

- **Decision**: Notifications are persisted as `Notification` documents created synchronously
  within the same request that creates the triggering Discussion/Resource (fan-out-on-write to
  all active `Membership` records for that community, excluding the author), read via a
  paginated `GET /api/notifications` endpoint. No message queue or WebSocket push is introduced;
  react-hot-toast is reserved for transient, client-local feedback only (per Principle V), while
  the persisted Notification entity is a separate, polled/page-loaded domain object.
- **Rationale**: Matches the small/medium scale assumption (fan-out cost per post stays bounded
  by community member counts of tens to a few hundred) and Principle VII's framing of real-time
  delivery as optional/non-blocking.
- **Alternatives considered**: Background job queue (e.g., BullMQ/Redis) for fan-out — rejected
  as unpinned infrastructure not justified at this scale; WebSocket push for instant delivery —
  explicitly optional per constitution, deferred past MVP.

## Admin Hard-Delete Cascade Strategy

- **Decision**: Admin deletion of a Community cascades (hard-delete) its Memberships,
  Invitations, Discussions, Comments, Resources, Likes, Bookmarks, and Reports scoped to that
  community, executed via a single backend service function wrapped in a Mongoose session/
  transaction. **Deployment requirement (confirmed)**: a replica-set MongoDB topology is
  required for this project, and `mongodb-memory-server` is started with `replSet: true` in the
  test harness so Mongoose session/transaction usage in cascade-delete flows is exercised in
  tests exactly as in deployment; the same service blocks deletion up-front if unresolved
  (non-dismissed, non-removed) discussions/reports exist, per FR-019, unless an explicit admin
  override flag is passed. Admin deletion of a User cascades their authored content the same
  way, and is blocked up-front (409-style error) if the user owns/administers any Community
  until ownership is transferred or explicitly forfeited (also FR-019).
- **Rationale**: Directly implements the resolved spec clarification on hard-delete + cascade +
  ownership-transfer gating; using a single service function keeps the cascade logic centralized
  and testable rather than scattered across controllers.
- **Alternatives considered**: Soft-delete (`isDeleted` flag) — rejected because the spec
  clarification explicitly calls for hard delete; best-effort cascade without transactions —
  considered and **explicitly rejected** for this project as risking partial deletes; standalone
  (non-replica-set) MongoDB deployments are therefore not supported, which resolves the former
  deployment-environment NEEDS CLARIFICATION.
