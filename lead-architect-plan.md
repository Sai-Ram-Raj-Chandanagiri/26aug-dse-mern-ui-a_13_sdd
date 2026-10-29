# Lead Architect Plan — Roundtable Platform
**Status:** PLAN ONLY — no `constitution.md` / `specifications.md` have been written yet.
**Purpose:** Hand-off artifact for a multi-model pipeline. Verify this plan, then switch model to execute.

---

## 1. Ingestion Summary (Source: `round_table.md`)

**Product:** Roundtable — a social platform for creating communities, joining discussions, and sharing resources.

**Declared tech stack (authoritative for this pipeline, supersedes "MERN" wording in the source doc):**
Frontend: Vite, vite dev-server proxy, Tailwind CSS, shadcn/ui, Aceternity UI, lucide-react, Zustand, Axios, react-hot-toast, react-router-dom (`BrowserRouter`).
Backend: Node.js, Express, MongoDB + Mongoose, JWT, bcryptjs, cookie-parser.

> **Amendment (superseding prior daisyUI decision):** The component system was changed from
> daisyUI to shadcn/ui (Radix-based primitives) + Aceternity UI (animated components), per
> explicit stakeholder direction. This is reflected in Roundtable Constitution v1.1.0.

### 1.1 Bounded Contexts / Domains Extracted from User Stories

| # | Domain | Source Story | Key Entities |
|---|--------|---------------|--------------|
| 1 | Authentication & Identity | US-1, US-6 | User (incl. `role: user\|admin` field), Session/Token, PasswordResetToken, EmailVerificationCode |
| 2 | User Profile | US-2 | UserProfile, Avatar, ActivityLog |
| 3 | Community Management | US-3, US-6 | Community, Membership, Invitation |
| 4 | Discussions (core content) | US-4, US-8 | Discussion/Post, Comment |
| 5 | Resource Sharing | US-5, US-8 | Resource (article/video/link), ResourceType |
| 6 | Admin & Moderation | US-6, US-11 | AdminAction, Report, ModerationQueue |
| 7 | Notifications | US-7 | Notification, NotificationPreference |
| 8 | Engagement (Likes/Saves) | US-9, US-10 | Like, Bookmark |
| 9 | Search & Filter | US-4, US-8 | SearchIndex (query-time, no new entity) |
| 10 | Direct Messaging | US-12 | Conversation, Message |

### 1.2 Cross-Cutting Constraints Pulled From "Overall Requirements"
- Git discipline: ≥1 push/trainee/day (process rule, not a runtime rule — goes in Governance, not Principles).
- Material-design-equivalent components → mapped to Tailwind + shadcn/ui + Aceternity UI since Material UI isn't in the stack; constitution must pin **shadcn/ui + Aceternity UI as the canonical component system** to avoid drift.
- Validation + explicit error/success messaging is mandatory everywhere (e.g., date validation example in source doc, but generalizes to all forms).
- No spelling/grammar errors — content-quality gate, goes in Governance/Quality Gates.
- Uniform color theme — single shadcn/ui design-token theme, no ad-hoc colors.
- Web accessibility (a11y) is explicitly called out as a gap in the reference video that MUST be fixed — this is a first-class non-negotiable principle, not an afterthought.

### 1.3 Explicit Scope Boundaries (Won't-Have / Negative Constraints)
These must be encoded as **System Boundary Definitions** in the constitution so no downstream model scope-creeps:
- No automated ML content moderation (US-11) — moderation is human/admin-driven only.
- No group messaging, no file attachments in DMs (US-12) — 1-on-1 text-only messaging for MVP.
- Real-time delivery (WebSockets) for messaging is **Should-Have**, not Must-Have — constitution must mark this as an optional enhancement, not a blocking requirement.
- Admin cannot delete a community with active discussions (US-6) — a protected-deletion invariant.
- Users cannot edit their own email (US-2, US-6) — immutable-field invariant.
- Private communities are invitation-gated — content/search must never leak private community data to non-members (US-4, US-8).

