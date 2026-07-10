import { useState } from 'react'
import * as Switch from '@radix-ui/react-switch'
import { Moon, Bell, Shield, HelpCircle, MapPin, Smartphone, KeyRound, LogOut } from 'lucide-react'
import { useUIStore, useAuthStore } from '../store'
import { updatePassword, signOut } from '../lib/auth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const SettingRow = ({ icon: Icon, title, desc, action }) => (
  <div className="flex items-center justify-between py-4 border-b border-neutral-light dark:border-gray-800 last:border-0">
    <div className="flex items-center gap-4 flex-1 pr-4">
      <div className="w-10 h-10 rounded-full bg-neutral-light dark:bg-gray-800 flex items-center justify-center text-neutral-mid shrink-0">
        <Icon size={20} />
      </div>
      <div className="flex flex-col">
        <span className="font-semibold text-neutral-dark dark:text-white text-[15px]">{title}</span>
        <span className="text-xs text-neutral-mid mt-0.5 leading-snug">{desc}</span>
      </div>
    </div>
    <div className="shrink-0">{action}</div>
  </div>
)

const SwitchControl = ({ checked, onCheckedChange }) => (
  <Switch.Root 
    checked={checked} 
    onCheckedChange={onCheckedChange}
    className="w-12 h-7 bg-neutral-light dark:bg-gray-700 rounded-full relative data-[state=checked]:bg-primary outline-none cursor-pointer border border-neutral-mid/20"
  >
    <Switch.Thumb className="block w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 translate-x-1 will-change-transform data-[state=checked]:translate-x-[22px]" />
  </Switch.Root>
)

export const Settings = () => {
  const navigate = useNavigate()
  const { darkMode, toggleDarkMode } = useUIStore()
  const { user, clearAuth } = useAuthStore()
  const [pwLoading, setPwLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSetPassword = async (e) => {
    e.preventDefault()
    if (!newPassword || !confirmPassword) return toast.error('Fill in all fields.')
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match.')
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters.')
    setPwLoading(true)
    try {
      await updatePassword(newPassword)
      toast.success('Password updated!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err.message || 'Failed to update password.')
    } finally {
      setPwLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    clearAuth()
    navigate('/auth', { replace: true })
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-secondary dark:bg-dark-bg p-4 gap-6">
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-neutral-light dark:border-gray-800 px-4 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-mid uppercase tracking-wider pt-5 pb-1">Account</h3>
        <div className="flex items-center gap-3 py-3 border-b border-neutral-light dark:border-gray-800">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <KeyRound size={20} />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-semibold text-neutral-dark dark:text-white text-[15px]">Email</span>
            <span className="text-xs text-neutral-mid truncate">{user?.email}</span>
          </div>
        </div>

        <form onSubmit={handleSetPassword} className="py-4 space-y-3">
          <Input label="New Password" type="password" placeholder="At least 6 characters"
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <Input label="Confirm Password" type="password" placeholder="Repeat new password"
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          <Button type="submit" size="sm" isLoading={pwLoading}>
            {pwLoading ? 'Saving...' : 'Update Password'}
          </Button>
        </form>

        <div className="border-t border-neutral-light dark:border-gray-800">
          <SettingRow
            icon={LogOut}
            title="Sign Out"
            desc="Sign out of your account"
            action={
              <button onClick={handleSignOut} className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors">
                Sign Out
              </button>
            }
          />
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-neutral-light dark:border-gray-800 px-4 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-mid uppercase tracking-wider pt-5 pb-1">App Settings</h3>
        <SettingRow 
          icon={Moon} 
          title="Dark Mode" 
          desc="Toggle dark theme"
          action={<SwitchControl checked={darkMode} onCheckedChange={toggleDarkMode} />}
        />
        <SettingRow 
          icon={Bell} 
          title="Push Notifications" 
          desc="Receive alerts for nearby requests"
          action={<SwitchControl checked={true} />}
        />
        <SettingRow 
          icon={Smartphone} 
          title="SMS Fallback" 
          desc="Receive SMS when offline"
          action={<SwitchControl checked={true} />}
        />
        <SettingRow 
          icon={MapPin} 
          title="Location Settings" 
          desc="Set your location & update hospital positions"
          action={
            <button onClick={() => navigate('/location-settings')} className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors">
              Set Now
            </button>
          }
        />
      </section>

      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-neutral-light dark:border-gray-800 px-4 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-mid uppercase tracking-wider pt-5 pb-1">Support & Privacy</h3>
        <SettingRow 
          icon={Shield} 
          title="Privacy Policy" 
          desc="How we protect your medical data"
          action={<ChevronRight />}
        />
        <SettingRow 
          icon={HelpCircle} 
          title="Help & FAQ" 
          desc="Get assistance with the app"
          action={<ChevronRight />}
        />
      </section>
      
      <div className="flex justify-center py-4">
        <span className="text-xs text-neutral-mid font-mono">Rudhi v1.0.0</span>
      </div>
    </div>
  )
}

const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-mid">
    <path d="m9 18 6-6-6-6"/>
  </svg>
)
