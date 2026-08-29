import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()
    const apiKey = Deno.env.get('GROQ_API_KEY')

    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set in edge function secrets.")
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `You are a medical assistant parsing blood request data. 
Extract the following fields from the user's prompt and return ONLY a raw JSON object.
Do not use markdown blocks.

Fields to extract:
- bloodGroup: (enum: 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
- units: number
- urgency: ('critical' | 'moderate' | 'routine')
- hospitalName: string
- patientName: string

If a field is not found, leave it empty or provide a safe default.`
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" }
      })
    })

    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.message)
    }

    const parsedContent = JSON.parse(data.choices[0].message.content)

    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
