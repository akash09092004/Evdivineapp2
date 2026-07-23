const nodemailer = require('nodemailer');
const { generateOtp } = require('../utils/generateOtp');
const Otp = require('../models/common/Otp');

const getMailConfig = () => {
  const user = process.env.MAIL_USER || process.env.EMAIL_USER;
  const pass = process.env.MAIL_PASS || process.env.EMAIL_PASS;
  const host = process.env.MAIL_HOST || 'smtp.gmail.com';
  const port = process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 587;
  const secure =
    typeof process.env.MAIL_SECURE !== 'undefined'
      ? String(process.env.MAIL_SECURE).toLowerCase() === 'true'
      : port === 465;

  return { host, port, secure, user, pass };
};

const getTransporter = () => {
  const { host, port, secure, user, pass } = getMailConfig();

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });
};

const sendOtpEmail = async ({ email, otp, purpose = 'login' }) => {
  const transporter = getTransporter();
  const from = process.env.MAIL_FROM || process.env.EMAIL_FROM || process.env.MAIL_USER || process.env.EMAIL_USER;

  if (!transporter || !from) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email transporter is not configured');
    }

    return { skipped: true };
  }

  await transporter.sendMail({
    from: `"EvDivine" <${from}>`,
    to: email,
    subject: purpose === 'signup' ? 'Verify your EvDivine signup OTP' : 'Your EvDivine login OTP',
    text: `Your EvDivine OTP is ${otp}. It expires in ${Number(process.env.OTP_TTL_MINUTES || 10)} minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
        <h2 style="margin:0 0 12px">EvDivine OTP</h2>
        <p>Your verification code is:</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0">${otp}</div>
        <p>This code expires in ${Number(process.env.OTP_TTL_MINUTES || 10)} minutes.</p>
      </div>
    `
  });

  return { sent: true };
};

const sendOtp = async ({ email, purpose = 'login' }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('email is required');
  }

  const otp = generateOtp(Number(process.env.OTP_LENGTH || 6));
  const expiresAt = Date.now() + Number(process.env.OTP_TTL_MINUTES || 10) * 60 * 1000;

  await Otp.findOneAndDelete({ email: normalizedEmail, purpose });
  await Otp.create({ email: normalizedEmail, purpose, otp, expiresAt: new Date(expiresAt) });
  await sendOtpEmail({ email: normalizedEmail, otp, purpose });

  return { otp, expiresAt };
};

const verifyOtp = async ({ email, purpose = 'login', otp }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const otpValue = String(otp || '').trim();
  const record = await Otp.findOne({
    email: normalizedEmail,
    otp: otpValue,
    $or: [{ purpose }, { purpose: { $exists: false } }]
  });
  if (!record) return false;
  if (record.expiresAt < Date.now()) {
    await Otp.deleteOne({ _id: record._id });
    return false;
  }
  await Otp.deleteOne({ _id: record._id });
  return true;
};

module.exports = { sendOtp, verifyOtp };
