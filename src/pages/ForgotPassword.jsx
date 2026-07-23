import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { BloodDropIcon } from '../components/ui/BloodDropIcon'
import { resetPasswordForEmail } from '../lib/auth'
import toast from 'react-hot-toast'

export const ForgotPassword = () => {
  const navigate = useNavigate()
  const [resetEmail, setResetEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleResetPassword = async (e) => {
    e.preventDefault()
    const email = resetEmail.toLowerCase().trim()
    const pass = newPassword.trim()

    if (!email) return toast.error('Enter your email.')
    if (pass.length < 6) return toast.error('Password must be at least 6 characters.')
    if (pass !== confirmPassword.trim()) return toast.error('Passwords do not match.')

    setIsLoading(true)
    try {
      // CLEAR EVERYTHING FIRST
      localStorage.removeItem('signup_meta')
      localStorage.removeItem('pending_password_reset')

      // Store the new password securely in local storage
      localStorage.setItem('pending_password_reset', pass)

      console.log('[Rudhi] Requesting reset link for:', email)
      await resetPasswordForEmail(email)

      setResetSent(true)
      toast.success('Check your email for the link!')
    } catch (err) {
      console.error('[Rudhi] Request Failed:', err)
      toast.error(err.message || 'Could not send reset email.')
      localStorage.removeItem('pending_password_reset')
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
          <p className="font-semibold text-neutral-dark dark:text-white">Link Sent!</p>
          <p className="text-sm text-neutral-mid leading-relaxed">
            We sent a secure link to <strong className="text-neutral-dark dark:text-white">{resetEmail}</strong>.
            <br/><br/>
            <strong>Click the link in your email</strong> to automatically apply your new password and sign in.
          </p>
          <Button variant="secondary" size="sm" className="mt-2" onClick={() => { navigate('/auth'); setResetSent(false); }}>
            Back to Sign In
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 text-sm text-neutral-mid hover:text-neutral-dark dark:hover:text-white transition-colors self-start mb-2"
          >
            <ArrowLeft size={16} /> Back to sign in
          </button>

          <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
            <p className="text-sm text-neutral-mid">
              Provide your email and the new password you want to set.
            </p>

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />

            <div className="relative">
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-neutral-mid hover:text-neutral-dark"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button type="submit" size="lg" className="mt-2" isLoading={isLoading}>
              Send Secure Link
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
