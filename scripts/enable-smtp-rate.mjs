#!/usr/bin/env node

// ─────────────────────────────────────────────────────────────────────────────
// Updates email rate limit in Supabase Auth settings.
// Does NOT touch SMTP config — uses Supabase built-in email.
// ─────────────────────────────────────────────────────────────────────────────

const PROJECT_REF = 'glkolpuocczxxfwjiqag'
const API_BASE = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`

const payload = {
  // Only update rate limit — no SMTP changes
  rate_limit_email_sent: 30,
}

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token) { console.error('Set SUPABASE_ACCESS_TOKEN'); process.exit(1) }

  console.log('Updating rate limit...')
  const res = await fetch(API_BASE, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) { console.error(`FAILED ${res.status}:`, await res.text()); process.exit(1) }
  const data = await res.json()
  console.log('Done! rate_limit_email_sent:', data.rate_limit_email_sent)
}

main()
