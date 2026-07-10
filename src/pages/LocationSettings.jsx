import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Building2, User, Radio, Crosshair } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { MapPicker } from '../components/maps/MapPicker'
import { updateDonorLocation } from '../lib/api/profiles'
import { getHospitals, updateHospitalLocation } from '../lib/api/hospitals'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store'
import { useGeolocation } from '../hooks/useGeolocation'
import toast from 'react-hot-toast'

export const LocationSettings = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { latitude, longitude } = useGeolocation()

  const [myLocation, setMyLocation] = useState(null)
  const [liveTracking, setLiveTracking] = useState(false)
  const [myLoading, setMyLoading] = useState(false)

  const [hospitals, setHospitals] = useState([])
  const [selectedHospital, setSelectedHospital] = useState('')
  const [hospitalLocation, setHospitalLocation] = useState(null)
  const [hospitalLoading, setHospitalLoading] = useState(false)

  useEffect(() => {
    getHospitals().then(setHospitals).catch(() => {})
    supabase
      .from('profiles')
      .select('location')
      .eq('id', user?.id)
      .single()
      .then(({ data }) => {
        if (data?.location?.coordinates) {
          setMyLocation({ lat: data.location.coordinates[1], lng: data.location.coordinates[0] })
        }
      })
      .catch(() => {})
  }, [user?.id])

  // Live tracking broadcast every 5s
  useEffect(() => {
    if (!liveTracking || !user?.id) return
    const uid = user.id
    const interval = setInterval(async () => {
      if (latitude && longitude) {
        try {
          await updateDonorLocation(latitude, longitude, uid)
        } catch {}
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [liveTracking, user?.id, latitude, longitude])

  const handleUseCurrentLocation = () => {
    if (latitude && longitude) {
      setMyLocation({ lat: latitude, lng: longitude })
      toast.success('Centered to your current position')
    } else {
      toast.error('Location not available. Check GPS permissions.')
    }
  }

  const handleSaveMyLocation = async () => {
    if (!myLocation) return toast.error('No location selected.')
    setMyLoading(true)
    try {
      await updateDonorLocation(myLocation.lat, myLocation.lng)
      toast.success('Your location updated!')
    } catch (err) {
      toast.error(err.message || 'Failed to update location.')
    } finally {
      setMyLoading(false)
    }
  }

  const handleSaveHospitalLocation = async () => {
    if (!selectedHospital) return toast.error('Select a hospital.')
    if (!hospitalLocation) return toast.error('Pick a location on the map first.')
    setHospitalLoading(true)
    try {
      await updateHospitalLocation(selectedHospital, hospitalLocation.lat, hospitalLocation.lng)
      toast.success('Hospital location updated!')
    } catch (err) {
      toast.error(err.message || 'Failed to update hospital location.')
    } finally {
      setHospitalLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-secondary dark:bg-dark-bg p-4 gap-6">
      {/* ── My Location ─────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-neutral-light dark:border-gray-800 p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <User size={20} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-neutral-dark dark:text-white">My Location</h3>
            <p className="text-xs text-neutral-mid">Pin your location for donor/receiver matching</p>
          </div>
        </div>

        {latitude && longitude && (
          <div className="mb-3 flex items-center gap-2 text-xs bg-success/5 border border-success/20 rounded-xl px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
            <span className="text-success font-medium">
              Live: {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </span>
          </div>
        )}

        <MapPicker
          defaultLocation={myLocation}
          onLocationChange={setMyLocation}
        />

        <div className="flex gap-3 mt-4">
          <Button
            variant="secondary"
            onClick={handleUseCurrentLocation}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Crosshair size={16} />
            Use GPS
          </Button>
          <Button onClick={handleSaveMyLocation} isLoading={myLoading} className="flex-1">
            {myLoading ? 'Saving...' : 'Save'}
          </Button>
          <Button
            variant={liveTracking ? 'primary' : 'secondary'}
            onClick={() => setLiveTracking(!liveTracking)}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Radio size={16} className={liveTracking ? 'animate-pulse' : ''} />
            {liveTracking ? 'ON' : 'Track'}
          </Button>
        </div>

        {liveTracking && (
          <p className="text-[11px] text-neutral-mid text-center mt-3">
            Broadcasting live position every 5s for active requests
          </p>
        )}
      </section>

      {/* ── Hospital Location ───────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-neutral-light dark:border-gray-800 p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-neutral-dark dark:text-white">Hospital Location</h3>
            <p className="text-xs text-neutral-mid">Update a hospital's pin on the map</p>
          </div>
        </div>

        <select
          value={selectedHospital}
          onChange={(e) => {
            setSelectedHospital(e.target.value)
            const h = hospitals.find(h => h.id === e.target.value)
            if (h?.location?.coordinates) {
              setHospitalLocation({ lat: h.location.coordinates[1], lng: h.location.coordinates[0] })
            } else {
              setHospitalLocation(null)
            }
          }}
          className="w-full p-3 border border-neutral-light dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-neutral-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary mb-4"
        >
          <option value="">-- Select a hospital --</option>
          {hospitals.map(h => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>

        {selectedHospital && (
          <>
            <MapPicker
              key={selectedHospital}
              defaultLocation={hospitalLocation}
              onLocationChange={setHospitalLocation}
            />
            <Button onClick={handleSaveHospitalLocation} isLoading={hospitalLoading} className="w-full mt-4">
              {hospitalLoading ? 'Saving...' : 'Save Hospital Location'}
            </Button>
          </>
        )}
      </section>
    </div>
  )
}
