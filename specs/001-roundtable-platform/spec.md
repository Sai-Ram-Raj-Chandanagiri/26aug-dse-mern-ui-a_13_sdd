# Feature Specification: Roundtable Platform

**Feature Branch**: `001-roundtable-platform`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "Roundtable — a social platform that allows users to create communities, join discussions, and share resources with others. Source of truth: round_table.md (12 user stories), constrained by the Roundtable Constitution v1.1.0."

## Clarifications

### Session 2026-10-26

- Q: What are the numeric file-size limits for profile picture uploads and shared resources? → A: Profile picture max 5 MB; resources allow file uploads up to 10 MB
- Q: What does admin deletion of a user account do, and how is a deleted user's community ownership handled? → A: Hard delete the user and cascade-delete their owned content; if the user owns/administers a community, ownership MUST be transferred to another member/admin, or the user MUST forfeit ownership, before the deletion can proceed.
- Q: What expected scale (concurrent users, community/data volume) should this specification target? → A: Deferred to `/speckit.plan`; not specified at the spec level.
- Q: How should discussion, resource, and community search result lists be displayed when there are many items? → A: Paginated lists with a fixed page size per page (communities, discussions/posts) and explicit page navigation.
- Q: Can a user disable all notification categories entirely? → A: Yes — users may disable all notification categories; there is no enforced minimum-required category.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Account Creation & Login (Priority: P1)

A new visitor creates an account with a unique email and password, then logs in to reach their profile page. This is the entry point for every other capability on the platform.

**Why this priority**: No other feature is reachable without an authenticated identity; this is the foundational MVP slice.

**Independent Test**: Can be fully tested by registering a new account, logging out, and logging back in with the same credentials, independent of any other feature.

**Acceptance Scenarios**:

1. **Given** no account exists for an email, **When** a user registers with that email and a password, **Then** the account is created and the user receives a confirmation code (printed to server console in this build).
2. **Given** a registered account, **When** the user logs in with the correct email and password, **Then** they are redirected to their profile page.
3. **Given** a registered account, **When** a user attempts to register again with the same email, **Then** registration is rejected with a clear "email already in use" error.
4. **Given** a registered account, **When** a user logs in with an incorrect password, **Then** login is rejected with a clear "invalid credentials" error and no indication of which field was wrong.
5. **Given** a user has forgotten their password, **When** they request a reset, **Then** a single-use, time-limited reset code is generated (printed to server console in this build) and the password can be updated using it.

---

### User Story 2 - Profile Management (Priority: P1)

A logged-in user edits their profile information, uploads a profile picture, and views their own platform activity.

**Why this priority**: Profile identity underpins community membership, discussion authorship, and admin management; required for a usable MVP alongside auth.

**Independent Test**: Can be fully tested by logging in, editing display fields, uploading an avatar, and viewing the activity section, independent of community/discussion features.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they update editable profile fields, **Then** the changes are saved and confirmed with a success message.
2. **Given** a logged-in user, **When** they upload a profile picture within the size limit, **Then** the picture is saved and displayed on their profile.
3. **Given** a logged-in user, **When** they attempt to upload a profile picture exceeding the maximum size limit, **Then** the upload is rejected with a clear file-size error.
4. **Given** a logged-in user, **When** they attempt to change their email address, **Then** the system rejects the change since email is immutable.
5. **Given** a logged-in user, **When** they view their profile, **Then** they can see a summary of their activity on the platform (e.g., posts, joined communities).

---

### User Story 3 - Community Creation & Invitations (Priority: P1)

A logged-in user creates a new community (public or private) and invites other users to join it.

**Why this priority**: Communities are the organizing structure for all discussion and resource-sharing features; required for MVP.

**Independent Test**: Can be fully tested by creating a community with a unique name, inviting another existing user, and confirming the invite appears for them, independent of discussion/resource features.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they create a community with a name not already in use, **Then** the community is created and the user becomes its owner/first member.
2. **Given** an existing community name, **When** a user attempts to create another community with that same name, **Then** creation is rejected with a clear "name already exists" error.
3. **Given** a community the user owns or administers, **When** they invite another registered user who is not already a member, **Then** the invitation is sent/recorded.
4. **Given** a community member, **When** a community owner attempts to invite them again, **Then** the invitation is rejected with a clear "already a member" error.
5. **Given** a community owner, **When** they edit the community's information (name, description, visibility), **Then** the changes are saved and reflected to members.

