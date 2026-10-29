---
description: "Deferred, opt-in testing strategy for Roundtable Platform"
---

# Test Strategy: Roundtable Platform

**Status**: Deferred / opt-in. Nothing here blocks implementation in [tasks.md](./tasks.md).
**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [contracts/](./contracts/)
**Scope**: Backend contract + integration suites, frontend component/flow suites, and Success-Criteria timing checks.

A developer may execute any single suite below in isolation. Suites are addressed by ID (`TS-US1` … `TS-US12`, `TS-X*`) and map 1:1 to the user stories in [spec.md](./spec.md).

---

## Design Rules (why this is not redundant)

The naive approach re-exercises login, community creation, and membership setup inside every story's tests. That is slow, brittle, and makes a single auth regression fail 40 suites. These five rules eliminate that.

### Rule 1 — Test each behavior at exactly one level

| Behavior | Tested once in | Never re-tested in |
|---|---|---|
| Register / login / session issuance | `TS-US1` | Any other suite |
| Response envelope `{ success, data, message }` | `TS-X1` | Per-endpoint suites |
| Pagination metadata shape | `TS-X2` | Per-endpoint suites |
| Auth-required gating (401 when anonymous) | `TS-X3` | Per-endpoint suites |
| Admin-role gating (403 for non-admin) | `TS-X3` | `TS-US6`, `TS-US11` |
| Private-community non-member gating (404) | `TS-X3` | `TS-US4`, `TS-US8` |

Story suites assert **only their own domain logic** — the cross-cutting matrix suites own the rest.

### Rule 2 — Reach state via factories, never via the UI/API of another story

Prerequisite state is created by direct model writes in `backend/tests/factories/`, not by calling the endpoints of a different user story.

- `TS-US4` does **not** call `POST /api/auth/login` or `POST /api/communities`. It calls `makeUser()`, `makeCommunity()`, `makeMembership()`, and `authAgent(user)`.
- `authAgent(user)` signs a JWT and attaches it as an httpOnly cookie on a `supertest` agent directly. Login is never re-exercised outside `TS-US1`.

This is what makes every suite genuinely isolated **and** keeps `TS-US1` the single point of failure for auth regressions.

### Rule 3 — Compound arrangement, isolated assertion

Within one suite, share a single expensive `beforeAll` arrangement across many cheap assertions. Do not share arrangement *across* suites.

> Example: `TS-US8` seeds one community with 25 discussions and 25 mixed-type resources **once**, then runs keyword-match, type-filter, pagination-boundary, and empty-result assertions against that single fixture.

Each assertion remains independently diagnosable because it asserts on a distinct response, not on leftover mutated state.

### Rule 4 — Mutating assertions get a scoped reset, not a global one

Read-only assertions share the suite-level fixture. Mutating assertions (`like`, `report`, `delete`, `bookmark`) run inside a `beforeEach` that resets only the collection they touch. Avoid dropping the whole database between tests.

### Rule 5 — Parametrize negative paths

Every error code in [contracts/](./contracts/) is asserted via a table-driven test, not a hand-written block per code.

```js
test.each([
  ['EMAIL_IN_USE',       () => post('/api/auth/register', existingEmailPayload), 409],
  ['INVALID_CREDENTIALS',() => post('/api/auth/login',     badPasswordPayload),  401],
])('%s returns the documented envelope and status', async (code, call, status) => { /* ... */ });
```

---

## Phase T0 — Harness (required before any suite)

