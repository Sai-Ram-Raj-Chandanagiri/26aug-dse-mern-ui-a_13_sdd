# Users Contracts (US-2)

## GET /api/users/me
**Success 200**: `{ success: true, data: { user }, message: "" }` — excludes `passwordHash`.

## PATCH /api/users/me
**Body**: `{ displayName?, bio? }` — `email` and `role` are stripped server-side if present
(Principle I); any attempt to include `email` in the body returns:
**Errors**: 400 `EMAIL_IMMUTABLE` — explicit rejection when `email` is present in the payload (FR-007).
**Success 200**: `{ success: true, data: { user }, message: "Profile updated." }`

## POST /api/users/me/avatar
**Body**: multipart/form-data, field `avatar` (image file).
**Success 200**: `{ success: true, data: { avatarUrl }, message: "Avatar updated." }`
**Errors**: 413 `OVERSIZED_UPLOAD` — file exceeds 5 MB (FR-008); 400 `INVALID_FILE_TYPE` — not an image.

## GET /api/users/me/activity
**Success 200**: `{ success: true, data: { discussionCount, resourceCount, communityCount, recentItems: [...] }, message: "" }` (FR-009).

## GET /api/users/me/bookmarks?page=
**Success 200**: paginated list of the user's Bookmarks with resolved target content, excluding
bookmarks whose target was removed (FR-027). See README.md pagination convention.
