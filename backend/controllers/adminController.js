const User = require("../models/User");
const Admin = require("../models/Admin");
const Booking = require("../models/Booking");
const Refund = require("../models/Refund");
const Subscriber = require("../models/Subscriber");
const Contact = require("../models/Contact");
const HistoryNote = require("../models/HistoryNote");
const CloseRequest = require("../models/CloseRequest");

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalBookings = await Booking.countDocuments();
    const totalRefunds = await Refund.countDocuments();
    const totalSubscribers = await Subscriber.countDocuments();
    const totalContacts = await Contact.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalBookings,
        totalRefunds,
        totalSubscribers,
        totalContacts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRegisteredUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserCredit = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select(
      "name email phone credit createdAt"
    );

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getHistoryNotes = async (req, res) => {
  try {
    const notes = await HistoryNote.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      notes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCloseRequests = async (req, res) => {
  try {
    const requests = await CloseRequest.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.changeAdminPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (req.user?.source === "env") {
      return res.status(400).json({
        success: false,
        message: "Env admin password must be changed in .env file",
      });
    }

    const admin =
      (await Admin.findById(req.user._id).select("+password")) ||
      (await User.findById(req.user._id).select("+password"));

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can change password",
      });
    }

    const isMatch = await admin.matchPassword(oldPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    admin.password = newPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
