import { supabase } from './supabase'

const getOrigin = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return 'https://rudhi.vercel.app'
}

// Callback used by magic‑link sign‑in / sign‑up flows
export const AUTH_CALLBACK = `${getOrigin()}/auth/callback?type=signup`
// Dedicated redirect for password‑reset emails - explicit recovery type
export const RESET_PASSWORD_REDIRECT = `${getOrigin()}/auth/callback?type=recovery`

function wrapAuthError(err) {
  if (!err) return null

  // Log the full error to console for debugging
  console.group('[Rudhi Auth Debug]')
  console.error('Raw Error:', err)
  if (typeof err === 'object') {
    console.error('Error Message Prop:', err.message)
    console.error('Error Description Prop:', err.error_description)
  }
  console.groupEnd()

  let message = ''

  if (typeof err === 'string') {
    message = err
  } else if (err && typeof err === 'object') {
    message = err.message || err.error_description || err.error || err.msg
  }

  if (!message || message === '{}') {
    message = 'An unexpected authentication error occurred. Please try again.'
  }

  if (message === 'Failed to fetch') {
    return new Error('Cannot reach authentication server. Please check your internet connection.')
  }

  const finalError = new Error(message)
  if (typeof err === 'object') Object.assign(finalError, err)
  return finalError
}

// ─── Magic Link ───────────────────────────────────────────────────────────────

export const sendEmailOtp = async (email) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: AUTH_CALLBACK,
    },
  })
  if (error) throw wrapAuthError(error)
  return data
}

export const sendSignUpOtp = async (email) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: AUTH_CALLBACK,
    },
  })
  if (error) throw wrapAuthError(error)
  return data
}

export const signUpWithPasswordCustomRedirect = async (email, password, redirectUrl) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl || AUTH_CALLBACK,
    },
  })
  if (error) throw wrapAuthError(error)
  return data
}

// ─── Email + Password ─────────────────────────────────────────────────────────

export const signUpWithPassword = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: AUTH_CALLBACK,
    },
  })
  if (error) throw wrapAuthError(error)
  return data
}

export const signInWithPassword = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw wrapAuthError(error)
  return data
}

export const updatePassword = async (newPassword) => {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw wrapAuthError(error)
  return data
}

// ─── Phone OTP ────────────────────────────────────────────────────────────────

export const sendPhoneOtp = async (phone) => {
  const { data, error } = await supabase.auth.signInWithOtp({ phone })
  if (error) throw wrapAuthError(error)
  return data
}

export const verifyPhoneOtp = async (phone, token) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })
  if (error) throw wrapAuthError(error)
  return data
}

// ─── Resend ──────────────────────────────────────────────────────────────────

export const resendVerification = async (email) => {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: AUTH_CALLBACK,
    },
  })
  if (error) throw wrapAuthError(error)
  return data
}

// ─── Password Reset ─────────────────────────────────────────────────────────

export const resetPasswordForEmail = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
    redirectTo: RESET_PASSWORD_REDIRECT,
  })
  if (error) throw wrapAuthError(error)
  return data
}

// ─── Session helpers ─────────────────────────────────────────────────────────

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw wrapAuthError(error)
  return session
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw wrapAuthError(error)
}
