import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { BloodDropIcon } from '../components/ui/BloodDropIcon'
import { resetPasswordForEmail } from '../lib/auth'
import toast from 'react-hot-toast'

export const ForgotPassword = () => {
  const navigate = useNavigate()
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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

      <div className="flex items-center gap-2 mb-2">
        <Mail size={20} className="text-primary" />
        <h2 className="text-2xl font-heading font-bold text-neutral-dark dark:text-white">Reset Password</h2>
      </div>

      {resetSent ? (
        <div className="flex flex-col items-center gap-3 p-6 bg-success/5 border border-success/20 rounded-xl text-center mt-4">
          <CheckCircle2 size={40} className="text-success" />
          <p className="font-semibold text-neutral-dark dark:text-white">Check your email</p>
          <p className="text-sm text-neutral-mid">We sent a password reset link to <strong className="text-neutral-dark dark:text-white">{resetEmail}</strong></p>
          <Button variant="secondary" size="sm" className="mt-2" onClick={() => { navigate('/auth'); setResetSent(false); }}>
            Back to Sign In
          </Button>
        </div>
      ) : (
        <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
          <p className="text-sm text-neutral-mid">Enter your email and we'll send you a link to reset your password.</p>
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
  )
}