- [ ] TH-01 Add Jest + `supertest` + `mongodb-memory-server` to `backend/package.json` devDependencies; config in `backend/jest.config.js`
- [ ] TH-02 Start `mongodb-memory-server` with `replSet: true` in `backend/tests/setup.js` so `adminService` transactions work
- [ ] TH-03 Implement `backend/tests/factories/index.js`: `makeUser({ role })`, `makeCommunity({ visibility, owner })`, `makeMembership(user, community)`, `makeDiscussion()`, `makeResource()`, `makeConversation()`
- [ ] TH-04 Implement `authAgent(user)` in `backend/tests/helpers/authAgent.js` — signs a JWT and returns a cookie-bearing `supertest` agent, bypassing the login endpoint
- [ ] TH-05 Implement `expectEnvelope(res, { success, code })` assertion helper in `backend/tests/helpers/assertions.js`
- [ ] TH-06 Add Jest + React Testing Library (+ `@testing-library/jest-dom`, `jest-environment-jsdom`, `babel-jest`) to `frontend/package.json`; config in `frontend/jest.config.js`, setup in `frontend/tests/setupTests.js`
- [ ] TH-07 Implement `renderWithProviders(ui, { authState })` in `frontend/tests/helpers/renderWithProviders.jsx` — wraps router, toast provider, and a pre-seeded Zustand auth store so no component test performs a login

**Checkpoint**: Any suite below can now be run standalone via `npm test -- <suite-file>`.

---

## Phase T1 — Cross-Cutting Matrix Suites

Run these once. They absorb all the gating/shape assertions that would otherwise be duplicated across every story.

- [ ] TS-X1 Response-envelope conformance: every mounted route returns `{ success, data, message }` and never leaks a raw stack trace — `backend/tests/crosscutting/envelope.test.js`
- [ ] TS-X2 Pagination conformance: table-driven across all list endpoints, asserting `{ items, page, pageSize, totalItems, totalPages }` and page-boundary behavior — `backend/tests/crosscutting/pagination.test.js`
- [ ] TS-X3 Access-control matrix: table-driven `(route, method, actor) → expectedStatus` covering anonymous→401, non-admin→403, private-community non-member→404 — `backend/tests/crosscutting/accessControl.test.js`

> After `TS-X3` exists, no story suite should contain an "unauthenticated user is rejected" test.

---

## Phase T2 — Per-Story Suites

Each suite is self-contained and assumes only Phase T0. Run any subset.

### TS-US1 — Account Creation & Login (P1)

The **only** suite that exercises the real auth endpoints end to end.

- [ ] Register succeeds; verification code is emitted to console transport
- [ ] Parametrized negatives: `EMAIL_IN_USE`, `INVALID_CREDENTIALS`, malformed email, weak password
- [ ] Login issues an httpOnly + SameSite cookie; `GET /api/auth/session` hydrates
- [ ] Password reset: issue → redeem → old password rejected
- [ ] Reset-code negatives (compound, one fixture): expired code, already-used code, unknown code
- File: `backend/tests/stories/us1_auth.test.js`

### TS-US2 — Profile Management (P1)

- [ ] `PATCH /api/users/me` updates editable fields; `email` and `role` are silently stripped (assert persisted doc, not just response)
- [ ] Avatar upload succeeds under 5 MB; parametrized negatives: `OVERSIZED_UPLOAD`, `INVALID_FILE_TYPE`
- [ ] `GET /api/users/me/activity` aggregates seeded activity
- Fixture: one `makeUser()` + `authAgent`; no login call
- File: `backend/tests/stories/us2_profile.test.js`

### TS-US3 — Community Creation & Invitations (P1)

- [ ] Create public and private community; owner auto-becomes member; `memberCount === 1`
- [ ] Parametrized negatives: `NAME_TAKEN`, `ALREADY_MEMBER`, non-owner `FORBIDDEN` on update
- [ ] Invitation lifecycle in one compound flow: invite → pending visible to invitee → accept → membership exists → re-invite rejected
- [ ] Decline path leaves no membership
- File: `backend/tests/stories/us3_communities.test.js`

### TS-US4 — Joining & Discussions (P1)

