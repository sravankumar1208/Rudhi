import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store'
import { getMyProfile, upsertProfile } from '../lib/api/profiles'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export const AuthCallback = () => {
  const navigate = useNavigate()
  const { setUser, setProfile } = useAuthStore()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/auth/reset-password', { replace: true })
        return
      }

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        setUser(session.user)
        const meta = sessionStorage.getItem('signup_meta')
        if (meta) {
          const { name, role } = JSON.parse(meta)
          try { await upsertProfile({ full_name: name, role }) } catch { /* profile may already exist */ }
          sessionStorage.removeItem('signup_meta')
        }
        try {
          const profile = await getMyProfile()
          setProfile(profile)
        } catch { /* profile may not exist yet */ }
        navigate(meta ? '/profile-setup' : '/home', { replace: true })
      }
    })

    const timer = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          const meta = sessionStorage.getItem('signup_meta')
          if (meta) {
            const { name, role } = JSON.parse(meta)
            try { await upsertProfile({ full_name: name, role }) } catch { /* profile may already exist */ }
            sessionStorage.removeItem('signup_meta')
          }
          try {
            const profile = await getMyProfile()
            setProfile(profile)
          } catch { /* profile may not exist yet */ }
          navigate(meta ? '/profile-setup' : '/home', { replace: true })
        }
      } catch { /* session not ready yet */ }
    }, 2000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [navigate, setUser, setProfile])

  return (
    <div className="flex items-center justify-center h-screen">
      <LoadingSpinner size="lg" />
    </div>
  )
}
