import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import * as Tabs from '@radix-ui/react-tabs'
import { Heart, Building2, KeyRound, Mail, ArrowLeft, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { BloodDropIcon } from '../components/ui/BloodDropIcon'
import { cn } from '../lib/utils'
import { signInWithPassword, signUpWithPassword, signUpWithPasswordCustomRedirect, AUTH_CALLBACK, resendVerification } from '../lib/auth'
import { useAuthStore } from '../store'
import { upsertProfile, getMyProfile } from '../lib/api/profiles'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export const Auth = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { setUser, setProfile, isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Only auto-redirect if we ARE NOT in the middle of a password recovery
    // This stops the "teleportation" bug where the app takes you home before the reset is finished
    const isRecovery = location.search.includes('recovery') ||
                      location.search.includes('type=recovery') ||
                      window.location.hash.includes('recovery')

    if (isAuthenticated && !isRecovery) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, navigate, location.search])

  useEffect(() => {
    if (searchParams.get('confirmed') === '1') {
      toast.success('Email confirmed! Please sign in.')
    }
  }, [searchParams])

  // Sign In
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')

  // Sign Up
  const [signUpName, setSignUpName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [role, setRole] = useState('donor')
  const [signUpSent, setSignUpSent] = useState(false)

  // ─── Sign In ─────────────────────────────────────────────────────────────────

  const handlePasswordSignIn = async (e) => {
    e.preventDefault()
    const email = signInEmail.toLowerCase().trim()
    const password = signInPassword.trim()

    if (!email || !password) return toast.error('Enter email and password.')
    setIsLoading(true)
    try {
      const result = await signInWithPassword(email, password)
      if (result?.user) {
        // Clear any stale reset or signup metadata
        localStorage.removeItem('pending_password_reset')
        localStorage.removeItem('signup_meta')
        sessionStorage.removeItem('signup_meta')

        setUser(result.user)
        const sessionMeta = sessionStorage.getItem('signup_meta')
        if (sessionMeta) {
          sessionStorage.removeItem('signup_meta')
          const meta = JSON.parse(sessionMeta)
          try { await upsertProfile({ full_name: meta.name, role: meta.role }) } catch {}
        }
        try {
          const profile = await getMyProfile()
          setProfile(profile)
        } catch { /* profile fetch failed silently */ }
        navigate('/home', { replace: true })
      } else {
        toast.error('Invalid email or password.')
      }
    } catch (err) {
      toast.error(err.message || 'Invalid email or password.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Sign Up ─────────────────────────────────────────────────────────────────

  const handlePasswordSignUp = async (e) => {
    e.preventDefault()
    const email = signUpEmail.toLowerCase().trim()
    const password = signUpPassword.trim()
    const name = signUpName.trim()

    if (!name || !email || !password) return toast.error('Please fill all fields.')
    if (password.length < 6) return toast.error('Password must be at least 6 characters.')
    setIsLoading(true)
    try {
      console.log('[Rudhi] Starting Sign Up for:', email)
      const meta = JSON.stringify({ name: name, role })
      localStorage.setItem('signup_meta', meta)
      sessionStorage.setItem('signup_meta', meta)

      const result = await signUpWithPasswordCustomRedirect(email, password, AUTH_CALLBACK)
      console.log('[Rudhi] Sign Up result:', result)

      if (result?.session) {
        setUser(result.user)
        await upsertProfile({ full_name: signUpName, role })
        const profile = await getMyProfile()
        setProfile(profile)
        navigate('/profile-setup', { replace: true })
      } else {
        setSignUpSent(true)
      }
    } catch (err) {
      console.error('[Rudhi] Sign Up Error Object:', err)
      toast.error(err.message || 'Could not create account.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen w-full px-6 py-8">
      <div className="flex items-center justify-center gap-2 mb-8 mt-4">
        <BloodDropIcon size={24} className="text-primary" />
        <span className="font-heading font-bold text-2xl tracking-tight text-neutral-dark dark:text-white">Rudhi</span>
      </div>

      <Tabs.Root defaultValue="signin" className="w-full flex-1 flex flex-col">
        <Tabs.List className="flex w-full border-b border-neutral-light dark:border-gray-800 mb-6">
          <Tabs.Trigger value="signin" className="flex-1 pb-3 text-sm font-medium text-neutral-mid data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
            Sign In
          </Tabs.Trigger>
          <Tabs.Trigger value="signup" className="flex-1 pb-3 text-sm font-medium text-neutral-mid data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
            Sign Up
          </Tabs.Trigger>
        </Tabs.List>

        {/* ── SIGN IN ──────────────────────────────────────────────────────── */}
        <Tabs.Content value="signin" className="flex flex-col flex-1 focus:outline-none">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={20} className="text-primary" />
            <h2 className="text-2xl font-heading font-bold text-neutral-dark dark:text-white">Welcome Back</h2>
          </div>

          <form onSubmit={handlePasswordSignIn} className="flex flex-col gap-4 flex-1">
            <Input label="Email" type="email" placeholder="you@example.com" value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)} required />
            <Input label="Password" type="password" placeholder="Enter your password" value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)} required />
            <button
              type="button"
              onClick={() => navigate('/auth/forgot-password')}
              className="text-xs text-primary font-medium hover:underline self-end -mt-2"
            >
              Forgot Password?
            </button>
            <Button type="submit" size="lg" className="mt-2" isLoading={isLoading}>
              Sign In
            </Button>
          </form>
        </Tabs.Content>

        {/* ── SIGN UP ──────────────────────────────────────────────────────── */}
        <Tabs.Content value="signup" className="flex flex-col flex-1 focus:outline-none">
          {signUpSent ? (
            <div className="flex flex-col items-center gap-4 p-6 mt-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail size={32} className="text-primary" />
              </div>
              <h2 className="text-xl font-heading font-bold text-neutral-dark dark:text-white text-center">Verify Your Email</h2>
              <p className="text-sm text-neutral-mid text-center max-w-xs">
                We sent a confirmation link to <strong className="text-neutral-dark dark:text-white">{signUpEmail}</strong>.
                Click the link to activate your account.
              </p>
              <div className="flex flex-col gap-2 w-full mt-4">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={async () => {
                    setIsLoading(true)
                    try {
                      await resendVerification(signUpEmail)
                      toast.success('Confirmation email resent!')
                    } catch (err) {
                      toast.error(err.message || 'Could not resend email.')
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  isLoading={isLoading}
                >
                  Resend Confirmation
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSignUpSent(false)}
                >
                  Use a different email
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <KeyRound size={20} className="text-primary" />
                <h2 className="text-2xl font-heading font-bold text-neutral-dark dark:text-white">Create Account</h2>
              </div>

              <form onSubmit={handlePasswordSignUp} className="flex flex-col gap-4">
                <Input label="Full Name" placeholder="John Doe" value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)} required />
                <Input label="Email" type="email" placeholder="you@example.com" value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)} required />
                <Input label="Password" type="password" placeholder="At least 6 characters" value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)} required />
                <div className="flex flex-col gap-1.5 mt-1">
                  <label className="text-sm font-medium text-neutral-dark dark:text-neutral-light">I want to be a</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {[
                      { id: 'donor', label: 'Donor', Icon: BloodDropIcon },
                      { id: 'requester', label: 'Patient', Icon: Heart },
                      { id: 'hospital', label: 'Hospital', Icon: Building2 },
                    ].map(({ id, label, Icon }) => (
                      <button key={id} type="button" onClick={() => setRole(id)}
                        className={cn(
                          'flex flex-col items-center justify-center p-3 border rounded-xl gap-2 transition-all',
                          role === id
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-neutral-light dark:border-gray-700 text-neutral-mid dark:text-gray-400 hover:bg-neutral-light dark:hover:bg-gray-800'
                        )}>
                        <Icon size={24} />
                        <span className="text-xs font-semibold">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-neutral-mid mt-1">
                  By creating an account, you agree to our{' '}
                  <a href="/about" className="text-primary underline">Terms</a>.
                  A confirmation email will be sent to verify your address.
                </p>
                <Button type="submit" size="lg" className="mt-2" isLoading={isLoading}>
                  Create Account
                </Button>
              </form>
            </>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
