import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { userId, title, body, data } = await req.json()
    if (!userId || !title) {
      return new Response(JSON.stringify({ error: 'userId and title are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the user's FCM token
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('fcm_token, alert_preference')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const fcmToken = profile.fcm_token

    if (!fcmToken) {
      return new Response(JSON.stringify({ error: 'No FCM token registered' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send via FCM HTTP v1 API
    const fcmResponse = await fetch(
      `https://fcm.googleapis.com/v1/projects/${Deno.env.get('FCM_PROJECT_ID')}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('FCM_SERVER_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: fcmToken,
            notification: { title, body: body || '' },
            data: data || {},
            android: { priority: 'high', ttl: '86400s' },
            apns: {
              payload: {
                aps: { sound: 'default', badge: 1, 'content-available': 1 },
              },
            },
          },
        }),
      }
    )

    const fcmResult = await fcmResponse.json()

    return new Response(
      JSON.stringify({ success: fcmResponse.ok, fcmResult }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
