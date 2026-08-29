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
    const { imageUrl, donorName, hospitalName, unitsDonated } = await req.json()

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ isAuthorized: false, reason: "Donation proof photo is required." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('XAI_API_KEY')
    if (!apiKey) {
      throw new Error("XAI_API_KEY is not set.")
    }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "grok-vision-beta",
        messages: [
          {
            role: "system",
            content: `You are an automated medical verification agent for a blood donation network. Your sole job is to authenticate user-submitted proof photos before awarding certificates.

CRITERIA FOR APPROVAL (isAuthorized = true):
- Blood donation certificate or official donor card.
- Hospital acknowledgement slip, blood bank bill, or blood camp stamp.
- Visible blood collection bag/tubes with clinical labels in a medical environment.
- Live photograph of the donor actively donating blood under clinical supervision.

CRITERIA FOR REJECTION (isAuthorized = false):
- Random selfies, personal photos without clinical context, or memes.
- Blank images, scenery, food, or screenshots of chats/text messages.
- Prescription slips or unrelated medical bills that do not mention blood donation.

Return strictly raw valid JSON with no markdown backticks or commentary:
{
  "isAuthorized": true | false,
  "confidence": number,
  "reason": "Clear explanation of why it was authorized or rejected"
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Evaluate this blood donation proof. Context: Donor Name: ${donorName || 'N/A'}, Hospital: ${hospitalName || 'N/A'}, Units Donated: ${unitsDonated || 1}.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        temperature: 0.1,
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`xAI API Error: ${response.status} - ${errText}`)
    }

    const data = await response.json()
    const rawText = data.choices[0].message.content.trim()
    const cleanJson = rawText.replace(/^```json/i, '').replace(/```$/i, '').trim()
    const result = JSON.parse(cleanJson)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("Grok Vision Authorization Error:", error)
    return new Response(
      JSON.stringify({ isAuthorized: false, reason: "AI authorization failed: " + error.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
