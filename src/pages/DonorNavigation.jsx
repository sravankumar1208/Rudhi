import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Phone, MapPin, ArrowUpRight, CheckCircle2, User, Building2 } from 'lucide-react'
import { LiveMap } from '../components/maps/LiveMap'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'
import { getRequest } from '../lib/api/requests'
import { updateDonorLocation } from '../lib/api/profiles'
import { useGeolocation } from '../hooks/useGeolocation'
import { useAuthStore } from '../store'
import { getHospitals } from '../lib/api/hospitals'
import toast from 'react-hot-toast'

export const DonorNavigation = () => {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { latitude, longitude } = useGeolocation()
  const [allHospitals, setAllHospitals] = useState([])

  const [request, setRequest] = useState(null)
  const locationRef = useRef({ lat: null, lng: null })

  const [arrivedStep, setArrivedStep] = useState('none') // 'none' | 'receiver' | 'hospital'

  // Keep location ref in sync
  useEffect(() => {
    locationRef.current = { lat: latitude, lng: longitude }
  }, [latitude, longitude])

  const receiverLocation = request?.receiver_location?.coordinates
    ? { lat: request.receiver_location.coordinates[1], lng: request.receiver_location.coordinates[0] }
    : null

  const hasReceiver = !!receiverLocation

  useEffect(() => {
    getHospitals().then(setAllHospitals).catch(() => {})
  }, [])

  useEffect(() => {
    if (requestId) getRequest(requestId).then(setRequest).catch(() => null)

    const channel = supabase
      .channel(`donor-nav:${requestId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'blood_requests', filter: `id=eq.${requestId}` },
        (payload) => {
          const updated = payload.new
          if (updated.status === 'cancelled' || updated.status === 'fulfilled') {
            toast.error('This request has been updated')
            navigate('/home', { replace: true })
          } else {
            setRequest(updated)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [requestId, navigate])

  // Broadcast donor's live location every 5s
  useEffect(() => {
    if (!user?.id) return
    const uid = user.id
    const interval = setInterval(async () => {
      const { lat, lng } = locationRef.current
      if (lat && lng) {
        try {
          await updateDonorLocation(lat, lng, uid)
        } catch { /* background sync errors are non-critical */ }
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [user?.id])

  // Get hospital location from request, fallback to hospitals table lookup
  const hospitalLocation = request?.hospital_location?.coordinates
    ? { lat: request.hospital_location.coordinates[1], lng: request.hospital_location.coordinates[0] }
    : request?.hospital_name
    ? (() => {
        const match = allHospitals.find(h =>
          h.name?.toLowerCase() === request.hospital_name.toLowerCase() ||
          h.name?.toLowerCase().includes(request.hospital_name.toLowerCase()) ||
          request.hospital_name.toLowerCase().includes(h.name?.toLowerCase())
        )
        if (match?.location?.coordinates) {
          return { lat: match.location.coordinates[1], lng: match.location.coordinates[0] }
        }
        return null
      })()
    : null

  const donorLocation = (latitude && longitude)
    ? { lat: latitude, lng: longitude }
    : null

  // Route: donor → receiver (if set) → hospital
  const routePoints = [
    [donorLocation?.lat, donorLocation?.lng],
    ...(receiverLocation ? [[receiverLocation.lat, receiverLocation.lng]] : []),
    ...(hospitalLocation ? [[hospitalLocation.lat, hospitalLocation.lng]] : []),
  ].filter(p => p[0] != null && p[1] != null)

  const routeCoordinates = routePoints.length >= 2 ? routePoints : null

  const hospitalName = request?.hospital_name || 'Hospital'
  const hospitalPhone = request?.hospital_phone || ''

  // Primary destination: receiver first, otherwise hospital
  const primaryDest = receiverLocation || hospitalLocation
  const destName = hasReceiver
    ? (request?.patient_name || 'Patient')
    : hospitalName
  const DestIcon = hasReceiver ? User : Building2

  const handleOpenNativeMaps = (location) => {
    if (!location) return toast.error('No destination location available.')
    const origin = donorLocation ? `${donorLocation.lat},${donorLocation.lng}` : ''
    const dest = `${location.lat},${location.lng}`
    const url = origin
      ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`
      : `https://www.google.com/maps/dir/?api=1&destination=${dest}`
    window.open(url, '_blank')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] w-full relative">
      <div className="absolute inset-0 z-0">
        <LiveMap
          hospitalLocation={hospitalLocation}
          donorLocation={donorLocation}
          receiverLocation={receiverLocation}
          routeCoordinates={routeCoordinates}
        />
      </div>

      {/* Top header - shows primary (receiver) or hospital destination */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-primary text-white p-4 rounded-xl shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowUpRight size={28} />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-bold text-2xl">
              {hasReceiver ? `Meet ${destName}` : `Navigate to ${hospitalName}`}
            </span>
            <span className="text-sm font-medium text-white/80">
              {hasReceiver
                ? (receiverLocation ? `${receiverLocation.lat.toFixed(4)}, ${receiverLocation.lng.toFixed(4)}` : '')
                : (request?.hospital_address || '')}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-white dark:bg-gray-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 pb-8 border-t border-neutral-light dark:border-gray-800">
        <div className="w-12 h-1.5 bg-neutral-light dark:bg-gray-800 rounded-full mx-auto mb-6" />

        {/* Step 0: Navigate to receiver / hospital */}
        {arrivedStep === 'none' && (
          <div className="flex flex-col gap-5">
            {/* Primary destination card */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${hasReceiver ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                  <DestIcon size={24} />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-heading font-bold text-xl text-neutral-dark dark:text-white">
                    {hasReceiver ? (request?.patient_name || 'Patient') : hospitalName}
                  </h3>
                  <span className="text-sm text-neutral-mid">
                    {hasReceiver ? `Blood needed: ${request?.blood_group || ''}` : (request?.hospital_address || '')}
                  </span>
                </div>
              </div>
              {!hasReceiver && hospitalPhone && (
                <a href={`tel:${hospitalPhone}`} className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success transition-colors hover:bg-success/20">
                  <Phone size={20} />
                </a>
              )}
            </div>

            {/* Next stop hint - show hospital after receiver */}
            {hasReceiver && hospitalLocation && (
              <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Building2 size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-dark dark:text-white">Next: {hospitalName}</p>
                  <p className="text-xs text-neutral-mid truncate">Blood donation at hospital after meeting patient</p>
                </div>
              </div>
            )}

            {/* Receiver info */}
            {hasReceiver && (
              <div className="flex items-center gap-2 p-3 bg-accent/5 border border-accent/20 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                  <User size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-dark dark:text-white">
                    {request?.patient_name ? `${request.patient_name}'s Location` : 'Receiver Location'}
                  </p>
                  <p className="text-xs text-neutral-mid truncate">
                    {receiverLocation.lat.toFixed(4)}, {receiverLocation.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              {primaryDest && (
                <Button variant="secondary" className="w-full flex gap-2" onClick={() => handleOpenNativeMaps(primaryDest)}>
                  <MapPin size={18} /> Open Maps
                </Button>
              )}
              <Button className={`${primaryDest ? '' : 'col-span-2 '}w-full bg-success hover:bg-emerald-600 text-white flex gap-2`} onClick={() => setArrivedStep(hasReceiver ? 'receiver' : 'hospital')}>
                <CheckCircle2 size={18} /> I've Arrived
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Arrived at receiver - now go to hospital */}
        {arrivedStep === 'receiver' && (
          <div className="flex flex-col items-center justify-center gap-4 py-2 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent mb-2">
              <User size={36} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-heading font-bold text-xl text-neutral-dark dark:text-white">
                Met {request?.patient_name || 'Patient'}!
              </h3>
              <p className="text-sm text-neutral-mid">Now proceed to the hospital for donation.</p>
            </div>
            <div className="w-full flex flex-col gap-3 mt-4">
              {hospitalLocation && (
                <Button className="w-full flex gap-2" onClick={() => handleOpenNativeMaps(hospitalLocation)}>
                  <MapPin size={18} /> Navigate to {hospitalName}
                </Button>
              )}
              <Button className="w-full bg-success hover:bg-emerald-600 text-white flex gap-2" onClick={() => setArrivedStep('hospital')}>
                <CheckCircle2 size={18} /> I've Arrived at Hospital
              </Button>
              <Button variant="secondary" onClick={() => setArrivedStep('none')}>
                Back
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Arrived at hospital */}
        {arrivedStep === 'hospital' && (
          <div className="flex flex-col items-center justify-center gap-4 py-2 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center text-success mb-2">
              <CheckCircle2 size={36} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-heading font-bold text-xl text-neutral-dark dark:text-white">You have arrived!</h3>
              <p className="text-sm text-neutral-mid">Please proceed to the blood bank.</p>
            </div>
            <div className="w-full flex flex-col gap-3 mt-4">
              <Button size="lg" className="w-full" onClick={() => {
                // Notify requester that donor arrived at hospital
                if (request?.requester_id) {
                  supabase.from('notifications').insert({
                    user_id: request.requester_id,
                    type: 'success',
                    title: 'Donor Arrived at Hospital',
                    body: `Your donor has arrived at ${request?.hospital_name || 'the hospital'}. Head there to complete the donation.`,
                    data: { request_id: requestId, donor_status: 'arrived' },
                  }).catch(() => {})
                }
                navigate(`/log-donation/${requestId}`)
              }}>
                Log Donation
              </Button>
              <Button variant="secondary" onClick={() => setArrivedStep(hasReceiver ? 'receiver' : 'none')}>
                Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
