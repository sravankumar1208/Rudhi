#!/usr/bin/env node

const PROJECT_REF = 'glkolpuocczxxfwjiqag'
const API_BASE = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`

const payload = {
  hook_send_email_enabled: false,
  hook_send_email_uri: null,
  hook_send_email_secrets: null,
  smtp_host: '',
  smtp_port: null,
  smtp_user: null,
  smtp_pass: null,
  smtp_sender_name: null,
  smtp_admin_email: null,

}

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token) { console.error('Set SUPABASE_ACCESS_TOKEN'); process.exit(1) }
  console.log('Reverting to built-in email...')
  const res = await fetch(API_BASE, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) { console.error(`FAILED ${res.status}:`, await res.text()); process.exit(1) }
  console.log('Done. Using Supabase free email with 2/min limit.')
}

main()
