import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export const AuthCallback = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const handled = useRef(false)
  const [status, setStatus] = useState('Processing...')

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const code = searchParams.get('code')
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      console.error('[Rudhi] Auth callback error:', error, errorDescription)
      navigate(`/auth?error=${encodeURIComponent(error)}`, { replace: true })
      return
    }

    // PKCE flow: exchange authorization code for session
    if (code) {
      setStatus('Verifying your email...')
      supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
        if (exchangeError) {
          console.error('[Rudhi] PKCE exchange failed:', exchangeError.message)
          navigate('/auth?error=confirmation_failed', { replace: true })
        } else {
          setStatus('Email verified! Redirecting...')
          navigate('/home', { replace: true })
        }
      })
      return
    }

    // Token hash flow: verify OTP token
    if (tokenHash && type) {
      setStatus('Verifying your email...')
      supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error: otpError }) => {
        if (otpError) {
          console.error('[Rudhi] OTP verify failed:', otpError.message)
          navigate('/auth?error=confirmation_failed', { replace: true })
        } else {
          setStatus('Email verified! Redirecting...')
          if (type === 'recovery') {
            navigate('/auth/reset-password', { replace: true })
          } else {
            navigate('/home', { replace: true })
          }
        }
      })
      return
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
    }
  }, [navigate, searchParams])

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-neutral-mid">{status}</p>
    </div>
  )
}
