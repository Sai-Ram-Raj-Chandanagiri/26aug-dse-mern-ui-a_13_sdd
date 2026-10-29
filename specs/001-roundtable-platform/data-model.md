# Phase 1 Data Model: Roundtable Platform

All models are Mongoose schemas in a single MongoDB database. Every schema includes
`createdAt`/`updatedAt` (via `{ timestamps: true }`) unless noted. All `ObjectId` references use
Mongoose `ref` for population. Field-level validators are the server-side source of truth
(Principle III); client-side validation mirrors but never replaces them.

## User

| Field | Type | Rules |
|---|---|---|
| `email` | String | required, unique index, lowercase, immutable after creation (schema `immutable: true` and controller-layer rejection even if present in update payload) |
| `passwordHash` | String | required; bcryptjs hash, cost ≥10; never serialized in API responses |
| `role` | String enum (`user`, `admin`) | required, default `user`; never settable via public registration/profile-update endpoints |
| `displayName` | String | required, 1–60 chars |
| `bio` | String | optional, ≤500 chars |
| `avatarUrl` | String | optional; set via avatar upload endpoint (≤5 MB enforced by multer) |
| `isEmailVerified` | Boolean | default `false`; set `true` on confirmation-code redemption |
| `status` | String enum (`active`, `deleted`) | default `active`; used transiently during cascade-delete workflow, not a soft-delete substitute — deletion still hard-deletes the document once cascade/ownership checks pass |

**Relationships**: 1–N with Community (as owner), Membership, Discussion, Resource, Like,
Bookmark, Report (as reporter), Notification, NotificationPreference, Conversation (participant).

**Validation rules**: email format + uniqueness (schema + controller re-check); password
complexity enforced at registration controller (min length) before hashing; `role` and `email`
stripped from any profile-update request body before `findByIdAndUpdate`.

## PasswordResetToken

| Field | Type | Rules |
|---|---|---|
| `user` | ObjectId ref User | required |
| `tokenHash` | String | required; hashed, single-use |
| `expiresAt` | Date | required; short-lived (e.g., 15–30 min) |
| `usedAt` | Date | null until redeemed; redemption sets this and the token is rejected thereafter |

**Index**: `(user, expiresAt)`. Distinct from the session JWT per Principle I.

## EmailVerificationCode

| Field | Type | Rules |
|---|---|---|
| `user` | ObjectId ref User | required |
| `code` | String | required; short numeric/alphanumeric code printed to console (nodemailer console transport) |
| `expiresAt` | Date | required |
| `usedAt` | Date | null until redeemed |

## Community

| Field | Type | Rules |
|---|---|---|
| `name` | String | required, unique index, 3–60 chars |
| `description` | String | optional, ≤1000 chars |
| `visibility` | String enum (`public`, `private`) | required |
| `owner` | ObjectId ref User | required; the accountable owner for admin ownership-transfer rules |
| `admins` | [ObjectId ref User] | additional community-level admins (community owner is implicitly included) |
| `memberCount` | Number | denormalized counter, maintained by Membership create/remove hooks, for list-view display without extra aggregation |

**Indexes**: `name` unique; `$text` index on `(name, description)` for keyword search;
`(visibility, name)` for the public-community search path.

**Deletion rule (FR-019)**: blocked if any non-resolved Discussion/Report exists in the
community unless an explicit admin override is supplied; cascades to Membership, Invitation,
Discussion, Comment, Resource, Like, Bookmark, Report scoped to the community.

## Membership

| Field | Type | Rules |
|---|---|---|
| `user` | ObjectId ref User | required |
| `community` | ObjectId ref Community | required |
| `role` | String enum (`member`, `admin`, `owner`) | default `member` |
| `joinedAt` | Date | default now |

**Index**: compound unique `(user, community)`; secondary index on `community` (member listing)
and `user` (my-communities listing). Presence of a Membership document is the sole gate for
discussion/resource write access to a community (Principle IV).

## Invitation

| Field | Type | Rules |
|---|---|---|
| `community` | ObjectId ref Community | required |
| `invitedUser` | ObjectId ref User | required |
| `invitedBy` | ObjectId ref User | required |
| `status` | String enum (`pending`, `accepted`, `declined`) | default `pending` |

**Index**: compound unique `(community, invitedUser)` where `status = pending`, to enforce
"already a member"/duplicate-invite rejection (FR-012).

## Discussion

| Field | Type | Rules |
|---|---|---|
| `community` | ObjectId ref Community | required |
| `author` | ObjectId ref User | required |
| `title` | String | required, 1–200 chars |
| `body` | String | required, 1–10,000 chars |
| `status` | String enum (`active`, `resolved`, `removed`) | default `active`; `removed` set by moderation action (content stays in DB for audit, excluded from normal listings) |
| `likeCount` | Number | denormalized counter maintained by Like create/remove |

**Indexes**: compound `(community, createdAt desc)` for paginated listing; `$text` index on
`(title, body)` scoped by `community` filter for keyword search (FR-024).

## Comment

| Field | Type | Rules |
|---|---|---|
| `discussion` | ObjectId ref Discussion | required |
| `author` | ObjectId ref User | required |
| `body` | String | required, 1–2,000 chars |
| `status` | String enum (`active`, `removed`) | default `active` |