---

### User Story 4 - Joining Communities & Participating in Discussions (Priority: P1)

A logged-in user browses communities, joins a public one (or accepts an invitation to a private one), and participates in discussions within it.

**Why this priority**: This is the core value loop of the platform (discussion participation); required for MVP alongside community creation.

**Independent Test**: Can be fully tested by joining a public community and posting/replying to a discussion, independent of resource-sharing or engagement features.

**Acceptance Scenarios**:

1. **Given** a public community, **When** a non-member user requests to join, **Then** they become a member immediately.
2. **Given** a private community, **When** a non-invited user attempts to join, **Then** the join attempt is rejected.
3. **Given** a community member, **When** they create a discussion post or reply within that community, **Then** the post is published and visible to other members.
4. **Given** a non-member of a community, **When** they attempt to post or reply in that community's discussions, **Then** the action is rejected.
5. **Given** a logged-in user, **When** they search for communities using keywords, **Then** matching communities are returned (public communities only, unless the user is already a member of a matching private one).

---

### User Story 5 - Sharing Resources (Priority: P2)

A community member shares articles, videos, or other resource links within a community, and other members can view shared resources.

**Why this priority**: Resource sharing extends the core discussion value but is not required to prove the MVP loop of joining and discussing.

**Independent Test**: Can be fully tested by sharing a resource in a community and confirming another member can view it, independent of likes/bookmarks/search.

**Acceptance Scenarios**:

1. **Given** a community member, **When** they share a resource (article/video/link) within the size limit, **Then** it is published and visible to other members of that community.
2. **Given** a community member, **When** they attempt to share a resource exceeding the maximum size limit, **Then** the share is rejected with a clear file-size error.
3. **Given** a community member, **When** they attempt to share flagged/inappropriate content, **Then** the share is rejected or routed to moderation per platform content rules.
4. **Given** a community member, **When** they browse the community's resource list, **Then** they see all resources shared by other members of that community.

---

### User Story 6 - Admin Management of Communities & Users (Priority: P2)

An administrator manages the platform by editing or deleting communities and users.

**Why this priority**: Admin oversight is necessary for platform health but is not part of the end-user MVP loop; depends on communities/users already existing.

**Independent Test**: Can be fully tested by an admin account deleting a test community with no active discussions and editing a test user's non-email profile fields, independent of end-user discussion flows.

**Acceptance Scenarios**:

1. **Given** an admin account, **When** they delete a community that has no active/unresolved discussions, **Then** the community and its data are removed.
2. **Given** an admin account, **When** they attempt to delete a community with active discussions, **Then** the deletion is rejected (or requires an explicit override step) until discussions are resolved.
3. **Given** an admin account, **When** they delete a user account that owns no communities, **Then** the user and their content are permanently removed (hard delete, cascade-deleted).
3a. **Given** an admin account, **When** they attempt to delete a user who owns/administers one or more communities, **Then** the deletion is rejected until ownership of those communities is transferred to another member/admin or explicitly forfeited by the user.
4. **Given** an admin account, **When** they edit community or user information, **Then** the changes are saved, except that a user's email address MUST remain unchanged.
5. **Given** a non-admin user, **When** they attempt to access admin management actions, **Then** access is denied.

---

### User Story 7 - Notifications for Community Activity (Priority: P3)

A community member receives notifications about new discussions and resources in their communities and can manage notification preferences.

**Why this priority**: Enhances engagement and retention but the platform is usable without it; depends on communities/discussions/resources already existing.

**Independent Test**: Can be fully tested by posting a discussion in a community and confirming other members receive a notification, independent of messaging/search features.

**Acceptance Scenarios**:

1. **Given** a community member, **When** a new discussion or resource is posted in their community, **Then** they receive a notification.
2. **Given** a user who has left a community, **When** new activity occurs in that community, **Then** they do not receive a notification for it.
3. **Given** a logged-in user, **When** they open notification settings, **Then** they can adjust preferences per category, including disabling all notification categories entirely if desired.

---

### User Story 8 - Search & Filter Within a Community (Priority: P2)

A community member searches and filters discussions and resources within a community by keyword and resource type.

**Why this priority**: Improves discoverability of existing content; valuable but not required to prove the core MVP loop.

**Independent Test**: Can be fully tested by searching for a known discussion/resource by keyword within a community the user belongs to, independent of notifications/messaging.

**Acceptance Scenarios**:

