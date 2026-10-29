# Quickstart: Roundtable Platform

This guide validates the feature end-to-end once implementation (from `/speckit.tasks` +
implementation phases) is complete. It references [data-model.md](./data-model.md) and
[contracts/](./contracts/) rather than duplicating field/endpoint details.

## Prerequisites

- Node.js 20 LTS, npm.
- MongoDB running locally (standalone is sufficient for dev; a replica set is recommended to
  exercise the transactional cascade-delete path described in [research.md](./research.md)).
- Two terminals: one for `backend/`, one for `frontend/`.

## Setup

```powershell
# Backend
cd backend
npm install
copy .env.example .env   # set MONGODB_URI, JWT_SECRET, COOKIE_SECRET
npm run dev               # starts Express on (e.g.) http://localhost:5000

# Frontend
cd frontend
npm install
npm run dev               # starts Vite dev server with /api proxy to backend
```

## Validation Scenarios (map to user stories)

1. **Account creation & login (US-1)**
   - Register via the UI with a fresh email/password → confirm the account-creation code is
     printed in the backend console (`contracts/auth.md` `POST /api/auth/register`).
   - Log in with the same credentials → land on the profile page.
   - Attempt to register the same email again → see the `EMAIL_IN_USE` error.
   - Attempt login with a wrong password → see the generic `INVALID_CREDENTIALS` error.

2. **Profile management (US-2)**
   - Edit display name/bio → success toast.
   - Upload an avatar < 5 MB → avatar updates; upload one > 5 MB → `OVERSIZED_UPLOAD` error.
   - Attempt to submit an `email` field in the profile-edit form (e.g., via devtools) → request
     is rejected with `EMAIL_IMMUTABLE`.

3. **Community creation & invitations (US-3)**
   - Create a community with a unique name → becomes owner/first member.
   - Create another community with the same name → `NAME_TAKEN`.
   - Invite a second test user → invitation recorded; re-inviting an existing member → `ALREADY_MEMBER`.

4. **Joining & discussions (US-4)**
   - As the second user, join the public community (or accept the invite for a private one).
   - Post a discussion and a reply → both visible to other members.
   - As a non-member, attempt to post in that community → `FORBIDDEN`/`NOT_A_MEMBER`.
   - Search communities by keyword → paginated results with explicit page navigation (SC-009).

5. **Resources (US-5)**
   - Share a link resource and a file resource < 10 MB → both visible to members.
   - Attempt a file resource > 10 MB → `OVERSIZED_UPLOAD`.

6. **Admin management (US-6)**
   - As an admin (role set manually in DB per Principle I — never via registration), delete a
     community with no unresolved discussions → removed.
   - Attempt to delete a community with unresolved discussions without `force` → `UNRESOLVED_DISCUSSIONS`.
   - Attempt to delete a user who owns a community → `OWNERSHIP_TRANSFER_REQUIRED`; transfer
     ownership, then retry → succeeds (hard delete + cascade).

7. **Notifications (US-7)**
   - Post a discussion in a community with another member → that member receives a Notification.
   - Leave the community, then have another member post → no new notification for the departed user.
   - Disable all notification categories → preference update succeeds with no minimum enforced.

8. **Search & filter (US-8)**
   - Search discussions/resources by keyword within a community → relevant paginated results.
   - Search with no matches → "no results found" message.
   - As a non-member of a private community, search within it → no results returned.

9. **Likes (US-9)**
   - Like a post once → count increments; like again → `DUPLICATE_LIKE`; unlike → count decrements.

10. **Bookmarks (US-10)**
    - Bookmark a post → appears in the saved-items profile section.
    - Remove the bookmark → disappears from the list.
    - Have an admin remove the underlying post → it no longer appears in the saved list.

11. **Reporting (US-11)**
    - Report a post with a reason → confirmation shown; the post is hidden only for the
      reporter, still visible to others.
    - Report the same post again → `DUPLICATE_REPORT`.
    - Report your own post → `SELF_REPORT`.
    - As admin, open the reports dashboard, dismiss one report and remove content for another.

12. **Direct messaging (US-12)**
    - Two users sharing a community start a conversation and exchange messages; verify
      chronological order and sent/received visual distinction in both inboxes.
    - A user with no shared community attempts to message another → `NO_SHARED_COMMUNITY`.
    - Attempt to send an empty message → `EMPTY_MESSAGE`.
    - Send a message to an offline recipient → unread badge appears on next page load/poll
      (no WebSocket required for MVP acceptance, per Principle VII).

## Success Criteria Checks

- All list views above (community search, discussion/resource listings) show a fixed page size
  with working next/previous page controls (SC-009).
- Every validation failure listed above produces the specific named error above, never a
  generic/silent failure (SC-004).
- Private-community content is verified inaccessible to non-members across discussion, resource,
  and search surfaces (SC-005) by repeating steps 4/8 as a logged-in non-member.
