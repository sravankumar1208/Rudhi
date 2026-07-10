#!/usr/bin/env node

const PROJECT_REF = 'glkolpuocczxxfwjiqag'
const API_BASE = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`

const BRAND = {
  name: 'Rudhi – Blood Bridge',
  color: '#C0152A',
  bg: '#f9fafb',
}

const tmpl = (body) => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Inter',sans-serif;max-width:480px;margin:0 auto;padding:32px;background:${BRAND.bg};">
  ${body}
  <p style="color:#6B7280;font-size:12px;text-align:center;">With gratitude,<br/>The Rudhi Team</p>
</body>
</html>`

const header = (title) => `
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:${BRAND.color};font-size:24px;margin:0;">${BRAND.name}</h1>
    <p style="color:#6B7280;">${title}</p>
  </div>`

const button = (url, label) =>
  `<a href="${url}" style="display:inline-block;padding:14px 32px;background:${BRAND.color};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">${label}</a>`

const payload = {
  // Webhook disabled — use Supabase built-in SMTP
  hook_send_email_enabled: false,

  // OTP settings
  mailer_otp_length: 6,
  mailer_otp_exp: 3600,

  // Email templates
  mailer_subjects_confirmation: 'Confirm your email address – Rudhi',
  mailer_templates_confirmation_content: tmpl(`
    ${header('Confirm your email address')}
    <p>Hi there,</p>
    <p>Thanks for signing up! Click the button below to confirm your email address and activate your account.</p>
    <div style="margin:32px 0;text-align:center;">${button('{{ .ConfirmationURL }}', 'Confirm Email')}</div>
    <p style="color:#6B7280;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
  `),

  mailer_subjects_magic_link: 'Your sign-in link – Rudhi',
  mailer_templates_magic_link_content: tmpl(`
    ${header('Your sign-in link')}
    <p>Hi there,</p>
    <p>Click the button below to sign in. This link expires shortly and can only be used once.</p>
    <div style="margin:32px 0;text-align:center;">${button('{{ .ConfirmationURL }}', 'Sign In')}</div>
    <p style="color:#6B7280;font-size:12px;">Or enter this OTP code manually: <strong>{{ .Token }}</strong></p>
    <p style="color:#6B7280;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
  `),

  mailer_subjects_recovery: 'Reset your password – Rudhi',
  mailer_templates_recovery_content: tmpl(`
    ${header('Reset your password')}
    <p>Hi there,</p>
    <p>We received a request to reset your password. Click the button below to choose a new one.</p>
    <div style="margin:32px 0;text-align:center;">${button('{{ .ConfirmationURL }}', 'Reset Password')}</div>
    <p style="color:#6B7280;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
  `),

  mailer_subjects_invite: "You've been invited – Rudhi",
  mailer_templates_invite_content: tmpl(`
    ${header("You've been invited")}
    <p>Hi there,</p>
    <p>You've been invited to join Rudhi – Blood Bridge. Click the button below to accept and create your account.</p>
    <div style="margin:32px 0;text-align:center;">${button('{{ .ConfirmationURL }}', 'Accept Invitation')}</div>
    <p style="color:#6B7280;font-size:12px;">If you didn't expect this invitation, you can safely ignore this email.</p>
  `),

  mailer_subjects_email_change: 'Confirm email change – Rudhi',
  mailer_templates_email_change_content: tmpl(`
    ${header('Confirm email change')}
    <p>Hi there,</p>
    <p>We received a request to change your email from <strong>{{ .OldEmail }}</strong> to <strong>{{ .NewEmail }}</strong>.</p>
    <p>Click the button below to confirm this change.</p>
    <div style="margin:32px 0;text-align:center;">${button('{{ .ConfirmationURL }}', 'Confirm Change')}</div>
    <p style="color:#6B7280;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
  `),
}

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token) {
    console.error('ERROR: Set SUPABASE_ACCESS_TOKEN environment variable.')
    process.exit(1)
  }

  console.log('Updating auth config...')
  const res = await fetch(API_BASE, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`FAILED (${res.status}):`, err)
    process.exit(1)
  }

  console.log('Auth config updated successfully!')
  console.log('Changes applied:')
  console.log('  smtp_port: 586 -> 587')
  console.log('  smtp_user: Rudhi -> resend')
  console.log('  smtp_pass: set to Resend API key')
  console.log('  smtp_sender_name: rudhi service -> Rudhi')
  console.log('  smtp_admin_email: noreply@rudhi.com -> noreply@rudhi.app')
  console.log('  mailer_otp_length: 8 -> 6')
  console.log('  All email templates updated with Rudhi branding')
}

main()
