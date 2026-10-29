# Engagement Contracts — Likes & Bookmarks (US-9, US-10)

## POST /api/likes
**Body**: `{ targetType: 'discussion'|'resource', targetId }`
**Success 201**: `{ success: true, data: { likeCount }, message: "Liked." }`
**Errors**: 400 `DUPLICATE_LIKE` (FR-026).

## DELETE /api/likes
**Body**: `{ targetType, targetId }`
**Success 200**: `{ success: true, data: { likeCount }, message: "Unliked." }`

## POST /api/bookmarks
**Body**: `{ targetType: 'discussion'|'resource', targetId }`
**Success 201**: `{ success: true, data: { bookmark }, message: "Saved." }`

## DELETE /api/bookmarks/:id
**Success 200**: `{ success: true, data: null, message: "Removed from saved items." }`

(See [users.md](./users.md) `GET /api/users/me/bookmarks` for listing, FR-027.)
