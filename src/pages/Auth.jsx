import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Tabs from '@radix-ui/react-tabs'
import { Heart, Building2, KeyRound, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { BloodDropIcon } from '../components/ui/BloodDropIcon'
import { cn } from '../lib/utils'
import { signInWithPassword, signUpWithPassword, resetPasswordForEmail } from '../lib/auth'
import { useAuthStore } from '../store'
import { upsertProfile, getMyProfile } from '../lib/api/profiles'
import toast from 'react-hot-toast'

export const Auth = () => {
  const navigate = useNavigate()
  const { setUser, setProfile } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  // Sign In
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')

  // Sign Up
  const [signUpName, setSignUpName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [role, setRole] = useState('donor')
  const [signUpSent, setSignUpSent] = useState(false)

  // Forgot Password
  const [showForgotPw, setShowForgotPw] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)

  // ─── Sign In ─────────────────────────────────────────────────────────────────

  const handlePasswordSignIn = async (e) => {
    e.preventDefault()
    if (!signInEmail || !signInPassword) return toast.error('Enter email and password.')
    setIsLoading(true)
    try {
      const result = await signInWithPassword(signInEmail, signInPassword)
      if (result?.user) {
        setUser(result.user)
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
    if (!signUpName || !signUpEmail || !signUpPassword) return toast.error('Please fill all fields.')
    if (signUpPassword.length < 6) return toast.error('Password must be at least 6 characters.')
    setIsLoading(true)
    try {
      const result = await signUpWithPassword(signUpEmail, signUpPassword)
      if (result?.session) {
        sessionStorage.setItem('signup_meta', JSON.stringify({ name: signUpName, role }))
        setUser(result.user)
        await upsertProfile({ full_name: signUpName, role })
        sessionStorage.removeItem('signup_meta')
        const profile = await getMyProfile()
        setProfile(profile)
        navigate('/profile-setup', { replace: true })
      } else {
        sessionStorage.setItem('signup_meta', JSON.stringify({ name: signUpName, role }))
        setSignUpSent(true)
      }
    } catch (err) {
      toast.error(err.message || 'Could not create account.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Forgot Password ─────────────────────────────────────────────────────────

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!resetEmail) return toast.error('Enter your email.')
    setIsLoading(true)
    try {
      await resetPasswordForEmail(resetEmail)
      setResetSent(true)
      toast.success('Check your email for the reset link.')
    } catch (err) {
      toast.error(err.message || 'Could not send reset email.')
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
          {showForgotPw ? (
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => { setShowForgotPw(false); setResetSent(false) }}
                className="flex items-center gap-2 text-sm text-neutral-mid hover:text-neutral-dark dark:hover:text-white transition-colors self-start"
              >
                <ArrowLeft size={16} /> Back to sign in
              </button>

              <div className="flex items-center gap-2 mb-2">
                <Mail size={20} className="text-primary" />
                <h2 className="text-2xl font-heading font-bold text-neutral-dark dark:text-white">Reset Password</h2>
              </div>

              {resetSent ? (
                <div className="flex flex-col items-center gap-3 p-6 bg-success/5 border border-success/20 rounded-xl text-center mt-4">
                  <CheckCircle2 size={40} className="text-success" />
                  <p className="font-semibold text-neutral-dark dark:text-white">Check your email</p>
                  <p className="text-sm text-neutral-mid">
                    We sent a password reset link to <strong className="text-neutral-dark dark:text-white">{resetEmail}</strong>
                  </p>
                  <Button variant="secondary" size="sm" className="mt-2" onClick={() => { setShowForgotPw(false); setResetSent(false) }}>
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                  <p className="text-sm text-neutral-mid">
                    Enter your email and we'll send you a link to reset your password.
                  </p>
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" size="lg" className="mt-2" isLoading={isLoading}>
                    Send Reset Link
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <>
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
                  onClick={() => setShowForgotPw(true)}
                  className="text-xs text-primary font-medium hover:underline self-end -mt-2"
                >
                  Forgot Password?
                </button>
                <Button type="submit" size="lg" className="mt-2" isLoading={isLoading}>
                  Sign In
                </Button>
              </form>
            </>
          )}
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
                  onClick={() => {
                    setSignUpSent(false)
                    setIsLoading(true)
                    signUpWithPassword(signUpEmail, signUpPassword).then((result) => {
                      if (!result?.session) toast.success('Confirmation email resent!')
                      else { setSignUpSent(false); toast.success('Email confirmed!') }
                    }).catch((err) => toast.error(err.message)).finally(() => setIsLoading(false))
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
