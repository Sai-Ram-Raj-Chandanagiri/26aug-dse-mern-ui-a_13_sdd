<!--
Sync Impact Report
Version change: (none) → 1.0.0 (initial ratification)
Principles added:
  - I. Security & Identity Integrity (NON-NEGOTIABLE)
  - II. Accessibility & Inclusive Design (NON-NEGOTIABLE)
  - III. Validation & Feedback Consistency
  - IV. Membership & Privacy Boundaries
  - V. State & Data Flow Discipline
  - VI. Moderation & Content Boundaries
  - VII. Scope Discipline (MVP Boundaries)
Sections added:
  - Technology & Implementation Constraints
  - Development Workflow & Quality Gates
  - Governance
Templates requiring updates:
  - .specify/templates/plan-template.md (⚠ pending manual review)
  - .specify/templates/spec-template.md (⚠ pending manual review)
  - .specify/templates/tasks-template.md (⚠ pending manual review)
Deferred items:
  - RATIFICATION_DATE: TODO — set when the pipeline formally ratifies this document.
  - LAST_AMENDED_DATE: TODO — set alongside ratification date for this initial version.

---

Sync Impact Report (Amendment)
Version change: 1.0.0 → 1.1.0
Rationale: Component-system substitution — daisyUI is replaced with shadcn/ui (Radix-based,
Tailwind-native components) plus Aceternity UI (Tailwind/Framer-Motion animated components),
per explicit stakeholder direction. No principle was removed or redefined; Principle II and the
Technology & Implementation Constraints section were updated to reflect the new pinned
component system.
Principles modified:
  - II. Accessibility & Inclusive Design (NON-NEGOTIABLE) — theme reference updated from daisyUI
    to the shadcn/ui design-token theme.
Sections modified:
  - Technology & Implementation Constraints — styling stack pin updated from Tailwind CSS +
    daisyUI to Tailwind CSS + shadcn/ui + Aceternity UI.
Templates requiring updates:
  - .specify/templates/plan-template.md (⚠ pending manual review)
  - .specify/templates/spec-template.md (⚠ pending manual review)
  - .specify/templates/tasks-template.md (⚠ pending manual review)
Deferred items: unchanged (RATIFICATION_DATE, LAST_AMENDED_DATE still TODO).
-->

# Roundtable Constitution

## Core Principles

### I. Security & Identity Integrity (NON-NEGOTIABLE)
All passwords MUST be hashed with bcryptjs (minimum cost factor 10); the system MUST NOT
store plaintext or reversibly-encrypted passwords. JWT session tokens MUST be issued on
login and transmitted only via httpOnly, SameSite cookies set through cookie-parser; tokens
MUST NOT be stored in localStorage or sessionStorage. Password reset MUST use a separate,
short-lived, single-use token distinct from the session JWT. Email uniqueness MUST be
enforced at the Mongoose schema level (unique index) and re-validated server-side regardless
of client-side checks. Immutable fields — specifically the user's email — MUST NOT be
mutable via any profile-update endpoint; this MUST be enforced in the controller layer, not
only hidden in the UI. The `User.role` field (`user` | `admin`) MUST govern all admin-only
routes via server-side route middleware, never via UI-only checks; no admin accounts MUST be
pre-seeded in production — the admin role MAY only be assigned manually or for testing
purposes. Account-creation confirmation codes and password-reset codes MUST be generated via
`nodemailer`, but in this build MUST be printed to the server console only — no real SMTP
transport is wired up; this satisfies the confirmation/reset acceptance criteria for
development and testing without requiring live email infrastructure.

### II. Accessibility & Inclusive Design (NON-NEGOTIABLE)
Every interactive component MUST be keyboard-navigable and screen-reader labeled using
semantic HTML and `aria-*` attributes; this is non-negotiable because the reference
implementation this project improves upon explicitly lacks accessibility support. Color
contrast MUST meet WCAG AA against the single shadcn/ui design-token theme in use; Aceternity
UI animated components MUST respect `prefers-reduced-motion` and MUST NOT be the sole carrier
of any interactive affordance. All form error and success states MUST be announced via
`aria-live` or an equivalent mechanism, and MUST NOT be conveyed by color alone.

