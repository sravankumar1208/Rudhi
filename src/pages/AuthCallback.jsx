import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store'
import { getMyProfile, upsertProfile } from '../lib/api/profiles'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export const AuthCallback = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setUser, setProfile } = useAuthStore()
  const handled = useRef(false)

  const getSignupMeta = () => {
    const urlName = searchParams.get('name')
    const urlRole = searchParams.get('role')
    if (urlName && urlRole) return { name: decodeURIComponent(urlName), role: urlRole }
    const sessionMeta = sessionStorage.getItem('signup_meta')
    if (sessionMeta) {
      sessionStorage.removeItem('signup_meta')
      return JSON.parse(sessionMeta)
    }
    return null
  }

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/auth/reset-password', { replace: true })
        return
      }

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        const meta = getSignupMeta()

        if (meta) {
          setUser(session.user)
          try { await upsertProfile({ full_name: meta.name, role: meta.role }) } catch {}
          try {
            const profile = await getMyProfile()
            setProfile(profile)
          } catch {}
          navigate('/profile-setup', { replace: true })
        } else {
          await supabase.auth.signOut()
          navigate('/auth', { replace: true })
        }
      }
    })

    const timer = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const meta = getSignupMeta()

          if (meta) {
            setUser(session.user)
            try { await upsertProfile({ full_name: meta.name, role: meta.role }) } catch {}
            try {
              const profile = await getMyProfile()
              setProfile(profile)
            } catch {}
            navigate('/profile-setup', { replace: true })
          } else {
            await supabase.auth.signOut()
            navigate('/auth', { replace: true })
          }
        } else {
          navigate('/auth', { replace: true })
        }
      } catch {
        navigate('/auth', { replace: true })
      }
    }, 2000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [navigate, setUser, setProfile, searchParams])

  return (
    <div className="flex items-center justify-center h-screen">
      <LoadingSpinner size="lg" />
    </div>
  )
}
