import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Phone, MapPin, ArrowUpRight, CheckCircle2, User, Building2 } from 'lucide-react'
import { LiveMap } from '../components/maps/LiveMap'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'
import { getRequest } from '../lib/api/requests'
import { updateDonorLocation } from '../lib/api/profiles'
import { useGeolocation } from '../hooks/useGeolocation'
import { useAuthStore } from '../store'
import { parseLocation } from '../lib/utils'
import toast from 'react-hot-toast'

export const DonorNavigation = () => {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { latitude, longitude } = useGeolocation()

  const [request, setRequest] = useState(null)
  const locationRef = useRef({ lat: null, lng: null })

  const [arrivedStep, setArrivedStep] = useState('none') // 'none' | 'receiver' | 'hospital'

  useEffect(() => {
    locationRef.current = { lat: latitude, lng: longitude }
  }, [latitude, longitude])

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
            setRequest(prev => ({ ...prev, ...updated }))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [requestId, navigate])

  useEffect(() => {
    if (!user?.id) return
    const uid = user.id
    const interval = setInterval(async () => {
      const { lat, lng } = locationRef.current
      if (lat && lng) {
        try {
          await updateDonorLocation(lat, lng, uid)
        } catch { }
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [user?.id])

  // ROBUST LOCATION PARSING
  const hospitalLocation = useMemo(() => parseLocation(request?.hospital_location), [request?.hospital_location])
  const receiverLocation = useMemo(() => parseLocation(request?.receiver_location), [request?.receiver_location])
  const donorLocation = useMemo(() => (latitude && longitude ? { lat: latitude, lng: longitude } : null), [latitude, longitude])

  const hasReceiver = !!receiverLocation

  const routePoints = useMemo(() => [
    [donorLocation?.lat, donorLocation?.lng],
    ...(receiverLocation ? [[receiverLocation.lat, receiverLocation.lng]] : []),
    ...(hospitalLocation ? [[hospitalLocation.lat, hospitalLocation.lng]] : []),
  ].filter(p => p[0] != null && p[1] != null), [donorLocation, receiverLocation, hospitalLocation])

  const routeCoordinates = routePoints.length >= 2 ? routePoints : null

  const hospitalName = request?.hospital_name || 'Hospital'
  const primaryDest = receiverLocation || hospitalLocation
  const destName = hasReceiver ? (request?.patient_name || 'Patient') : hospitalName
  const DestIcon = hasReceiver ? User : Building2

  const handleOpenNativeMaps = (loc) => {
    if (!loc) return toast.error('No destination location available.')
    const origin = donorLocation ? `${donorLocation.lat},${donorLocation.lng}` : ''
    const dest = `${loc.lat},${loc.lng}`
    const url = origin
      ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`
      : `https://www.google.com/maps/dir/?api=1&destination=${dest}`
    window.open(url, '_blank')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] w-full relative text-left">
      <div className="absolute inset-0 z-0">
        <LiveMap
          hospitalLocation={hospitalLocation}
          donorLocation={donorLocation}
          receiverLocation={receiverLocation}
          routeCoordinates={routeCoordinates}
        />
      </div>

      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-primary text-white p-4 rounded-xl shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <ArrowUpRight size={28} />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-heading font-bold text-xl truncate">
              {hasReceiver ? `Meet ${destName}` : `Go to ${hospitalName}`}
            </span>
            <span className="text-xs font-medium text-white/80 truncate">
              {hasReceiver
                ? (request?.receiver_address || 'Proceed to pickup point')
                : (request?.hospital_address || 'Proceed to hospital')}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 bg-white dark:bg-gray-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 pb-8 border-t border-neutral-light dark:border-gray-800 animate-slide-up">
        <div className="w-12 h-1.5 bg-neutral-light dark:bg-gray-800 rounded-full mx-auto mb-6" />

        {arrivedStep === 'none' && (
          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${hasReceiver ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                  <DestIcon size={24} />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-heading font-bold text-lg text-neutral-dark dark:text-white truncate max-w-[200px]">
                    {hasReceiver ? destName : hospitalName}
                  </h3>
                  <span className="text-xs text-neutral-mid truncate max-w-[200px]">
                    {hasReceiver ? request?.receiver_address : request?.hospital_address}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <Button
                variant="secondary"
                className="w-full h-12 gap-2"
                onClick={() => handleOpenNativeMaps(primaryDest)}
              >
                <MapPin size={18} /> Open Maps
              </Button>
              <Button
                className="w-full h-12 bg-success hover:bg-emerald-600 text-white gap-2"
                onClick={() => setArrivedStep(hasReceiver ? 'receiver' : 'hospital')}
              >
                <CheckCircle2 size={18} /> I've Arrived
              </Button>
            </div>
          </div>
        )}

        {arrivedStep === 'receiver' && (
          <div className="flex flex-col items-center justify-center gap-4 py-2 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent mb-2">
              <User size={36} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-heading font-bold text-xl text-neutral-dark dark:text-white uppercase tracking-wider">Met {destName}!</h3>
              <p className="text-sm text-neutral-mid px-4">Now please proceed to the hospital with the patient.</p>
            </div>
            <div className="w-full flex flex-col gap-3 mt-4">
              <Button className="w-full h-12 gap-2" onClick={() => handleOpenNativeMaps(hospitalLocation)}>
                <MapPin size={18} /> Navigate to Hospital
              </Button>
              <Button variant="secondary" className="h-12" onClick={() => setArrivedStep('none')}>Back</Button>
            </div>
          </div>
        )}

        {arrivedStep === 'hospital' && (
          <div className="flex flex-col items-center justify-center gap-4 py-2 text-center">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center text-success mb-2">
              <CheckCircle2 size={36} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-heading font-bold text-xl text-neutral-dark dark:text-white uppercase tracking-wider">At Hospital!</h3>
              <p className="text-sm text-neutral-mid px-4">Please complete the donation process.</p>
            </div>
            <div className="w-full flex flex-col gap-3 mt-4">
              <Button size="lg" className="w-full h-14 font-bold" onClick={() => navigate(`/log-donation/${requestId}`)}>
                Log Donation Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
