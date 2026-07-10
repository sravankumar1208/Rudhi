import { useState } from 'react'
import * as Switch from '@radix-ui/react-switch'
import { Navigation, AlertTriangle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuthStore } from '../store'
import { setDonorAvailability, upsertProfile } from '../lib/api/profiles'
import toast from 'react-hot-toast'

export const AvailabilitySettings = () => {
  const { profile } = useAuthStore()
  const [isAvailable, setIsAvailable] = useState(profile?.is_available ?? true)
  const [alertRadius, setAlertRadius] = useState(10)
  const [autoDecline, setAutoDecline] = useState(false)
  const [quietHours, setQuietHours] = useState(false)
  const [preferences, setPreferences] = useState({
    weekdays: true,
    weekends: true,
    daytime: true,
    nighttime: false,
  })

  const [saving, setSaving] = useState(false)

  const togglePreference = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDonorAvailability(isAvailable)
      await upsertProfile({
        is_available: isAvailable,
        preferences: JSON.stringify({ alertRadius, autoDecline, quietHours, schedule: preferences }),
      })
      toast.success('Availability preferences saved!')
    } catch {
      toast.error('Could not save preferences')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-secondary dark:bg-dark-bg p-4 gap-4">
      <Card className="flex flex-col p-5 gap-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="font-heading font-bold text-lg text-neutral-dark dark:text-white">Donor Status</h2>
            <span className="text-sm text-neutral-mid">
              {isAvailable ? 'Visible to requesters' : 'Hidden from requests'}
            </span>
          </div>
          <Switch.Root
            checked={isAvailable}
            onCheckedChange={setIsAvailable}
            className="w-14 h-8 bg-neutral-light dark:bg-gray-800 rounded-full relative data-[state=checked]:bg-success outline-none cursor-pointer border border-neutral-mid/20"
          >
            <Switch.Thumb className="block w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 translate-x-1 will-change-transform data-[state=checked]:translate-x-[26px]" />
          </Switch.Root>
        </div>

        {isAvailable && (
          <div className="bg-success/5 border border-success/20 rounded-xl p-3 flex items-start gap-3">
            <Navigation size={20} className="text-success mt-0.5 shrink-0" />
            <p className="text-sm text-neutral-dark dark:text-white">
              You will receive alerts for matching blood requests in your area.
            </p>
          </div>
        )}
      </Card>

      <Card className="flex flex-col p-5 gap-4">
        <h2 className="font-heading font-bold text-lg text-neutral-dark dark:text-white">Alert Radius</h2>
        <p className="text-sm text-neutral-mid -mt-2">Maximum distance to receive request alerts</p>

        <div className="flex flex-col gap-2">
          <input
            type="range"
            min="1"
            max="50"
            value={alertRadius}
            onChange={(e) => setAlertRadius(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-mid">1 km</span>
            <span className="text-lg font-heading font-bold text-primary">{alertRadius} km</span>
            <span className="text-xs text-neutral-mid">50 km</span>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col p-5 gap-4">
        <h2 className="font-heading font-bold text-lg text-neutral-dark dark:text-white">Availability Schedule</h2>

        <div className="flex flex-col gap-3">
          {[
            { key: 'weekdays', label: 'Weekdays (Mon–Fri)' },
            { key: 'weekends', label: 'Weekends (Sat–Sun)' },
            { key: 'daytime', label: 'Daytime (6 AM – 6 PM)' },
            { key: 'nighttime', label: 'Nighttime (6 PM – 6 AM)' },
          ].map(({ key, label }) => (
            <div key={key} className="flex justify-between items-center py-1">
              <span className="text-sm font-medium text-neutral-dark dark:text-white">{label}</span>
              <Switch.Root
                checked={preferences[key]}
                onCheckedChange={() => togglePreference(key)}
                className="w-12 h-7 bg-neutral-light dark:bg-gray-800 rounded-full relative data-[state=checked]:bg-primary outline-none cursor-pointer border border-neutral-mid/20"
              >
                <Switch.Thumb className="block w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 translate-x-1 will-change-transform data-[state=checked]:translate-x-[22px]" />
              </Switch.Root>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col p-5 gap-4">
        <h2 className="font-heading font-bold text-lg text-neutral-dark dark:text-white">Advanced</h2>

        <div className="flex justify-between items-center py-1">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-neutral-dark dark:text-white">Auto-Decline on Cooldown</span>
            <span className="text-xs text-neutral-mid">Automatically decline when ineligible</span>
          </div>
          <Switch.Root
            checked={autoDecline}
            onCheckedChange={setAutoDecline}
            className="w-12 h-7 bg-neutral-light dark:bg-gray-800 rounded-full relative data-[state=checked]:bg-primary outline-none cursor-pointer border border-neutral-mid/20"
          >
            <Switch.Thumb className="block w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 translate-x-1 will-change-transform data-[state=checked]:translate-x-[22px]" />
          </Switch.Root>
        </div>

        <div className="flex justify-between items-center py-1">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-neutral-dark dark:text-white">Quiet Hours</span>
            <span className="text-xs text-neutral-mid">Mute alerts between 10 PM – 7 AM</span>
          </div>
          <Switch.Root
            checked={quietHours}
            onCheckedChange={setQuietHours}
            className="w-12 h-7 bg-neutral-light dark:bg-gray-800 rounded-full relative data-[state=checked]:bg-primary outline-none cursor-pointer border border-neutral-mid/20"
          >
            <Switch.Thumb className="block w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 translate-x-1 will-change-transform data-[state=checked]:translate-x-[22px]" />
          </Switch.Root>
        </div>

        {quietHours && (
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 flex items-start gap-3">
            <AlertTriangle size={18} className="text-accent mt-0.5 shrink-0" />
            <p className="text-xs text-neutral-dark dark:text-white">
              Critical emergency alerts will still bypass quiet hours.
            </p>
          </div>
        )}
      </Card>

      <Button size="lg" className="mt-2" onClick={handleSave} isLoading={saving}>Save Preferences</Button>
    </div>
  )
}
