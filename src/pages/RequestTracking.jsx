import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Phone, MessageCircle, MapPin, User, Save, Radio, Building2, UserCircle } from 'lucide-react'
import { LiveMap } from '../components/maps/LiveMap'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { MapPicker } from '../components/maps/MapPicker'
import { supabase } from '../lib/supabase'
import { getRequest, subscribeToRequest, cancelRequest, updateReceiverLocation } from '../lib/api/requests'
import { useAuthStore } from '../store'
import { useGeolocation } from '../hooks/useGeolocation'
import { parseLocation } from '../lib/utils'
import toast from 'react-hot-toast'

export const RequestTracking = () => {
  const { id: requestId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { latitude, longitude } = useGeolocation()
  
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [donorLocation, setDonorLocation] = useState(null)
  const [showLocPicker, setShowLocPicker] = useState(false)
  const [pickLoc, setPickLoc] = useState(null)
  const [locSaving, setLocSaving] = useState(false)

  const isRequester = user?.id === request?.requester_id

  useEffect(() => {
    if (!requestId) return
    getRequest(requestId).then(data => {
      setRequest(data)
      const loc = parseLocation(data?.receiver_location)
      if (loc) setPickLoc(loc)
      setLoading(false)
    }).catch(() => setLoading(false))

    const sub = subscribeToRequest(requestId, (payload) => {
      if (payload.new) {
        setRequest(prev => ({ ...prev, ...payload.new }))
        const loc = parseLocation(payload.new.receiver_location)
        if (loc) setPickLoc(loc)
      }
    })

    return () => sub.unsubscribe()
  }, [requestId])

  const acceptedResponse = request?.donor_responses?.find(r => r.response === 'accepted')
  const donor = acceptedResponse?.profiles || null
  const donorId = donor?.id || acceptedResponse?.donor_id

  useEffect(() => {
    if (!donorId) return
    const channel = supabase
      .channel(`donor-location:${donorId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${donorId}` },
        (payload) => {
          const loc = parseLocation(payload.new?.location)
          if (loc) setDonorLocation(loc)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [donorId])

  const handleSaveMyLocation = async () => {
    if (!pickLoc) return toast.error('Pick your location on the map first.')
    setLocSaving(true)
    try {
      await updateReceiverLocation(requestId, pickLoc.lat, pickLoc.lng)
      toast.success('Your location updated!')
      setShowLocPicker(false)
    } catch (err) {
      toast.error(err.message || 'Failed to update location.')
    } finally {
      setLocSaving(false)
    }
  }

  const handleUseGps = () => {
    if (latitude && longitude) {
      setPickLoc({ lat: latitude, lng: longitude })
      toast.success('Using your current GPS position')
    } else {
      toast.error('GPS location not available.')
    }
  }

  const donorStatus = request?.status || 'searching'
  const hospitalLocation = useMemo(() => parseLocation(request?.hospital_location), [request?.hospital_location])
  const receiverLocation = useMemo(() => pickLoc || null, [pickLoc])

  const routeCoords = useMemo(() => {
    if (!donorLocation || !hospitalLocation) return null
    const points = [[donorLocation.lat, donorLocation.lng]]
    if (receiverLocation) points.push([receiverLocation.lat, receiverLocation.lng])
    points.push([hospitalLocation.lat, hospitalLocation.lng])
    return points.filter(p => p[0] != null && p[1] != null)
  }, [donorLocation, receiverLocation, hospitalLocation])

  const donorToDestDist = useMemo(() => {
    if (!donorLocation) return null
    const dest = receiverLocation || hospitalLocation
    if (!dest) return null
    const R = 6371
    const dLat = (dest.lat - donorLocation.lat) * Math.PI / 180
    const dLng = (dest.lng - donorLocation.lng) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(donorLocation.lat * Math.PI / 180) * Math.cos(dest.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
  }, [donorLocation, receiverLocation, hospitalLocation])

  const etaMins = donorToDestDist != null ? Math.max(1, Math.round(donorToDestDist / 30 * 60)) : null

  const handleCancel = async () => {
    try {
      await cancelRequest(requestId)
      toast.success('Request cancelled')
      navigate('/home')
    } catch {
      toast.error('Could not cancel request')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen text-neutral-mid">Loading Tracking...</div>

  return (
    <div className="flex flex-col h-[calc(100vh-56px-72px)] w-full relative text-left">
      <div className="absolute inset-0 z-0">
        <LiveMap 
          hospitalLocation={hospitalLocation}
          donorLocation={donorLocation}
          receiverLocation={receiverLocation}
          routeCoordinates={routeCoords}
        />
      </div>

      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-neutral-light/50 dark:border-gray-800/50 flex justify-between items-center pointer-events-auto">
          <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] text-neutral-mid font-bold uppercase tracking-widest">Status</span>
            <span className="font-bold text-neutral-dark dark:text-white truncate">
              {donorStatus === 'searching' && "Pinging Donors..."}
              {donorStatus === 'matched' && "Donor Found!"}
              {(donorStatus === 'fulfilled' || donorStatus === 'on_the_way') && "Donor En Route"}
            </span>
          </div>
          {(donorStatus === 'matched' || donorStatus === 'fulfilled') && (
            <div className="flex flex-col items-end">
              <span className="text-xl font-heading font-bold text-primary leading-none">
                {etaMins != null ? `${etaMins} min` : '...'}
              </span>
              <span className="text-[10px] text-neutral-mid uppercase font-bold tracking-tighter">ETA</span>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 bg-white dark:bg-gray-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 pb-8 border-t border-neutral-light dark:border-gray-800 animate-slide-up max-h-[70vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-neutral-light dark:bg-gray-800 rounded-full mx-auto mb-6" />

        {showLocPicker ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-neutral-dark dark:text-white uppercase tracking-tight">Set Pickup Location</h3>
              <button onClick={() => setShowLocPicker(false)} className="text-sm font-bold text-primary px-2">Cancel</button>
            </div>
            <MapPicker defaultLocation={receiverLocation || hospitalLocation} onLocationChange={setPickLoc} />
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleUseGps} className="flex-1">Use GPS</Button>
              <Button onClick={handleSaveMyLocation} isLoading={locSaving} className="flex-[2]">Save & Share</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">

            {/* 1. Recipient Information Section */}
            <div className="flex flex-col gap-4">
               <div className="flex items-center gap-2">
                  <UserCircle size={16} className="text-accent" />
                  <span className="text-[10px] font-bold text-neutral-mid uppercase tracking-widest">Recipient Details</span>
               </div>
               <Card className="p-4 border-accent/10 bg-accent/5">
                  <p className="text-sm font-bold text-neutral-dark dark:text-white mb-1">
                     {request?.patient_name || 'Patient'}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-mid">
                     <MapPin size={12} className="shrink-0" />
                     <span className="truncate">{request?.receiver_address || 'Pickup address not set'}</span>
                  </div>
                  {isRequester && (
                    <button
                      onClick={() => setShowLocPicker(true)}
                      className="mt-3 text-[11px] font-bold text-accent uppercase tracking-wider hover:underline"
                    >
                      Update Meeting Point
                    </button>
                  )}
               </Card>
            </div>

            {/* 2. Destination Hospital Section */}
            <div className="flex flex-col gap-4 border-t border-neutral-light dark:border-gray-800 pt-5">
               <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-primary" />
                  <span className="text-[10px] font-bold text-neutral-mid uppercase tracking-widest">Destination Hospital</span>
               </div>
               <div className="flex flex-col gap-1">
                  <p className="text-sm font-bold text-neutral-dark dark:text-white">
                     {request?.hospital_name}
                  </p>
                  <p className="text-xs text-neutral-mid leading-relaxed">
                     {request?.hospital_address || 'Address information not available'}
                  </p>
               </div>
            </div>

            {/* 3. Donor Action Section */}
            {donorStatus !== 'searching' && (
              <div className="flex flex-col gap-4 border-t border-neutral-light dark:border-gray-800 pt-5">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center text-xl font-bold text-success">
                        {donor?.full_name?.charAt(0)?.toUpperCase() || 'D'}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-bold text-neutral-dark dark:text-white leading-tight">{donor?.full_name || 'Donor'}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="blood">{request?.blood_group}</Badge>
                          {donorLocation && <span className="text-[10px] font-bold text-success animate-pulse">LIVE</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={`tel:${donor?.phone || ''}`} className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success"><Phone size={18} /></a>
                      <button className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><MessageCircle size={18} /></button>
                    </div>
                 </div>
              </div>
            )}

            {/* 4. Controls */}
            <div className="flex flex-col gap-3">
              {donorStatus === 'searching' ? (
                <Button variant="secondary" className="w-full border-danger text-danger hover:bg-danger/5" onClick={handleCancel}>
                  Cancel Urgent Request
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                   <Button variant="secondary" className="w-full">Share Link</Button>
                   <Button className="w-full bg-success hover:bg-emerald-600 text-white" onClick={() => navigate(`/log-donation/${requestId}`)}>Confirm Arrival</Button>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
