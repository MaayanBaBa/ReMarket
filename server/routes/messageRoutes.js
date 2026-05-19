const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { authRequired } = require("../middleware/auth");

router.post("/", authRequired, messageController.addMessage);
router.get("/count", authRequired, messageController.getMessageCount);
router.post("/read", authRequired, messageController.markMessagesRead);
router.get("/", authRequired, messageController.getMessages);
router.get("/:id", messageController.getMessageById);
router.put("/:id", messageController.updateMessage);
router.delete("/:id", messageController.deleteMessage);

module.exports = router;