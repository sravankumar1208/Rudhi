const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

const getApiKey = () => import.meta.env.VITE_OPENAI_API_KEY

export const isOpenAIConfigured = () => {
  return !!getApiKey()
}

export const generateAISuggestion = async ({ prompt, context }) => {
  const apiKey = getApiKey()
  if (!apiKey) {
    return { error: 'OpenAI API key not configured' }
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for Rudhi – Blood Bridge, a blood donation platform.
You help patients and their families create effective blood requests.
Be empathetic, concise, and accurate.

Key things you can help with:
- Suggesting which blood group is compatible
- Writing urgency descriptions
- Providing tips for faster donor matching
- Explaining the donation process`,
          },
          {
            role: 'user',
            content: `Context: ${context || 'No additional context'}

User request: ${prompt}`,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return { error: err.error?.message || 'OpenAI API error' }
    }

    const data = await response.json()
    return { suggestion: data.choices?.[0]?.message?.content?.trim() || '' }
  } catch (err) {
    return { error: err.message }
  }
}

export const suggestBloodRequestDetails = async ({ bloodGroup, urgency, hospitalName, patientAge }) => {
  return generateAISuggestion({
    prompt: `Help me write a blood request for ${bloodGroup} blood at ${hospitalName}.${patientAge ? ` Patient age: ${patientAge}.` : ''} Urgency: ${urgency}. What details should I include to get matched faster?`,
    context: 'Blood request creation',
  })
}
