const express = require("express");

const messagingController = require("../controllers/messagingController");
const authRequired = require("../middleware/authRequired");
const validateBody = require("../middleware/validateBody");

// Owns /api/conversations* (contracts/messaging.md, US-12)
const router = express.Router();

function validateRecipientUserId(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{24}$/i.test(value)) {
    return "A valid recipientUserId is required.";
  }
  return true;
}

const createConversationSchema = {
  recipientUserId: validateRecipientUserId,
};

router.use(authRequired);

router.post("/conversations", validateBody(createConversationSchema), messagingController.createConversation);
router.get("/conversations", messagingController.listConversations);
router.get("/conversations/:id/messages", messagingController.listMessages);
// `body` empty/whitespace-only validation is a business rule (EMPTY_MESSAGE), handled in the
// service rather than validateBody, so the contract's specific error code is preserved.
router.post("/conversations/:id/messages", messagingController.sendMessage);
router.patch("/conversations/:id/read", messagingController.markRead);

module.exports = router;
