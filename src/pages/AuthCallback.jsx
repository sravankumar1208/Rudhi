import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { CheckCircle2, ShieldAlert, KeyRound, ArrowRight, Eye, EyeOff, Lock, RefreshCw, Fingerprint, ShieldCheck, Info } from 'lucide-react'
import toast from 'react-hot-toast'

function getHashParams() {
  try {
    const hash = window.location.hash
    if (!hash || hash.length < 2) return {}
    // Implicit flow tokens are usually in the # fragment
    return Object.fromEntries(new URLSearchParams(hash.substring(1)).entries())
  } catch (e) {
    return {}
  }
}

export const AuthCallback = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const handled = useRef(false)

  // UI Flow States
  const [status, setStatus] = useState('Initiating secure handshake...')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showDebug, setShowDebug] = useState(false)

  // Data States
  const [userEmail, setUserEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [debugInfo, setDebugInfo] = useState({})

  const { setUser } = useAuthStore()

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const processLink = async () => {
      // 1. COLLECT ALL PARAMS (Search + Hash)
      const code = searchParams.get('code')
      const type = searchParams.get('type')
      const errorParam = searchParams.get('error')

      const hashParams = getHashParams()
      const accessToken = hashParams.access_token || searchParams.get('access_token')
      const refreshToken = hashParams.refresh_token || searchParams.get('refresh_token')
      const hashType = hashParams.type || type

      const isRecovery = hashType === 'recovery' || type === 'recovery' || window.location.href.toLowerCase().includes('recovery')

      setDebugInfo({ hasCode: !!code, hasToken: !!accessToken, type, hashType, isRecovery })

      try {
        if (errorParam) throw new Error(searchParams.get('error_description') || 'Security link error.')

        // 2. VERIFY (Prioritize Implicit/Token flow for reliability)
        setStatus('Verifying identity...')

        if (accessToken) {
          // Implicit Flow: Use tokens directly from the URL hash
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          if (error) throw error
        } else if (code) {
          // PKCE Flow: Exchange code (fallback)
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        }

        // 3. RECOVERY WAIT
        await new Promise(r => setTimeout(r, 1000))

        // 4. CONFIRM SESSION
        let { data: { session } } = await supabase.auth.getSession()
        if (!session) {
           const { data: { session: retry } } = await supabase.auth.refreshSession()
           session = retry
        }

        if (!session) throw new Error('Security session could not be established. Link may be stale.')

        // 5. ROUTING
        if (isRecovery) {
          setUserEmail(session.user.email.toLowerCase())
          setUser(session.user)
          setIsConfirming(true)
        } else {
          localStorage.removeItem('signup_meta')
          sessionStorage.removeItem('signup_meta')
          navigate('/home', { replace: true })
        }

      } catch (err) {
        console.error('[Rudhi] Callback critical fault:', err)
        setIsError(true)
        setErrorMessage(err.message || 'Link invalid or expired.')
      }
    }

    processLink()
  }, [navigate, searchParams, setUser])

  const handleDefinitiveUpdate = async () => {
    const finalPass = password.trim()
    if (finalPass.length < 6) return toast.error('Min. 6 characters.')
    if (finalPass !== confirmPassword.trim()) return toast.error('Passwords do not match.')

    setIsUpdating(true)
    setStatus('Syncing Account...')

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: finalPass })
      if (updateError) throw updateError

      await new Promise(r => setTimeout(r, 1500))
      await supabase.auth.refreshSession()

      setIsSuccess(true)
      toast.success('Security successfully updated!')
      setTimeout(() => navigate('/home', { replace: true }), 2500)
    } catch (e) {
      toast.error(e.message)
      setErrorMessage(e.message)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6 bg-neutral-light dark:bg-neutral-dark p-6">
      <div className="flex flex-col items-center gap-6 bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-3xl shadow-2xl border border-neutral-light dark:border-gray-800 w-full max-w-sm text-center relative overflow-hidden">

        {isConfirming && !isSuccess && !isError ? (
          <div className="flex flex-col items-center gap-5 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-1 mx-auto">
              <KeyRound size={32} className="text-primary" />
            </div>

            <div className="flex flex-col gap-1 text-center w-full">
              <h2 className="text-xl font-bold text-neutral-dark dark:text-white uppercase tracking-wider">Identity Verified</h2>
              <p className="text-[11px] text-neutral-mid leading-relaxed px-4">
                Now choosing a new password for: <span className="font-bold text-neutral-dark dark:text-white break-all">{userEmail}</span>
              </p>
            </div>

            <div className="w-full space-y-4 mt-1">
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
                  className="absolute right-3 top-[38px] text-neutral-mid hover:text-neutral-dark"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button
              className="w-full h-12 gap-2 mt-2"
              onClick={handleDefinitiveUpdate}
              isLoading={isUpdating}
              disabled={!password || !confirmPassword || password.trim() !== confirmPassword.trim() || password.length < 6}
            >
              Secure Account Now <ArrowRight size={18} />
            </Button>

            <button onClick={() => navigate('/auth')} className="text-xs text-neutral-mid hover:underline mx-auto block">Cancel & Back</button>
          </div>
        ) : isSuccess ? (
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle2 size={48} className="text-success" />
            </div>
            <h2 className="text-xl font-bold text-neutral-dark dark:text-white uppercase tracking-wider">Account Secured</h2>
            <p className="text-sm text-neutral-mid px-4 leading-relaxed">
              Your new password is now active. <br/>Opening your dashboard...
            </p>
            <LoadingSpinner size="sm" className="mt-2" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-5 animate-in shake duration-300">
            <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center">
              <ShieldAlert size={48} className="text-error" />
            </div>
            <div className="flex flex-col gap-1 px-4 text-center">
              <h2 className="text-xl font-bold text-neutral-dark dark:text-white uppercase tracking-wider">Security Fault</h2>
              <p className="text-xs text-error font-medium leading-relaxed italic">{errorMessage}</p>
            </div>
            <div className="w-full flex flex-col gap-2 pt-2">
               <Button size="sm" onClick={() => window.location.reload()} className="w-full">Try Connection Again</Button>
               <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)} className="w-full text-neutral-mid text-xs">
                 {showDebug ? 'Hide Details' : 'Show Technical Details'}
               </Button>
               {showDebug && (
                 <div className="bg-black/5 dark:bg-white/5 rounded-lg p-3 text-[9px] text-left font-mono text-neutral-mid break-all">
                    {JSON.stringify(debugInfo, null, 2)}
                 </div>
               )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-4">
            <LoadingSpinner size="lg" className="text-primary" />
            <div className="flex flex-col gap-2 px-6">
              <p className="text-sm font-bold text-neutral-dark dark:text-white uppercase tracking-wider animate-pulse">{status}</p>
              <p className="text-[10px] text-neutral-mid italic">Encryption handshake with Supabase Cloud...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
