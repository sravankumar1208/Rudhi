import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

function getHashParams() {
  const hash = window.location.hash
  if (!hash || hash.length < 2) return {}
  const params = new URLSearchParams(hash.substring(1))
  return Object.fromEntries(params.entries())
}

export const AuthCallback = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const handled = useRef(false)
  const [status, setStatus] = useState('Processing...')
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const code = searchParams.get('code')
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    const hashParams = getHashParams()
    const accessToken = searchParams.get('access_token') || hashParams.access_token
    const refreshToken = searchParams.get('refresh_token') || hashParams.refresh_token
    const hashType = hashParams.type || type
    const isRecovery = (hashType || type) === 'recovery'

    console.log('[Rudhi] AuthCallback params:', { code: !!code, tokenHash: !!tokenHash, type, accessToken: !!accessToken, refreshToken: !!refreshToken, hashParams })

    if (error) {
      console.error('[Rudhi] Auth callback error:', error, errorDescription)
      navigate(`/auth?error=${encodeURIComponent(error)}`, { replace: true })
      return
    }

    const navigateAfterAuth = (recovery) => {
      if (recovery) {
        navigate('/auth/reset-password', { replace: true })
      } else {
        navigate('/home', { replace: true })
      }
    }

    const waitForSession = (onReady) => {
      if (isAuthenticated) {
        onReady()
        return undefined
      }
      let gone = false
      const unsub = useAuthStore.subscribe((state) => {
        if (!gone && state.isAuthenticated) {
          gone = true
          unsub()
          onReady()
        }
      })
      return unsub
    }

    let cleanup = () => {}

    // PKCE flow: exchange authorization code for session
    if (code) {
      setStatus('Verifying your email...')
      supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
        if (exchangeError) {
          console.error('[Rudhi] PKCE exchange failed:', exchangeError.message)
          navigate('/auth?error=confirmation_failed', { replace: true })
        } else {
          setStatus('Email verified! Signing you in...')
          cleanup = waitForSession(() => navigateAfterAuth(isRecovery)) || cleanup
        }
      })
      return () => cleanup()
    }

    // Token from Supabase server-side verify (access_token/refresh_token pair)
    if (accessToken && refreshToken) {
      setStatus('Signing you in...')
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error: sessionError }) => {
        if (sessionError) {
          console.error('[Rudhi] Session set failed:', sessionError.message)
          navigate('/auth?error=confirmation_failed', { replace: true })
        } else {
          setStatus('Signed in! Redirecting...')
          cleanup = waitForSession(() => navigateAfterAuth(isRecovery)) || cleanup
        }
      })
      return () => cleanup()
    }

    // Token hash flow: verify OTP token
    if (tokenHash && type) {
      setStatus('Verifying your email...')
      supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error: otpError }) => {
        if (otpError) {
          console.error('[Rudhi] OTP verify failed:', otpError.message)
          navigate('/auth?error=confirmation_failed', { replace: true })
        } else {
          setStatus('Email verified! Signing you in...')
          cleanup = waitForSession(() => navigateAfterAuth(type === 'recovery')) || cleanup
        }
      })
      return () => cleanup()
    }

    // Fallback: listen for auth state changes
    setStatus('Waiting for authentication...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/auth/reset-password', { replace: true })
        return
      }

      if (event === 'SIGNED_IN' && session) {
        navigate('/home', { replace: true })
      }
    })

    const timer = setTimeout(() => {
      navigate('/auth?error=timeout', { replace: true })
    }, 15000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
      cleanup()
    }
  }, [navigate, searchParams, isAuthenticated])

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-neutral-mid">{status}</p>
    </div>
  )
}
