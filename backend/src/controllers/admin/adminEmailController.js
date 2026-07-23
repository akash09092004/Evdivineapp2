const mongoose = require('mongoose');
const DropMessage = require('../../models/admin/DropMessage');
const { asyncHandler } = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const { sendResponse } = require('../../utils/responseHandler');
const { sendEmail } = require('../../services/emailService');

const cleanText = (value) => String(value || '').trim();

const parseRecipients = (value) => {
  if (Array.isArray(value)) {
    return value.map(cleanText).filter(Boolean);
  }

  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const findDropMessage = async (body) => {
  const candidateIds = [
    body?.messageId,
    body?.dropMessageId,
    body?.dropId,
    body?.id,
    body?.contactMessageId
  ]
    .map(cleanText)
    .filter(Boolean);

  for (const id of candidateIds) {
    if (!mongoose.isValidObjectId(id)) continue;
    const doc = await DropMessage.findById(id);
    if (doc) return doc;
  }

  return null;
};

const sendAdminEmail = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const dropMessage = await findDropMessage(body);

  const replyText = cleanText(
    body.reply ||
      body.adminReply ||
      body.replyMessage ||
      body.response ||
      body.message ||
      body.text ||
      body.content ||
      body.body
  );

  const recipients = parseRecipients(
    dropMessage?.email || body.to || body.email || body.recipient || body.recipients
  );

  if (!recipients.length) {
    throw new AppError('Recipient email is required', 400, 'VALIDATION_ERROR');
  }

  const subject = cleanText(body.subject) || `Re: ${cleanText(dropMessage?.subject) || 'Contact Us message'}`;
  const text =
    cleanText(body.text) ||
    cleanText(body.message) ||
    replyText ||
    (dropMessage
      ? `Hello ${cleanText(dropMessage.name) || 'Customer'},\n\nThanks for contacting EvDivine.\n\n${replyText}`
      : '');
  const html = cleanText(body.html) || '';

  let emailCount = 0;
  for (const to of recipients) {
    await sendEmail({
      to,
      subject,
      text,
      html: html || undefined,
      fromName: body.fromName ? cleanText(body.fromName) : 'EvDivine'
    });
    emailCount += 1;
  }

  if (dropMessage && replyText) {
    dropMessage.reply = replyText;
    dropMessage.adminReply = replyText;
    dropMessage.replyMessage = replyText;
    dropMessage.response = replyText;
    dropMessage.replyAt = new Date();
    dropMessage.replyEmailSent = true;
    dropMessage.status = 'replied';
    await dropMessage.save();
  }

  return sendResponse(res, {
    message: emailCount > 1 ? 'Bulk email sent' : 'Email sent',
    data: {
      sent: true,
      emailCount,
      recipients,
      dropMessageId: dropMessage?._id ? String(dropMessage._id) : null
    }
  });
});

module.exports = {
  sendAdminEmail
};
