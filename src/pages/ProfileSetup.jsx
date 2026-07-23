import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera } from 'lucide-react'
import * as Switch from '@radix-ui/react-switch'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { MapPicker } from '../components/maps/MapPicker'
import { useAuthStore } from '../store'
import { upsertProfile } from '../lib/api/profiles'
import toast from 'react-hot-toast'

export const ProfileSetup = () => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const signupMeta = localStorage.getItem('signup_meta') || sessionStorage.getItem('signup_meta')
  const role = profile?.role || signupMeta
    ? JSON.parse(signupMeta || '{}').role
    : 'donor'

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [isAvailable, setIsAvailable] = useState(true)
  const [location, setLocation] = useState(null)

  // Form data
  const [form, setForm] = useState({
    full_name: '',
    date_of_birth: '',
    blood_group: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    address: '',
    alert_preference: 'both',
  })

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handlePhotoUpload = (e) => {
    if (e.target.files?.[0]) setPhoto(URL.createObjectURL(e.target.files[0]))
  }

  const handleNext = (e) => {
    e.preventDefault()
    setStep(2)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await upsertProfile({
        ...form,
        role,
        is_available: isAvailable,
        location: location ? `POINT(${location.lng} ${location.lat})` : null,
      })
      localStorage.removeItem('signup_meta')
      sessionStorage.removeItem('signup_meta')
      toast.success('Profile saved!')
      navigate('/home', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Could not save profile.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen w-full px-6 py-8">
      {/* Progress Bar */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex justify-between text-sm font-medium">
          <span className="text-neutral-dark dark:text-white">
            {step === 1 ? 'Step 1: Personal Info' : 'Step 2: Location & Availability'}
          </span>
          <span className="text-neutral-mid">{step} of 2</span>
        </div>
        <div className="h-2 w-full bg-neutral-light dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleNext} className="flex flex-col gap-4 flex-1">
          {/* Avatar Upload */}
          <div className="flex justify-center mb-4">
            <label className="relative w-24 h-24 rounded-full bg-neutral-light dark:bg-gray-800 border-2 border-dashed border-neutral-mid flex items-center justify-center cursor-pointer overflow-hidden group">
              {photo
                ? <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                : <Camera className="text-neutral-mid group-hover:text-primary transition-colors" size={32} />
              }
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={24} />
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </label>
          </div>

          <Input label="Full Name" value={form.full_name} onChange={e => update('full_name', e.target.value)} required />

          <div className="flex gap-4">
            <div className="flex-1">
              <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} required />
            </div>
            <div className="flex-1">
              <Input label="Blood Group" value={form.blood_group} onChange={e => update('blood_group', e.target.value)} placeholder="O+" required />
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-neutral-light dark:border-gray-800">
            <h3 className="text-sm font-semibold mb-3 text-neutral-dark dark:text-white">Emergency Contact (Optional)</h3>
            <div className="flex flex-col gap-4">
              <Input label="Contact Name" placeholder="Jane Doe" value={form.emergency_contact_name} onChange={e => update('emergency_contact_name', e.target.value)} />
              <Input label="Contact Phone" type="tel" placeholder="+91 XXXXX XXXXX" value={form.emergency_contact_phone} onChange={e => update('emergency_contact_phone', e.target.value)} />
            </div>
          </div>

          <div className="mt-auto pt-8 flex gap-3">
            <Button type="button" variant="ghost" onClick={() => navigate('/home')} className="flex-1">Skip</Button>
            <Button type="submit" className="flex-[2]">Next →</Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-6 flex-1">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-dark dark:text-neutral-light">Your Location</label>
            <MapPicker onLocationChange={setLocation} />
            <Input className="mt-2" placeholder="Full Address…" value={form.address} onChange={e => update('address', e.target.value)} />
          </div>

          {role === 'donor' && (
            <>
              <div className="flex items-center justify-between p-4 border border-neutral-light dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900">
                <div className="flex flex-col">
                  <span className="font-semibold text-neutral-dark dark:text-white">Available to Donate</span>
                  <span className="text-xs text-neutral-mid">Toggle off if traveling or unwell</span>
                </div>
                <Switch.Root
                  className="w-[42px] h-[25px] bg-neutral-mid rounded-full relative data-[state=checked]:bg-success outline-none cursor-default"
                  checked={isAvailable}
                  onCheckedChange={setIsAvailable}
                >
                  <Switch.Thumb className="block w-[21px] h-[21px] bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
                </Switch.Root>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-neutral-dark dark:text-neutral-light">Alert Preferences</span>
                <div className="grid grid-cols-3 gap-2">
                  {['app', 'sms', 'both'].map(pref => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => update('alert_preference', pref)}
                      className={`flex items-center justify-center p-3 text-xs font-semibold border rounded-lg capitalize transition-all ${
                        form.alert_preference === pref
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-neutral-light dark:border-gray-700 text-neutral-mid hover:bg-neutral-light dark:hover:bg-gray-800'
                      }`}
                    >
                      {pref === 'app' ? 'App Only' : pref === 'sms' ? 'SMS Only' : 'Both'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="mt-auto pt-8 flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">← Back</Button>
            <Button type="submit" className="flex-[2]" isLoading={isLoading}>Save & Continue</Button>
          </div>
        </form>
      )}
    </div>
  )
}
