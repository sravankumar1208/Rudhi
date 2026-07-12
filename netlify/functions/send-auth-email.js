const nodemailer = require('nodemailer');

const SMTP_USER = process.env.SMTP_USER || 'sy7616956@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'rucwhpavtllsckso';
const SMTP_FROM = process.env.SMTP_FROM || 'Rudhi <sy7616956@gmail.com>';

const SUBJECTS = {
  signup: 'Confirm your email address – Rudhi',
  invite: "You've been invited – Rudhi",
  magiclink: 'Your sign-in link – Rudhi',
  recovery: 'Reset your password – Rudhi',
  email_change: 'Confirm email change – Rudhi',
  reauthentication: 'Your verification code – Rudhi',
  email: 'Your OTP code – Rudhi',
};

const BRAND = { name: 'Rudhi – Blood Bridge', color: '#C0152A', bg: '#f9fafb' };

function wrap(body) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:'Inter',sans-serif;max-width:480px;margin:0 auto;padding:32px;background:${BRAND.bg};"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:${BRAND.color};font-size:24px;margin:0;">${BRAND.name}</h1></div>${body}<p style="color:#6B7280;font-size:12px;text-align:center;">With gratitude,<br/>The Rudhi Team</p></body></html>`;
}

function buildContent(actionType, token, siteUrl, redirectTo) {
  const btn = (url, label) => `<a href="${url}" style="display:inline-block;padding:14px 32px;background:#C0152A;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">${label}</a>`;
  const code = (t) => `<div style="margin:24px 0;text-align:center;padding:16px;background:#f0f0f0;border-radius:8px;font-size:28px;font-weight:bold;letter-spacing:8px;color:#C0152A;">${t}</div>`;
  const note = '<p style="color:#6B7280;font-size:12px;">If you didn\'t request this, you can safely ignore this email.</p>';

  switch (actionType) {
    case 'signup':
      return wrap(`<p>Hi there,</p><p>Thanks for signing up! Use the code below to confirm your email:</p>${code(token)}<div style="margin:24px 0;text-align:center;">${btn(siteUrl + '/auth/callback?token_hash=' + token + '&type=signup&redirect_to=' + redirectTo, 'Confirm Email')}</div>${note}`);
    case 'magiclink':
      return wrap(`<p>Hi there,</p><p>Click below to sign in. This link expires shortly.</p><div style="margin:32px 0;text-align:center;">${btn(siteUrl + '/auth/callback?token_hash=' + token + '&type=magiclink&redirect_to=' + redirectTo, 'Sign In')}</div><p style="color:#6B7280;font-size:12px;">Or enter this code: <strong>${token}</strong></p>${note}`);
    case 'recovery':
      return wrap(`<p>Hi there,</p><p>We received a request to reset your password.</p><div style="margin:32px 0;text-align:center;">${btn(siteUrl + '/auth/callback?token_hash=' + token + '&type=recovery', 'Reset Password')}</div>${note}`);
    case 'invite':
      return wrap(`<p>Hi there,</p><p>You've been invited to join Rudhi – Blood Bridge.</p><div style="margin:32px 0;text-align:center;">${btn(siteUrl + '/auth/callback?token_hash=' + token + '&type=invite&redirect_to=' + redirectTo, 'Accept Invitation')}</div>${note}`);
    case 'email_change':
      return wrap(`<p>Hi there,</p><p>Use the code below to confirm your email change:</p>${code(token)}${note}`);
    default:
      return wrap(`<p>Hi there,</p><p>Use the code below to verify your account:</p>${code(token)}${note}`);
  }
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { user, email_data } = JSON.parse(event.body || '{}');

    if (!user?.email || !email_data?.email_action_type) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid payload' }) };
    }

    const recipient = user.email;
    const actionType = email_data.email_action_type;
    const token = email_data.token || '';
    const siteUrl = email_data.site_url || 'https://rudhi.netlify.app';
    const redirectTo = email_data.redirect_to || siteUrl;
    const subject = SUBJECTS[actionType] || 'Notification from Rudhi';
    const html = buildContent(actionType, token, siteUrl, redirectTo);

    console.log(`[send-auth-email] Sending ${actionType} to ${recipient}`);

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: SMTP_FROM,
      to: recipient,
      subject,
      html,
    });

    console.log(`[send-auth-email] ✓ Sent ${actionType} to ${recipient}`);

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error(`[send-auth-email] Error:`, error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
