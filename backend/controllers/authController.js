const User = require("../models/User");
const Admin = require("../models/Admin");
const generateToken = require("../utils/generateToken");

const clean = (value) => (typeof value === "string" ? value.trim() : "");
const getEnvAdmin = () => {
  const email = clean(process.env.ADMIN_EMAIL).toLowerCase();
  const password = clean(process.env.ADMIN_PASSWORD);

  if (!email || !password) {
    return null;
  }

  return { email, password };
};

exports.register = async (req, res) => {
  try {
    const name = clean(req.body.name);
    const email = clean(req.body.email).toLowerCase();
    const phone = clean(req.body.phone);
    const password = clean(req.body.password);
    const role = clean(req.body.role);

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role || "user",
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token: generateToken({
        id: user._id,
        email: user.email,
        role: user.role || "user",
        source: "db-user",
      }),
      user,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

exports.checkEmail = async (req, res) => {
  try {
    const email = clean(req.query.email).toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const userExists = await User.findOne({ email }).select("_id email");

    return res.status(200).json({
      success: true,
      exists: Boolean(userExists),
      message: userExists ? "Email is already registered" : "Email is available",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const email = clean(req.body.email).toLowerCase();
    const password = clean(req.body.password);
    const envAdmin = getEnvAdmin();

    console.log("[auth/login] request", {
      email,
      passwordLength: password.length,
    });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (envAdmin && email === envAdmin.email && password === envAdmin.password) {
      console.log("[auth/login] env admin success", {
        email,
      });

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token: generateToken({
          id: "env-admin",
          email: envAdmin.email,
          role: "admin",
          source: "env",
        }),
        user: {
          _id: "env-admin",
          email: envAdmin.email,
          name: "Admin",
          role: "admin",
          source: "env",
        },
      });
    }

    const user = await User.findOne({ email }).select("+password");
    const admin = user ? null : await Admin.findOne({ email }).select("+password");
    const account = user || admin;

    console.log("[auth/login] lookup result", {
      foundInUser: Boolean(user),
      foundInAdmin: Boolean(admin),
      accountRole: account?.role || null,
      accountId: account?._id || null,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "Username not found",
      });
    }

    if (!(await account.matchPassword(password))) {
      console.log("[auth/login] password mismatch");
      return res.status(401).json({
        success: false,
        code: "INVALID_PASSWORD",
        message: "Password is incorrect",
      });
    }

    console.log("[auth/login] success", {
      id: account._id,
      role: account.role,
      email: account.email,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: generateToken({
        id: account._id,
        email: account.email,
        role: account.role || "user",
        source: account.role === "admin" ? "db-admin" : "db-user",
      }),
      user: account,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

exports.forgotPassword = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Forgot password API working",
  });
};

exports.resetPassword = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Reset password API working",
  });
};
