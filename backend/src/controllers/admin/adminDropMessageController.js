const DropMessage = require('../../models/admin/DropMessage');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');
const { sendEmail } = require('../../services/emailService');

const toPayload = (doc) => ({
  _id: doc._id ? String(doc._id) : undefined,
  name: doc.name || 'N/A',
  email: doc.email || 'N/A',
  phone: doc.phone || 'N/A',
  subject: doc.subject || 'N/A',
  message: doc.message || doc.note || 'N/A',
  status: doc.status || 'new',
  reply: doc.reply || '',
  adminReply: doc.adminReply || '',
  replyMessage: doc.replyMessage || '',
  response: doc.response || '',
  replyAt: doc.replyAt || null,
  replyEmailSent: Boolean(doc.replyEmailSent),
  date: doc.createdAt || null
});

const cleanReplyText = (value) => String(value || '').trim();

const buildReplyEmail = (doc, replyText) => {
  const originalSubject = cleanReplyText(doc.subject) || 'Contact Us message';
  const subject = `Re: ${originalSubject}`;
  const originalMessage = cleanReplyText(doc.message || doc.note || '');
  const originalName = cleanReplyText(doc.name) || 'Customer';
  const originalEmail = cleanReplyText(doc.email) || 'N/A';
  const originalPhone = cleanReplyText(doc.phone) || 'N/A';
  const originalDate = doc.createdAt ? new Date(doc.createdAt).toLocaleString() : 'N/A';

  const text = [
    `Hello ${originalName},`,
    '',
    'Thanks for contacting EvDivine.',
    '',
    'Admin reply:',
    replyText,
    '',
    'Original message reference:',
    `Name: ${originalName}`,
    `Email: ${originalEmail}`,
    `Phone: ${originalPhone}`,
    `Subject: ${cleanReplyText(doc.subject) || 'N/A'}`,
    `Message: ${originalMessage || 'N/A'}`,
    `Submitted on: ${originalDate}`,
    '',
    'Regards,',
    'EvDivine Team'
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#111827">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
        <div style="background:#7c3aed;color:#fff;padding:20px 24px">
          <h2 style="margin:0;font-size:22px;line-height:1.3">Re: ${escapeHtml(
            originalSubject
          )}</h2>
          <p style="margin:8px 0 0;font-size:14px;opacity:0.95">Reply from EvDivine support team</p>
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 16px">Hello ${escapeHtml(originalName)},</p>
          <p style="margin:0 0 18px">Thank you for reaching out to EvDivine. Please find our reply below:</p>
          <div style="padding:16px 18px;border-left:4px solid #7c3aed;background:#f5f3ff;border-radius:12px;margin-bottom:22px">
            <div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6b21a8;margin-bottom:8px">Admin Reply</div>
            <div style="white-space:pre-wrap;line-height:1.7;font-size:15px;color:#111827">${escapeHtml(
              replyText
            )}</div>
          </div>

          <div style="margin-bottom:10px;font-weight:700;color:#374151">Original message reference</div>
          <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px">
            <tr>
              <td style="padding:8px 0;color:#6b7280;width:110px;vertical-align:top">Name</td>
              <td style="padding:8px 0;color:#111827">${escapeHtml(originalName)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;vertical-align:top">Email</td>
              <td style="padding:8px 0;color:#111827">${escapeHtml(originalEmail)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;vertical-align:top">Phone</td>
              <td style="padding:8px 0;color:#111827">${escapeHtml(originalPhone)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;vertical-align:top">Subject</td>
              <td style="padding:8px 0;color:#111827">${escapeHtml(
                cleanReplyText(doc.subject) || 'N/A'
              )}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;vertical-align:top">Message</td>
              <td style="padding:8px 0;color:#111827;white-space:pre-wrap;line-height:1.7">${escapeHtml(
                originalMessage || 'N/A'
              )}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;vertical-align:top">Submitted</td>
              <td style="padding:8px 0;color:#111827">${escapeHtml(originalDate)}</td>
            </tr>
          </table>

          <p style="margin:24px 0 0;color:#374151">Regards,<br />EvDivine Team</p>
        </div>
      </div>
    </div>
  `;

  return { subject, text, html };
};

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const listDropMessages = asyncHandler(async (req, res) => {
  const rows = await DropMessage.find({}).sort({ createdAt: -1 }).lean();
  sendResponse(res, { data: rows.map(toPayload) });
});

const createDropMessage = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const phone = String(req.body.phone || '').trim();
  const subject = String(req.body.subject || '').trim();
  const message = String(req.body.message || '').trim();
  const status = String(req.body.status || 'new').trim();
  const note = String(req.body.note || '').trim();

  if (!name || !message) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'name and message are required'
    });
  }

  const doc = await DropMessage.create({
    name,
    email,
    phone,
    subject,
    message,
    status,
    note
  });

  sendResponse(res, { message: 'Drop message saved', data: toPayload(doc) });
});

const updateDropMessage = asyncHandler(async (req, res) => {
  const doc = await DropMessage.findByIdAndUpdate(
    req.params.id,
    {
      ...(req.body.name !== undefined ? { name: String(req.body.name).trim() } : {}),
      ...(req.body.email !== undefined ? { email: String(req.body.email).trim() } : {}),
      ...(req.body.phone !== undefined ? { phone: String(req.body.phone).trim() } : {}),
      ...(req.body.subject !== undefined ? { subject: String(req.body.subject).trim() } : {}),
      ...(req.body.message !== undefined ? { message: String(req.body.message).trim() } : {}),
      ...(req.body.status !== undefined ? { status: String(req.body.status).trim() } : {}),
      ...(req.body.note !== undefined ? { note: String(req.body.note).trim() } : {}),
      ...(req.body.reply !== undefined ? { reply: String(req.body.reply).trim() } : {}),
      ...(req.body.adminReply !== undefined ? { adminReply: String(req.body.adminReply).trim() } : {}),
      ...(req.body.replyMessage !== undefined ? { replyMessage: String(req.body.replyMessage).trim() } : {}),
      ...(req.body.response !== undefined ? { response: String(req.body.response).trim() } : {}),
      ...(req.body.replyAt !== undefined ? { replyAt: req.body.replyAt ? new Date(req.body.replyAt) : null } : {}),
      ...(req.body.replyEmailSent !== undefined ? { replyEmailSent: Boolean(req.body.replyEmailSent) } : {})
    },
    { new: true }
  );

  sendResponse(res, { message: 'Drop message updated', data: toPayload(doc) });
});

const replyToDropMessage = asyncHandler(async (req, res) => {
  const doc = await DropMessage.findById(req.params.id);
  if (!doc) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: 'Drop message not found'
    });
  }

  const replyText = cleanReplyText(
    req.body.reply ||
      req.body.adminReply ||
      req.body.replyMessage ||
      req.body.response
  );

  if (!replyText) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'reply is required'
    });
  }

  const nextReplyAt = new Date();

  doc.reply = replyText;
  doc.adminReply = replyText;
  doc.replyMessage = replyText;
  doc.response = replyText;
  doc.replyAt = nextReplyAt;
  doc.status = 'replied';
  doc.replyEmailSent = false;

  await doc.save();

  let emailSent = false;
  let emailError = null;

  if (cleanReplyText(doc.email)) {
    const emailPayload = buildReplyEmail(doc, replyText);

    try {
      await sendEmail({
        to: doc.email,
        subject: emailPayload.subject,
        text: emailPayload.text,
        html: emailPayload.html,
        fromName: 'EvDivine'
      });
      emailSent = true;
      doc.replyEmailSent = true;
      await doc.save();
    } catch (error) {
      emailError = error?.message || 'Unable to send reply email';
      doc.replyEmailSent = false;
      await doc.save();
    }
  } else {
    emailError = 'User email is missing on this message record';
  }

  const responseMessage = emailSent
    ? 'Reply saved, status updated, and email sent'
    : 'Reply saved and status updated, but email could not be sent';

  return sendResponse(res, {
    statusCode: emailSent ? 200 : 207,
    success: true,
    message: responseMessage,
    data: {
      message: responseMessage,
      replySaved: true,
      statusUpdated: true,
      emailSent,
      replyEmailSent: emailSent,
      replyAt: doc.replyAt || nextReplyAt,
      status: doc.status,
      reply: doc.reply,
      adminReply: doc.adminReply,
      replyMessage: doc.replyMessage,
      response: doc.response
    },
    meta: emailError ? { emailError } : null
  });
});

module.exports = {
  listDropMessages,
  createDropMessage,
  updateDropMessage,
  replyToDropMessage
};
