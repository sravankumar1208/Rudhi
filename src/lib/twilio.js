import { supabase } from './supabase'

const EMERGENCY_SMS_NUMBER = import.meta.env.VITE_EMERGENCY_SMS_NUMBER

export const isTwilioConfigured = () => {
  return !!import.meta.env.VITE_TWILIO_PHONE_NUMBER
}

export const sendEmergencySMS = async ({ to, message }) => {
  if (!isTwilioConfigured()) {
    console.warn('Twilio not configured — SMS not sent')
    return { error: 'Twilio not configured' }
  }

  // SMS is sent server-side via Edge Function to protect Twilio credentials
  const { data, error } = await supabase.functions.invoke('send-sms', {
    body: { to, message },
  })

  if (error) throw error
  return data
}

export const getEmergencyContactNumber = () => {
  return EMERGENCY_SMS_NUMBER
}
