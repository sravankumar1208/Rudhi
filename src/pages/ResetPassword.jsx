import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { updatePassword } from '../lib/auth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { BloodDropIcon } from '../components/ui/BloodDropIcon'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export const ResetPassword = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let retries = 0
    const maxRetries = 5

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setChecking(false)
          return
        }
        if (retries < maxRetries) {
          retries++
          setTimeout(checkSession, 1000)
        } else {
          toast.error('Invalid or expired reset link.')
          navigate('/auth', { replace: true })
        }
      } catch {
        if (retries < maxRetries) {
          retries++
          setTimeout(checkSession, 1000)
        } else {
          toast.error('Invalid or expired reset link.')
          navigate('/auth', { replace: true })
        }
      }
    }

    checkSession()
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) return toast.error('Password must be at least 6 characters.')
    if (password !== confirm) return toast.error('Passwords do not match.')
    setIsLoading(true)
    try {
      await updatePassword(password)
      setSuccess(true)
      toast.success('Password reset successfully!')
      setTimeout(() => navigate('/home', { replace: true }), 2000)
    } catch (err) {
      toast.error(err.message || 'Could not reset password.')
    } finally {
      setIsLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex flex-col min-h-screen w-full px-6 py-8 items-center justify-center">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={40} className="text-success" />
        </div>
        <h2 className="text-xl font-heading font-bold text-neutral-dark dark:text-white mb-2">Password Reset!</h2>
        <p className="text-sm text-neutral-mid text-center">Redirecting you to the app...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen w-full px-6 py-8">
      <div className="flex items-center justify-center gap-2 mb-8 mt-4">
        <BloodDropIcon size={24} className="text-primary" />
        <span className="font-heading font-bold text-2xl tracking-tight text-neutral-dark dark:text-white">Rudhi</span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Lock size={20} className="text-primary" />
        <h2 className="text-2xl font-heading font-bold text-neutral-dark dark:text-white">Set New Password</h2>
      </div>

      <p className="text-sm text-neutral-mid mb-6">
        Enter a new password for your account. Make sure it's at least 6 characters.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-neutral-mid hover:text-neutral-dark dark:hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="Re-enter your new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        {password && confirm && password !== confirm && (
          <p className="text-xs text-error -mt-2">Passwords do not match</p>
        )}
        {password && password.length < 6 && (
          <p className="text-xs text-error -mt-2">Password must be at least 6 characters</p>
        )}

        <Button type="submit" size="lg" className="mt-2" isLoading={isLoading}>
          Reset Password
        </Button>
      </form>
    </div>
  )
}