- [ ] Public join succeeds; private join without invite → `PRIVATE_COMMUNITY_INVITE_REQUIRED`
- [ ] Member posts discussion and reply; non-member → `NOT_A_MEMBER`
- [ ] Community keyword search returns public communities + the actor's own private memberships, filtered **in-query** (assert via a seeded private community the actor is not in)
- Fixture: `makeCommunity()` ×2 (one public, one private) + `makeMembership` — no US3 endpoint calls
- File: `backend/tests/stories/us4_discussions.test.js`

### TS-US5 — Sharing Resources (P2)

- [ ] Share link / article / video / file variants in one parametrized block
- [ ] Negatives: `NOT_A_MEMBER`, `OVERSIZED_UPLOAD` (>10 MB)
- [ ] Second member can list and read the shared resource
- File: `backend/tests/stories/us5_resources.test.js`

### TS-US6 — Admin Management (P2)

Assumes `TS-X3` already covers "non-admin is denied" — this suite tests admin *behavior*, not admin *gating*.

- [ ] Delete community with no unresolved discussions → cascades memberships, discussions, resources
- [ ] Delete community with unresolved discussions → `UNRESOLVED_DISCUSSIONS`; `?force=true` overrides
- [ ] Delete user who owns a community → `OWNERSHIP_TRANSFER_REQUIRED`; transfer then delete succeeds
- [ ] Admin update of a user strips `email`
- [ ] Transaction rollback: force a mid-cascade failure and assert no partial deletion
- File: `backend/tests/stories/us6_admin.test.js`

### TS-US8 — Search & Filter (P2)

