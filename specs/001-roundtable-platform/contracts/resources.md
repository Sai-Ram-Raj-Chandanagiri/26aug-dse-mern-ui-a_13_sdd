# Resources Contracts (US-5, US-8)

## GET /api/communities/:communityId/resources?type=&query=&page=
**Success 200**: paginated resources, optional `type` filter (`article|video|link|file`) and
keyword `query` (FR-024); 404 if private-community non-member.

## POST /api/communities/:communityId/resources
**Auth**: Membership required (FR-017).
**Body** (link/article/video): `{ type, title, url }`
**Body** (file): multipart/form-data `{ type: 'file', title, file }`
**Success 201**: `{ success: true, data: { resource }, message: "Resource shared." }`
**Errors**: 403 `NOT_A_MEMBER`; 413 `OVERSIZED_UPLOAD` — file exceeds 10 MB; 400
`FLAGGED_CONTENT` — reserved for future content-rule routing (US-5 scenario 3; no automated
moderation exists yet per Principle VI, so this is currently a manual-report-driven path, not an
automatic rejection — flagged as **NEEDS CLARIFICATION**: the spec's "flagged/inappropriate
content" rejection path has no defined detection mechanism since ML moderation is out of scope;
current design routes all content through post-hoc user Reports rather than pre-publication
blocking).

## GET /api/resources/:id
**Success 200**: resource detail; 404 if private-community non-member.