1. **Given** a community member, **When** they search discussions or resources by keyword, **Then** relevant results from that community are returned quickly.
2. **Given** a community member, **When** a search returns no results, **Then** a helpful "no results found" message is shown.
3. **Given** a logged-in user who is not a member of a private community, **When** they attempt to search content within it, **Then** no results from that private community are returned.
4. **Given** a community member, **When** they filter resources by type (e.g., article, video), **Then** only matching resources are shown.

---

### User Story 9 - Liking / Upvoting Content (Priority: P3)

A community member likes or upvotes a discussion or resource and can see the total like count.

**Why this priority**: Lightweight engagement signal; nice-to-have on top of the core discussion/resource features.

**Independent Test**: Can be fully tested by liking a post once and confirming the count increments and a second like attempt is blocked, independent of bookmarking/reporting.

**Acceptance Scenarios**:

1. **Given** a community member viewing a post, **When** they like it, **Then** the like count increments and they see immediate visual feedback.
2. **Given** a post the user has already liked, **When** they attempt to like it again, **Then** the duplicate like is rejected (the UI instead allows unliking).
3. **Given** a post the user has liked, **When** they unlike it, **Then** the like count decrements accordingly.

---

### User Story 10 - Saving / Bookmarking Content (Priority: P3)

A community member saves or bookmarks discussions and resources for later viewing from a dedicated profile section.

**Why this priority**: Convenience feature for returning users; not required for the core MVP loop.

**Independent Test**: Can be fully tested by bookmarking a post and viewing it later from the saved-items section, independent of likes/reporting.

**Acceptance Scenarios**:

1. **Given** a community member, **When** they save a discussion or resource, **Then** it appears in their dedicated saved-items profile section.
2. **Given** a saved item, **When** the user removes it from their saved list, **Then** it no longer appears there.
3. **Given** a saved item whose original post has been deleted by an admin, **When** the user views their saved list, **Then** the deleted item is not shown.

---

### User Story 11 - Reporting Inappropriate Content (Priority: P2)

A community member flags inappropriate discussions, resources, or comments for admin review; an admin reviews and acts on reports via a dashboard.

**Why this priority**: Essential for platform health and the constitution's human-driven moderation principle, but depends on discussions/resources already existing.

**Independent Test**: Can be fully tested by reporting a post, confirming it is hidden only for the reporting user, and confirming it appears on the admin reports dashboard, independent of messaging/notifications.

**Acceptance Scenarios**:

1. **Given** a community member, **When** they flag a post, resource, or comment with a reason, **Then** they receive a confirmation that the report was submitted, and the content is hidden only for them pending review.
2. **Given** a user, **When** they attempt to report the same piece of content a second time, **Then** the duplicate report is rejected.
3. **Given** a user, **When** they attempt to report their own content, **Then** the report is rejected.
4. **Given** an admin, **When** they open the reports dashboard, **Then** they see all pending reports and can dismiss a report or remove the offending content.

---

### User Story 12 - Direct Messaging Between Members (Priority: P3)

A user initiates a 1-on-1 private chat with another community member and views conversation history from an inbox.

**Why this priority**: Valuable but most complex/least foundational capability; not required for the core community/discussion MVP loop. Real-time delivery is an optional enhancement, not MVP-blocking, per the Roundtable Constitution (Principle VII).

**Independent Test**: Can be fully tested by two users who share a joined community exchanging messages and viewing them in chronological order in their respective inboxes, independent of all other features.

**Acceptance Scenarios**:

1. **Given** two users who are members of at least one shared community, **When** one initiates a private chat with the other, **Then** a conversation is created and messages can be exchanged.
2. **Given** an existing conversation, **When** a user opens their inbox, **Then** they see all active conversations and message history ordered chronologically, with sent and received messages visually distinguished.
3. **Given** a user who shares no community with another user, **When** they attempt to message that user, **Then** the attempt is rejected.
4. **Given** a compose box, **When** a user attempts to send an empty message, **Then** the send is rejected.
5. **Given** a new message arrives, **When** the recipient has not yet read it, **Then** an unread-message indicator/badge is shown (real-time delivery via WebSockets is an optional enhancement in this version).

### Edge Cases

