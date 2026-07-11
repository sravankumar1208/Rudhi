import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export const AuthCallback = () => {
  const navigate = useNavigate()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/auth/reset-password', { replace: true })
        return
      }

      if (event === 'SIGNED_IN') {
        supabase.auth.signOut()
        navigate('/auth?confirmed=1', { replace: true })
      }
    })

    const timer = setTimeout(() => {
      supabase.auth.signOut()
      navigate('/auth?confirmed=1', { replace: true })
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [navigate])

  return (
    <div className="flex items-center justify-center h-screen">
      <LoadingSpinner size="lg" />
    </div>
  )
}
