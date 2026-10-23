import nodemailer from 'nodemailer';
import { env, smtpHost, smtpPort, smtpUser, smtpPass } from '../configs/env.config.js';
import logger from './logger.util.js';

let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  if (env.local && !smtpHost) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host:   'smtp.ethereal.email',
      port:   587,
      secure: false,
      auth:   { user: testAccount.user, pass: testAccount.pass },
    });
    logger.info(`[email] Ethereal test account: ${testAccount.user}`);
  } else {
    transporter = nodemailer.createTransport({
      host:   smtpHost,
      port:   smtpPort,
      secure: smtpPort === 465,
      auth:   smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
    });
  }

  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  try {
    const t    = await getTransporter();
    const info = await t.sendMail({ from: smtpUser || 'noreply@kultworks.com', to, subject, html, text });
    if (env.local) logger.info(`[email] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return info;
  } catch (err) {
    logger.error('[email] sendEmail failed', { message: err.message, to, subject });
  }
}

export async function sendPortalInvite({ to, firstName, inviteUrl }) {
  const subject = 'You have been invited to the Kultworks Immigration Portal';
  const html = `
    <p>Hi ${firstName || 'there'},</p>
    <p>You have been invited to access the Kultworks Immigration Portal.</p>
    <p><a href="${inviteUrl}">Click here to set up your account</a></p>
    <p>This link expires in 72 hours.</p>
  `;
  return sendEmail({ to, subject, html });
}

export async function sendDeadlineReminder({ to, cases }) {
  const subject = 'Immigration Case Deadline Reminder';
  const rows = (cases || [])
    .map((c) => `<li>${c.caseNumber} — ${c.visaType} — expires ${c.expiryDate?.toDateString?.() ?? c.expiryDate}</li>`)
    .join('');
  const html = `
    <p>The following cases have upcoming expiration dates:</p>
    <ul>${rows}</ul>
    <p>Please take action as needed.</p>
  `;
  return sendEmail({ to, subject, html });
}
