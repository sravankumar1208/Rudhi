import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Minus, Plus, AlertCircle, Search, MapPin } from 'lucide-react'
import * as Switch from '@radix-ui/react-switch'
import { Button } from '../components/ui/Button'
import { MapPicker } from '../components/maps/MapPicker'
import { cn } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { createBloodRequest } from '../lib/api/requests'
import { getHospitals, findNearbyHospitals } from '../lib/api/hospitals'
import { useAuthStore } from '../store'
import toast from 'react-hot-toast'

export const CreateRequest = () => {
  const navigate = useNavigate()
  const [units, setUnits] = useState(1)
  const [selectedBg, setSelectedBg] = useState(null)
  const [urgency, setUrgency] = useState('critical')
  const [radius, setRadius] = useState(10)
  const [smsMode, setSmsMode] = useState(false)
  const [aiMode, setAiMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hospitalLocation, setHospitalLocation] = useState(null)
  const [receiverLocation, setReceiverLocation] = useState(null)

  const [hospitals, setHospitals] = useState([])
  const [hospitalSearch, setHospitalSearch] = useState('')
  const [showHospDropdown, setShowHospDropdown] = useState(false)
  const [selectedHospital, setSelectedHospital] = useState('')
  const [gpsMode, setGpsMode] = useState('locating') // 'locating' | 'active' | 'off'
  const hospRef = useRef(null)

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  const urgencyLevels = [
    { id: 'critical', icon: '🔴', label: 'Critical', desc: 'Need within 1 hour' },
    { id: 'moderate', icon: '🟡', label: 'Moderate', desc: 'Within 6 hours' },
    { id: 'routine', icon: '🟢', label: 'Routine', desc: 'Planned' }
  ]

  // Load hospitals — detect GPS first, fallback to all
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const nearby = await findNearbyHospitals(pos.coords.latitude, pos.coords.longitude)
          setHospitals(nearby)
          setGpsMode('active')
        } catch {
          // RPC might fail if not deployed — fallback to all
          getHospitals().then(setHospitals).catch(() => {})
          setGpsMode('off')
        }
      },
      () => {
        getHospitals().then(setHospitals).catch(() => {})
        setGpsMode('off')
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (hospRef.current && !hospRef.current.contains(e.target)) setShowHospDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredHospitals = hospitals.filter(h =>
    !hospitalSearch || h.name?.toLowerCase().includes(hospitalSearch.toLowerCase())
  )

  const selectHospital = (h) => {
    setSelectedHospital(h.name)
    setHospitalSearch(h.name)
    setShowHospDropdown(false)
    if (h.location?.coordinates) {
      setHospitalLocation({ lat: h.location.coordinates[1], lng: h.location.coordinates[0] })
    }
  }

  const { user } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedBg) return toast.error('Select a blood group')
    if (!selectedHospital) return toast.error('Select a hospital')
    setIsLoading(true)
    try {
      const request = await createBloodRequest({
        hospitalName: selectedHospital,
        hospitalLat: hospitalLocation?.lat,
        hospitalLng: hospitalLocation?.lng,
        receiverLat: receiverLocation?.lat,
        receiverLng: receiverLocation?.lng,
        bloodGroup: selectedBg,
        units,
        urgency,
        notes: e.target.notes?.value,
        alertRadiusKm: radius,
        smsEnabled: smsMode,
      })

      // Create confirmation notification for requester
      await supabase.from('notifications').insert({
        user_id: user?.id,
        type: 'success',
        title: 'Blood Request Sent',
        body: `Your request for ${units} unit(s) of ${selectedBg} has been posted. We're finding donors nearby.`,
        data: { request_id: request.id },
      })

      // Trigger donor matching in background (don't block UI)
      supabase.functions.invoke('match-donors', { body: { requestId: request.id } }).catch(() => {})

      toast.success('Blood request sent!')
      navigate(`/request-tracking/${request.id}`)
    } catch (err) {
      toast.error(err.message || 'Failed to create request')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col w-full px-4 py-6 gap-6 relative">
      {/* AI Assistant Toggle */}
      <div className="flex flex-col items-center">
        <Button 
          variant={aiMode ? "primary" : "secondary"}
          onClick={() => setAiMode(!aiMode)}
          className={cn("w-full flex items-center justify-center gap-2 transition-all", aiMode && "bg-accent hover:bg-yellow-600 border-accent")}
        >
          <Sparkles size={18} className={aiMode ? "text-white" : "text-accent"} />
          <span className={aiMode ? "text-white" : "text-neutral-dark dark:text-white"}>
            {aiMode ? "Using AI Assistant ✨" : "Fill with AI ✨"}
          </span>
        </Button>
      </div>

      {aiMode && (
        <div className="bg-white dark:bg-gray-900 border border-accent/30 rounded-xl p-4 shadow-sm flex flex-col gap-3 animate-slide-up">
          <label className="text-sm font-medium text-neutral-dark dark:text-white">Describe what you need:</label>
          <textarea 
            className="w-full bg-neutral-light dark:bg-gray-800 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent min-h-[80px]"
            placeholder="E.g., Need 2 units of O- blood urgently at Apollo Hospital, Chennai..."
          />
          <Button size="sm" className="bg-accent hover:bg-yellow-600 text-white self-end">
            Generate Form
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Blood Group */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-neutral-dark dark:text-white">Required Blood Group <span className="text-danger">*</span></label>
          <div className="grid grid-cols-4 gap-2">
            {bloodGroups.map(bg => (
              <button
                key={bg}
                type="button"
                onClick={() => setSelectedBg(bg)}
                className={cn(
                  "flex items-center justify-center py-3 rounded-xl border text-lg font-heading font-bold transition-all",
                  selectedBg === bg 
                    ? "border-primary bg-primary text-white shadow-md shadow-primary/20 scale-105" 
                    : "border-neutral-light dark:border-gray-800 bg-white dark:bg-gray-900 text-neutral-dark dark:text-white hover:border-primary/50"
                )}
              >
                {bg}
              </button>
            ))}
          </div>
        </div>

        {/* Units Needed */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-neutral-light dark:border-gray-800 rounded-xl">
          <label className="text-sm font-medium text-neutral-dark dark:text-white">Units Needed</label>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setUnits(Math.max(1, units - 1))} className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-light dark:bg-gray-800 text-neutral-dark dark:text-white">
              <Minus size={16} />
            </button>
            <span className="text-xl font-bold font-heading w-6 text-center">{units}</span>
            <button type="button" onClick={() => setUnits(Math.min(10, units + 1))} className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white shadow-sm shadow-primary/30">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Urgency */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-neutral-dark dark:text-white">Urgency Level <span className="text-danger">*</span></label>
          <div className="flex flex-col gap-2">
            {urgencyLevels.map(level => (
              <div 
                key={level.id}
                onClick={() => setUrgency(level.id)}
                className={cn(
                  "flex items-center p-3 rounded-xl border transition-all cursor-pointer",
                  urgency === level.id ? "bg-white dark:bg-gray-800 border-neutral-mid shadow-sm" : "bg-transparent border-neutral-light dark:border-gray-800 opacity-60 hover:opacity-100"
                )}
              >
                <span className="text-2xl mr-3">{level.icon}</span>
                <div className="flex flex-col flex-1">
                  <span className="font-semibold text-neutral-dark dark:text-white">{level.label}</span>
                  <span className="text-xs text-neutral-mid">{level.desc}</span>
                </div>
                {urgency === level.id && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hospital Selector */}
        <div className="flex flex-col gap-4 p-4 bg-white dark:bg-gray-900 border border-neutral-light dark:border-gray-800 rounded-xl" ref={hospRef}>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-neutral-dark dark:text-white">Hospital / Blood Bank <span className="text-danger">*</span></label>
            <span className="text-xs text-neutral-mid">Search and select from available facilities</span>
          </div>
          {gpsMode && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
              gpsMode === 'locating'
                ? 'bg-amber/10 text-amber border border-amber/20'
                : gpsMode === 'active'
                ? 'bg-success/5 text-success border border-success/20'
                : 'bg-neutral-light/50 text-neutral-mid border border-neutral-light'
            }`}>
              {gpsMode === 'locating' ? (
                <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Detecting your location...</>
              ) : gpsMode === 'active' ? (
                <><MapPin size={14} className="shrink-0" /> Showing hospitals near you — sorted by distance</>
              ) : (
                <><MapPin size={14} className="shrink-0" /> Showing all hospitals (GPS unavailable)</>
              )}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-mid" size={18} />
            <input
              type="text"
              placeholder="Search hospitals..."
              value={hospitalSearch}
              onChange={(e) => {
                setHospitalSearch(e.target.value)
                setSelectedHospital('')
                setShowHospDropdown(true)
              }}
              onFocus={() => setShowHospDropdown(true)}
              className="w-full bg-white dark:bg-gray-900 border border-neutral-light dark:border-gray-700 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary text-neutral-dark dark:text-white text-sm"
              required
            />
            {showHospDropdown && filteredHospitals.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-neutral-light dark:border-gray-700 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                {filteredHospitals.map(h => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => selectHospital(h)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-neutral-light dark:hover:bg-gray-800 transition-colors border-b border-neutral-light/50 dark:border-gray-800/50 last:border-0"
                  >
                    <MapPin size={16} className="text-primary shrink-0" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-semibold text-neutral-dark dark:text-white truncate">{h.name}</span>
                      <span className="text-xs text-neutral-mid truncate">{h.address}</span>
                    </div>
                    {h.distance_km != null && (
                      <span className="text-[11px] font-semibold text-primary shrink-0 ml-2">
                        {h.distance_km < 1 ? `${(h.distance_km * 1000).toFixed(0)}m` : `${h.distance_km.toFixed(1)}km`}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {showHospDropdown && hospitalSearch && filteredHospitals.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-neutral-light dark:border-gray-700 rounded-xl shadow-lg z-20 p-4 text-center text-sm text-neutral-mid">
                No hospitals found matching "{hospitalSearch}"
              </div>
            )}
          </div>
          {selectedHospital && (
            <div className="flex items-center gap-2 text-xs text-success bg-success/5 border border-success/20 rounded-xl px-3 py-2">
              <MapPin size={14} />
              {hospitalLocation
                ? `${selectedHospital} — location set`
                : `${selectedHospital} selected (no coordinates available)`}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-dark dark:text-white">Or set location manually</label>
            <MapPicker onLocationChange={(loc) => setHospitalLocation(loc)} />
          </div>
        </div>

        {/* Receiver / Patient Location */}
        <div className="flex flex-col gap-4 p-4 bg-white dark:bg-gray-900 border border-neutral-light dark:border-gray-800 rounded-xl">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-neutral-dark dark:text-white">Your Location (Receiver)</label>
            <span className="text-xs text-neutral-mid">Where should the donor come to?</span>
          </div>
          <MapPicker onLocationChange={(loc) => setReceiverLocation(loc)} />
        </div>

        {/* Donor Radius */}
        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-900 border border-neutral-light dark:border-gray-800 rounded-xl">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-neutral-dark dark:text-white">Alert Radius</label>
            <span className="font-bold text-primary">{radius} km</span>
          </div>
          <input 
            type="range" 
            min="5" max="50" step="5" 
            value={radius} 
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-full accent-primary" 
          />
          <div className="flex justify-between text-xs text-neutral-mid font-medium">
            <span>5km</span>
            <span>25km</span>
            <span>50km</span>
          </div>
          <div className="mt-2 text-sm text-center bg-primary/5 text-primary rounded-lg py-2 font-medium">
            ~14 donors available within {radius} km
          </div>
        </div>

        {/* SMS Mode */}
        <div className="flex items-start gap-3 p-4 bg-accent/10 border border-accent/20 rounded-xl">
          <div className="pt-1">
            <Switch.Root 
              className="w-11 h-6 bg-neutral-mid/30 rounded-full relative data-[state=checked]:bg-accent outline-none cursor-pointer" 
              checked={smsMode}
              onCheckedChange={setSmsMode}
            >
              <Switch.Thumb className="block w-[20px] h-[20px] bg-white rounded-full shadow-md transition-transform duration-200 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
            </Switch.Root>
          </div>
          <div className="flex flex-col flex-1">
            <span className="font-semibold text-neutral-dark dark:text-white flex items-center gap-1">
              Enable SMS Emergency Mode <AlertCircle size={14} className="text-accent" />
            </span>
            <span className="text-xs text-neutral-mid mt-0.5 leading-relaxed">
              Sends standard SMS alerts to matching donors who don't have internet access. Highly recommended for critical requests.
            </span>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full mb-8 h-14 text-lg shadow-lg shadow-primary/20" isLoading={isLoading} disabled={!selectedBg || !selectedHospital}>
          Send Alert to Donors
        </Button>
      </form>
    </div>
  )
}
