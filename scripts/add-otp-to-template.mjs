#!/usr/bin/env node

const PROJECT_REF = 'glkolpuocczxxfwjiqag'
const API_BASE = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`

const payload = {
  mailer_templates_magic_link_content: `<h2>Your sign-in link</h2>
<p>Click the link below to sign in. This link expires shortly and can only be used once.</p>
<p><a href="{{ .ConfirmationURL }}">Sign in</a></p>
<p>Or enter this OTP code manually: <strong>{{ .Token }}</strong></p>`,

  mailer_templates_confirmation_content: `<h2>Confirm your email address</h2>
<p>Click the link below to confirm your email address and finish signing up.</p>
<p><a href="{{ .ConfirmationURL }}">Confirm email address</a></p>
<p>Or enter this code manually: <strong>{{ .Token }}</strong></p>`,

  mailer_templates_recovery_content: `<h2>Reset your password</h2>
<p>We received a request to reset your password. Click the link below to set a new one.</p>
<p><a href="{{ .ConfirmationURL }}">Reset password</a></p>
<p>Or enter this code manually: <strong>{{ .Token }}</strong></p>
<p>If you didn't request this, you can safely ignore this email.</p>`,
}

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token) { console.error('Set SUPABASE_ACCESS_TOKEN'); process.exit(1) }
  const res = await fetch(API_BASE, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) { console.error(`FAILED ${res.status}:`, await res.text()); process.exit(1) }
  console.log('Email templates updated with OTP code support')
}

main()