- [ ] Single compound fixture: 25 discussions + 25 mixed-type resources in one community
- [ ] Keyword match on discussions and resources
- [ ] `type=` filter returns only that type
- [ ] Empty query result returns an empty `items` array (not an error) for the "no results" UI state
- [ ] Private-community non-member receives 404 (reaffirmed here only because it is the *search* code path, distinct from `TS-X3`'s listing path)
- File: `backend/tests/stories/us8_search.test.js`

### TS-US11 — Reporting (P2)

- [ ] Report a discussion, a resource, and a comment (parametrized over `targetType`)
- [ ] Negatives: `DUPLICATE_REPORT`, `SELF_REPORT`
- [ ] Per-reporter hiding: reporter's listing excludes the item; a second member's listing still includes it (the key non-global-hiding assertion)
- [ ] Admin dismiss restores reporter visibility; admin remove-content hides it for everyone
- File: `backend/tests/stories/us11_reporting.test.js`

### TS-US7 — Notifications (P3)

- [ ] Fan-out on discussion create and resource create reaches all members except the author
- [ ] A user who left the community receives no new notification
- [ ] Preferences: per-category toggle suppresses the matching fan-out; all-disabled is permitted
- [ ] `PATCH /api/notifications/:id/read` clears unread state
- File: `backend/tests/stories/us7_notifications.test.js`

### TS-US9 — Likes (P3)

- [ ] Like increments `likeCount`; duplicate → `DUPLICATE_LIKE`; unlike decrements
- [ ] Parametrized across both `targetType` values (discussion, resource) rather than two suites
- [ ] Concurrency: two simultaneous likes from the same user yield exactly one Like document
- File: `backend/tests/stories/us9_likes.test.js`

### TS-US10 — Bookmarks (P3)

- [ ] Bookmark, list, remove — parametrized across both target types
- [ ] A bookmark whose target was admin-removed is excluded from the listing
- File: `backend/tests/stories/us10_bookmarks.test.js`

### TS-US12 — Direct Messaging (P3)

- [ ] Create-or-find conversation between two users sharing a community; second call returns the same conversation
- [ ] Negatives: `NO_SHARED_COMMUNITY`, `EMPTY_MESSAGE`, whitespace-only body
- [ ] Message ordering is chronological; `lastMessageAt` updates
- [ ] Unread badge clears after `PATCH /api/conversations/:id/read`
- [ ] Access after the shared community is removed is re-gated
- File: `backend/tests/stories/us12_messaging.test.js`

---

## Phase T3 — Frontend Suites

All use `renderWithProviders` with a pre-seeded auth store. **No frontend test performs a login.**

- [ ] TS-F1 Shared components: `LikeButton`, `BookmarkButton`, `ReportButton`, `EmptyState` — optimistic update, disabled/duplicate state, keyboard activation — `frontend/tests/unit/`
- [ ] TS-F2 Form validation + feedback: inline errors render and are announced via `aria-live`; toast fires on success — `frontend/tests/unit/forms.test.jsx`
- [ ] TS-F3 Primary flows with a mocked Axios layer: join→post, report→hide, bookmark→saved-items — `frontend/tests/integration/`
- [ ] TS-F4 Accessibility smoke: each page renders with no critical `axe` violations; `prefers-reduced-motion` disables Aceternity UI animations — `frontend/tests/a11y/`

---

## Phase T4 — Success-Criteria Validation

Measured against [quickstart.md](./quickstart.md) flows; record the measured value per criterion ID.

- [ ] TS-SC1 **SC-001** — registration → profile reachable in under 2 minutes
- [ ] TS-SC2 **SC-002** — new community visible to invited members in under 1 minute
- [ ] TS-SC3 **SC-003** — 95% of keyword searches resolve in under 2 seconds (seed ≥500 discussions; run ≥20 queries; assert p95)
- [ ] TS-SC4 **SC-004** — every documented error code produces a user-readable message (satisfied by the Rule 5 parametrized tables; this is an aggregation check)
- [ ] TS-SC5 **SC-005** — private-community content inaccessible across discussion, resource, and search surfaces (satisfied by `TS-X3` + `TS-US8`; this is an aggregation check)
- [ ] TS-SC6 **SC-007** — a sent direct message appears in both inboxes on next fetch

---

## Execution Recipes

```bash
# One story, in isolation
npm test --prefix backend -- us4_discussions

# Cross-cutting matrix only (fastest regression signal)
npm test --prefix backend -- crosscutting/

# MVP confidence gate (P1 stories + matrix)
npm test --prefix backend -- crosscutting/ us1_ us2_ us3_ us4_

# Everything
npm test --prefix backend && npm test --prefix frontend
```

### Suggested gates

| Gate | Run |
|---|---|
| Per-task commit | Nothing (tests are deferred) |
| Story checkpoint | That story's `TS-US*` suite |
| MVP checkpoint (post-US4) | `TS-X*` + `TS-US1`…`TS-US4` |
| Pre-release | All phases T1–T4 |

---

## Traceability

| User Story | Spec Priority | Suite | Contract |
|---|---|---|---|
| US-1 Account Creation & Login | P1 | `TS-US1` | [auth.md](./contracts/auth.md) |
| US-2 Profile Management | P1 | `TS-US2` | [users.md](./contracts/users.md) |
| US-3 Community Creation & Invitations | P1 | `TS-US3` | [communities.md](./contracts/communities.md) |
| US-4 Joining & Discussions | P1 | `TS-US4` | [discussions.md](./contracts/discussions.md) |
| US-5 Sharing Resources | P2 | `TS-US5` | [resources.md](./contracts/resources.md) |
| US-6 Admin Management | P2 | `TS-US6` | [communities.md](./contracts/communities.md), [users.md](./contracts/users.md) |
| US-7 Notifications | P3 | `TS-US7` | [notifications.md](./contracts/notifications.md) |
| US-8 Search & Filter | P2 | `TS-US8` | [discussions.md](./contracts/discussions.md), [resources.md](./contracts/resources.md) |
| US-9 Likes | P3 | `TS-US9` | [engagement.md](./contracts/engagement.md) |
| US-10 Bookmarks | P3 | `TS-US10` | [engagement.md](./contracts/engagement.md) |
| US-11 Reporting | P2 | `TS-US11` | [moderation.md](./contracts/moderation.md) |
| US-12 Direct Messaging | P3 | `TS-US12` | [messaging.md](./contracts/messaging.md) |