**Index**: `(discussion, createdAt asc)` for chronological reply ordering.

## Resource

| Field | Type | Rules |
|---|---|---|
| `community` | ObjectId ref Community | required |
| `author` | ObjectId ref User | required |
| `type` | String enum (`article`, `video`, `link`, `file`) | required; drives FR-024 type filter |
| `title` | String | required, 1–200 chars |
| `url` | String | required if `type` is `article`/`video`/`link` |
| `fileUrl` | String | set if `type = file`; upload rejected server-side above 10 MB (FR-017) |
| `fileSizeBytes` | Number | recorded for uploaded files, validated ≤10,485,760 |
| `status` | String enum (`active`, `removed`) | default `active` |
| `likeCount` | Number | denormalized counter |

**Indexes**: compound `(community, createdAt desc)`; compound `(community, type)` for type
filtering; `$text` index on `(title)` scoped by `community`.

## Report

| Field | Type | Rules |
|---|---|---|
| `reporter` | ObjectId ref User | required |
| `targetType` | String enum (`discussion`, `resource`, `comment`) | required |
| `targetId` | ObjectId | required; polymorphic reference resolved via `targetType` |
| `reason` | String | required, 1–500 chars |
| `status` | String enum (`pending`, `dismissed`, `removed`) | default `pending` |
| `hiddenForReporter` | Boolean | default `true`; governs per-user hiding of the reported content (Principle VI — never a global hide) |

**Indexes**: compound unique `(reporter, targetType, targetId)` to block duplicate reports
(FR-028); `(status, createdAt desc)` for the admin moderation dashboard (FR-029). Self-report
rejection (FR-028) is enforced in the controller by comparing `reporter` to the target content's
`author`, not by a schema constraint.

## Notification

| Field | Type | Rules |
|---|---|---|
| `user` | ObjectId ref User | required (recipient) |
| `community` | ObjectId ref Community | required |
| `type` | String enum (`new_discussion`, `new_resource`) | required |
| `refId` | ObjectId | required; points to the Discussion/Resource that triggered it |
| `readAt` | Date | null until read |

**Indexes**: `(user, createdAt desc)` for paginated inbox listing; `(user, readAt)` for unread
counts. Creation is skipped for members whose `NotificationPreference` has disabled the category
and for users who are no longer members at fan-out time (FR-022).

## NotificationPreference

| Field | Type | Rules |
|---|---|---|
| `user` | ObjectId ref User | required, unique (one preference document per user) |
| `newDiscussion` | Boolean | default `true` |
| `newResource` | Boolean | default `true` |

All categories may be set to `false` simultaneously (FR-023); there is no server-side minimum
enforced, matching the resolved spec clarification.

## Like

| Field | Type | Rules |
|---|---|---|
| `user` | ObjectId ref User | required |
| `targetType` | String enum (`discussion`, `resource`) | required |
| `targetId` | ObjectId | required |

**Index**: compound unique `(user, targetType, targetId)` — enforces one-like-per-user-per-item
(FR-026); removal of the document represents "unlike" and decrements the target's `likeCount`.

## Bookmark

| Field | Type | Rules |
|---|---|---|
| `user` | ObjectId ref User | required |
| `targetType` | String enum (`discussion`, `resource`) | required |
| `targetId` | ObjectId | required |

**Index**: compound unique `(user, targetType, targetId)`. Listing query joins against the
live target and filters out bookmarks whose target `status = removed` or whose document no
longer exists (FR-027), rather than eagerly deleting bookmarks on content removal.

## Conversation

| Field | Type | Rules |
|---|---|---|
| `participants` | [ObjectId ref User] (length 2) | required; creation requires the two users to share at least one active Membership (FR-030), checked in the controller/service layer, not the schema |
| `lastMessageAt` | Date | denormalized, used to sort inbox conversation list |

**Index**: compound `(participants)` (multikey) to find/avoid duplicate conversations between
the same pair; `(lastMessageAt desc)` scoped by participant for inbox ordering.

## Message

| Field | Type | Rules |
|---|---|---|
| `conversation` | ObjectId ref Conversation | required |
| `sender` | ObjectId ref User | required |
| `body` | String | required, 1–2,000 chars; empty/whitespace-only rejected (FR-031) |
| `readAt` | Date | null until the recipient opens the conversation |

**Index**: `(conversation, createdAt asc)` for chronological history; `(conversation, readAt)`
for unread-badge computation.

## Cross-Cutting Rules

- **Pagination**: every list-returning query defined above is paired with a fixed `PAGE_SIZE`
  constant (default 20) and a `page` query parameter; responses include
  `{ page, pageSize, totalItems, totalPages }` metadata alongside `data`.
- **Response envelope**: every endpoint returns `{ success: boolean, data, message }` per
  Principle V; list endpoints nest pagination metadata inside `data`
  (`{ items, page, pageSize, totalItems, totalPages }`).
- **Visibility enforcement**: any query touching Discussion/Resource/Community search MUST
  include a `visibility`/membership filter at the Mongoose query level (e.g.,
  `{ $or: [{ visibility: 'public' }, { _id: { $in: memberCommunityIds } }] }`), never filtered
  after fetching (Principle IV).
