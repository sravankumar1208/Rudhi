import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Phone, MessageCircle, MapPin, User, Save, Radio } from 'lucide-react'
import { LiveMap } from '../components/maps/LiveMap'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { MapPicker } from '../components/maps/MapPicker'
import { supabase } from '../lib/supabase'
import { getRequest, subscribeToRequest, cancelRequest, updateReceiverLocation } from '../lib/api/requests'
import { useAuthStore } from '../store'
import { useGeolocation } from '../hooks/useGeolocation'
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

  // Determine if the current user is the requester
  const isRequester = user?.id === request?.requester_id

  useEffect(() => {
    if (!requestId) return
    getRequest(requestId).then(data => {
      setRequest(data)
      if (data?.receiver_location?.coordinates) {
        setPickLoc({ lat: data.receiver_location.coordinates[1], lng: data.receiver_location.coordinates[0] })
      }
      setLoading(false)
    }).catch(() => setLoading(false))

    const sub = subscribeToRequest(requestId, (payload) => {
      if (payload.new) {
        setRequest(prev => ({ ...prev, ...payload.new }))
        if (payload.new.receiver_location?.coordinates) {
          setPickLoc({ lat: payload.new.receiver_location.coordinates[1], lng: payload.new.receiver_location.coordinates[0] })
        }
      }
    })

    return () => sub.unsubscribe()
  }, [requestId])

  // Subscribe to donor's live location
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
          const loc = payload.new?.location
          if (loc?.coordinates) {
            setDonorLocation({
              lat: loc.coordinates[1],
              lng: loc.coordinates[0],
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [donorId])

  // Load donor's initial location from their profile
  useEffect(() => {
    if (!donorId) return
    supabase
      .from('profiles')
      .select('location')
      .eq('id', donorId)
      .single()
      .then(({ data }) => {
        if (data?.location?.coordinates) {
          setDonorLocation({
            lat: data.location.coordinates[1],
            lng: data.location.coordinates[0],
          })
        }
      })
      .catch(() => {})
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

  const hospitalLocation = useMemo(() => ({
    lat: request?.hospital_location?.coordinates?.[1] || 13.0827,
    lng: request?.hospital_location?.coordinates?.[0] || 80.2707,
  }), [request?.hospital_location?.coordinates])

  const receiverLocation = useMemo(() => pickLoc || null, [pickLoc])

  const routeCoords = useMemo(() => {
    if (!donorLocation || !hospitalLocation) return null
    const points = [[donorLocation.lat, donorLocation.lng]]
    if (receiverLocation) points.push([receiverLocation.lat, receiverLocation.lng])
    points.push([hospitalLocation.lat, hospitalLocation.lng])
    return points.filter(p => p[0] != null && p[1] != null)
  }, [donorLocation, receiverLocation, hospitalLocation])

  // Compute distance from donor to nearest destination
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

  // Estimate ETA in minutes (assume ~30 km/h avg speed in city)
  const etaMins = donorToDestDist != null ? Math.max(1, Math.round(donorToDestDist / 30 * 60)) : null

  const handleCancel = async () => {
    try {
      await cancelRequest(requestId)

      // Notify all pending/accepted donors that request was cancelled
      const acceptedDonors = request?.donor_responses?.filter(r => r.response === 'accepted' || r.response === 'pending') || []
      if (acceptedDonors.length > 0) {
        const notifs = acceptedDonors.map(r => ({
          user_id: r.donor_id,
          type: 'alert',
          title: 'Request Cancelled',
          body: `The blood request for ${request?.blood_group} at ${request?.hospital_name} has been cancelled.`,
          data: { request_id: requestId },
        }))
        supabase.from('notifications').insert(notifs).catch(() => {})
      }

      toast.success('Request cancelled')
      navigate('/home')
    } catch {
      toast.error('Could not cancel request')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px-72px)] text-neutral-mid">
        Loading...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px-72px)] w-full relative">
      
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
          <div className="flex flex-col">
            <span className="text-xs text-neutral-mid font-medium uppercase tracking-wider">Status</span>
            <span className="font-bold text-neutral-dark dark:text-white">
              {donorStatus === 'searching' && "Pinging Donors..."}
              {donorStatus === 'matched' && "Donor Found!"}
              {(donorStatus === 'fulfilled' || donorStatus === 'on_the_way') && "Donor En Route"}
            </span>
          </div>
          {donorStatus === 'searching' && (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20">
              <div className="w-4 h-4 rounded-full bg-accent animate-ping" />
            </div>
          )}
          {(donorStatus === 'matched' || donorStatus === 'fulfilled') && (
            <div className="flex flex-col items-end">
              <span className="text-xl font-heading font-bold text-primary">
                {etaMins != null ? `${etaMins} min` : '...'}
              </span>
              <span className="text-[10px] text-neutral-mid uppercase font-medium">ETA</span>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 bg-white dark:bg-gray-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 pb-8 border-t border-neutral-light dark:border-gray-800 animate-slide-up max-h-[50vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-neutral-light dark:bg-gray-800 rounded-full mx-auto mb-6" />

        {showLocPicker ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-neutral-dark dark:text-white">Set My Location</h3>
              <button onClick={() => setShowLocPicker(false)} className="text-sm text-neutral-mid hover:text-neutral-dark transition-colors">
                Cancel
              </button>
            </div>
            <p className="text-xs text-neutral-mid">Tap the map or use GPS to set your current position</p>
            <MapPicker
              defaultLocation={receiverLocation || hospitalLocation}
              onLocationChange={setPickLoc}
            />
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleUseGps} className="flex-1">
                Use GPS
              </Button>
              <Button onClick={handleSaveMyLocation} isLoading={locSaving} className="flex-[2]">
                {locSaving ? 'Saving...' : <span className="flex items-center gap-2"><Save size={16} /> Save</span>}
              </Button>
            </div>
          </div>
        ) : donorStatus === 'searching' ? (
          <div className="flex flex-col items-center justify-center gap-4 py-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <MapPin className="text-primary" size={24} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-heading font-bold text-lg text-neutral-dark dark:text-white">Alert Sent to Donors</h3>
              <p className="text-sm text-neutral-mid">Waiting for a donor to accept your request...</p>
            </div>
            <div className="w-full flex gap-3">
              {isRequester && (
                <Button variant="secondary" className="flex-1 flex gap-2" onClick={() => setShowLocPicker(true)}>
                  <MapPin size={16} /> Set My Location
                </Button>
              )}
              <Button variant="secondary" className="flex-1 border-danger text-danger hover:bg-danger/10" onClick={handleCancel}>
                Cancel Request
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-neutral-light dark:bg-gray-800 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold text-neutral-mid">
                  {donor?.full_name?.charAt(0)?.toUpperCase() || 'D'}
                </div>
                <div className="flex flex-col">
                  <h3 className="font-heading font-bold text-lg text-neutral-dark dark:text-white leading-tight">{donor?.full_name || 'Donor'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="blood">{donor?.blood_group || request?.blood_group}</Badge>
                    <span className="text-xs font-medium text-neutral-mid flex items-center gap-1">
                      {donorLocation ? (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                          {donorToDestDist != null ? `${donorToDestDist} km` : 'Live'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> Awaiting GPS...
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <a href="tel:1234567890" className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success transition-colors hover:bg-success/20">
                  <Phone size={18} />
                </a>
                <button className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary transition-colors hover:bg-primary/20">
                  <MessageCircle size={18} />
                </button>
              </div>
            </div>

            {donorLocation && (
              <div className="flex items-center gap-2 p-3 bg-success/5 border border-success/20 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success shrink-0">
                  <Radio size={16} className="animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-dark dark:text-white">Donor Live Location</p>
                  <p className="text-xs text-neutral-mid truncate">
                    {donorLocation.lat.toFixed(5)}, {donorLocation.lng.toFixed(5)}
                    {donorToDestDist != null ? ` — ${donorToDestDist} km away` : ''}
                  </p>
                </div>
              </div>
            )}

            {isRequester && (
              <div className="flex items-center gap-2 p-3 bg-accent/5 border border-accent/20 rounded-xl cursor-pointer hover:bg-accent/10 transition-colors" onClick={() => setShowLocPicker(true)}>
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                  <User size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-dark dark:text-white">
                    {receiverLocation ? 'My location is set' : 'Set my location'}
                  </p>
                  <p className="text-xs text-neutral-mid truncate">
                    {receiverLocation ? `${receiverLocation.lat.toFixed(4)}, ${receiverLocation.lng.toFixed(4)}` : 'Tap here to show the donor where you are'}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-2">
              <Button variant="secondary" className="w-full flex gap-2">
                Share Live Link
              </Button>
              <Button className="w-full bg-success hover:bg-emerald-600 text-white flex gap-2" onClick={() => navigate(`/log-donation/${requestId}`)}>
                Confirm Arrival
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
