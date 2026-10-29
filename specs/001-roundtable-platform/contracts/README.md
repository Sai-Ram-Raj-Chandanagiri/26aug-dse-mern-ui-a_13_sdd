# API Contracts: Roundtable Platform

All endpoints are prefixed with `/api` and proxied by the Vite dev-server (`server.proxy`) to the
Express backend. Every response uses the uniform envelope mandated by Constitution Principle V:

```json
{ "success": true, "data": { /* endpoint-specific payload */ }, "message": "Human-readable message" }
```

Error responses use the same envelope with `success: false`, `data: null`, and a specific
`message`; every negative-path rule in the spec maps to a distinct `code` for client-side
handling:

```json
{ "success": false, "data": null, "message": "Email already in use.", "code": "EMAIL_IN_USE" }
```

## Conventions

- **Auth**: session JWT delivered via httpOnly, SameSite cookie (set by `/api/auth/login` and
  `/api/auth/register`); every protected route requires the cookie and is enforced by
  `authRequired` middleware. Admin-only routes additionally require `requireAdmin` middleware
  checking `User.role === 'admin'` (Principle I).
- **Pagination**: all list endpoints accept `?page=<n>` (1-indexed, default 1) and use a fixed
  server-side `pageSize` (default 20, not client-configurable) per the spec's fixed-page-size
  pagination clarification. Responses nest `{ items, page, pageSize, totalItems, totalPages }`
  inside `data`.
- **Validation errors**: HTTP 400 with a `code` identifying the specific rule violated (e.g.,
  `EMAIL_IN_USE`, `INVALID_CREDENTIALS`, `DUPLICATE_LIKE`, `DUPLICATE_REPORT`, `SELF_REPORT`,
  `ALREADY_MEMBER`, `OVERSIZED_UPLOAD`, `NAME_TAKEN`, `EMPTY_MESSAGE`).
- **Access-control errors**: HTTP 403 (`FORBIDDEN`) for non-members/non-admins; HTTP 404
  (`NOT_FOUND`) for private-community content requested by non-members (never leaking existence
  via a 403, consistent with Principle IV privacy boundaries).

## Contract Files

| File | Domain | User Stories |
|---|---|---|
| [auth.md](./auth.md) | Registration, login, logout, password reset, email verification | US-1 |
| [users.md](./users.md) | Profile view/edit, avatar upload, activity summary | US-2 |
| [communities.md](./communities.md) | Create/edit community, invitations, join, search | US-3, US-4 |
| [discussions.md](./discussions.md) | Discussion posts, comments, in-community search | US-4, US-8 |
| [resources.md](./resources.md) | Resource sharing, listing, type filter | US-5, US-8 |
| [engagement.md](./engagement.md) | Likes, bookmarks | US-9, US-10 |
| [notifications.md](./notifications.md) | Notification list, preferences | US-7 |
| [moderation.md](./moderation.md) | Reports, admin dashboard, admin community/user management | US-6, US-11 |
| [messaging.md](./messaging.md) | Conversations, messages, inbox | US-12 |
