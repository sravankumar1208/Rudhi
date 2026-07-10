import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { requestId } = await req.json()
    if (!requestId) {
      return new Response(JSON.stringify({ error: 'requestId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Fetch the blood request
    const { data: request, error: reqError } = await supabaseClient
      .from('blood_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (reqError || !request) {
      return new Response(JSON.stringify({ error: 'Request not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Extract coordinates from PostGIS point
    const pointMatch = request.hospital_location?.match(/POINT\(([^ ]+) ([^ ]+)\)/)
    if (!pointMatch) {
      return new Response(JSON.stringify({ error: 'Hospital location not set' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const lng = parseFloat(pointMatch[1])
    const lat = parseFloat(pointMatch[2])

    // Call the find_nearby_donors SQL function
    const { data: donors, error: donorsError } = await supabaseClient.rpc(
      'find_nearby_donors',
      {
        request_lat: lat,
        request_lng: lng,
        blood_grp: request.blood_group,
        radius_km: request.alert_radius_km,
      }
    )

    if (donorsError) {
      console.error('find_nearby_donors error:', donorsError)
      return new Response(JSON.stringify({ error: donorsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const matchedDonors = donors || []

    // Create donor_responses entries for all matched donors
    if (matchedDonors.length > 0) {
      const responseRows = matchedDonors.map((donor: { id: string }) => ({
        request_id: requestId,
        donor_id: donor.id,
        response: 'pending',
      }))

      const { error: insertError } = await supabaseClient
        .from('donor_responses')
        .upsert(responseRows, { onConflict: 'request_id, donor_id' })

      if (insertError) {
        console.error('Error inserting donor responses:', insertError)
      }

      // Create notifications for each matched donor
      const notifications = matchedDonors.map((donor: { id: string }) => ({
        user_id: donor.id,
        type: 'alert',
        title: 'Urgent Blood Request',
        body: `${request.units_needed} unit(s) of ${request.blood_group} needed at ${request.hospital_name}`,
        data: { request_id: requestId, urgency: request.urgency },
      }))

      const { error: notifError } = await supabaseClient
        .from('notifications')
        .insert(notifications)

      if (notifError) {
        console.error('Error inserting notifications:', notifError)
      }
    }

    // Update the request with donor count
    await supabaseClient
      .from('blood_requests')
      .update({ donors_pinged: matchedDonors.length })
      .eq('id', requestId)

    return new Response(
      JSON.stringify({
        success: true,
        donors_pinged: matchedDonors.length,
        donors: matchedDonors.map((d: { id: string; full_name: string; distance_km: number }) => ({
          id: d.id,
          name: d.full_name,
          distance_km: d.distance_km,
        })),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
