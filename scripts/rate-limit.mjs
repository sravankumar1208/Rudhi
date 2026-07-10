#!/usr/bin/env node

const PROJECT_REF = 'glkolpuocczxxfwjiqag'
const API_BASE = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token) { console.error('Set SUPABASE_ACCESS_TOKEN'); process.exit(1) }

  const res = await fetch(API_BASE, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ rate_limit_email_sent: 30 }),
  })

  if (!res.ok) { console.error(`FAILED ${res.status}:`, await res.text()); process.exit(1) }

  const data = await res.json()
  console.log('rate_limit_email_sent:', data.rate_limit_email_sent)
}

main()
