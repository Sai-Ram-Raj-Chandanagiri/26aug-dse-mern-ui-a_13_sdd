# Roundtable Requirements Document

## EPIC
Roundtable is a social platform that allows users to create communities, join discussions, and share resources with others. It is a MERN STACK technology-based web application that is designed to cater to the needs of individuals who want to connect with like-minded people, share their thoughts, and engage in meaningful conversations.

The application is of professional complexity, and it offers a range of features that make it easy for users to interact with each other. The user interface is simple and intuitive, making it easy for even the most technologically challenged individuals to use the platform. Users can create their profiles, join communities, participate in discussions, share and bookmark resources, receive real-time notifications, report inappropriate content, and communicate directly with fellow community members.

One of the key features of Roundtable is the ability to create and manage communities. Users can create their own communities based on their interests and invite others to join. This feature allows users to connect with people who share similar interests and engage in discussions on topics that they are passionate about. The communities can be public or private, depending on the user's preference, and creators can manage members or transfer ownership when needed.

Another important feature of Roundtable is the ability to join discussions. Users can browse through the various communities and join discussions on topics that interest them. They can share their thoughts, ask questions, like helpful posts, and engage in debates with other members of the community. This feature allows users to learn from others, broaden their horizons, and gain new perspectives on various topics.

Finally, Roundtable allows users to share resources with others. Users can share articles, videos, and other resources that they find interesting or informative, and bookmark discussions or resources for later viewing. This feature allows users to learn from each other and stay up-to-date on the latest trends and developments in their respective fields.

Overall, Roundtable is a powerful social platform that is designed to connect people, foster meaningful conversations, and facilitate the sharing of resources. Its MERN STACK technology-based web application ensures that it is fast, reliable, and easy to use. With its range of features and professional complexity, Roundtable is sure to become a go-to platform for individuals who want to connect with others, share their thoughts, and engage in meaningful discussions.

---

## OVERALL REQUIREMENTS
The web app shown in the reference video only shows the minimum requirements for the application. Aspects like web accessibility which leads to a better user experience, better error handling, etc. should also be implemented. Your implementation of the Roundtable web app should be an improvisation of it.

1. Use GIT for code integration and management. At least one git push per trainee, per day is required.
2. Use Material Design components wherever necessary.
3. Add appropriate validations wherever necessary. For example, you should be validating password complexity, valid HTTP(S) URLs and character limits for shared resources, and case-insensitive uniqueness for community names and usernames.
4. Appropriate error messages should be provided for any such validations done above.
5. The Error or Success messages should be populated based on the requirement and should be appropriate.
6. There should not be any spelling or grammatical mistakes.
7. The website should have a uniform color theme.
8. Refer to the `styles.css` file for styling your web app.
9. Make web accessibility a part of your design and development. The reference video does not implement this.

---

## PRODUCT BACKLOG

### User Story - 1: Account Creation and Login