### 1.4 Security-Sensitive Surfaces (map directly to stack choices)
- Auth: bcryptjs for hashing, JWT for session, cookie-parser to deliver JWT as httpOnly cookie (not localStorage) — mitigates XSS token theft.
- Password reset must use a time-limited, single-use token (not the raw JWT).
- Admin distinction: `User.role` enum (`user` | `admin`); no admin accounts are pre-seeded in production — admin role is only ever assigned manually/for testing, never via public registration.
- Rate limiting / duplicate-action guards needed for: like (no double-like), report (no duplicate report, no self-report), community invite (no duplicate invite to existing member).
- File upload limits: profile picture max size (US-2), resource size limits (US-5) — must be enforced server-side, not just UI.
- Email delivery (confirmation email on signup, password-reset code) uses `nodemailer`, but in this build **no real SMTP transport is wired up** — the generated code/link is printed to the server console only. This satisfies the US-1 "confirmation"/reset acceptance criteria for dev/testing without requiring real email infrastructure.

---

## 2. Constitution Drafting Blueprint

This is the exact section-by-section content map for `.specify/memory/constitution.md`, filling the existing template (`[PROJECT_NAME]`, `[PRINCIPLE_n_NAME]`, etc.).

- **PROJECT_NAME:** Roundtable

### Core Principles (7 principles — expand template beyond its default 5 slots)

1. **I. Security & Identity Integrity (NON-NEGOTIABLE)**
   - All passwords hashed with bcryptjs (min cost factor 10); JWT issued on login, transmitted only via httpOnly, SameSite cookies through cookie-parser; no tokens in localStorage/sessionStorage.
   - Password reset uses a separate, short-lived, single-use token — never the session JWT.
   - Email uniqueness enforced at the Mongoose schema level (unique index) and re-validated server-side regardless of client checks.
   - Immutable fields (email) can never be mutated via profile-update endpoints — must be explicitly blocked in the controller layer, not just hidden in the UI.
   - `User.role` (`user` | `admin`) governs all admin-only routes server-side (route middleware, not UI-only); no admin accounts are pre-seeded in production — role is assigned manually/for testing only.
   - Account-creation confirmation and password-reset codes are generated via `nodemailer` but printed to the server console (no real SMTP transport in this build) — acceptance criteria are satisfied without live email delivery.

2. **II. Accessibility & Inclusive Design (NON-NEGOTIABLE)**
   - Every interactive component must be keyboard-navigable and screen-reader labeled (aria-* attributes, semantic HTML) — explicitly called out because the reference implementation lacks this.
   - Color contrast must meet WCAG AA against the single shadcn/ui design-token theme; Aceternity UI animations must respect `prefers-reduced-motion`.
   - All form errors/success states must be announced (aria-live or equivalent), not conveyed by color alone.

3. **III. Validation & Feedback Consistency**
   - Every user input must be validated both client-side (immediate UX feedback) and server-side (source of truth) via Mongoose schema validators / Express middleware.
   - Every mutating action must produce an explicit, user-appropriate success or error message surfaced via react-hot-toast — no silent failures, no raw stack traces shown to users.
   - Negative-path rules from the user stories (duplicate email, incorrect login, duplicate like, duplicate report, self-report, duplicate invite, oversized upload) must each map to a specific named validation error.

4. **IV. Membership & Privacy Boundaries**
   - Community visibility (public/private) governs all read/write access to discussions, resources, and search results; private-community content must never be returned to non-members at the API layer (not just hidden in UI).
   - Messaging and discussion participation require active community/conversation membership — enforced server-side on every relevant route.

5. **V. State & Data Flow Discipline**
   - Zustand stores are the single source of truth for client state, scoped per domain (auth, community, discussion, notification, messaging) — no duplicated/parallel state in components.
   - All server communication goes through a single configured Axios instance (base URL via Vite dev-server proxy in development) so auth headers/cookies and error interceptors are applied uniformly.
   - API responses follow one consistent envelope shape (e.g., `{ success, data, message }`) so error-handling and toast logic can be generic.

