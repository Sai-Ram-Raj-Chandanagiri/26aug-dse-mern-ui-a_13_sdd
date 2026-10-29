# Discussions Contracts (US-4, US-8)

## GET /api/communities/:communityId/discussions?query=&page=
**Success 200**: paginated discussions in the community, keyword-filtered via `$text` when
`query` present (FR-024); 404 `NOT_FOUND` if community is private and requester is not a member.
Empty result with `query` set still returns 200 with `items: []` so the client can show the
"no results found" message (FR-025).

## POST /api/communities/:communityId/discussions
**Auth**: must be a Membership holder for the community (FR-015).
**Body**: `{ title, body }`
**Success 201**: `{ success: true, data: { discussion }, message: "Posted." }`
**Errors**: 403 `NOT_A_MEMBER`.

## GET /api/discussions/:id
**Success 200**: discussion + paginated comments.
**Errors**: 404 if private-community non-member.

## POST /api/discussions/:id/comments
**Auth**: Membership required.
**Body**: `{ body }`
**Success 201**: `{ success: true, data: { comment }, message: "Reply posted." }`
**Errors**: 403 `NOT_A_MEMBER`; 400 `VALIDATION_ERROR` (empty body).
