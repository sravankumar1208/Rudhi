import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const [isLoading, setIsLoading] = useState(false)
  const [checking, setChecking] = useState(true)

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
      toast.success('Password reset successfully.')
      navigate('/home', { replace: true })
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

  return (
    <div className="flex flex-col min-h-screen w-full px-6 py-8">
      <div className="flex items-center justify-center gap-2 mb-8 mt-4">
        <BloodDropIcon size={24} className="text-primary" />
        <span className="font-heading font-bold text-2xl tracking-tight text-neutral-dark dark:text-white">Rudhi</span>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-heading font-bold text-neutral-dark dark:text-white">Set New Password</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="New Password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          label="Confirm New Password"
          type="password"
          placeholder="Re-enter your new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <Button type="submit" size="lg" className="mt-2" isLoading={isLoading}>
          Reset Password
        </Button>
      </form>
    </div>
  )
}
