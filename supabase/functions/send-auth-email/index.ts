const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const SMTP_HOST = Deno.env.get('SMTP_HOST') ?? 'smtp.gmail.com'
const SMTP_PORT = Number(Deno.env.get('SMTP_PORT') ?? '465')
const SMTP_USER = Deno.env.get('SMTP_USER') ?? ''
const SMTP_PASS = Deno.env.get('SMTP_PASS') ?? ''
const SMTP_FROM = Deno.env.get('SMTP_FROM') ?? 'Rudhi <sy7616956@gmail.com>'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? 'https://glkolpuocczxxfwjiqag.supabase.co'
const SITE_URL = 'https://rudhi.vercel.app'

const SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email address – Rudhi',
  invite: "You've been invited – Rudhi",
  magiclink: 'Your sign-in link – Rudhi',
  recovery: 'Reset your password – Rudhi',
  email_change: 'Confirm email change – Rudhi',
  reauthentication: 'Your verification code – Rudhi',
  email: 'Your OTP code – Rudhi',
}

const BRAND = { name: 'Rudhi – Blood Bridge', color: '#C0152A', bg: '#f9fafb' }

const wrap = (body: string) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:'Inter',sans-serif;max-width:480px;margin:0 auto;padding:32px;background:${BRAND.bg};"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:${BRAND.color};font-size:24px;margin:0;">${BRAND.name}</h1></div>${body}<p style="color:#6B7280;font-size:12px;text-align:center;">With gratitude,<br/>The Rudhi Team</p></body></html>`

function buildContent(actionType: string, tokenHash: string): string {
  const appCallback = (type: string) =>
    `${SITE_URL}/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${type}`

  switch (actionType) {
    case 'signup':
      return wrap(`<p>Hi there,</p><p>Thanks for signing up! Click below to confirm your email and sign in automatically:</p><div style="margin:24px 0;text-align:center;"><a href="${appCallback('signup')}" style="display:inline-block;padding:14px 32px;background:#C0152A;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Confirm Email</a></div><p style="color:#6B7280;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>`)
    case 'magiclink':
      return wrap(`<p>Hi there,</p><p>Click the button below to sign in. This link expires shortly and can only be used once.</p><div style="margin:32px 0;text-align:center;"><a href="${appCallback('magiclink')}" style="display:inline-block;padding:14px 32px;background:#C0152A;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Sign In</a></div><p style="color:#6B7280;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>`)
    case 'recovery':
      return wrap(`<p>Hi there,</p><p>We received a request to reset your password. Click below to choose a new one.</p><div style="margin:32px 0;text-align:center;"><a href="${appCallback('recovery')}" style="display:inline-block;padding:14px 32px;background:#C0152A;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Reset Password</a></div><p style="color:#6B7280;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>`)
    case 'invite':
      return wrap(`<p>Hi there,</p><p>You've been invited to join Rudhi – Blood Bridge. Click below to accept.</p><div style="margin:32px 0;text-align:center;"><a href="${appCallback('invite')}" style="display:inline-block;padding:14px 32px;background:#C0152A;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Accept Invitation</a></div><p style="color:#6B7280;font-size:12px;">If you didn't expect this, you can safely ignore this email.</p>`)
    case 'email_change':
      return wrap(`<p>Hi there,</p><p>We received a request to change your email. Use the code below to confirm:</p><div style="margin:24px 0;text-align:center;padding:16px;background:#f0f0f0;border-radius:8px;font-size:28px;font-weight:bold;letter-spacing:8px;color:#C0152A;">${tokenHash}</div><p style="color:#6B7280;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>`)
    default:
      return wrap(`<p>Hi there,</p><p>Use the code below to verify your account:</p><div style="margin:24px 0;text-align:center;padding:16px;background:#f0f0f0;border-radius:8px;font-size:28px;font-weight:bold;letter-spacing:8px;color:#C0152A;">${tokenHash}</div><p style="color:#6B7280;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>`)
  }
}

async function smtpSend(to: string, subject: string, html: string): Promise<void> {
  const conn = await Deno.connectTls({ hostname: SMTP_HOST, port: SMTP_PORT })
  const w = conn.writable.getWriter()
  const r = conn.readable.getReader()
  const enc = new TextEncoder()
  const dec = new TextDecoder()

  async function cmd(c: string): Promise<string> {
    await w.write(enc.encode(c + '\r\n'))
    let out = ''
    for (let i = 0; i < 10; i++) {
      const { value } = await r.read()
      if (value) {
        out += dec.decode(value)
        if (out.includes('\r\n')) break
      }
    }
    return out
  }

  await cmd('')
  await cmd('EHLO rudhi.local')
  await cmd('AUTH LOGIN')
  await cmd(btoa(SMTP_USER))
  await cmd(btoa(SMTP_PASS))
  await cmd(`MAIL FROM:<${SMTP_USER}>`)
  await cmd(`RCPT TO:<${to}>`)
  await cmd('DATA')

  const data = `From: ${SMTP_FROM}\r\nTo: <${to}>\r\nSubject: ${subject}\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${html}\r\n.\r\n`
  await cmd(data)
  await cmd('QUIT')
  await conn.close()
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user, email_data } = await req.json()
    if (!user?.email || !email_data?.email_action_type) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const recipient = user.email
    const actionType = email_data.email_action_type
    const tokenHash = email_data.token_hash || email_data.token || ''
    const subject = SUBJECTS[actionType] || 'Notification from Rudhi'
    const html = buildContent(actionType, tokenHash)

    console.log(`[send-auth-email] Sending ${actionType} to ${recipient}`)
    await smtpSend(recipient, subject, html)
    console.log(`[send-auth-email] Sent ${actionType} to ${recipient}`)

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error(`[send-auth-email] Error:`, error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