- What happens when a user tries to join a community that has been deleted by an admin while their join request was pending?
- How does the system handle a password-reset code that has expired or already been used?
- Resolved: An admin cannot delete a user who owns/administers communities until ownership is transferred to another member/admin or forfeited by the user (see Clarifications).
- How does the system handle a search query within a community the user just left (mid-session)?
- What happens when a reported piece of content is removed by an admin while other users still have it bookmarked?
- How does the system handle a profile picture upload that is not a valid image file?
- What happens when a user is removed from a community that they currently have an open direct-message conversation referencing?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a visitor to register a new account with a unique email and a password.
- **FR-002**: System MUST reject registration attempts using an email already associated with an existing account, with a clear error message.
- **FR-003**: System MUST allow a registered user to log in with their email and password and be redirected to their profile page on success.
- **FR-004**: System MUST reject login attempts with incorrect credentials, with a clear error message that does not reveal which field was incorrect.
- **FR-005**: System MUST allow a user to request a password reset and complete it using a time-limited, single-use reset code.
- **FR-006**: System MUST generate an account-creation confirmation code and password-reset codes via the email-generation mechanism, printed to the server console in this build (no live SMTP transport required).
- **FR-007**: System MUST allow a logged-in user to edit their own profile information, excluding their email address, which MUST remain immutable after account creation.
- **FR-008**: System MUST allow a logged-in user to upload a profile picture, rejecting uploads that exceed the maximum allowed file size of 5 MB.
- **FR-009**: System MUST allow a logged-in user to view a summary of their own activity on the platform.
- **FR-010**: System MUST allow a logged-in user to create a new community with a unique name, selecting public or private visibility.
- **FR-011**: System MUST reject community creation when the requested name already exists.
- **FR-012**: System MUST allow a community owner/admin to invite other registered users to their community, rejecting invitations to users who are already members.
- **FR-013**: System MUST allow a community owner/admin to edit their community's information.
- **FR-014**: System MUST allow any user to join a public community, and MUST restrict joining a private community to users who have received an invitation.
- **FR-015**: System MUST allow community members to create discussion posts and replies within communities they belong to, and MUST reject discussion participation from non-members.
- **FR-016**: System MUST allow a logged-in user to search for communities by keyword, returning only public communities and private communities the user already belongs to, displayed as a paginated list with a fixed page size and explicit page navigation.
- **FR-017**: System MUST allow community members to share resources (articles, videos, other links) within a community, rejecting file-based resource uploads that exceed the maximum size limit of 10 MB.
- **FR-018**: System MUST allow community members to view resources shared by other members of communities they belong to.
- **FR-019**: System MUST provide an admin-only capability to permanently delete communities and users (hard delete, cascading to owned content), MUST reject deleting a community that has active/unresolved discussions without an explicit override, and MUST reject deleting a user who owns/administers one or more communities until ownership is transferred to another member/admin or explicitly forfeited.
- **FR-020**: System MUST provide an admin-only capability to edit community and user information, excluding a user's email address, which admins MUST NOT be able to change.
- **FR-021**: System MUST restrict all admin-only management actions to users whose `role` is `admin`, enforced server-side.
- **FR-022**: System MUST notify community members of new discussions and resources posted in communities they belong to, and MUST NOT notify users about communities they have left.
- **FR-023**: System MUST allow users to manage their notification preferences per category, including the ability to disable all notification categories entirely.
- **FR-024**: System MUST allow community members to search discussions and resources within a community by keyword, and to filter resources by type, displaying results as a paginated list with a fixed page size and explicit page navigation.
- **FR-025**: System MUST display a helpful message when a search returns no results, and MUST exclude private-community content from search results for non-members.
- **FR-026**: System MUST allow a community member to like a discussion or resource once, display the total like count, and allow the member to remove (unlike) their own like; duplicate likes by the same user on the same content MUST be rejected.
- **FR-027**: System MUST allow a user to save/bookmark a discussion or resource, view saved items from a dedicated profile section, and remove items from that list; saved items whose original post was deleted by an admin MUST NOT be shown.
- **FR-028**: System MUST allow a user to flag/report a discussion, resource, or comment with a reason, hide the reported content only for the reporting user pending review, and confirm submission to the reporter; duplicate reports and self-reports by the same user MUST be rejected.
- **FR-029**: System MUST provide admins a dashboard of all reported content, allowing them to dismiss a report or remove the offending content.
- **FR-030**: System MUST allow a user to initiate a 1-on-1 private conversation with another user with whom they share at least one joined community, and MUST reject messaging attempts to users with no shared community.
- **FR-031**: System MUST provide an inbox showing a user's active conversations and chronological message history, visually distinguishing sent and received messages, and MUST reject sending empty messages.
- **FR-032**: System MUST surface an explicit, user-appropriate success or error message for every validation outcome described above (per Roundtable Constitution Principle III), and MUST NOT expose raw internal errors to end users.
- **FR-033**: System MUST enforce every access-control and membership rule described above (private-community gating, admin-only actions, message-eligibility) at the API layer, not only in the UI (per Roundtable Constitution Principles I and IV).

