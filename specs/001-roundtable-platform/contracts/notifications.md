# Notifications Contracts (US-7)

## GET /api/notifications?page=
**Success 200**: paginated notifications for the current user, newest first, with `readAt`
state (FR-022).

## PATCH /api/notifications/:id/read
**Success 200**: `{ success: true, data: { notification }, message: "" }`

## GET /api/notifications/preferences
**Success 200**: `{ success: true, data: { preference }, message: "" }`

## PATCH /api/notifications/preferences
**Body**: `{ newDiscussion?, newResource? }` — all categories may be set `false` (FR-023).
**Success 200**: `{ success: true, data: { preference }, message: "Preferences updated." }`
