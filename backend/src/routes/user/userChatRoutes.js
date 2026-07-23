const router = require("express").Router();
const ctrl = require("../../controllers/user/userChatController");
const { requireUser } = require("../../middleware/authMiddleware");
const upload = require("../../middleware/uploadMiddleware");

router.post("/request", requireUser, ctrl.requestChat);
router.post("/request/cancel", requireUser, ctrl.cancelChatRequest);
router.delete("/request", requireUser, ctrl.cancelChatRequest);
router.get("/status", requireUser, ctrl.myChatStatus);
router.post(
  "/upload",
  requireUser,
  upload.single("file"),
  ctrl.uploadChatAttachment
);
router.get("/sessions", requireUser, ctrl.listMySessions);
router.get(
  "/sessions/:sessionId/messages",
  requireUser,
  ctrl.getMySessionMessages
);
router.post("/sessions/:sessionId/messages", requireUser, ctrl.sendMyMessage);
router.post("/sessions/:sessionId/end", requireUser, ctrl.endMySession);
router.get(
  "/rooms/:chatroomId/messages",
  requireUser,
  ctrl.getMySessionMessages
);
router.post("/rooms/:chatroomId/messages", requireUser, ctrl.sendMyMessage);
router.post("/rooms/:chatroomId/end", requireUser, ctrl.endMySession);

module.exports = router;
