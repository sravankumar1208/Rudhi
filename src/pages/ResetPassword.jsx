import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { updatePassword } from '../lib/auth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { BloodDropIcon } from '../components/ui/BloodDropIcon'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { CheckCircle2, ShieldCheck, Eye, EyeOff, Lock, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export const ResetPassword = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [success, setSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    let retries = 0
    const maxRetries = 10

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setUserEmail(session.user.email)
          setChecking(false)
          return
        }

        if (retries < maxRetries) {
          retries++
          setTimeout(checkSession, 1000)
        } else {
          toast.error('Session expired. Please request a new reset link.')
          navigate('/auth', { replace: true })
        }
      } catch {
        navigate('/auth', { replace: true })
      }
    }

    checkSession()
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = password.trim()
    if (trimmed.length < 6) return toast.error('Password must be at least 6 characters.')
    if (trimmed !== confirm.trim()) return toast.error('Passwords do not match.')

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: trimmed })
      if (error) throw error

      setSuccess(true)
      toast.success('Account password updated!')
      setTimeout(() => navigate('/home', { replace: true }), 2500)
    } catch (err) {
      toast.error(err.message || 'Could not update password.')
    } finally {
      setIsLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-light dark:bg-neutral-dark p-6">
        <LoadingSpinner size="lg" className="text-primary" />
        <p className="mt-4 text-sm font-medium text-neutral-mid animate-pulse">Securing session...</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-light dark:bg-neutral-dark p-6 text-center">
        <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-xl border border-neutral-light dark:border-gray-800 w-full max-w-sm">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6 mx-auto">
            <CheckCircle2 size={48} className="text-success" />
          </div>
          <h2 className="text-xl font-bold text-neutral-dark dark:text-white uppercase tracking-wider">Password Saved</h2>
          <p className="text-sm text-neutral-mid mt-2">You can now use your new password to sign in.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light dark:bg-neutral-dark p-6 items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-3xl shadow-xl border border-neutral-light dark:border-gray-800">
        <div className="flex items-center justify-center gap-2 mb-8">
          <BloodDropIcon size={28} className="text-primary" />
          <span className="font-heading font-bold text-2xl tracking-tight text-neutral-dark dark:text-white">Rudhi</span>
        </div>

        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-1">
             <ShieldCheck size={28} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-dark dark:text-white tracking-tight">Set New Password</h2>
          <p className="text-xs text-neutral-mid">Account: <span className="font-bold text-neutral-dark dark:text-white">{userEmail}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="relative">
            <Input
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-neutral-mid hover:text-neutral-dark dark:hover:text-white"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Repeat new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <Button
            type="submit"
            size="lg"
            className="w-full mt-2 h-12 gap-2"
            isLoading={isLoading}
            disabled={!password || !confirm || password.trim() !== confirm.trim() || password.length < 6}
          >
            Update Account <ArrowRight size={18} />
          </Button>

          <button type="button" onClick={() => navigate('/auth')} className="text-xs text-neutral-mid hover:underline mx-auto">Cancel and sign in</button>
        </form>
      </div>
    </div>
  )
}
