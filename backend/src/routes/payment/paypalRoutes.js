const express = require("express");
const {
  testPayPalConnection,
  createOrder,
  captureOrder,
} = require("../../controllers/payment/paypalController");
const { requireUser } = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/test", testPayPalConnection);
router.post("/orders", requireUser, createOrder);
router.post("/orders/:orderId", requireUser, captureOrder);
router.post("/orders/:orderId/capture", requireUser, captureOrder);

module.exports = router;
