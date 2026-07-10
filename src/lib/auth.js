import { supabase } from './supabase'

const AUTH_REDIRECT = `${window.location.origin}/auth/callback`

function wrapAuthError(err) {
  if (err?.message === 'Failed to fetch') {
    console.error('[Rudhi] Auth network error. URL:', supabase.supabaseUrl, '| Check: 1) Supabase project active? 2) Env vars set? 3) Ad blocker off?')
    return new Error('Cannot reach authentication server. Please check your internet connection and try again.')
  }
  return err
}

// ─── Magic Link ───────────────────────────────────────────────────────────────

export const sendEmailOtp = async (email) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: AUTH_REDIRECT,
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
      emailRedirectTo: AUTH_REDIRECT,
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
      emailRedirectTo: AUTH_REDIRECT,
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

// ─── Password Reset ─────────────────────────────────────────────────────────

export const resetPasswordForEmail = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: AUTH_REDIRECT,
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
