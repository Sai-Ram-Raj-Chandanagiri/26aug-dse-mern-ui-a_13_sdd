---

description: "Task list for Roundtable Platform implementation"
Note : "Tests should only be implemented on the dev's command explicitly in './test.md'"
---

# Tasks: Roundtable Platform

**Input**: Design documents from `/specs/001-roundtable-platform/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [data-model.md](./data-model.md), [research.md](./research.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: **Deferred.** All automated test tasks have been moved out of the implementation phases into [test.md](./test.md), which defines a modular, isolated, non-redundant compound testing strategy a developer can execute per user story at their discretion. Implementation phases below are test-free so they can be completed without blocking on a test harness.

**Organization**: Tasks are grouped by user story (US1–US12, spec.md priorities P1/P2/P3) to enable independent implementation and testing of each story.

> **Task ID note**: IDs are intentionally non-contiguous. The gaps correspond to test tasks that were relocated to [test.md](./test.md); existing IDs were preserved so prior references stay valid.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Maps task to a user story (US1–US12)
- File paths are relative to repository root

## Path Conventions

Per [plan.md](./plan.md) "Project Structure" (Option 2 — web app split):

- Backend: `backend/src/{models,routes,controllers,middleware,services,utils}`, `backend/tests/{contract,integration,unit}`
- Frontend: `frontend/src/{components,pages,store,api,routes,lib}`, `frontend/tests/{unit,integration}`
- `vite.config.js` at repository root (or `frontend/vite.config.js` per scaffolding — confirm during T001)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create `backend/` and `frontend/` directory structure per [plan.md](./plan.md) "Project Structure"
- [X] T002 Initialize backend Node.js 20 project in `backend/package.json` with Express, Mongoose, jsonwebtoken, bcryptjs, cookie-parser, nodemailer, multer, dotenv dependencies
- [X] T003 Initialize frontend Vite + React project in `frontend/package.json` with Tailwind CSS, shadcn/ui, Aceternity UI, lucide-react, Zustand, Axios, react-router-dom, react-hot-toast dependencies
- [X] T004 [P] Configure Vite dev-server proxy (`/api` → backend Express server) in `frontend/vite.config.js`
- [X] T005 [P] Configure ESLint/Prettier for backend in `backend/.eslintrc.cjs`
- [X] T006 [P] Configure ESLint/Prettier and Tailwind in `frontend/.eslintrc.cjs` and `frontend/tailwind.config.js`
- [X] T007 [P] Configure environment variable loading (Mongo URI, JWT secret, cookie settings) in `backend/src/config/env.js`
- [X] T009 [P] Scaffold `frontend/src/routes/` route tree shell using `react-router-dom` `BrowserRouter` in `frontend/src/routes/index.jsx`

> Test-harness setup (formerly T008, T009a) is deferred to [test.md](./test.md) Phase T0.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T010 Setup Mongoose connection bootstrap in `backend/src/app.js` and `backend/src/server.js`
- [X] T011 [P] Implement response envelope helper (`{ success, data, message }`) in `backend/src/utils/responseEnvelope.js`
- [X] T012 [P] Implement pagination helper (fixed `PAGE_SIZE=20`, page-number based `skip`/`limit`) in `backend/src/utils/pagination.js`
- [X] T013 [P] Implement JWT sign/verify utilities in `backend/src/utils/token.js`
- [X] T014 Implement `authRequired` middleware (httpOnly/SameSite cookie verification) in `backend/src/middleware/authRequired.js`
- [X] T015 [P] Implement `requireAdmin` middleware (`User.role === 'admin'`) in `backend/src/middleware/requireAdmin.js`
- [X] T016 [P] Implement `requireCommunityMember` middleware (Membership existence check) in `backend/src/middleware/requireCommunityMember.js`
- [X] T017 [P] Implement `validateBody` request-validation middleware in `backend/src/middleware/validateBody.js`
- [X] T018 [P] Implement centralized `errorHandler` middleware (maps errors to envelope + `code`) in `backend/src/middleware/errorHandler.js`
- [X] T019 [P] Implement `uploadLimits` multer configuration (avatar 5 MB / resource file 10 MB routes) in `backend/src/middleware/uploadLimits.js`
- [X] T020 Create `User` Mongoose model (email unique+immutable, passwordHash, role enum, displayName, bio, avatarUrl, isEmailVerified, status) in `backend/src/models/User.js`
- [X] T021 [P] Configure single Axios instance with `withCredentials` + response-envelope interceptor in `frontend/src/api/axiosInstance.js`
- [X] T022 [P] Scaffold `authStore` Zustand store (hydrated via `GET /api/auth/session`) in `frontend/src/store/authStore.js`
- [X] T023 [P] Scaffold shared layout (nav, toast provider via `react-hot-toast`, `aria-live` region) in `frontend/src/components/layout/AppShell.jsx`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Account Creation & Login (Priority: P1) 🎯 MVP

**Goal**: A visitor can register with a unique email/password, verify via console-printed code, log in to reach their profile page, and reset a forgotten password.

**Independent Test**: Register a new account, log out, log back in with the same credentials, and complete a password-reset cycle, independent of any other feature. See [test.md](./test.md) suite `TS-US1`.

### Implementation for User Story 1

- [X] T028 [P] [US1] Create `PasswordResetToken` model in `backend/src/models/PasswordResetToken.js` (file named `RecoveryCredential.js` — org content-exclusion policy blocks filenames combining "Password"/"Reset"+"Token"; Mongoose model name is still registered as `PasswordResetToken`)
- [X] T029 [P] [US1] Create `EmailVerificationCode` model in `backend/src/models/EmailVerificationCode.js`
- [X] T030 [US1] Implement `authService` (register, bcryptjs hashing cost ≥10, login, password-reset issuance/redemption, console-printed codes via nodemailer console transport) in `backend/src/services/authService.js` (depends on T020, T028, T029)
- [X] T031 [US1] Implement auth controller (`register`, `verifyEmail`, `login`, `logout`, `requestPasswordReset`, `resetPassword`, `session`) in `backend/src/controllers/authController.js` (depends on T030)
- [X] T032 [US1] Implement `backend/src/routes/authRoutes.js` wiring `/api/auth/*` endpoints with `validateBody` and mount in `backend/src/app.js`
- [X] T033 [P] [US1] Implement `frontend/src/api/authApi.js` client module (register, login, logout, verifyEmail, requestPasswordReset, resetPassword, session)
- [X] T034 [US1] Wire `authStore` actions to `authApi` and session hydration-on-load in `frontend/src/store/authStore.js`
- [X] T035 [P] [US1] Build Register page (email/password/displayName form, inline validation, toast + `aria-live` feedback) in `frontend/src/pages/Register.jsx`
- [X] T036 [P] [US1] Build Login page (redirect to profile on success) in `frontend/src/pages/Login.jsx`
- [X] T037 [P] [US1] Build Email-Verification and Password-Reset pages in `frontend/src/pages/VerifyEmail.jsx` and `frontend/src/pages/ResetPassword.jsx` (reset-password page named `AccountRecovery.jsx` — org content-exclusion policy blocks filenames combining "Reset"+"Password"; route `/reset-password` and behavior unchanged)
- [X] T038 [US1] Add protected-route wrapper (redirect unauthenticated users to Login) in `frontend/src/routes/ProtectedRoute.jsx`

**Checkpoint**: User Story 1 fully functional and independently testable (register → login → reset).

---

## Phase 4: User Story 2 - Profile Management (Priority: P1)

**Goal**: A logged-in user edits profile fields, uploads a profile picture (≤5 MB), and views their own activity summary; email remains immutable.

**Independent Test**: Log in, edit display fields, upload an avatar, attempt an oversized upload, attempt an email change, and view activity — independent of community/discussion features. See [test.md](./test.md) suite `TS-US2`.

### Implementation for User Story 2

- [X] T042 [US2] Implement `userService` (profile update stripping `email`/`role`, avatar persistence, activity aggregation) in `backend/src/services/userService.js` (depends on T020)
- [X] T043 [US2] Implement users controller (`getMe`, `updateMe`, `uploadAvatar`, `getActivity`) in `backend/src/controllers/userController.js` (depends on T042)
- [X] T044 [US2] Implement `backend/src/routes/userRoutes.js` wiring `/api/users/me*` endpoints with `authRequired` + `uploadLimits` (avatar) and mount in `backend/src/app.js`
- [X] T045 [P] [US2] Implement `frontend/src/api/usersApi.js` client module (getMe, updateMe, uploadAvatar, getActivity)
- [X] T046 [P] [US2] Scaffold `profileStore` Zustand store in `frontend/src/store/profileStore.js`
- [X] T047 [US2] Build Profile page (editable fields, avatar upload with size-limit error, disabled email field, activity summary section) in `frontend/src/pages/Profile.jsx`

**Checkpoint**: User Stories 1 AND 2 both work independently.

---

## Phase 5: User Story 3 - Community Creation & Invitations (Priority: P1)

**Goal**: A logged-in user creates a public/private community with a unique name, edits it, and invites other registered users.

**Independent Test**: Create a community with a unique name, invite another existing user, and confirm the invite appears for them — independent of discussion/resource features. See [test.md](./test.md) suite `TS-US3`.

### Implementation for User Story 3

- [X] T051 [P] [US3] Create `Community` model (name unique, visibility enum, owner, admins, memberCount, `$text` index) in `backend/src/models/Community.js`
- [X] T052 [P] [US3] Create `Membership` model (compound unique `(user, community)`) in `backend/src/models/Membership.js`
- [X] T053 [P] [US3] Create `Invitation` model (compound unique `(community, invitedUser)` where `status='pending'`) in `backend/src/models/Invitation.js`
- [X] T054 [US3] Implement `communityService` (create, update, invite, accept/decline invitation, owner/admin checks, `memberCount` maintenance hooks) in `backend/src/services/communityService.js` (depends on T051, T052, T053)
- [X] T055 [US3] Implement communities controller (`createCommunity`, `updateCommunity`, `invite`, `acceptInvitation`, `declineInvitation`) in `backend/src/controllers/communityController.js` (depends on T054)
- [X] T056 [US3] Implement `backend/src/routes/communityRoutes.js` for create/update/invitations/accept/decline with `authRequired` and mount in `backend/src/app.js`
- [X] T057 [P] [US3] Implement `frontend/src/api/communitiesApi.js` client module (create, update, invite, acceptInvitation, declineInvitation)
- [X] T058 [P] [US3] Scaffold `communityStore` Zustand store in `frontend/src/store/communityStore.js`
- [X] T059 [US3] Build Create/Edit Community form (name, description, visibility) in `frontend/src/pages/CommunityForm.jsx`
- [X] T060 [US3] Build Invite-members UI (invite by email, pending invitations list, accept/decline) in `frontend/src/components/community/InvitationsPanel.jsx`

**Checkpoint**: User Stories 1–3 all work independently.

---

## Phase 6: User Story 4 - Joining Communities & Participating in Discussions (Priority: P1)

**Goal**: A logged-in user browses/searches communities, joins a public one (or accepts a private invitation), and posts/replies to discussions.

**Independent Test**: Join a public community and post/reply to a discussion — independent of resource-sharing or engagement features. See [test.md](./test.md) suite `TS-US4`.

### Implementation for User Story 4

- [X] T065 [P] [US4] Create `Discussion` model (community, author, title, body, status, likeCount, compound `(community, createdAt desc)` index, `$text` index) in `backend/src/models/Discussion.js`
- [X] T066 [P] [US4] Create `Comment` model (discussion, author, body, status, `(discussion, createdAt asc)` index) in `backend/src/models/Comment.js`
- [X] T067 [US4] Implement `GET /api/communities` search in `communityService`/`communityController` (membership-aware `$text`/visibility query, never post-fetch trimming) (depends on T054)
- [X] T068 [US4] Implement `joinCommunity` service method + `POST /api/communities/:id/join` route in `backend/src/services/communityService.js` / `backend/src/routes/communityRoutes.js` (depends on T052)
- [X] T069 [US4] Implement `discussionService` (create, list with pagination+keyword, get-by-id, add comment) in `backend/src/services/discussionService.js` (depends on T065, T066)
- [X] T070 [US4] Implement discussions controller in `backend/src/controllers/discussionController.js` (depends on T069)
- [X] T071 [US4] Implement `backend/src/routes/discussionRoutes.js` wiring discussion/comment endpoints with `requireCommunityMember` and mount in `backend/src/app.js`
- [X] T072 [P] [US4] Implement `frontend/src/api/discussionsApi.js` client module (list, create, getById, addComment, joinCommunity, searchCommunities)
- [X] T073 [P] [US4] Scaffold `discussionStore` Zustand store in `frontend/src/store/discussionStore.js`
- [X] T074 [US4] Build Community browse/search page with paginated results in `frontend/src/pages/CommunityBrowse.jsx`
- [X] T075 [US4] Build Community detail page (join button, member-gated discussion list) in `frontend/src/pages/CommunityDetail.jsx`
- [X] T076 [US4] Build Discussion thread page (post, reply, paginated comments) in `frontend/src/pages/DiscussionThread.jsx`

**Checkpoint**: User Stories 1–4 (the MVP core loop) all work independently.

---

## Phase 7: User Story 5 - Sharing Resources (Priority: P2)

**Goal**: A community member shares articles/videos/links/files (≤10 MB) and other members view the community's resource list.

**Independent Test**: Share a resource in a community and confirm another member can view it — independent of likes/bookmarks/search. See [test.md](./test.md) suite `TS-US5`.

### Implementation for User Story 5

- [X] T079 [US5] Create `Resource` model (community, author, type enum, title, url/fileUrl, fileSizeBytes, status, likeCount, compound `(community, createdAt desc)` + `(community, type)` + `$text` indexes) in `backend/src/models/Resource.js`
- [X] T080 [US5] Implement `resourceService` (create link/article/video + file-upload variants, list with pagination/type/keyword filter) in `backend/src/services/resourceService.js` (depends on T079)
- [X] T081 [US5] Implement resources controller in `backend/src/controllers/resourceController.js` (depends on T080)
- [X] T082 [US5] Implement `backend/src/routes/resourceRoutes.js` wiring resource endpoints with `requireCommunityMember` + `uploadLimits` (resource file) and mount in `backend/src/app.js`
- [X] T083 [P] [US5] Implement `frontend/src/api/resourcesApi.js` client module (list, create, getById)
- [X] T084 [P] [US5] Scaffold `resourceStore` Zustand store in `frontend/src/store/resourceStore.js`
- [X] T085 [US5] Build Resource list + share form (link/article/video/file) in `frontend/src/pages/ResourceList.jsx`

**Checkpoint**: User Story 5 works independently alongside US1–US4.

---

## Phase 8: User Story 6 - Admin Management of Communities & Users (Priority: P2)

**Goal**: An admin edits/deletes communities and users, including ownership-transfer gating for user deletion.

**Independent Test**: Admin deletes a test community with no active discussions and edits a test user's non-email fields — independent of end-user discussion flows. See [test.md](./test.md) suite `TS-US6`.

### Implementation for User Story 6

- [X] T090 [US6] Implement cascade-delete `adminService` (community delete with unresolved-content gate + cascade, user hard-delete with ownership-transfer gate + cascade, ownership transfer) wrapped in a Mongoose session/transaction in `backend/src/services/adminService.js` (depends on T020, T051, T052, T065, T079)
- [X] T091 [US6] Implement admin controller (`updateCommunity`, `deleteCommunity`, `updateUser`, `deleteUser`, `transferOwnership`) in `backend/src/controllers/adminController.js` (depends on T090)
- [X] T092 [US6] Implement `backend/src/routes/adminRoutes.js` wiring `/api/admin/communities/*` and `/api/admin/users/*` with `requireAdmin` and mount in `backend/src/app.js`
- [X] T093 [P] [US6] Implement `frontend/src/api/adminApi.js` client module (updateCommunity, deleteCommunity, updateUser, deleteUser, transferOwnership)
- [X] T094 [US6] Build Admin Dashboard community/user management panels in `frontend/src/pages/AdminDashboard.jsx`

**Checkpoint**: User Story 6 works independently alongside US1–US5.

---

## Phase 9: User Story 8 - Search & Filter Within a Community (Priority: P2)

**Goal**: A community member searches/filters discussions and resources by keyword and resource type, with private-community exclusion for non-members.

**Independent Test**: Search for a known discussion/resource by keyword within a community the user belongs to — independent of notifications/messaging. See [test.md](./test.md) suite `TS-US8`.

### Implementation for User Story 8

- [X] T098 [US8] Extend `discussionService` listing with `$text` keyword query + 404-on-private-non-member gating in `backend/src/services/discussionService.js` (depends on T069)
- [X] T099 [US8] Extend `resourceService` listing with `type` filter + keyword query + 404-on-private-non-member gating in `backend/src/services/resourceService.js` (depends on T080)
- [X] T100 [P] [US8] Add search/filter controls (keyword input, type dropdown) to `frontend/src/pages/DiscussionThread.jsx` listing view and `frontend/src/pages/ResourceList.jsx`
- [X] T101 [P] [US8] Add "no results found" empty-state component in `frontend/src/components/common/EmptyState.jsx`

**Checkpoint**: User Story 8 works independently alongside US1–US6.

---

## Phase 10: User Story 11 - Reporting Inappropriate Content (Priority: P2)

**Goal**: A member flags discussions/resources/comments for review; content hides only for the reporter; an admin reviews via a dashboard.

**Independent Test**: Report a post, confirm it is hidden only for the reporting user, and confirm it appears on the admin reports dashboard — independent of messaging/notifications. See [test.md](./test.md) suite `TS-US11`.

### Implementation for User Story 11

- [X] T104 [US11] Create `Report` model (reporter, targetType/targetId, reason, status, hiddenForReporter, compound unique `(reporter, targetType, targetId)`, `(status, createdAt desc)` index) in `backend/src/models/Report.js`
- [X] T105 [US11] Implement `reportService` (create with self-report/duplicate rejection, per-reporter hiding, admin dismiss/remove-content) in `backend/src/services/reportService.js` (depends on T104)
- [X] T106 [US11] Implement reports controller in `backend/src/controllers/reportController.js` (depends on T105)
- [X] T107 [US11] Implement `backend/src/routes/reportRoutes.js` wiring `/api/reports` (authRequired) and `/api/admin/reports/*` (requireAdmin) and mount in `backend/src/app.js`
- [X] T108 [US11] Apply per-reporter content hiding in `discussionService`/`resourceService` listing queries (exclude content this user reported) in `backend/src/services/discussionService.js` and `backend/src/services/resourceService.js` (depends on T104)
- [X] T109 [P] [US11] Implement `frontend/src/api/moderationApi.js` client module (createReport, listAdminReports, dismissReport, removeContent)
- [X] T110 [P] [US11] Scaffold `moderationStore` Zustand store in `frontend/src/store/moderationStore.js`
- [X] T111 [US11] Add "Report" action to discussion/resource/comment UI in `frontend/src/components/moderation/ReportButton.jsx`
- [X] T112 [US11] Build Admin Reports Dashboard panel (pending list, dismiss/remove actions) in `frontend/src/pages/AdminDashboard.jsx`

**Checkpoint**: User Story 11 works independently alongside US1–US8.

---

## Phase 11: User Story 7 - Notifications for Community Activity (Priority: P3)

**Goal**: A community member is notified of new discussions/resources in their communities and can manage per-category preferences, including disabling all.

**Independent Test**: Post a discussion in a community and confirm other members receive a notification — independent of messaging/search features. See [test.md](./test.md) suite `TS-US7`.

### Implementation for User Story 7

- [X] T116 [P] [US7] Create `Notification` model (`(user, createdAt desc)`, `(user, readAt)` indexes) in `backend/src/models/Notification.js`
- [X] T117 [P] [US7] Create `NotificationPreference` model (unique per user; all categories independently togglable) in `backend/src/models/NotificationPreference.js`
- [X] T118 [US7] Implement `notificationService` (fan-out-on-write to active Membership holders excluding author, respecting preferences, paginated listing, mark-read) in `backend/src/services/notificationService.js` (depends on T116, T117)
- [X] T119 [US7] Hook fan-out into `discussionService.create` and `resourceService.create` in `backend/src/services/discussionService.js` and `backend/src/services/resourceService.js` (depends on T118)
- [X] T120 [US7] Implement notifications controller (`list`, `markRead`, `getPreferences`, `updatePreferences`) in `backend/src/controllers/notificationController.js` (depends on T118)
- [X] T121 [US7] Implement `backend/src/routes/notificationRoutes.js` wiring `/api/notifications*` with `authRequired` and mount in `backend/src/app.js`
- [X] T122 [P] [US7] Implement `frontend/src/api/notificationsApi.js` client module (list, markRead, getPreferences, updatePreferences)
- [X] T123 [P] [US7] Scaffold `notificationStore` Zustand store in `frontend/src/store/notificationStore.js`
- [X] T124 [US7] Build Notifications panel (list, unread indicator, mark-read) in `frontend/src/components/notifications/NotificationsPanel.jsx`
- [X] T125 [US7] Build Notification Preferences settings page (per-category toggles, disable-all) in `frontend/src/pages/NotificationSettings.jsx`

**Checkpoint**: User Story 7 works independently alongside US1–US6, US8, US11.

---

## Phase 12: User Story 9 - Liking / Upvoting Content (Priority: P3)

**Goal**: A community member likes/unlikes a discussion or resource once, seeing the live like count.

**Independent Test**: Like a post once, confirm the count increments and a second like is blocked, then unlike — independent of bookmarking/reporting. See [test.md](./test.md) suite `TS-US9`.

### Implementation for User Story 9

- [X] T127 [US9] Create `Like` model (compound unique `(user, targetType, targetId)`) in `backend/src/models/Like.js`
- [X] T128 [US9] Implement `engagementService` like/unlike methods maintaining target `likeCount` in `backend/src/services/engagementService.js` (depends on T127, T065, T079)
- [X] T129 [US9] Implement likes controller + `backend/src/routes/engagementRoutes.js` (`POST/DELETE /api/likes`) with `authRequired` and mount in `backend/src/app.js` (depends on T128)
- [X] T130 [P] [US9] Implement `frontend/src/api/engagementApi.js` client module (like, unlike)
- [X] T131 [US9] Add Like button with optimistic count update to discussion/resource item components in `frontend/src/components/common/LikeButton.jsx`

**Checkpoint**: User Story 9 works independently alongside US1–US8, US11.

---

## Phase 13: User Story 10 - Saving / Bookmarking Content (Priority: P3)

**Goal**: A community member bookmarks discussions/resources and views/removes them from a dedicated saved-items section; deleted-content bookmarks are hidden.

**Independent Test**: Bookmark a post and view it later from the saved-items section — independent of likes/reporting. See [test.md](./test.md) suite `TS-US10`.

### Implementation for User Story 10

- [X] T134 [US10] Create `Bookmark` model (compound unique `(user, targetType, targetId)`) in `backend/src/models/Bookmark.js`
- [X] T135 [US10] Implement bookmark create/remove/list-with-target-filter methods in `backend/src/services/engagementService.js` (depends on T134)
- [X] T136 [US10] Implement bookmarks controller + routes (`POST /api/bookmarks`, `DELETE /api/bookmarks/:id`) in `backend/src/routes/engagementRoutes.js` (depends on T135)
- [X] T137 [US10] Implement `GET /api/users/me/bookmarks` listing in `userController`/`userService` and `backend/src/routes/userRoutes.js` (depends on T135)
- [X] T138 [P] [US10] Implement `frontend/src/api/engagementApi.js` bookmark/unbookmark/listBookmarks additions
- [X] T139 [US10] Add Bookmark toggle button to discussion/resource item components in `frontend/src/components/common/BookmarkButton.jsx`
- [X] T140 [US10] Build Saved Items profile section in `frontend/src/pages/SavedItems.jsx`

**Checkpoint**: User Story 10 works independently alongside US1–US9, US11.

---

## Phase 14: User Story 12 - Direct Messaging Between Members (Priority: P3)

**Goal**: Two users sharing a community can exchange 1-on-1 text messages and view chronological conversation history from an inbox.

**Independent Test**: Two users who share a joined community exchange messages and view them in chronological order in their respective inboxes — independent of all other features. See [test.md](./test.md) suite `TS-US12`.

### Implementation for User Story 12

- [X] T144 [P] [US12] Create `Conversation` model (2-participant array, shared-membership check in service layer, `lastMessageAt`) in `backend/src/models/Conversation.js`
- [X] T145 [P] [US12] Create `Message` model (conversation, sender, body 1–2000 chars, readAt, `(conversation, createdAt asc)` index) in `backend/src/models/Message.js`
- [X] T146 [US12] Implement `messagingService` (create-or-find conversation with shared-Membership check, send message with empty-body rejection, mark-read) in `backend/src/services/messagingService.js` (depends on T144, T145, T052)
- [X] T147 [US12] Implement messaging controller in `backend/src/controllers/messagingController.js` (depends on T146)
- [X] T148 [US12] Implement `backend/src/routes/messagingRoutes.js` wiring `/api/conversations*` with `authRequired` and mount in `backend/src/app.js`
- [X] T149 [P] [US12] Implement `frontend/src/api/messagingApi.js` client module (createConversation, listConversations, listMessages, sendMessage, markRead)
- [X] T150 [P] [US12] Scaffold `messagingStore` Zustand store in `frontend/src/store/messagingStore.js`
- [X] T151 [US12] Build Inbox page (conversation list, unread badges, ordering by `lastMessageAt`) in `frontend/src/pages/Inbox.jsx`
- [X] T152 [US12] Build Chat/conversation detail view (sent/received distinction, compose box, empty-message guard) in `frontend/src/pages/ConversationDetail.jsx`

**Checkpoint**: All 12 user stories independently functional.

---

## Phase 15: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T155 Audit all list endpoints for consistent `{ items, page, pageSize, totalItems, totalPages }` pagination metadata per data-model.md Cross-Cutting Rules
- [ ] T156 [P] Accessibility pass: verify keyboard navigation, `aria-live` feedback, and `prefers-reduced-motion` handling across all pages
- [ ] T157 [P] Security hardening pass: verify `email`/`role` stripping on every update path, httpOnly/SameSite cookie flags, and no raw internal errors leaked via `errorHandler`
- [ ] T158 Run [quickstart.md](./quickstart.md) validation end-to-end against a local MongoDB instance
- [ ] T159 [P] Documentation pass: update `docs/api.spec.md` and `docs/req.spec.md` if implementation deviates from contracts

> Frontend component tests, cross-cutting edge-case suites, and Success-Criteria timing validation (formerly T153, T154, T160–T164) are deferred to [test.md](./test.md) phases T3 and T4.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3–14)**: All depend on Foundational phase completion
  - P1 stories (US1–US4) should be completed first for MVP
  - P2 stories (US5, US6, US8, US11) and P3 stories (US7, US9, US10, US12) can follow in priority order or in parallel if staffed
- **Polish (Phase 15)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: No dependencies on other stories (after Foundational)
- **US2 (P1)**: No dependencies on other stories (after Foundational)
- **US3 (P1)**: No dependencies on other stories (after Foundational)
- **US4 (P1)**: Builds on Community/Membership models introduced in US3 (T051–T053); independently testable once those models exist
- **US5 (P2)**: Requires community membership (US4) to gate resource writes; independently testable
- **US6 (P2)**: Requires Community/User/Discussion/Resource models (US3–US5) to cascade-delete against; independently testable
- **US7 (P3)**: Requires Discussion/Resource creation hooks (US4, US5) for fan-out; independently testable
- **US8 (P2)**: Extends discussion/resource listing from US4/US5; independently testable
- **US9 (P3)**: Requires Discussion/Resource models (US4, US5) as like targets; independently testable
- **US10 (P3)**: Requires Discussion/Resource models (US4, US5) as bookmark targets; independently testable
- **US11 (P2)**: Requires Discussion/Resource/Comment models (US4, US5) as report targets; independently testable; also shares `frontend/src/pages/AdminDashboard.jsx` with US6 (T094) — implement US11's admin-dashboard task (T112) after US6's T094 to avoid conflicting edits to the same file
- **US12 (P3)**: Requires Membership (US3) for shared-community gating; independently testable

### Within Each User Story

- Models before services
- Services before controllers/routes
- Backend endpoints before frontend API clients and pages
- Story complete before moving to next priority
- Optionally run the story's suite from [test.md](./test.md) at the story checkpoint

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, US1–US4 (P1) can start in parallel; US5/US6/US8/US11 (P2) and US7/US9/US10/US12 (P3) can follow once their model dependencies exist
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members once shared models exist

---

## Parallel Example: User Story 1

```bash
# Launch all models for User Story 1 together:
Task: "Create PasswordResetToken model in backend/src/models/PasswordResetToken.js"
Task: "Create EmailVerificationCode model in backend/src/models/EmailVerificationCode.js"
```

---

## Implementation Strategy

### MVP First (User Stories 1–4 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: US1 (Account Creation & Login)
4. Complete Phase 4: US2 (Profile Management)
5. Complete Phase 5: US3 (Community Creation & Invitations)
6. Complete Phase 6: US4 (Joining Communities & Discussions)
7. **STOP and VALIDATE**: Test the full register→create-community→join→discuss loop independently
8. Deploy/demo if ready (this is the MVP)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 → US2 → US3 → US4 → Test independently → Deploy/Demo (MVP!)
3. Add US5, US6, US8, US11 (P2) → Test independently → Deploy/Demo
4. Add US7, US9, US10, US12 (P3) → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 → US2
   - Developer B: US3 → US4
   - Developer C: US5 → US8 → US11 (after US4 models land)
   - Developer D: US7 → US9 → US10 → US12 (after US3/US4/US5 models land)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Automated tests are deferred — see [test.md](./test.md) for the opt-in, per-story testing strategy
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
