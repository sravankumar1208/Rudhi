import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

interface OsmElement {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: {
    name?: string
    'addr:full'?: string
    'addr:street'?: string
    'addr:city'?: string
    phone?: string
    website?: string
    amenity?: string
    'contact:phone'?: string
    operator?: string
  }
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { lat, lng, radius = 10 } = await req.json()

    if (lat == null || lng == null) {
      return new Response(JSON.stringify({ error: 'lat and lng are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Convert radius from km to degrees (approx)
    const deg = radius / 111

    const overpassQuery = `
      [out:json];
      (
        node["amenity"="hospital"](${lat - deg},${lng - deg},${lat + deg},${lng + deg});
        way["amenity"="hospital"](${lat - deg},${lng - deg},${lat + deg},${lng + deg});
        relation["amenity"="hospital"](${lat - deg},${lng - deg},${lat + deg},${lng + deg});
      );
      out center;
    `

    const osmResp = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(overpassQuery)}`,
    })

    if (!osmResp.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch from OSM' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const osmData = await osmResp.json()
    const elements: OsmElement[] = osmData.elements || []

    // Get existing hospital names to skip duplicates
    const { data: existing } = await supabase
      .from('hospitals')
      .select('name')
    const existingNames = new Set((existing || []).map((h: { name: string }) => h.name?.toLowerCase().trim()))

    let inserted = 0
    const seen = new Set<string>()

    for (const el of elements) {
      const name = el.tags?.name
      if (!name) continue

      const key = name.toLowerCase().trim()
      if (existingNames.has(key) || seen.has(key)) continue
      seen.add(key)

      const osmLat = el.lat ?? el.center?.lat
      const osmLng = el.lon ?? el.center?.lon
      if (!osmLat || !osmLng) continue

      const address = [
        el.tags?.['addr:full'],
        el.tags?.['addr:street'],
        el.tags?.['addr:city'],
      ].filter(Boolean).join(', ') || `${name} area`

      const phone = el.tags?.phone || el.tags?.['contact:phone'] || ''
      const type = el.tags?.operator || 'Hospital'

      const { error } = await supabase.from('hospitals').insert({
        name,
        address,
        phone,
        location: `POINT(${osmLng} ${osmLat})`,
        type,
      })

      if (!error) inserted++
    }

    return new Response(JSON.stringify({
      message: `Seeded ${inserted} hospitals near (${lat}, ${lng}) within ${radius}km`,
      total_found: elements.length,
      inserted,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
