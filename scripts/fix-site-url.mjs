#!/usr/bin/env node

const PROJECT_REF = 'glkolpuocczxxfwjiqag'
const API_BASE = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`

const payload = {
  site_url: 'http://localhost:5173',
  uri_allow_list: 'http://localhost:5173,http://localhost:5174,http://localhost:3000',
}

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token) { console.error('Set SUPABASE_ACCESS_TOKEN'); process.exit(1) }
  console.log('Updating site URL...')
  const res = await fetch(API_BASE, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) { console.error(`FAILED ${res.status}:`, await res.text()); process.exit(1) }
  console.log('Site URL updated to http://localhost:5173')
}

main()
