const express = require("express");

const authController = require("../controllers/authController");
const authRequired = require("../middleware/authRequired");
const validateBody = require("../middleware/validateBody");

const router = express.Router();

const isNonEmptyString = (value) => (typeof value === "string" && value.trim().length > 0) || "This field is required.";
const isEmail = (value) =>
  (typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) || "A valid email is required.";

router.post(
  "/register",
  validateBody({
    email: isEmail,
    password: isNonEmptyString,
    displayName: isNonEmptyString,
  }),
  authController.register
);

router.post(
  "/verify-email",
  validateBody({
    userId: isNonEmptyString,
    code: isNonEmptyString,
  }),
  authController.verifyEmail
);

router.post(
  "/login",
  validateBody({
    email: isEmail,
    password: isNonEmptyString,
  }),
  authController.login
);

router.post("/logout", authController.logout);

router.post(
  "/request-password-reset",
  validateBody({
    email: isEmail,
  }),
  authController.requestPasswordReset
);

router.post(
  "/reset-password",
  validateBody({
    email: isEmail,
    code: isNonEmptyString,
    newPassword: isNonEmptyString,
  }),
  authController.resetPassword
);

router.get("/session", authRequired, authController.session);

module.exports = router;
