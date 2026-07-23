const router = require("express").Router();
const ctrl = require("../../controllers/user/userWalletController");
const { requireUser } = require("../../middleware/authMiddleware");

router.get("/balance", requireUser, ctrl.getBalance);
router.get("/plans", requireUser, ctrl.getPlans);
router.post("/recharge/order", requireUser, ctrl.createRechargeOrder);
router.post("/recharge/verify", requireUser, ctrl.verifyRecharge);
router.post(
  "/paypal/recharge/order",
  requireUser,
  ctrl.createPaypalRechargeOrder
);
router.post(
  "/paypal/recharge/:orderId/capture",
  requireUser,
  ctrl.capturePaypalRechargeOrder
);
router.post(
  "/paypal/recharge/capture-order",
  requireUser,
  ctrl.capturePaypalRechargeOrder
);
router.post("/refund", requireUser, ctrl.requestRefund);
router.get("/invoice/:id", requireUser, ctrl.getInvoiceById);
router.get("/transactions", requireUser, ctrl.transactions);

module.exports = router;
