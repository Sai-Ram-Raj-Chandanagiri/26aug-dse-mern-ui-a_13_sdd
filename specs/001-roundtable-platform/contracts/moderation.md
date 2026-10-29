# Moderation Contracts (US-6, US-11)

## POST /api/reports
**Body**: `{ targetType: 'discussion'|'resource'|'comment', targetId, reason }`
**Success 201**: `{ success: true, data: { report }, message: "Report submitted." }`
(content becomes hidden only for this reporter — FR-028)
**Errors**: 400 `DUPLICATE_REPORT`; 400 `SELF_REPORT`.

## GET /api/admin/reports?status=pending&page=
**Auth**: admin only.
**Success 200**: paginated reports dashboard (FR-029).

## PATCH /api/admin/reports/:id/dismiss
**Success 200**: `{ success: true, data: { report }, message: "Report dismissed." }`

## PATCH /api/admin/reports/:id/remove-content
**Success 200**: sets target `status = 'removed'`; `{ success: true, data: { report }, message: "Content removed." }`

## PATCH /api/admin/communities/:id
**Auth**: admin only.
**Body**: `{ name?, description?, visibility? }`
**Success 200**: `{ success: true, data: { community }, message: "Community updated." }` (FR-020)

## DELETE /api/admin/communities/:id
See [communities.md](./communities.md) `DELETE /api/communities/:id` (admin-only route, same
contract, FR-019).

## PATCH /api/admin/users/:id
**Auth**: admin only.
**Body**: `{ displayName?, bio?, role? }` — `email` stripped/rejected even for admins (FR-020).
**Success 200**: `{ success: true, data: { user }, message: "User updated." }`

## DELETE /api/admin/users/:id
**Auth**: admin only.
**Success 200**: `{ success: true, data: null, message: "User deleted." }`
**Errors**: 409 `OWNERSHIP_TRANSFER_REQUIRED` — user owns/administers one or more communities;
deletion is blocked until ownership is transferred or forfeited via
`POST /api/admin/communities/:id/transfer-ownership` (FR-019).

## POST /api/admin/communities/:id/transfer-ownership
**Auth**: admin only.
**Body**: `{ newOwnerUserId }`
**Success 200**: `{ success: true, data: { community }, message: "Ownership transferred." }`
