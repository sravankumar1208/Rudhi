import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') ?? '';
const BREVO_API = 'https://api.brevo.com/v3/smtp/email';

... (the rest unchanged) ...
        sender: { name: 'Rudhi', email: 'sravankumark1210.sse@saveetha.com' },

const SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email address – Rudhi',
  invite: "You've been invited – Rudhi",
  magiclink: 'Your sign-in link – Rudhi',
  recovery: 'Reset your password – Rudhi',
  email_change: 'Confirm email change – Rudhi',
  reauthentication: 'Your verification code – Rudhi',
  email: 'Your OTP code – Rudhi',
}

const BRAND = {
  name: 'Rudhi – Blood Bridge',
  color: '#C0152A',
  bg: '#f9fafb',
}

const wrap = (body: string) =>
  `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Inter',sans-serif;max-width:480px;margin:0 auto;padding:32px;background:${BRAND.bg};">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:${BRAND.color};font-size:24px;margin:0;">${BRAND.name}</h1>
  </div>
  ${body}
  <p style="color:#6B7280;font-size:12px;text-align:center;">With gratitude,<br/>The Rudhi Team</p>
</body>
</html>`

function buildContent(actionType: string, token: string, siteUrl: string, redirectTo: string): string {
  switch (actionType) {
    case 'signup':
      return wrap(`
        <p>Hi there,</p>
        <p>Thanks for signing up! Use the code below to confirm your email:</p>
        <div style="margin:24px 0;text-align:center;padding:16px;background:#f0f0f0;border-radius:8px;font-size:28px;font-weight:bold;letter-spacing:8px;color:#C0152A;">${token}</div>
        <p style="color:#6B7280;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
      `)
    case 'magiclink':
      return wrap(`
        <p>Hi there,</p>
        <p>Click the button below to sign in. This link expires shortly and can only be used once.</p>
        <div style="margin:32px 0;text-align:center;">
          <a href="${siteUrl}/auth/callback?token_hash=${token}&type=magiclink&redirect_to=${redirectTo}" style="display:inline-block;padding:14px 32px;background:#C0152A;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Sign In</a>
        </div>
        <p style="color:#6B7280;font-size:12px;">Or enter this code manually: <strong>${token}</strong></p>
        <p style="color:#6B7280;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
      `)
    case 'recovery':
      return wrap(`
        <p>Hi there,</p>
        <p>We received a request to reset your password. Click below to choose a new one.</p>
        <div style="margin:32px 0;text-align:center;">
          <a href="${siteUrl}/auth/callback?token_hash=${token}&type=recovery" style="display:inline-block;padding:14px 32px;background:#C0152A;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Reset Password</a>
        </div>
        <p style="color:#6B7280;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
      `)
    case 'invite':
      return wrap(`
        <p>Hi there,</p>
        <p>You've been invited to join Rudhi – Blood Bridge. Click below to accept and create your account.</p>
        <div style="margin:32px 0;text-align:center;">
          <a href="${siteUrl}/auth/callback?token_hash=${token}&type=invite" style="display:inline-block;padding:14px 32px;background:#C0152A;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Accept Invitation</a>
        </div>
        <p style="color:#6B7280;font-size:12px;">If you didn't expect this invitation, you can safely ignore this email.</p>
      `)
    case 'email_change':
      return wrap(`
        <p>Hi there,</p>
        <p>We received a request to change your email. Use the code below to confirm:</p>
        <div style="margin:24px 0;text-align:center;padding:16px;background:#f0f0f0;border-radius:8px;font-size:28px;font-weight:bold;letter-spacing:8px;color:#C0152A;">${token}</div>
        <p style="color:#6B7280;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
      `)
    default:
      return wrap(`
        <p>Hi there,</p>
        <p>Use the code below to verify your account:</p>
        <div style="margin:24px 0;text-align:center;padding:16px;background:#f0f0f0;border-radius:8px;font-size:28px;font-weight:bold;letter-spacing:8px;color:#C0152A;">${token}</div>
        <p style="color:#6B7280;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
      `)
  }
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user, email_data } = await req.json()

    if (!user?.email || !email_data?.email_action_type) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const recipient = user.email
    const actionType = email_data.email_action_type
    const token = email_data.token || ''
    const siteUrl = email_data.site_url || 'https://rudhi.app'
    const redirectTo = email_data.redirect_to || siteUrl
    const subject = SUBJECTS[actionType] || 'Notification from Rudhi'
    const html = buildContent(actionType, token, siteUrl, redirectTo)

    const brevoRes = await fetch(BREVO_API, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Rudhi', email: 'noreply@rudhi.in' },
        to: [{ email: recipient }],
        subject,
        htmlContent: html,
      }),
    })

    const brevoData = await brevoRes.json()

    if (!brevoRes.ok) {
      console.error('Brevo error:', brevoData)
      return new Response(JSON.stringify({ error: brevoData.message || 'Brevo failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
