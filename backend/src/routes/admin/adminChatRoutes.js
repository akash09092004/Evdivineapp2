const router = require("express").Router();
const ctrl = require("../../controllers/admin/adminChatSessionController");
const accessCtrl = require("../../controllers/admin/adminChatAccessController");
const { requireAdmin } = require("../../middleware/authMiddleware");

router.get("/sessions", requireAdmin, ctrl.listSessions);
router.get(
  "/sessions/:sessionId/messages",
  requireAdmin,
  ctrl.getSessionMessages
);
router.post(
  "/sessions/:sessionId/messages",
  requireAdmin,
  ctrl.sendAdminMessage
);
router.patch("/sessions/:sessionId/end", requireAdmin, ctrl.markSessionEnded);
router.patch("/sessions/:sessionId", requireAdmin, ctrl.updateSession);
router.put("/sessions/:sessionId", requireAdmin, ctrl.updateSession);
router.post("/sessions/:sessionId", requireAdmin, ctrl.updateSession);
router.patch("/sessions/:sessionId/update", requireAdmin, ctrl.updateSession);
router.put("/sessions/:sessionId/update", requireAdmin, ctrl.updateSession);
router.post("/sessions/:sessionId/update", requireAdmin, ctrl.updateSession);
router.patch("/sessions/:sessionId/edit", requireAdmin, ctrl.updateSession);
router.put("/sessions/:sessionId/edit", requireAdmin, ctrl.updateSession);
router.post("/sessions/:sessionId/edit", requireAdmin, ctrl.updateSession);
router.get(
  "/rooms/:chatroomId/messages",
  requireAdmin,
  ctrl.getSessionMessages
);
router.post("/rooms/:chatroomId/messages", requireAdmin, ctrl.sendAdminMessage);
router.patch("/rooms/:chatroomId/end", requireAdmin, ctrl.markSessionEnded);
router.patch("/rooms/:chatroomId", requireAdmin, ctrl.updateSession);
router.put("/rooms/:chatroomId", requireAdmin, ctrl.updateSession);
router.post("/rooms/:chatroomId", requireAdmin, ctrl.updateSession);
router.patch("/rooms/:chatroomId/update", requireAdmin, ctrl.updateSession);
router.put("/rooms/:chatroomId/update", requireAdmin, ctrl.updateSession);
router.post("/rooms/:chatroomId/update", requireAdmin, ctrl.updateSession);
router.patch("/rooms/:chatroomId/edit", requireAdmin, ctrl.updateSession);
router.put("/rooms/:chatroomId/edit", requireAdmin, ctrl.updateSession);
router.post("/rooms/:chatroomId/edit", requireAdmin, ctrl.updateSession);
router.post("/:id/approve", requireAdmin, accessCtrl.approveRequest);
router.post("/:id/reject", requireAdmin, accessCtrl.rejectRequest);
router.patch("/:id/approve", requireAdmin, accessCtrl.approveRequest);
router.patch("/:id/reject", requireAdmin, accessCtrl.rejectRequest);

module.exports = router;
