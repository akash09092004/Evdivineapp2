const Payment = require("../models/Payment");
const Booking = require("../models/Booking");

exports.createPayment = async (req, res) => {
  try {
    const { booking, amount, paymentMethod, transactionId, status } = req.body;

    if (!booking || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Booking, amount and payment method are required",
      });
    }

    const payment = await Payment.create({
      user: req.user._id,
      booking,
      amount,
      paymentMethod,
      transactionId,
      status: status || "success",
    });

    await Booking.findByIdAndUpdate(booking, {
      paymentStatus: payment.status,
    });

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      payment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { user: req.user._id };

    const payments = await Payment.find(filter)
      .populate("user", "name email phone")
      .populate("booking")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("booking");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};