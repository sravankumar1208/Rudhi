const RESEND_API_URL = 'https://api.resend.com/emails'

export const isResendConfigured = () => {
  return !!import.meta.env.VITE_RESEND_API_KEY
}

export const sendEmail = async ({ to, subject, html }) => {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY
  if (!apiKey) {
    console.warn('Resend API key not configured — email not sent')
    return { error: 'Resend not configured' }
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Rudhi <noreply@rudhi.app>',
        to,
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return { error: err.message || 'Resend API error' }
    }

    const data = await response.json()
    return { id: data.id }
  } catch (err) {
    return { error: err.message }
  }
}

export const sendDonationCertificateEmail = async ({ to, name, donationId }) => {
  return sendEmail({
    to,
    subject: 'Your Donation Certificate – Rudhi Blood Bridge',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #C0152A; font-size: 24px;">Rudhi – Blood Bridge</h1>
          <p style="color: #6B7280;">Certificate of Appreciation</p>
        </div>
        <p>Dear ${name},</p>
        <p>Thank you for your generous blood donation. Your contribution has saved lives.</p>
        <p>Your certificate is available in the app. Share it and inspire others to donate!</p>
        <div style="margin: 32px 0; padding: 24px; background: #F9E5E8; border-radius: 12px; text-align: center;">
          <p style="margin: 0; color: #C0152A; font-size: 14px;">Donation ID: ${donationId}</p>
        </div>
        <p style="color: #6B7280; font-size: 12px;">With gratitude,<br/>The Rudhi Team</p>
      </div>
    `,
  })
}
