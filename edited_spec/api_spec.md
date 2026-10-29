# Roundtable API Specification

REST API for Roundtable, a community-based discussion platform where users create communities, hold discussions, and share resources. This document defines the configuration, conventions, data models, and endpoints required to build the API. Each user story maps to one story in the product backlog.

## 1. Configuration

| Variable | Rule |
| :--- | :--- |
| `PORT` | Server port (default `3000`) |
| `NODE_ENV` | `development` or `production`; `production` enables the `secure` cookie flag |
| `MONGO_URI` | Required. MongoDB connection string |
| `JWT_SECRET` | Required. At least 32 characters |
| `JWT_EXPIRES_IN` | JWT lifetime (default `7d`, matching the cookie lifetime) |
| `FRONTEND_URL` | Required. Absolute `http(s)` origin of the client, used for CORS and password-reset links |
| `SMTP_HOST`, `SMTP_PORT` (default `587`), `SMTP_USER`, `SMTP_PASS` | SMTP transport. If `SMTP_HOST` is unset, emails are not sent (they are printed to the console when `NODE_ENV=development`). |
| `MAIL_FROM` | Sender address (default `Roundtable <no-reply@roundtable.local>`) |
| `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Credentials of the admin account created by the seed script |
| `REACT_APP_API_URL` | Client only. API base URL (default `/api/v1`) |

The server refuses to start if `MONGO_URI`, `JWT_SECRET` (32+ characters), or `FRONTEND_URL` is missing or invalid.

---

## 2. Conventions

| Aspect | Rule |
| :--- | :--- |
| **Base URL** | `http://localhost:<PORT>/api/v1`. All paths below are relative to it. |
| **Format** | JSON (`application/json`), request body limit `100 KB`; the profile picture upload uses `multipart/form-data` |
| **Authentication** | JWT in an HTTP-only cookie named `roundtable_session`. Clients send it with `withCredentials: true` and never read it. |
| **JWT** | Claims `{ id, role, tokenVersion }`; `HS256`; issuer `roundtable-api`; audience `roundtable-client`. A token is rejected if its `tokenVersion` differs from the user's current value. |
| **Cookie** | `httpOnly`, `secure` (production only), `sameSite: strict`, `maxAge: 7d`, `path: /` |
| **Authorization** | Role (`user \| admin`) plus resource-level checks (membership, ownership) in the service layer |
| **Success responses** | Reads return the resource or an array (or paginated envelope when pagination query parameters are supplied). Writes return `{ "message": "<text>" }` unless a table states otherwise. |
| **Error responses** | `{ "error": "<message>" }` (flat object, no codes) |
| **Status codes** | `200` OK, `201` Created, `204` No Content, `400` Validation, `401` Unauthenticated, `403` Forbidden, `404` Not Found, `429` Too Many Requests, `500` Server Error |
| **Common errors** | `401 "Authentication is required"` (no cookie) or `401 "Invalid or expired token"`; `403 "Admin access required"` on admin routes; `400 "Invalid request body"` when an update supplies no updatable field; `400 "Email is required"` / `400 "Password is required"` when missing |
| **Invalid IDs** | A malformed `ObjectId` returns `404` with a `"not found"` message, never `400` |
| **Rate limiting** | `/auth/*`: 20 requests per 15 minutes per IP, then `429`. High-write endpoints (`POST /communities/:communityId/invite`, `POST .../report`, `POST /messages/conversations*`): 30 requests per 15 minutes per user, then `429`. |
| **Pagination** | List endpoints accept optional `?page=1&limit=20` (limit max `50`; `400 "Invalid pagination parameters"` if invalid). For backwards compatibility, list endpoints other than `GET /messages/conversations/:conversationId` return a flat array when `page` is omitted, or `{ items[], page, limit, total }` when `page` is provided. |
| **CORS** | Only the `FRONTEND_URL` origin; `credentials: true`; methods `GET, POST, PUT, PATCH, DELETE, OPTIONS`; allowed header `Content-Type` |
| **Security headers** | `helmet()` applied globally |
| **Logging** | Every request appended to `RequestLogger.txt`; every error to `ErrorLogger.txt` |
| **Health check** | `GET /health` returns `200 { "status": "ok" }` (no auth) |
| **Content removal** | Whenever a discussion, comment, or resource is deleted (by author deletion, user deletion, community deletion, or report removal), notifications and saved items pointing at it are deleted and its pending reports (including pending reports on the comments of a deleted discussion) are marked `removed` (while preserving the report's `content` snapshot). |

### 2.1 Shared Validation
* **Email:** matches `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`; stored trimmed and lower-cased. Failure: `400 "Please enter a valid email address"`.
* **Password:** matches `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$` (8+ characters with an uppercase letter, a lowercase letter, a digit, and one of `@$!%*?&`). Failure: `400 "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and one of @$!%*?&"`.
* **Username:** matches `^[a-zA-Z0-9_-]{3,30}$` (3–30 alphanumeric characters, underscores, or hyphens), unique case-insensitively. Failure: `400 "Username must be between 3 and 30 characters"` when the length is out of range, `400 "Username can only contain letters, numbers, underscores, and hyphens"` for any other invalid character, or `400 "This username is already taken"`.
* **Search text:** user-supplied text used in regex queries is trimmed, matched case-insensitively, and regex-escaped first. A blank value is ignored.

---

## 3. Data Models

| Model | Fields |
| :--- | :--- |
| **User** | `email` (unique, lower-cased), `password` (hashed), `username` (unique, case-insensitive), `bio` (≤ 200), `profilePicture` (base64 data URL), `role` (`user \| admin`, default `user`), `tokenVersion`, `resetToken`, `resetTokenExpiry`, `timestamps` |
| **Community** | `name` (unique, case-insensitive), `description`, `isPrivate`, `creator`, `members[]`, `invitedUsers[]`, `timestamps` |
| **Discussion** | `title`, `content`, `author`, `community`, `likes[]`, `comments[]` (embedded `Comment`), `timestamps` |
| **Comment** (embedded) | `author`, `content`, `timestamps` |
| **Resource** | `title` (≤ 100), `type` (`article \| video \| other`), `link` (≤ 2000), `description` (≤ 300), `sharedBy`, `community`, `likes[]`, `timestamps`. Unique on `(community, link)`. |
| **SavedItem** | `user`, `itemType` (`discussion \| resource`), `item` (ID of the Discussion or Resource), `community`, `timestamps`. Unique on `(user, itemType, item)`. |
| **Report** | `reporter`, `targetType` (`discussion \| resource \| comment`), `target` (ID; a comment's `_id` for comments), `discussion` (parent, comment reports only), `community`, `reporterName` and `communityName` (snapshotted at report creation so the report stays readable after the reporter or community is deleted), `content` (embedded snapshot of target at report creation time: discussion `{ _id, title, content, author }`, comment `{ _id, content, author, discussion: { _id, title } }`, or resource `{ _id, title, type, link, description, sharedBy }`), `reason` (`spam \| harassment \| hate_speech \| inappropriate \| other`), `details` (≤ 300), `status` (`pending \| dismissed \| removed`, default `pending`), `reviewedBy`, `reviewedAt`, `timestamps`. Unique on `(reporter, targetType, target)`. |
| **Notification** | `recipient`, `type` (`discussion \| resource \| invitation`), `community`, `discussion?`, `resource?`, `message`, `read` (default `false`), `status` (invitation type only: `pending \| accepted \| declined \| resolved`, default `pending`), `timestamps` |
| **NotificationSettings** | `user` (unique), `discussionNotifications` (default `true`), `resourceNotifications` (default `true`), `timestamps` |
| **Conversation** | `participants[2]` (stored sorted by ID so the pair is unique), `lastMessageAt`, `timestamps` |
| **Message** | `conversation`, `sender`, `content` (≤ 1000), `readBy[]`, `timestamps` |

`likes[]` holds unique user IDs (maintained with `$addToSet`).

---

## 4. API Reference

### User Story 1: Account Creation and Login
As a new user, I want to create an account, log in, log out, and recover a forgotten password so that I can securely access the platform.
Base path `/auth`. No authentication required. Subject to the auth rate limiter.

| Method | Path | Body | Success | Rules |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/signup` | `{ email, password, username? }` | `201 { message: "User registered successfully" }` | Email and password validated per §2.1; if `username` is supplied it is validated per §2.1, otherwise a unique default username is derived from the email prefix by removing characters outside `[a-zA-Z0-9_-]`, padding to at least 3 characters (for example with `user`), trimming to 30, and appending a numeric suffix on collision; `400 "An account with this email already exists"` for a duplicate email; `400 "This username is already taken"` for a duplicate username; sends a best-effort confirmation email when SMTP is configured (a mail failure never fails the signup) |
| `POST` | `/auth/login` | `{ email, password }` | `200 { message: "Login successful" }` and sets `roundtable_session` | Email format validated (`400`); `401 "Invalid credentials"` for an unknown email or wrong password (identical message) |
| `POST` | `/auth/logout` | none | `204` | Clears the `roundtable_session` cookie |
| `POST` | `/auth/forgot-password` | `{ email }` | `200 { message: "If an account with this email exists, a password reset link has been sent" }` | Email format validated (`400`); identical response whether or not the account exists (prevents enumeration); if it exists, emails a link `<FRONTEND_URL>/reset-password/<token>` valid for 15 minutes |
| `POST` | `/auth/reset-password/:token` | `{ password }` | `200 { message: "Password reset successfully" }` | Password validated per §2.1 (`400`); token is SHA-256 hashed before lookup; `400 "Reset link is invalid or has expired"` if unknown or expired; increments `tokenVersion`, invalidating all existing sessions |

---

### User Story 2: Profile Management
As a user, I want to edit my profile, upload a profile picture, and review my activity so that I can manage my identity and track my contributions.
Base path `/profile`. Authentication required.

| Method | Path | Body | Success | Rules |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/profile` | none | `200` user object (password and reset fields excluded) | Returns the authenticated user's profile |
| `GET` | `/profile/activity` | none | `200 { communities[], discussions[], comments[], resources[] }`, each newest first | `communities`: created by the user, `{ _id, name, description, isPrivate, createdAt }`.<br>`discussions`: `{ _id, title, content, community: { _id, name }, createdAt }`.<br>`comments`: `{ _id, discussion, discussionTitle, community: { _id, name }, content, createdAt }`.<br>`resources`: `{ _id, title, type, link, description, community: { _id, name }, createdAt }`. |
| `PUT` | `/profile` | `{ username?, bio? }` | `200 { message: "Profile updated successfully" }` | `username` 3–30 chars per §2.1 (`400 "Username must be between 3 and 30 characters"`; `400 "This username is already taken"` on case-insensitive duplicate); `bio` ≤ 200 chars; `400 "Email address cannot be changed"` if `email` is present; `400 "Invalid request body"` if neither field is supplied |
| `POST` | `/profile/picture` | `multipart/form-data`, field `image` | `200 { message: "Profile picture uploaded successfully" }` | Max 2 MB (`400 "Image must be 2 MB or smaller"`); `image/jpeg`, `image/png`, or `image/webp` (`400 "Only JPG, PNG, or WEBP images are allowed"`); `400 "Please select an image to upload"` if absent; stored as a base64 data URL on the user |

---

### User Story 3: Create and Manage Communities
As a user, I want to create a community, edit its details, manage its members, and invite others so that I can gather people around a shared interest.
Base path `/communities`. Authentication required.

| Method | Path | Body | Success | Rules |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/communities` | `{ name, description?, isPrivate? }` | `201 { message: "Community created successfully" }` | `name` 3–50 chars; `description` ≤ 300 chars; `isPrivate` boolean (default `false`); `400 "A community with this name already exists"` on a case-insensitive duplicate; creator becomes the first member |
| `PUT` | `/communities/:communityId` | `{ name?, description?, isPrivate? }` | `200 { message: "Community updated successfully" }` | Creator only; a non-creator receives `403 "Only the creator can edit this community"`; same field rules and duplicate-name error as create; if `isPrivate` changes from `true` to `false`, clears `invitedUsers[]` and sets pending invitation notifications for this community to `status: resolved` and `read: true` |
| `DELETE` | `/communities/:communityId` | none | `200 { message: "Community deleted successfully" }` | Creator only (`403 "Only the creator can delete this community"`); `400 "Cannot delete a community that has discussions"` if any discussion exists; deletes its resources and notifications; reports are retained (their `communityName` and `content` snapshots keep them readable); Content removal rules apply |
| `POST` | `/communities/:communityId/invite` | `{ email }` | `200 { message: "Invitation sent successfully" }` | Email format validated (`400`); caller must be a member (`403 "Only members can invite others to this community"`); `404 "No user found with this email"`; `400 "This user is already a member of the community"`; `400 "This user has already been invited"`; adds the user to `invitedUsers`, creates an invitation notification (`"You have been invited to join <name>"`), and emits `notification:new` via Socket.IO |
| `DELETE` | `/communities/:communityId/members/:userId` | none | `200 { message: "Member removed successfully" }` | Creator only (`403 "Only the creator can remove members"`); `400 "The community creator cannot remove themselves"`; `404 "User is not a member of this community"`; removes the target user from `members[]` |
| `PATCH` | `/communities/:communityId/transfer-ownership` | `{ newCreatorId }` | `200 { message: "Community ownership transferred successfully" }` | Creator only (`403 "Only the creator can transfer ownership"`); target user must already be a member of the community (`400 "New owner must be a member of the community"`); updates `creator` to `newCreatorId` |
| `GET` | `/communities/:communityId/members` | none | `200` array of `{ _id, username, profilePicture }` | Members only (`403 "Only members can view the member list"`); used by the creator to choose a member to remove or promote, and by Story 12 to pick a message recipient |

---

### User Story 4: Join Communities and Participate in Discussions
As a user, I want to find and join communities and take part in their discussions so that I can share my thoughts with like-minded people.
Authentication required.

| Method | Path | Body / Query | Success | Rules |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/communities` | `?search=&joined=` | `200` array of `{ _id, name, description, isPrivate, creator, memberCount, isMember }`, newest first | `search` matches `name` or `description`; `joined=true` returns only communities the caller is a member of; private communities are listed (their name and description are discoverable, but their discussions and resources are not) |
| `GET` | `/communities/:communityId` | none | `200 { _id, name, description, isPrivate, creator, memberCount, isMember, isInvited, isCreator }` | `404 "Community not found"` |
| `POST` | `/communities/:communityId/join` | none | `200 { message: "Joined community successfully" }` | `400 "You are already a member of the community"`; `403 "This is a private community. You need an invitation to join"` unless the caller is in `invitedUsers`, in which case joining counts as accepting the invitation; clears the caller from `invitedUsers` and sets any pending invitation notification for this community to `status: accepted` (private community) or `status: resolved` (public community) with `read: true` |
| `DELETE` | `/communities/:communityId/leave` | none | `200 { message: "Left community successfully" }` | `400 "The community creator cannot leave the community"`; `400 "You are not a member of the community"` |
| `GET` | `/communities/:communityId/discussions` | `?search=` (Story 8) | `200` array, newest first, of `{ _id, title, content, author: { _id, username }, likeCount, likedByMe, savedByMe, commentCount, comments[], createdAt }`; each comment carries `author: { _id, username }` | `403 "Only members can view discussions in a private community"` for non-members of a private community |
| `GET` | `/communities/:communityId/discussions/:discussionId` | none | `200 { _id, title, content, author: { _id, username }, likeCount, likedByMe, savedByMe, commentCount, comments[], createdAt }` | `403 "Only members can view discussions in a private community"` for non-members of a private community; `404 "Discussion not found"` if missing or not in that community |
| `POST` | `/communities/:communityId/discussions` | `{ title, content }` | `201 { message: "Discussion created successfully" }` | Members only (`403 "Only members can start discussions in this community"`); `title` 3–100 chars; `content` 1–2000 chars; notifies other members (see Story 7) |
| `PUT` | `/communities/:communityId/discussions/:discussionId` | `{ title?, content? }` | `200 { message: "Discussion updated successfully" }` | Author only (`403 "You can only edit your own discussions"`); `404 "Discussion not found"`; `title` 3–100 chars; `content` 1–2000 chars; `400 "Invalid request body"` if neither field is supplied |
| `DELETE` | `/communities/:communityId/discussions/:discussionId` | none | `200 { message: "Discussion deleted successfully" }` | Author only (`403 "You can only delete your own discussions"`); `404 "Discussion not found"`; Content removal rules apply |
| `POST` | `/communities/:communityId/discussions/:discussionId/comments` | `{ content }` | `201 { message: "Comment added successfully" }` | Members only (`403 "Only members can comment in this community"`); `content` 1–1000 chars; `404 "Discussion not found"` if it is not in that community |
| `PUT` | `/communities/:communityId/discussions/:discussionId/comments/:commentId` | `{ content }` | `200 { message: "Comment updated successfully" }` | Author only (`403 "You can only edit your own comments"`); `content` 1–1000 chars; `404 "Comment not found"` if discussion or comment is not found |
| `DELETE` | `/communities/:communityId/discussions/:discussionId/comments/:commentId` | none | `200 { message: "Comment deleted successfully" }` | Author only (`403 "You can only delete your own comments"`); `404 "Comment not found"`; Content removal rules apply |

---

### User Story 5: Share and Manage Resources
As a user, I want to share articles, videos, and other links with my community and view what others have shared so that members can learn from each other.
Authentication required.

| Method | Path | Body / Query | Success | Rules |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/communities/:communityId/resources` | `?search=&type=` (Story 8) | `200` array, newest first, of resources with `sharedBy: { _id, username }`, `likeCount`, `likedByMe`, `savedByMe` | `403 "Only members can view resources in a private community"` for non-members of a private community |
| `POST` | `/communities/:communityId/resources` | `{ title, type, link, description? }` | `201 { message: "Resource shared successfully" }` | Members only (`403 "Only members can share resources in this community"`); `title` 3–100 chars; `type` ∈ `article \| video \| other`; `link` a valid `http(s)` URL ≤ 2000 chars; `description` ≤ 300 chars (these length limits are the size limits); `400 "This resource has already been shared in this community"` if `link` already exists in the community; a case-insensitive blocklist (`nudity`, `gore`, `terrorism`, `hate speech`) is applied to `title`, `link`, and `description` (`400 "This resource contains inappropriate content"`); notifies other members (see Story 7) |
| `PUT` | `/communities/:communityId/resources/:resourceId` | `{ title?, type?, link?, description? }` | `200 { message: "Resource updated successfully" }` | Author (`sharedBy`) only (`403 "You can only edit your own resources"`); `404 "Resource not found"`; same field validation, blocklist check, and duplicate `link` check as create |
| `DELETE` | `/communities/:communityId/resources/:resourceId` | none | `200 { message: "Resource deleted successfully" }` | Author (`sharedBy`) only (`403 "You can only delete your own resources"`); `404 "Resource not found"`; Content removal rules apply |

---

### User Story 6: Administration
As an administrator, I want to edit and delete users and communities so that the platform stays healthy and appropriate.
Base path `/admin`. Authentication and role `admin` required. The first admin is created by the seed script from `ADMIN_*` configuration.

| Method | Path | Body | Success | Rules |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/admin/users` | none | `200` array of users, newest first (password and reset fields excluded) | Supports optional pagination and filtering by `?search=` (username or email) and `?role=user\|admin` |
| `GET` | `/admin/communities` | none | `200` array of `{ _id, name, description, isPrivate, creator, memberCount, createdAt }`, newest first | Supports optional pagination and filtering by `?search=` (name) and `?isPrivate=true\|false` |
| `PUT` | `/admin/users/:userId` | `{ username?, bio?, role?, password? }` | `200 { message: "User updated successfully" }` | `400 "Email address cannot be changed"` if `email` is present; `role` ∈ `user \| admin` (`400 "Invalid role"`); an admin changing their own `role` receives `400 "You cannot change your own role"`; a changed `password` increments that user's `tokenVersion`, invalidating their sessions; `username`, `bio`, and `password` follow the same rules as elsewhere |
| `DELETE` | `/admin/users/:userId` | none | `200 { message: "User deleted successfully" }` | `400 "You cannot delete your own admin account"`; communities the user created transfer to the acting admin (who becomes a member); the user is removed from every community's `members` and `invitedUsers`; the user's discussions, comments, resources, likes, saved items, pending reports they filed (reviewed reports are retained for audit), notifications, notification settings, and conversations with their messages are deleted; Content removal rules apply |
| `PUT` | `/admin/communities/:communityId` | `{ name?, description?, isPrivate? }` | `200 { message: "Community updated successfully" }` | Same validation and private-to-public invitation cleanup as Story 3, without the creator restriction |
| `DELETE` | `/admin/communities/:communityId` | none | `200 { message: "Community deleted successfully" }` | `400 "Cannot delete a community that has discussions"` if any discussion exists; deletes its resources and notifications; reports are retained (their `communityName` and `content` snapshots keep them readable); Content removal rules apply |

---

### User Story 7: Notifications
As a user, I want to be notified about new discussions, shared resources, and community invitations, and to control which alerts I receive, so that I stay informed without noise.
Base path `/notifications`. Authentication required. All records are scoped to the caller.

* A new discussion creates a `discussion` notification (`"A new discussion was posted in your community"`) and a new resource creates a `resource` notification (`"A new resource was shared in your community"`) for every current member except the author, unless that member has disabled that type. Former members receive nothing.
* Invitations always create an `invitation` notification regardless of settings.
* Whenever a notification is created, the server also emits `notification:new` via Socket.IO to the recipient's private user room.

| Method | Path | Body | Success | Rules |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | none | `200` array, newest first, with populated `community.name`, `discussion.title`, `resource.title`; invitation notifications include `status` | Scoped to the authenticated user |
| `GET` | `/notifications/unread-count` | none | `200 { count }` | Returns count of unread notifications for the caller |
| `PATCH` | `/notifications/:notificationId/read` | none | `200 { message: "Notification marked as read" }` | `404 "Notification not found"` if missing or not the caller's |
| `PATCH` | `/notifications/read-all` | none | `200 { message: "All notifications marked as read" }` | Marks all unread notifications belonging to the caller as `read: true` |
| `PATCH` | `/notifications/:notificationId/accept` | none | `200 { message: "Community invitation accepted" }` | Only `type: invitation` (`404 "Invitation not found"`); `404 "This invitation is no longer valid"` if the caller is no longer invited or is already a member (the notification is then set to `status: resolved`); adds the caller to `members`, removes them from `invitedUsers`, sets the notification to `status: accepted` and `read: true` |
| `PATCH` | `/notifications/:notificationId/decline` | none | `200 { message: "Community invitation declined" }` | Only `type: invitation` (`404 "Invitation not found"`); removes the caller from `invitedUsers` and sets the notification to `status: declined` and `read: true` |
| `GET` | `/notifications/settings` | none | `200` settings object `{ discussionNotifications, resourceNotifications }` | Defaults to `{ discussionNotifications: true, resourceNotifications: true }` if none are stored |
| `PUT` | `/notifications/settings` | `{ discussionNotifications?, resourceNotifications? }` | `200` updated settings object | `400 "Invalid request body"` if both fields are absent; `400` if either is not a boolean; `400 "At least one notification type must remain enabled"` if the result would disable both |

---

### User Story 8: Search and Filter Community Content
As a user, I want to search discussions and resources within a community and filter resources by type so that I can quickly find relevant content.
These are query parameters on the Story 4 and Story 5 list endpoints. Authentication required; the same access rules apply, so private communities the caller has not joined return `403`.

| Method | Path | Query | Success | Rules |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/communities/:communityId/discussions` | `search` | `200` matching discussions (same shape as Story 4) | Matches `title` or `content` |
| `GET` | `/communities/:communityId/resources` | `search`, `type` | `200` matching resources (same shape as Story 5) | `search` matches `title` or `description`; `type` ∈ `article \| video \| other` (`400 "Resource type must be article, video, or other"`); both may be combined |

A search with no matches returns `200 []`, and the client shows a "no results" message. Community search is covered by `GET /communities?search=` (Story 4).

---

### User Story 9: Like Discussions and Resources
As a member, I want to like and unlike discussions and resources so that I can show appreciation and see which content is popular.
Authentication and community membership required. Each user can like an item at most once.
Discussion and resource list items (Stories 4 and 5) include `likeCount` and `likedByMe`; the `likes` array is never returned.

| Method | Path | Success | Rules |
| :--- | :--- | :--- | :--- |
| `POST` | `/communities/:communityId/discussions/:discussionId/like` | `200 { liked: true, likeCount }` | `403 "Only members can like discussions in this community"`; `404 "Discussion not found"`; `400 "You have already liked this discussion"` |
| `DELETE` | `/communities/:communityId/discussions/:discussionId/like` | `200 { liked: false, likeCount }` | Same access rules; `400 "You have not liked this discussion"` |
| `POST` | `/communities/:communityId/resources/:resourceId/like` | `200 { liked: true, likeCount }` | `403 "Only members can like resources in this community"`; `404 "Resource not found"`; `400 "You have already liked this resource"` |
| `DELETE` | `/communities/:communityId/resources/:resourceId/like` | `200 { liked: false, likeCount }` | Same access rules; `400 "You have not liked this resource"` |

---

### User Story 10: Save Content for Later
As a user, I want to save discussions and resources and view them in one place so that I can return to them later.
Authentication required. Saving requires access to the item's community: a private community the caller has not joined returns `403 "Only members can save content in a private community"`.
Discussion and resource list items (Stories 4 and 5) include `savedByMe`.

| Method | Path | Success | Rules |
| :--- | :--- | :--- | :--- |
| `POST` | `/communities/:communityId/discussions/:discussionId/save` | `201 { message: "Discussion saved successfully" }` | `403 "Only members can save content in a private community"`; `404 "Discussion not found"`; `400 "You have already saved this discussion"` |
| `DELETE` | `/communities/:communityId/discussions/:discussionId/save` | `200 { message: "Discussion removed from saved items" }` | `400 "This discussion is not in your saved items"` |
| `POST` | `/communities/:communityId/resources/:resourceId/save` | `201 { message: "Resource saved successfully" }` | `403 "Only members can save content in a private community"`; `404 "Resource not found"`; `400 "You have already saved this resource"` |
| `DELETE` | `/communities/:communityId/resources/:resourceId/save` | `200 { message: "Resource removed from saved items" }` | `400 "This resource is not in your saved items"` |
| `GET` | `/profile/saved` | `200 { discussions[], resources[] }`, each newest-saved first, each item including `savedAt` | Discussions: `{ _id, title, content, author: { _id, username }, community: { _id, name }, createdAt, savedAt }`.<br>Resources: `{ _id, title, type, link, description, sharedBy: { _id, username }, community: { _id, name }, createdAt, savedAt }`.<br>Items whose original content was deleted, or that belong to a private community in which the caller is not currently a member, are never returned. |

---

### User Story 11: Report Inappropriate Content
As a user, I want to report inappropriate discussions, comments, and resources to the administrators so that harmful content is reviewed and removed.
Authentication required. The caller must be able to view the community (members only for a private community, `403` otherwise). Automated moderation is out of scope.

#### Reporting

| Method | Path | Body | Success | Rules |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/communities/:communityId/discussions/:discussionId/report` | `{ reason, details? }` | `201 { message: "Report submitted successfully" }` | See rules below |
| `POST` | `/communities/:communityId/discussions/:discussionId/comments/:commentId/report` | `{ reason, details? }` | `201 { message: "Report submitted successfully" }` | See rules below |
| `POST` | `/communities/:communityId/resources/:resourceId/report` | `{ reason, details? }` | `201 { message: "Report submitted successfully" }` | See rules below |

* `reason` is required and one of `spam`, `harassment`, `hate_speech`, `inappropriate`, `other` (`400 "Please select a valid reason for the report"`); `details` ≤ 300 chars (`400 "Details must be 300 characters or fewer"`).
* `404` if the discussion, comment, or resource is not found in that community.
* `400 "You cannot report your own content"`; `400 "You have already reported this content"`.
* Stores a snapshot of the reported target in `Report.content` at submission time.
* While a report is `pending`, the reported item is omitted from the reporter's own list responses (a reported comment is also excluded from `commentCount`). It reappears if the report is dismissed and stays hidden if the content is removed.

#### Administration (base path `/admin`, admin only)

| Method | Path | Query / Body | Success | Rules |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/admin/reports` | `?status=pending\|dismissed\|removed\|all` (default `pending`) | `200` array, newest first, of `{ _id, targetType, reason, details, status, reporter: { _id, username }, community: { _id, name }, content, createdAt, reviewedAt }` | `400 "Invalid status filter"`. If the reporter or community has since been deleted, `reporter` and `community` are built from the stored `reporterName` and `communityName` with a `null` `_id`. `content` is the stored snapshot: discussion `{ _id, title, content, author }`; comment `{ _id, content, author, discussion: { _id, title } }`; resource `{ _id, title, type, link, description, sharedBy }`. |
| `PATCH` | `/admin/reports/:reportId/dismiss` | none | `200 { message: "Report dismissed successfully" }` | `404 "Report not found"`; `400 "This report has already been reviewed"`; sets `status: dismissed`, `reviewedBy`, `reviewedAt` |
| `PATCH` | `/admin/reports/:reportId/remove-content` | none | `200 { message: "Content removed successfully" }` | Same `404` and `400` as dismiss; deletes the reported discussion (with its comments), comment, or resource; marks every pending report on that content `removed` while preserving `Report.content` snapshot; Content removal rules apply |

---

### User Story 12: Direct Messaging
As a user, I want to send private messages to members of my communities so that I can talk one-on-one outside of discussions.
Base path `/messages` (plus the member list endpoint defined in Story 3). Authentication required. Only participants can access a conversation. Group messaging and attachments are out of scope.

**Rules for starting and sending messages:** Sender and recipient must both be members of at least one common community, checked on every send (`403 "You can only message members of your communities"`). Existing history stays readable if they stop sharing a community. A message must be 1–1000 characters after trimming (`400 "Message must be between 1 and 1000 characters"`).

| Method | Path | Body / Query | Success | Rules |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/messages/conversations` | none | `200` array of `{ _id, participant: { _id, username, profilePicture }, lastMessage: { content, sender, createdAt }, unreadCount, updatedAt }`, most recent activity first | Only the caller's conversations |
| `POST` | `/messages/conversations` | `{ recipientId, content }` | `201 { message: "Message sent successfully", conversationId }` | `400 "You cannot message yourself"`; `404 "User not found"` if the recipient does not exist; reuses the existing conversation for the same pair |
| `GET` | `/messages/conversations/:conversationId` | `?page=1&limit=20` (limit max `50`) | `200 { messages[], page, limit, total }`; each message `{ _id, sender: { _id, username }, content, createdAt }` | `403 "You are not part of this conversation"`; `404 "Conversation not found"`; page 1 holds the newest messages and each page is ordered oldest to newest; `400 "Invalid pagination parameters"` |
| `POST` | `/messages/conversations/:conversationId` | `{ content }` | `201 { message: "Message sent successfully" }` | Same `403 "You are not part of this conversation"` and `404 "Conversation not found"` as above, plus common-community check |
| `PATCH` | `/messages/conversations/:conversationId/read` | none | `200 { message: "Conversation marked as read" }` | `403 "You are not part of this conversation"`; `404 "Conversation not found"`; marks every message not sent by the caller as `read` |
| `GET` | `/messages/unread-count` | none | `200 { count }` | Unread messages across all of the caller's conversations; drives the unread badge |

#### Real-time Delivery
A Socket.IO server runs on the same origin as the API. The handshake is authenticated with the same session cookie and the same checks as `authenticate`, and each socket joins a private room for its user. CORS follows `FRONTEND_URL`. REST remains the source of truth; events only push updates.

| Event (server to client) | Payload | Sent to | When |
| :--- | :--- | :--- | :--- |
| `message:new` | `{ conversationId, message }` | Recipient | A message is sent to them |
| `messages:read` | `{ conversationId }` | The other participant | The conversation is marked as read |
| `notification:new` | `{ notification }` | Recipient | A discussion, resource, or invitation notification is created for them |