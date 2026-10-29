# Auth Contracts (US-1)

## POST /api/auth/register
**Body**: `{ email, password, displayName }`
**Success 201**: `{ success: true, data: { userId }, message: "Registration successful. Check your confirmation code (printed to server console)." }`
**Errors**:
- 400 `EMAIL_IN_USE` — email already registered (FR-002).
- 400 `VALIDATION_ERROR` — missing/invalid fields.

## POST /api/auth/verify-email
**Body**: `{ userId, code }`
**Success 200**: `{ success: true, data: { verified: true }, message: "Email verified." }`
**Errors**: 400 `INVALID_OR_EXPIRED_CODE`.

## POST /api/auth/login
**Body**: `{ email, password }`
**Success 200**: sets httpOnly session cookie; `{ success: true, data: { user }, message: "Logged in." }`
**Errors**: 401 `INVALID_CREDENTIALS` — wrong email or password, generic message only (FR-004).

## POST /api/auth/logout
**Success 200**: clears session cookie; `{ success: true, data: null, message: "Logged out." }`

## POST /api/auth/request-password-reset
**Body**: `{ email }`
**Success 200**: always `{ success: true, data: null, message: "If that account exists, a reset code was sent." }`
(does not reveal account existence); generates a `PasswordResetToken`, printed to console via
nodemailer console transport (FR-005, FR-006).

## POST /api/auth/reset-password
**Body**: `{ email, code, newPassword }`
**Success 200**: `{ success: true, data: null, message: "Password updated." }`
**Errors**: 400 `INVALID_OR_EXPIRED_TOKEN` — token missing/expired/already used (single-use, Principle I).

## GET /api/auth/session
**Success 200**: `{ success: true, data: { user }, message: "" }` — used by frontend authStore to
hydrate session on load; 401 `UNAUTHENTICATED` if no valid cookie.
