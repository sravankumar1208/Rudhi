import { supabase } from './supabase'

const PROD_ORIGIN = 'https://rudhi-blood.netlify.app'
// Callback used by magic‑link sign‑in / sign‑up flows
export const AUTH_CALLBACK = `${PROD_ORIGIN}/auth/callback`
// Dedicated redirect for password‑reset emails
export const RESET_PASSWORD_REDIRECT = `${PROD_ORIGIN}/auth/reset-password`

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

// ─── Password Reset ─────────────────────────────────────────────────────────

export const resetPasswordForEmail = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
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