6. **VI. Moderation & Content Boundaries**
   - Content moderation is human-driven only (admin dashboard + reports) — explicitly no automated ML moderation in this version.
   - Reported content is hidden only for the reporting user pending review, not globally hidden.
   - Admins cannot delete a community that has active/unresolved discussions without an explicit override step (protected-deletion invariant).

7. **VII. Scope Discipline (MVP Boundaries)**
   - Direct messaging is 1-on-1, text-only; no group chat, no attachments in this version.
   - Real-time delivery (WebSockets) and read receipts/typing indicators are optional enhancements, not blocking acceptance criteria.
   - Any feature not traceable to a user story or an Overall Requirement must be flagged, not silently added.

### Section 2 — Technology & Implementation Constraints
Pin the stack as non-negotiable so the worker model and later specs don't substitute alternatives:
- Build tool: Vite, with `server.proxy` configured to forward `/api` to the Express backend in development.
- Styling: Tailwind CSS + shadcn/ui + Aceternity UI only — single design-token theme defined in Tailwind config; no competing UI kit (no MUI/Bootstrap/daisyUI) despite the source doc's "Material design" phrasing.
- Icons: lucide-react exclusively.
- Client state: Zustand (no Redux/Context-for-global-state).
- HTTP: Axios with one shared instance + interceptors.
- Routing: react-router-dom with `BrowserRouter`.
- Notifications/toasts: react-hot-toast exclusively for transient feedback (separate from the in-app Notification domain entity from US-7).
- Backend: Express + Mongoose against MongoDB; JWT auth; bcryptjs hashing; cookie-parser for cookie handling; nodemailer for generating account-confirmation/password-reset codes (console-only output, no live SMTP transport in this build).

### Section 3 — Development Workflow / Quality Gates
- Git: at least one push per trainee per day (explicit process rule from Overall Requirements).
- Every PR/change must self-check against: validation present, error/success messaging present, accessibility attributes present, no spelling/grammar errors, theme consistency.
- Each generated `specifications.md` feature must cite which User Story (US-1..US-12) it satisfies, to keep traceability.

### Governance
- This constitution supersedes ad-hoc implementation choices; any deviation (e.g., introducing Redux, MUI, localStorage tokens) requires an explicit amendment.
- Versioning: semantic (MAJOR.MINOR.PATCH) per existing template rules.
- Ratification date: TODO — set to date pipeline is approved by user (not yet known); Last Amended = same.

---

## 3. Worker Prompt (for the execution-phase model)

> Copy everything in the fenced block below as the prompt for the next (less capable) model. It is self-contained and does not require re-reading this plan file's prose, only the blueprint above and the source `round_table.md`.

