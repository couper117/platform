const nodemailer = require('nodemailer');
const env = require('../config/env');

// Build a transport only when SMTP is configured; otherwise fall back to a
// console "transport" so dev flows (password reset, notices) work without SMTP.
const isConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

let transporter = null;
if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT || '587', 10),
    secure: parseInt(env.SMTP_PORT || '587', 10) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

/**
 * Send an email. Never throws into the caller — logs and resolves so a mail
 * failure can't break the request flow.
 */
const sendMail = async ({ to, subject, html, text }) => {
  const from = env.SMTP_FROM || 'RwaSport <noreply@rwasport.rw>';
  if (!transporter) {
    console.log(`[mail:dev] To:${to} | ${subject}\n${text || html}`);
    return { queued: false, dev: true };
  }
  try {
    await transporter.sendMail({ from, to, subject, html, text });
    return { queued: true };
  } catch (error) {
    console.error('[mail] send failed:', error.message);
    return { queued: false, error: error.message };
  }
};

module.exports = { sendMail };
