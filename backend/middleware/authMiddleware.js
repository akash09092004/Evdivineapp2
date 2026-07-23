const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const envAdminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const isEnvAdmin =
      decoded?.source === "env" &&
      decoded?.role === "admin" &&
      envAdminEmail &&
      decoded?.email === envAdminEmail;

    if (isEnvAdmin) {
      req.user = {
        _id: decoded.id,
        email: decoded.email,
        name: "Admin",
        role: "admin",
        source: "env",
      };

      return next();
    }

    req.user =
      (await User.findById(decoded.id).select("-password")) ||
      (await Admin.findById(decoded.id).select("-password"));

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed",
    });
  }
};
