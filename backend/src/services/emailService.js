const nodemailer = require('nodemailer');

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

const getFromAddress = () =>
  process.env.MAIL_FROM ||
  process.env.EMAIL_FROM ||
  process.env.MAIL_USER ||
  process.env.EMAIL_USER ||
  '';

const sendEmail = async ({ to, subject, text, html, fromName = 'EvDivine' }) => {
  const transporter = getTransporter();
  const from = getFromAddress();

  if (!transporter || !from) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email transporter is not configured');
    }

    return { skipped: true };
  }

  await transporter.sendMail({
    from: `"${fromName}" <${from}>`,
    to,
    subject,
    text,
    html
  });

  return { sent: true };
};

module.exports = {
  sendEmail
};
