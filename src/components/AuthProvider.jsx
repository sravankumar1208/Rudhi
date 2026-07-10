import { useEffect, createContext } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore, useUIStore } from '../store'
import { getMyProfile } from '../lib/api/profiles'
import { requestNotificationPermission, registerFCMToken } from '../lib/fcm'
import { LoadingSpinner } from './ui/LoadingSpinner'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const { setUser, setProfile, setLoading, clearAuth, isLoading, user } = useAuthStore()
  const { darkMode } = useUIStore()

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [darkMode])

  useEffect(() => {
    if (user) {
      requestNotificationPermission().then(granted => {
        if (granted) registerFCMToken()
      })
    }
  }, [user])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('getSession error:', error)
        clearAuth()
      } else if (session?.user) {
        setUser(session.user)
        try {
          const profile = await getMyProfile()
          setProfile(profile)
        } catch { /* profile may not exist yet */ }
      } else {
        clearAuth()
      }
      setLoading(false)
    }).catch(() => {
      clearAuth()
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        try {
          const profile = await getMyProfile()
          setProfile(profile)
        } catch { /* profile may not exist yet */ }
      }

      if (event === 'SIGNED_OUT') {
        clearAuth()
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, setProfile, setLoading, clearAuth])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-secondary dark:bg-dark-bg">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>
}
