import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Mark all searching requests past their expiry as expired
    const { data, error } = await supabaseClient
      .from('blood_requests')
      .update({ status: 'expired' })
      .in('status', ['searching', 'matched'])
      .lt('expires_at', new Date().toISOString())
      .select()

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: data?.length || 0,
        message: `${data?.length || 0} request(s) marked as expired`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
