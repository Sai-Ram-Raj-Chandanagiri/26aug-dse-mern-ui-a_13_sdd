# Implementation Plan: Roundtable Platform

**Branch**: `001-roundtable-platform` | **Date**: 2026-10-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-roundtable-platform/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Roundtable is a social platform where users create accounts, form and join public/private
communities, hold threaded discussions, share size-limited resources, and engage via likes,
bookmarks, reports, notifications, and 1-on-1 direct messages. The technical approach is a
two-project MERN-style web application: a Vite + React frontend (Tailwind CSS + shadcn/ui +
Aceternity UI, Zustand, single Axios instance, react-router-dom, react-hot-toast) talking
through the Vite dev-server proxy to an Express + Mongoose/MongoDB backend secured with
JWT-in-httpOnly-cookie sessions and bcryptjs password hashing. All 12 user stories map onto 10
Mongoose collections (User, PasswordResetToken, Community, Membership/Invitation, Discussion,
Resource, Report, Notification/NotificationPreference, Like, Bookmark, Conversation/Message) and
a REST API surface under `/api`, with every list endpoint using fixed-page-size, offset/page-based
pagination and every access-control rule enforced server-side per the constitution.

## Technical Context

**Language/Version**: JavaScript (Node.js 20 LTS) on backend; JavaScript (ES2022) + JSX on
frontend, both run through Vite (no TypeScript — not pinned by the constitution, kept out to
avoid introducing unpinned tooling).

**Primary Dependencies**: Frontend — Vite, React, Tailwind CSS, shadcn/ui, Aceternity UI,
lucide-react, Zustand, Axios, react-router-dom (`BrowserRouter`), react-hot-toast. Backend —
Express, Mongoose, jsonwebtoken, bcryptjs, cookie-parser, nodemailer (console transport only),
multer (server-side file-size-limited upload middleware required to enforce FR-008/FR-017 size
limits — the one addition not explicitly named in the constitution; it is the Express-idiomatic
multipart-upload handler and no alternative upload library is introduced).

**Storage**: MongoDB (single database, Mongoose ODM), one collection per entity in
[data-model.md](./data-model.md).

**Testing**: Backend — integration/contract tests against the Express app and a local/in-memory
MongoDB instance (e.g., `mongodb-memory-server`). Frontend — component/unit tests colocated with
components. Confirmed test framework: Jest for the backend (with `mongodb-memory-server`) and
Jest + React Testing Library for the frontend (documented in research.md); this is a committed
decision, not a NEEDS CLARIFICATION item.

**Target Platform**: Server-rendered-API + SPA web application, deployed as a Node.js server
(Express, serving/alongside a Vite-built static frontend) accessed via modern evergreen browsers
(Chrome, Firefox, Edge, Safari, latest two versions); no native mobile target.

**Project Type**: Web application (frontend + backend split, "Option 2" structure).

**Performance Goals**: Meet spec Success Criteria directly — keyword search/list responses in
under 2 seconds at the assumed scale (see Scale/Scope); no explicit req/s target beyond that
implied by the small/medium scale assumption below.

**Constraints**: Profile picture uploads capped at 5 MB; resource file uploads capped at 10 MB;
all list views MUST use fixed-page-size pagination with explicit page navigation (FR-016,
FR-024, SC-009); JWT MUST live only in an httpOnly, SameSite cookie, never localStorage;
moderation is human-driven only (no ML); real-time (WebSocket) delivery for messaging/
notifications is an optional, non-blocking enhancement.