### Key Entities *(include if feature involves data)*

- **User**: A platform account with unique email, hashed password, profile fields, an immutable email, and a `role` (`user` | `admin`) that is never self-assignable or publicly registerable as admin.
- **UserProfile**: Editable profile details (display name, bio, avatar) and a read-only view of the user's own activity.
- **PasswordResetToken**: A short-lived, single-use token tied to a user, used to authorize a password change without the session credential.
- **EmailVerificationCode**: A code generated at registration to confirm account creation, delivered via console output in this build.
- **Community**: A named, uniquely-titled group with public/private visibility, owned/administered by one or more users, containing discussions and resources.
- **Membership**: The relationship between a User and a Community (including pending invitations for private communities).
- **Invitation**: A pending request for a non-member to join a specific community.
- **Discussion**: A post (and its replies/comments) created by a community member within a specific community.
- **Comment**: A reply authored by a community member on a specific Discussion, independently reportable and subject to the same membership/visibility rules as its parent Discussion.
- **Resource**: A shared article, video, or link, attributed to a community member within a specific community, with an associated type and size constraint.
- **Report**: A flag raised by a user against a Discussion, Resource, or Comment, including a reason, status (pending/dismissed/removed), and the reporting user.
- **Notification**: A record of community activity (new discussion/resource) relevant to a user, with read/unread state, distinct from transient UI toasts.
- **NotificationPreference**: A user's per-category settings controlling which notifications they receive, including the ability to disable all categories.
- **Like**: A single user's like/upvote on a Discussion or Resource, unique per (user, content) pair.
- **Bookmark**: A saved reference from a user to a Discussion or Resource, removed automatically if the underlying content is deleted.
- **Conversation**: A 1-on-1 private messaging thread between two users who share at least one community.
- **Message**: A single chronological, non-empty text entry within a Conversation, with sent/read state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete registration and reach their profile page in under 2 minutes.
- **SC-002**: A user can create a community and have it visible to invited members in under 1 minute.
- **SC-003**: 95% of keyword searches within a community return results (or a clear "no results" message) in under 2 seconds.
- **SC-004**: 100% of validation failures described in the Functional Requirements produce a specific, user-readable error message rather than a generic or silent failure.
- **SC-005**: 100% of private-community content remains inaccessible to non-members across discussion, resource, and search surfaces, verified by access-control testing.
- **SC-006**: Reported content is visible to admins on the moderation dashboard within the same session it was reported, with no automated-ML moderation involved.
- **SC-007**: A user can send and receive a direct message with a fellow community member and see it reflected in both inboxes without manual page reload (within optional real-time constraints) or upon next refresh at minimum.
- **SC-008**: 90% of first-time users successfully complete their first primary action (join a community or create one) without needing external help.
- **SC-009**: All paginated lists (community search, discussion/resource listings) display a fixed, consistent page size with working page navigation across the platform.

## Assumptions

- The Roundtable Constitution v1.1.0 (`.specify/memory/constitution.md`) governs all technical boundaries referenced indirectly here (security, accessibility, validation, privacy, state management, moderation, and scope discipline); this specification does not restate implementation-level technology choices.
- `round_table.md` (US-1 through US-12) is the sole source of truth for functional scope; `Discussify (1).pdf` is explicitly excluded.
- Email delivery (confirmation, password reset) is simulated via console-printed codes in this build; no live SMTP integration is in scope.
- The `admin` role is assigned manually/for testing only and is never exposed via public registration or self-service role escalation.
- Real-time message delivery (WebSockets), typing indicators, and read receipts are optional enhancements and are not required for MVP acceptance.
- Group messaging and file attachments in direct messages are out of scope for this version.
- Automated machine-learning content moderation is out of scope; all moderation is human/admin-driven via the reporting and dashboard flow.
- Maximum file-size limits are fixed at 5 MB for profile pictures and 10 MB for file-based shared resources.