```
You are the Execution Worker in the Speckit SDLC pipeline. You must produce two files:
1. `.specify/memory/constitution.md`
2. `specifications.md` (project root, create if missing)

Do NOT invent new scope. Use ONLY the inputs given below: the Constitution Blueprint, the source user stories in `round_table.md`, and the fixed tech stack list. If something is ambiguous, insert `TODO(<FIELD>): <reason>` rather than guessing.

STEP 1 — Load the existing template at `.specify/memory/constitution.md`. If it does not exist, copy it from `.specify/templates/constitution-template.md` first.

STEP 2 — Fill the template using this exact mapping (do not reorder or rename sections, do not drop any principle):
- PROJECT_NAME = "Roundtable"
- Write exactly 7 Core Principles, in this order, using these names and descriptions verbatim as the base text (you may tighten grammar but must not remove any rule listed):
  I. Security & Identity Integrity (NON-NEGOTIABLE)
  II. Accessibility & Inclusive Design (NON-NEGOTIABLE)
  III. Validation & Feedback Consistency
  IV. Membership & Privacy Boundaries
  V. State & Data Flow Discipline
  VI. Moderation & Content Boundaries
  VII. Scope Discipline (MVP Boundaries)
  [Pull the full rule text for each from "Section 2. Core Principles" of the Lead Architect Plan you were given.]
- SECTION_2_NAME = "Technology & Implementation Constraints" — populate with the exact stack pins listed in "Section 2" of the blueprint (Vite+proxy, Tailwind+shadcn/ui+Aceternity UI only, lucide-react only, Zustand only, single Axios instance, react-router-dom BrowserRouter, react-hot-toast, Express+Mongoose+MongoDB, JWT+bcryptjs+cookie-parser, nodemailer console-only for confirmation/reset codes).
- SECTION_3_NAME = "Development Workflow & Quality Gates" — populate with the Git push cadence rule, the PR self-check list, and the user-story traceability rule from the blueprint.
- GOVERNANCE_RULES = the Governance text from the blueprint, including the amendment/versioning rules.
- CONSTITUTION_VERSION = "1.0.0" (first ratification).
- RATIFICATION_DATE and LAST_AMENDED_DATE = leave as `TODO(RATIFICATION_DATE)` / `TODO(LAST_AMENDED_DATE)` — do not guess a date; the user will fill this in before final ratification.
- Leave NO bracketed `[PLACEHOLDER]` tokens remaining anywhere in the file.
- Prepend a Sync Impact Report HTML comment at the top summarizing: version 0→1.0.0 (initial ratification), principles added (list all 7), sections added, and "Templates requiring updates" listing `.specify/templates/plan-template.md`, `.specify/templates/spec-template.md`, `.specify/templates/tasks-template.md` as ⚠ pending manual review.

STEP 3 — Build `specifications.md`. For EACH of the 12 user stories in `round_table.md` (US-1 through US-12), produce a spec section with:
- A heading: `## US-<n>: <short title>`
- `Actor`, `Goal`, `Priority` (from the MoSCoW Must/Should/Won't lines in the source)
- `Functional Requirements` — convert every "Must Have" and "Should Have" bullet into a testable requirement statement (e.g., "FR-1: The system MUST allow a user to register with a unique email and password.")
- `Out of Scope` — convert every "Won't Have" / negative-point bullet into an explicit exclusion statement.
- `Acceptance Criteria` — copy the Dos/Don'ts bullets from the source story, rephrased as Given/When/Then or plain MUST/MUST NOT statements.
- `Constitution Traceability` — list which of the 7 Core Principles this story is constrained by (e.g., US-1 → Principle I, III; US-2 → Principle I, III; US-12 → Principle IV, VII).

STEP 4 — Cross-check: every entity listed in the Lead Architect Plan's "Bounded Contexts" table (User, Community, Discussion, Resource, Report, Notification, Conversation/Message, etc.) must appear in at least one specification section. If an entity has no corresponding spec coverage, add a short "Supporting Data Entities" subsection at the end of `specifications.md` listing it with a one-line description, rather than silently omitting it.

STEP 5 — Do not write any actual application code in this pass. Output only `constitution.md` and `specifications.md`. Stop after writing both files and report a summary of what was written, including the final constitution version and the count of specification sections produced (expect 12 user-story sections + any supporting-entities subsection).
```

---

## 4. Verification Outcomes (Resolved)
1. **Material design → shadcn/ui + Aceternity UI**: Confirmed (amended). daisyUI was the original decision; superseded by shadcn/ui (Radix-based primitives) + Aceternity UI (animated components) as the sole component system — see Roundtable Constitution v1.1.0.
2. **Ratification date**: Left as `TODO(RATIFICATION_DATE)` in the constitution — the worker model must not guess a date.
3. **WebSockets for messaging**: Confirmed deferred/optional enhancement, not MVP-blocking.
4. **Source of truth**: `round_table.md` only. `Discussify (1).pdf` is explicitly excluded from this pipeline.
5. **Email delivery (new gap, resolved)**: `nodemailer` is added to the backend stack, but only to generate confirmation/reset codes printed to the server console — no live SMTP transport in this build.
6. **Admin role (new gap, resolved)**: `User.role` enum (`user` | `admin`) added to the schema. No admin accounts are pre-seeded in production; role is only ever set manually/for testing purposes.

**Next step:** Plan is fully verified. On approval, switch model and feed it the Worker Prompt in Section 3 to generate the actual `constitution.md` and `specifications.md`.