### III. Validation & Feedback Consistency
Every user input MUST be validated both client-side, for immediate UX feedback, and
server-side via Mongoose schema validators and Express middleware, with the server-side
validation treated as the source of truth. Every mutating action MUST produce an explicit,
user-appropriate success or error message surfaced via react-hot-toast; silent failures and
raw stack traces exposed to users are forbidden. Every negative-path rule derived from the
product backlog (duplicate email, incorrect login credentials, duplicate like, duplicate
report, self-report, duplicate community invite, oversized upload) MUST map to a specific,
named validation error rather than a generic failure message.

### IV. Membership & Privacy Boundaries
Community visibility (public or private) MUST govern all read and write access to
discussions, resources, and search results; private-community content MUST NOT be returned to
non-members at the API layer, not merely hidden in the UI. Participation in discussions and
direct messaging MUST require active community or conversation membership, enforced
server-side on every relevant route.

### V. State & Data Flow Discipline
Zustand stores MUST be the single source of truth for client state, scoped per domain (auth,
community, discussion, notification, messaging); duplicated or parallel state within
components is forbidden. All server communication MUST go through a single configured Axios
instance, with the base URL resolved via the Vite dev-server proxy in development, so that
auth headers/cookies and error interceptors are applied uniformly. API responses MUST follow
one consistent envelope shape (e.g., `{ success, data, message }`) so error-handling and toast
logic can remain generic across the application.

### VI. Moderation & Content Boundaries
Content moderation MUST be human-driven only, via the admin dashboard and user reports;
automated machine-learning content moderation is explicitly out of scope for this version.
Reported content MUST be hidden only for the reporting user pending review, and MUST NOT be
hidden globally. Admins MUST NOT be able to delete a community that has active or unresolved
discussions without an explicit override step.

### VII. Scope Discipline (MVP Boundaries)
Direct messaging MUST remain 1-on-1 and text-only; group chat and message attachments are out
of scope for this version. Real-time delivery via WebSockets, read receipts, and typing
indicators are optional enhancements and MUST NOT be treated as blocking acceptance criteria.
Any feature not traceable to a user story or an Overall Requirement MUST be flagged for
review rather than silently added.

## Technology & Implementation Constraints

The following stack choices are pinned and MUST NOT be substituted without an explicit
constitution amendment:

- Build tool: Vite, with `server.proxy` configured to forward `/api` requests to the Express
  backend in development.
- Styling: Tailwind CSS + shadcn/ui (Radix-based primitives) + Aceternity UI (animated
  components) only, with a single design-token theme defined in the Tailwind config; no
  competing UI kit (e.g., Material UI, Bootstrap, daisyUI) MUST be introduced, despite the
  "Material design" phrasing in the source requirements document.
- Icons: lucide-react exclusively.
- Client state: Zustand only; Redux and ad-hoc React Context used as global state stores are
  forbidden.
- HTTP: Axios, via one shared configured instance with interceptors.
- Routing: react-router-dom using `BrowserRouter`.
- Transient feedback: react-hot-toast exclusively, kept distinct from the persisted in-app
  Notification domain entity.
- Backend: Express and Mongoose against MongoDB; JWT for session authentication; bcryptjs for
  password hashing; cookie-parser for cookie handling; nodemailer for generating
  account-confirmation and password-reset codes, with console-only output and no live SMTP
  transport in this build.

## Development Workflow & Quality Gates

- Git discipline: at least one git push per trainee, per day, is required for code
  integration and management.
- Every pull request or change MUST be self-checked against: input validation present,
  explicit error/success messaging present, accessibility attributes present, no spelling or
  grammatical mistakes, and uniform theme/color consistency.
- Every feature defined in `specifications.md` MUST cite which user story (US-1 through
  US-12) it satisfies, to preserve requirements traceability.

## Governance

This constitution supersedes all ad-hoc implementation choices. Any deviation from a stated
principle or pinned technology constraint — for example, introducing Redux, adopting a
Material UI or daisyUI component library, or storing JWTs in localStorage — requires an
explicit constitution amendment before implementation.

Amendments MUST be documented with a rationale, a semantic version bump, and an updated Sync
Impact Report prepended to this file. Versioning follows semantic rules: MAJOR for backward
incompatible principle removals or redefinitions, MINOR for new principles or materially
expanded guidance, PATCH for clarifications and non-semantic refinements. All pull requests
and reviews MUST verify compliance with this constitution; any added complexity MUST be
justified against these principles.

**Version**: 1.1.0 | **Ratified**: TODO(RATIFICATION_DATE): awaiting formal pipeline approval date | **Last Amended**: TODO(LAST_AMENDED_DATE): awaiting formal pipeline approval date
