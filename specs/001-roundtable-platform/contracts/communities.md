# Communities Contracts (US-3, US-4)

## POST /api/communities
**Body**: `{ name, description?, visibility }`
**Success 201**: `{ success: true, data: { community }, message: "Community created." }`
**Errors**: 400 `NAME_TAKEN` — name already exists (FR-011).

## PATCH /api/communities/:id
**Auth**: owner/admin of the community only.
**Body**: `{ name?, description?, visibility? }`
**Success 200**: `{ success: true, data: { community }, message: "Community updated." }`
**Errors**: 403 `FORBIDDEN`; 400 `NAME_TAKEN`.

## GET /api/communities?query=&page=
**Success 200**: paginated public communities + private communities the user belongs to, matching
keyword `query` via `$text` search (FR-016, FR-025). Private communities the user is not a member
of are excluded at the query level, never trimmed post-fetch (Principle IV).

## GET /api/communities/:id
**Success 200**: `{ success: true, data: { community } }`.
**Errors**: 404 `NOT_FOUND` — private community and requester is not a member (no 403 leak).

## POST /api/communities/:id/invitations
**Auth**: owner/admin only.
**Body**: `{ invitedUserEmail }`
**Success 201**: `{ success: true, data: { invitation }, message: "Invitation sent." }`
**Errors**: 400 `ALREADY_MEMBER` (FR-012); 403 `FORBIDDEN`.

## POST /api/communities/invitations/:invitationId/accept | /decline
**Success 200**: `{ success: true, data: { membership? }, message: "..." }`

## POST /api/communities/:id/join
**Success 200** (public community): creates Membership immediately (FR-014).
**Errors**: 403 `PRIVATE_COMMUNITY_INVITE_REQUIRED` — private community without accepted invitation.

## DELETE /api/communities/:id
**Auth**: admin only (`requireAdmin`).
**Query**: `?force=true` optional override.
**Success 200**: `{ success: true, data: null, message: "Community deleted." }`
**Errors**: 409 `UNRESOLVED_DISCUSSIONS` — active/unresolved discussions exist and `force` not set (FR-019).