**Scale/Scope**: Resolves the deferred spec clarification — **MVP/small-to-medium social
platform scale**: on the order of hundreds of communities, low thousands of registered users,
tens of concurrent active sessions at peak, and a typical community having tens to a few
hundred members with hundreds to low thousands of discussion posts/resources over the system's
lifetime. See [research.md](./research.md) §"Scale & Concurrency Assumption" for the full
rationale and the indexing/pagination strategy it drives.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate Check | Status |
|---|---|---|
| I. Security & Identity Integrity | bcryptjs (cost ≥10) for password hashing; JWT issued on login, set via httpOnly+SameSite cookie through cookie-parser, never localStorage; separate single-use `PasswordResetToken` model distinct from session JWT; `email` unique index in Mongoose schema + server-side re-validation; `email` immutability enforced in controller layer (ignored/rejected even if present in request body); `User.role` enum gates all admin routes via Express middleware; no admin seeding; nodemailer console transport only. | PASS (see data-model.md User/PasswordResetToken, contracts/auth.md) |
| II. Accessibility & Inclusive Design | Frontend plan uses shadcn/ui (Radix primitives, inherently keyboard/aria-friendly) + Aceternity UI with `prefers-reduced-motion` respected; single Tailwind design-token theme for WCAG AA contrast; all form feedback planned via `aria-live` + react-hot-toast (toast is supplementary, not the sole channel). | PASS (design-level; enforced during implementation/tasks phase) |
| III. Validation & Feedback Consistency | Every Mongoose schema carries validators; every Express route pairs client validation with server validation as source of truth; API envelope is `{ success, data, message }` uniformly (see contracts/README.md); every negative-path rule in FR-001..FR-033 maps to a named error code in contracts. | PASS |
| IV. Membership & Privacy Boundaries | Community `visibility` field gates all discussion/resource/search reads and writes at the query layer (Mongoose filters, never post-query trimming); Membership document required for discussion/resource writes; Conversation creation requires shared Membership. | PASS (see data-model.md Community/Membership, research.md query patterns) |
| V. State & Data Flow Discipline | Zustand stores scoped per domain (auth, community, discussion, resource, notification, messaging, moderation); single Axios instance with interceptors (baseURL via Vite proxy); uniform `{ success, data, message }` envelope reused by every contract. | PASS |
| VI. Moderation & Content Boundaries | Report hides content only for the reporting user (`Report` + per-user hidden-state, not a global `isDeleted` flag); no ML fields anywhere in data model; Community deletion blocked while unresolved discussions/active members exist, requiring explicit `force`/transfer step. | PASS (see data-model.md Report, Community deletion rules) |
| VII. Scope Discipline (MVP Boundaries) | Conversation/Message schema is strictly 1-on-1, text-only, no attachments/group fields; WebSocket/real-time fields flagged as optional/NEEDS CLARIFICATION, not required by any contract. | PASS |

No violations requiring Complexity Tracking justification at this stage.

## Project Structure

### Documentation (this feature)

```text
specs/001-roundtable-platform/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── README.md
│   ├── auth.md
│   ├── users.md
│   ├── communities.md
│   ├── discussions.md
│   ├── resources.md
│   ├── engagement.md
│   ├── notifications.md
│   ├── moderation.md
│   └── messaging.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/          # Mongoose schemas: User, PasswordResetToken, Community, Membership,
│   │                     Invitation, Discussion, Comment, Resource, Report, Notification,
│   │                     NotificationPreference, Like, Bookmark, Conversation, Message
│   ├── routes/           # Express routers, one per bounded context (auth, users, communities,
│   │                     discussions, resources, engagement, notifications, moderation, messaging)
│   ├── controllers/       # Route handlers (thin), one module per router
│   ├── middleware/        # authRequired, requireAdmin, requireCommunityMember, validateBody,
│   │                     errorHandler, uploadLimits (multer config for avatar/resource size caps)
│   ├── services/          # Business logic (e.g., cascade-delete, invite flow, notification fan-out)
│   ├── utils/             # token signing/verification, pagination helper, response envelope helper
│   └── app.js / server.js # Express app wiring + Mongo connection bootstrap
└── tests/
    ├── contract/         # One suite per contracts/*.md file, asserting request/response shape
    ├── integration/       # Cross-model flows (invite→join→post, report→moderate, etc.)
    └── unit/              # Service/util-level tests

frontend/
├── src/
│   ├── components/       # shadcn/ui + Aceternity UI composed components, organized per domain
│   ├── pages/             # Route-level views (Login, Register, Profile, CommunityDetail,
│   │                     DiscussionThread, ResourceList, AdminDashboard, Inbox, etc.)
│   ├── store/              # Zustand stores: authStore, communityStore, discussionStore,
│   │                     resourceStore, notificationStore, messagingStore, moderationStore
│   ├── api/                # Single configured Axios instance + one client module per domain
│   ├── routes/             # react-router-dom route tree (BrowserRouter)
│   └── lib/                # Shared utils (pagination hook, toast helpers, theme tokens)
└── tests/
    ├── unit/
    └── integration/

vite.config.js            # dev-server proxy: /api -> backend Express server
```

**Structure Decision**: Web application split into `backend/` (Express + Mongoose REST API) and
`frontend/` (Vite + React SPA), matching plan-template "Option 2". This mirrors the constitution's
pinned stack (Vite proxy, single Axios instance, Express/Mongoose backend) and keeps the API
surface independently testable via `backend/tests/contract` against the documents in `contracts/`.

## Complexity Tracking

> No Constitution Check violations were identified; this section is intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
