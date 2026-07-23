const Refund = require("../models/Refund");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");

exports.createRefund = async (req, res) => {
  try {
    const { payment, booking, amount, reason } = req.body;

    if (!payment || !booking || !amount || !reason) {
      return res.status(400).json({
        success: false,
        message: "Payment, booking, amount and reason are required",
      });
    }

    const refund = await Refund.create({
      user: req.user._id,
      payment,
      booking,
      amount,
      reason,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Refund request created successfully",
      refund,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRefunds = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { user: req.user._id };

    const refunds = await Refund.find(filter)
      .populate("user", "name email phone")
      .populate("payment")
      .populate("booking")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      refunds,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRefund = async (req, res) => {
  try {
    const { status } = req.body;

    const refund = await Refund.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund not found",
      });
    }

    if (status === "approved") {
      await Payment.findByIdAndUpdate(refund.payment, {
        status: "refunded",
      });

      await Booking.findByIdAndUpdate(refund.booking, {
        paymentStatus: "refunded",
      });
    }

    res.status(200).json({
      success: true,
      message: "Refund updated successfully",
      refund,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};