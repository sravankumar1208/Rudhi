import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, MapPin, Clock, Droplet } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { supabase } from '../lib/supabase'
import { getRequest, respondToRequest } from '../lib/api/requests'
import { useGeolocation } from '../hooks/useGeolocation'
import toast from 'react-hot-toast'

export const DonorAlert = () => {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const { latitude, longitude } = useGeolocation()
  const [request, setRequest] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (navigator.vibrate) {
      navigator.vibrate([500, 250, 500, 250, 500])
    }
    getRequest(requestId).then(setRequest).catch(() => null)

    const channel = supabase
      .channel(`donor-alert:${requestId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'blood_requests', filter: `id=eq.${requestId}` },
        (payload) => {
          const updated = payload.new
          if (updated.status === 'cancelled' || updated.status === 'fulfilled') {
            toast.error('This request is no longer available')
            navigate('/home', { replace: true })
          } else {
            setRequest(updated)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [requestId, navigate])

  const handleAccept = async () => {
    setActionLoading(true)
    try {
      // Ensure request data is loaded before picking destination
      let req = request
      if (!req) {
        req = await getRequest(requestId)
      }

      // Use hospital location first, fallback to receiver
      const dst = req?.hospital_location?.coordinates
        ? [req.hospital_location.coordinates[1], req.hospital_location.coordinates[0]]
        : req?.receiver_location?.coordinates
        ? [req.receiver_location.coordinates[1], req.receiver_location.coordinates[0]]
        : null

      // Open Google Maps synchronously (before await — browser popup blocker won't block it)
      if (dst) {
        const origin = latitude && longitude ? `&origin=${latitude},${longitude}` : ''
        window.open(
          `https://www.google.com/maps/dir/?api=1${origin}&destination=${dst[0]},${dst[1]}`,
          '_blank'
        )
      } else {
        toast.error('Hospital has no location set. Navigate manually from the tracking page.')
      }

      await respondToRequest(requestId, 'accepted')

      navigate(`/donor-navigation/${requestId}`)
    } catch {
      toast.error('Failed to accept request')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDecline = async () => {
    setActionLoading(true)
    try {
      await respondToRequest(requestId, 'declined')
      navigate('/home')
    } catch {
      navigate('/home')
    } finally {
      setActionLoading(false)
    }
  }

  const bg = request?.blood_group || 'O+'
  const hospitalName = request?.hospital_name || 'Hospital'
  const patientName = request?.patient_name || 'a patient'
  const units = request?.units_needed || 1
  const urgency = request?.urgency || 'critical'

  return (
    <div className="flex flex-col min-h-screen w-full bg-danger text-white relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <motion.div 
          animate={{ scale: [1, 2], opacity: [0.8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
          className="absolute w-64 h-64 border-4 border-white rounded-full"
        />
        <motion.div 
          animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut", delay: 0.5 }}
          className="absolute w-80 h-80 border-2 border-white rounded-full"
        />
      </div>

      <div className="flex-1 flex flex-col p-6 pt-16 z-10 relative">
        <div className="flex flex-col items-center text-center gap-4 mb-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(255,255,255,0.3)] animate-pulse">
            <AlertTriangle className="text-danger" size={40} />
          </div>
          <h1 className="text-4xl font-heading font-black tracking-tight uppercase">URGENT<br/>BLOOD REQUIRED</h1>
          <p className="text-white/90 text-lg font-medium max-w-[280px]">
            A patient near you is in critical condition and needs your help.
          </p>
        </div>

        <div className="bg-white text-neutral-dark rounded-2xl p-6 shadow-2xl flex flex-col gap-5 mt-auto">
          <div className="flex justify-between items-center pb-5 border-b border-neutral-light">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-danger/10 rounded-xl flex items-center justify-center text-danger font-heading font-bold text-2xl">
                {bg}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight">{hospitalName}</span>
                <span className="text-sm text-neutral-mid font-medium">Patient: {patientName}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-neutral-mid font-semibold uppercase tracking-wider flex items-center gap-1">
                <MapPin size={12} /> Distance
              </span>
              <span className="font-bold text-lg">2.4 km</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-neutral-mid font-semibold uppercase tracking-wider flex items-center gap-1">
                <Clock size={12} /> Est. Time
              </span>
              <span className="font-bold text-lg text-primary">12 mins</span>
            </div>
            <div className="flex flex-col gap-1 col-span-2 mt-1">
              <span className="text-xs text-neutral-mid font-semibold uppercase tracking-wider flex items-center gap-1">
                <Droplet size={12} /> Requirement
              </span>
              <div className="flex gap-2 mt-1">
                <Badge className="bg-danger/10 text-danger border border-danger/20">{units} Unit{units > 1 ? 's' : ''}</Badge>
                <Badge variant="status" status="active">{urgency.charAt(0).toUpperCase() + urgency.slice(1)}</Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <Button size="lg" className="h-14 text-lg w-full bg-success hover:bg-emerald-600 text-white shadow-lg shadow-success/30" onClick={handleAccept} isLoading={actionLoading}>
              Accept & Navigate
            </Button>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1 border-neutral-light bg-neutral-light/50 hover:bg-neutral-light text-neutral-dark" onClick={handleDecline} disabled={actionLoading}>
                Decline
              </Button>
              <Button variant="secondary" className="flex-1 border-neutral-light bg-neutral-light/50 hover:bg-neutral-light text-neutral-dark" disabled={actionLoading}>
                Remind in 10m
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
