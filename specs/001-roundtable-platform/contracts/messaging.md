# Messaging Contracts (US-12)

## POST /api/conversations
**Body**: `{ recipientUserId }`
**Success 201** (or 200 if an existing conversation is found): `{ success: true, data: { conversation }, message: "" }`
**Errors**: 403 `NO_SHARED_COMMUNITY` — users share no Membership in common (FR-030).

## GET /api/conversations?page=
**Success 200**: paginated inbox — active conversations ordered by `lastMessageAt desc`, each
with the other participant's profile summary and unread-count (FR-031).

## GET /api/conversations/:id/messages?page=
**Success 200**: paginated chronological message history (oldest-first within page, or
newest-first-page-1 depending on frontend scroll direction — contract returns `createdAt asc`
ordering and the frontend is responsible for display direction).
**Errors**: 403 `FORBIDDEN` — requester is not a participant.

## POST /api/conversations/:id/messages
**Body**: `{ body }`
**Success 201**: `{ success: true, data: { message }, message: "" }`
**Errors**: 400 `EMPTY_MESSAGE` — body is empty/whitespace-only (FR-031).

## PATCH /api/conversations/:id/read
**Success 200**: marks all messages in the conversation as read for the requester;
`{ success: true, data: null, message: "" }`.

**Note (NEEDS CLARIFICATION, non-blocking)**: real-time push (WebSocket) delivery of new
messages/unread badges is explicitly optional per Constitution Principle VII; this contract set
only defines the polling/page-load REST surface. If real-time is added later, it is additive
(e.g., a `socket.io` namespace) and does not change these contracts.