| Field | Details |
| :--- | :--- |
| **Description** | As a new user, I should be able to create an account, log in, log out, and recover a forgotten password so that I can securely access the platform. |
| **Story Points** | 5 |
| **Must Have** | 1. User should be able to create a new account with a unique email, password, and optional username (defaulting to a unique handle derived from the email prefix if omitted: disallowed characters are removed, the result is padded or trimmed to 3 to 30 characters, and a numeric suffix is added on collision).<br>2. User should be able to log in to the platform using their email and password.<br>3. User should be able to securely log out of the platform, clearing their active session cookie. |
| **Should Have** | 1. User should be able to request a password reset link via email and reset their password if forgotten.<br>2. All existing active sessions should be automatically invalidated when a user resets their password. |
| **Could Have** | None. |
| **Won't Have** | 1. Third-party OAuth social login (e.g., Google, GitHub). |
| **Acceptance Criteria (Dos / Positive)** | 1. A confirmation email should be sent upon successful account creation when email delivery is configured (delivery is best-effort and must never block registration).<br>2. User should be redirected to their profile page upon successful login.<br>3. User should receive a password reset link (valid for 15 minutes) when requesting a forgotten password reset.<br>4. User session cookie should be cleared immediately upon logging out. |
| **Acceptance Criteria (Don'ts / Negative)** | 1. User should not be able to create an account with an existing email or duplicate username.<br>2. User should not be able to register with a weak password (must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character from `@$!%*?&`).<br>3. User should not be able to log in with incorrect credentials, and forgot-password responses must not reveal whether an email address is registered. |

---

### User Story - 2: Profile Management

| Field | Details |
| :--- | :--- |
| **Description** | As a user, I should be able to create and manage my profile and review my platform activity. |
| **Story Points** | 3 |
| **Must Have** | 1. User should be able to edit their profile information (username and bio).<br>2. User should be able to upload a profile picture. |
| **Should Have** | 1. User should be able to view their activity on the platform (created communities, discussions, comments, and shared resources). |
| **Could Have** | 1. Live character counter for username (3–30 chars) and bio (up to 200 chars). |
| **Won't Have** | 1. Email address modification after registration. |
| **Acceptance Criteria (Dos / Positive)** | 1. User should be able to successfully update their username (3–30 alphanumeric/underscore/hyphen characters, unique case-insensitively) and bio (up to 200 characters).<br>2. User should be able to upload a valid JPG, PNG, or WEBP profile picture up to 2 MB.<br>3. User should be able to see their historical activity (communities created, discussions started, comments posted, and resources shared) ordered newest first. |
| **Acceptance Criteria (Don'ts / Negative)** | 1. User should not be able to upload an image that exceeds the 2 MB size limit or uses an unsupported file format.<br>2. User should not be able to edit their email address or choose a username already taken by another user.<br>3. User should see a specific error message when a username contains invalid characters, separate from the length error. |

---

### User Story - 3: Create and Manage Communities

| Field | Details |
| :--- | :--- |
| **Description** | As a user, I should be able to create a community, manage its settings and members, and invite others to join. |
| **Story Points** | 5 |
| **Must Have** | 1. User should be able to create a new public or private community.<br>2. Community members should be able to invite other registered users via email to join the community. |
| **Should Have** | 1. Community creator should be able to edit the community information (name, description, and privacy status).<br>2. Community creator should be able to remove (kick) a member or transfer community ownership to another existing member.<br>3. Community creator should be able to view the community's member list to choose a member to remove or promote.<br>4. Community creator should be able to delete their own community if it has no discussions. |
| **Could Have** | None. |
| **Won't Have** | 1. Multiple co-owners per community (only one creator/owner at a time). |
| **Acceptance Criteria (Dos / Positive)** | 1. User should be able to successfully create a new community (name 3–50 chars, description up to 300 chars) and automatically become its creator and first member.<br>2. Members should be able to invite registered users by email, adding them to `invitedUsers` and sending them an invitation notification.<br>3. Switching a community from private to public should automatically clear pending invitations and set related invitation notifications to the `resolved` status and mark them as read.<br>4. Creator should be able to transfer ownership to another member so the original creator can leave if desired. |
| **Acceptance Criteria (Don'ts / Negative)** | 1. User should not be able to create or rename a community with a name that already exists (case-insensitive).<br>2. User should not be able to invite an unregistered email, a user who is already a member, or a user who already has a pending invitation.<br>3. Non-creators should not be able to edit community details, remove members, or transfer ownership. |

---

### User Story - 4: Join Communities and Participate in Discussions

| Field | Details |
| :--- | :--- |
| **Description** | As a user, I should be able to find, join, and leave communities and create, view, edit, or delete my discussions and comments. |
| **Story Points** | 5 |
| **Must Have** | 1. User should be able to browse communities, join a public community, and leave a community they have joined.<br>2. User should be able to view discussions (list and individual discussion details) and participate by creating discussions and posting comments.<br>3. User should be able to see which communities they have joined (membership indicators on community lists and a view of joined communities). |
| **Should Have** | 1. User should be able to search for communities based on keywords matching name or description.<br>2. User should be able to edit or delete their own discussions and comments. |
| **Could Have** | 1. Pagination for community lists and community discussion feeds. |
| **Won't Have** | 1. Nested multi-level comment threads (comments are single-level under a discussion). |
| **Acceptance Criteria (Dos / Positive)** | 1. User should be able to successfully join a public community (which also resolves any prior pending invitation) and leave a community they are a member of.<br>2. Members should be able to start discussions (title 3–100 chars, content 1–2000 chars) and add comments (1–1000 chars).<br>3. Authors should be able to update or delete their own discussions and comments. |
| **Acceptance Criteria (Don'ts / Negative)** | 1. User should not be able to join a private community without a pending invitation (an invited user may join directly from the community page, which counts as accepting the invitation).<br>2. The community creator should not be able to leave the community without first transferring ownership to another member.<br>3. User should not be able to view discussions in a private community or create discussions/comments in any community if they are not a member.<br>4. User should not be able to edit or delete discussions or comments authored by another user. |

---

### User Story - 5: Share and Manage Resources

| Field | Details |
| :--- | :--- |
| **Description** | As a user, I should be able to share, edit, and delete resources in a community and view resources shared by others. |
| **Story Points** | 3 |
| **Must Have** | 1. User should be able to share articles, videos, and other link-based resources with others in a community they belong to.<br>2. User should be able to view resources shared by others in accessible communities. |
| **Should Have** | 1. Resource authors should be able to edit or delete their own shared resources.<br>2. Duplicate link detection within the same community to prevent redundant resource spam. |
| **Could Have** | None. |
| **Won't Have** | 1. Direct binary file hosting for resources (resources are external HTTP/HTTPS URLs). |
| **Acceptance Criteria (Dos / Positive)** | 1. Community members should be able to share resources with a valid title (3–100 chars), type (`article`, `video`, or `other`), valid HTTP(S) URL (up to 2000 chars), and optional description (up to 300 chars).<br>2. Users should be able to view shared resources ordered newest first, and authors can update or delete their own shared resources. |
| **Acceptance Criteria (Don'ts / Negative)** | 1. User should not be able to share a resource whose fields exceed the maximum character length limits (title >100, link >2000, description >300 chars) or have an invalid URL format.<br>2. User should not be able to share inappropriate content matching the platform blocklist (e.g., nudity, gore, terrorism, hate speech).<br>3. User should not be able to share the exact same resource URL multiple times within the same community.<br>4. Non-members should not be able to view resources in a private community or share resources in any community they have not joined. |

---

### User Story - 6: Administration

| Field | Details |
| :--- | :--- |
| **Description** | As an admin, I should be able to manage communities and users to keep the platform healthy and appropriate. |
| **Story Points** | 8 |
| **Must Have** | 1. Admin should be able to view and delete communities and users. |
| **Should Have** | 1. Admin should be able to edit community details and user information (username, bio, role, password). |
| **Could Have** | 1. Pagination and filtering on admin user and community management lists. |
| **Won't Have** | 1. Admin ability to modify a user's registered email address or delete their own admin account. |
| **Acceptance Criteria (Dos / Positive)** | 1. Admin should be able to successfully edit and delete communities and users.<br>2. When an admin deletes a user, ownership of any communities created by that user is automatically transferred to the acting admin (who also becomes a member), and all of the deleted user's content, likes, saved items, pending reports they filed (reviewed reports are retained for audit), notifications, and conversations are cleaned up.<br>3. When an admin changes a user's password, that user's existing sessions are invalidated. |
| **Acceptance Criteria (Don'ts / Negative)** | 1. Admin should not be able to delete a community that has any discussions.<br>2. Admin should not be able to edit a user's email address.<br>3. Admin should not be able to delete their own admin account.<br>4. Admin should not be able to change their own role (this prevents a platform with no admin). |

---

### User Story - 7: Notifications

| Field | Details |
| :--- | :--- |
| **Description** | As a user, I should be able to receive and manage notifications for new discussions, shared resources, and community invitations. |
| **Story Points** | 3 |
| **Must Have** | 1. User should receive notifications for new discussions and resources in their joined communities (excluding their own posts) and for community invitations.<br>2. User should be able to accept or decline community invitations directly from their notifications, and mark notifications as read. |
| **Should Have** | 1. User should be able to manage their notification settings for discussions and resources, view unread notification counts, and mark all notifications as read at once. |
| **Could Have** | 1. Real-time notification push delivery via Socket.IO (`notification:new`). |
| **Won't Have** | 1. Disabling community invitation notifications or disabling both discussion and resource notification types simultaneously. |
| **Acceptance Criteria (Dos / Positive)** | 1. User should receive notifications for new discussions, shared resources, and community invitations, and see an accurate unread badge count.<br>2. User should be able to accept or decline a pending community invitation notification, which updates their membership/invitation state, sets the notification status to `accepted` or `declined`, and marks it as read.<br>3. User should be able to mark individual notifications or all notifications as read, and toggle discussion or resource alerts in settings. |
| **Acceptance Criteria (Don'ts / Negative)** | 1. User should not receive notifications for discussions and resources in communities they have left, or for content they authored themselves.<br>2. User should not be able to turn off all notification types at the same time (at least one of `discussionNotifications` or `resourceNotifications` must remain enabled). |

---

### User Story - 8: Search and Filter Community Content

| Field | Details |
| :--- | :--- |
| **Description** | As a user, I should be able to search and filter discussions and resources within a community. |
| **Story Points** | 3 |
| **Must Have** | 1. User should be able to search discussions by keywords matching title or content.<br>2. User should be able to search resources by keywords matching title or description. |
| **Should Have** | 1. User should be able to filter resources by type (`article`, `video`, or `other`) and combine type filters with keyword search. |
| **Could Have** | 1. Pagination support for search and filter results. |
| **Won't Have** | 1. Searching the discussions or resources of private communities the user has not joined (community names and descriptions remain discoverable through community search). |
| **Acceptance Criteria (Dos / Positive)** | 1. User should see relevant case-insensitive search and filter results quickly.<br>2. User should see an empty state with a helpful "no results" message when no items match the query. |
| **Acceptance Criteria (Don'ts / Negative)** | 1. User should not be able to search or filter content in private communities they haven't joined.<br>2. User should not be able to filter resources with an invalid resource type value. |

---

### User Story - 9: Like Discussions and Resources

| Field | Details |
| :--- | :--- |
| **Description** | As a community member, I should be able to like or unlike discussions and resources. |
| **Story Points** | 2 |
| **Must Have** | 1. Community member should be able to like a discussion or shared resource.<br>2. User should be able to see the total number of likes (`likeCount`) and whether they have liked the item (`likedByMe`). |
| **Should Have** | 1. Community member should be able to remove their like (unlike). |
| **Could Have** | 1. Optimistic UI state updates when toggling likes. |
| **Won't Have** | 1. Exposing the raw list of user IDs who liked an item in public API payloads. |
| **Acceptance Criteria (Dos / Positive)** | 1. User should see immediate visual feedback and updated `likeCount` when liking or unliking a post. |
| **Acceptance Criteria (Don'ts / Negative)** | 1. User should not be able to like the same discussion or resource multiple times, or unlike an item they have not liked.<br>2. Non-members of a community should not be able to like or unlike discussions or resources in that community. |

---

### User Story - 10: Save Content for Later

| Field | Details |
| :--- | :--- |
| **Description** | As a user, I should be able to save or bookmark discussions and resources for later viewing. |
| **Story Points** | 3 |
| **Must Have** | 1. User should be able to save a discussion or resource from any community they have access to.<br>2. User should have a dedicated profile section to view their saved discussions and resources ordered newest-saved first. |
| **Should Have** | 1. User should be able to remove items from their saved list (unsave) and see `savedByMe` indicators on community feeds.<br>2. Saved items should be automatically hidden when a public community transitions to private and the user is not a member. |
| **Could Have** | None. |
| **Won't Have** | 1. Custom bookmark folders or tags. |
| **Acceptance Criteria (Dos / Positive)** | 1. User should be able to easily save/unsave content and access their saved items from their profile/navigation menu. |
| **Acceptance Criteria (Don'ts / Negative)** | 1. User should not be able to save content from a private community they have not joined, or save the same item twice.<br>2. User should not see posts in their saved list if the original content was deleted or belongs to a private community the user is not currently a member of. |

---

### User Story - 11: Report Inappropriate Content

| Field | Details |
| :--- | :--- |
| **Description** | As a user, I should be able to report inappropriate discussions, comments, or resources to the administrators for review and removal. |
| **Story Points** | 5 |
| **Must Have** | 1. User should be able to flag a discussion, comment, or resource for review in any community they can view.<br>2. Admin should be able to view a dashboard of all reported content with preserved content snapshots and filter by report status (`pending`, `dismissed`, `removed`, `all`). |
| **Should Have** | 1. User should be able to select a required reason for the report (`spam`, `harassment`, `hate_speech`, `inappropriate`, `other`) and provide optional details (up to 300 chars).<br>2. Admin should be able to dismiss the report or remove the offending content. |
| **Could Have** | 1. Rate limiting on report submissions to prevent abuse. |
| **Won't Have** | 1. Automated machine learning content moderation. |
| **Acceptance Criteria (Dos / Positive)** | 1. User should receive a confirmation message that their report has been submitted.<br>2. Reported content should be hidden from the reporting user's own list responses while the report is pending, reappear if dismissed, and remain permanently removed if deleted by an admin.<br>3. Admin report listings must preserve a snapshot of the reported content so historical removed reports remain auditable. Reports must survive deletion of the reporter or the community: the reporter's username and the community name are snapshotted, and reviewed (dismissed or removed) reports are retained. |
| **Acceptance Criteria (Don'ts / Negative)** | 1. User should not be able to report the same piece of content multiple times.<br>2. User should not be able to report their own content or report content in a private community they have not joined.<br>3. Admin should not be able to review a report that has already been dismissed or had its content removed. |

---

### User Story - 12: Direct Messaging

| Field | Details |
| :--- | :--- |
| **Description** | As a user, I should be able to view community members and send direct messages to other members of my communities. |
| **Story Points** | 8 |
| **Must Have** | 1. Community member should be able to view the member list of a community they belong to in order to select a recipient (the same member list is used by community creators in Story 3).<br>2. User should be able to initiate a 1-on-1 private chat with another member of a shared community and view active conversations and paginated message history in an inbox. |
| **Should Have** | 1. Messages and read receipts should be delivered and updated in real-time via Socket.IO (`message:new`, `messages:read`).<br>2. Users should see an unread message indicator/badge and be able to mark conversations as read. |
| **Could Have** | 1. Rate limiting on direct message sending to prevent spam. |
| **Won't Have** | 1. Group messaging or sending file attachments in messages. |
| **Acceptance Criteria (Dos / Positive)** | 1. Messages should be clearly ordered chronologically (newest page first, ordered oldest-to-newest within each page).<br>2. UI should clearly distinguish between sent and received messages, and existing conversation history should remain readable even if participants later stop sharing a community. |
| **Acceptance Criteria (Don'ts / Negative)** | 1. User should not be able to view the member list of a community they have not joined.<br>2. User should not be able to message themselves or send a message to someone with whom they do not currently share at least one common community.<br>3. User should not be able to send empty messages or messages exceeding 1000 characters after trimming.<br>4. User should not be able to view, message, or mark as read a conversation they are not a participant in. |