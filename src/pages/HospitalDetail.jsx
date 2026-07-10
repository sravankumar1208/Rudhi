import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Phone, Navigation, Clock, Droplet, Radio } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { LiveMap } from '../components/maps/LiveMap'
import { supabase } from '../lib/supabase'
import { getHospitalById, getBloodInventory } from '../lib/api/hospitals'
import { useGeolocation } from '../hooks/useGeolocation'

export const HospitalDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { latitude, longitude } = useGeolocation()
  const [hospital, setHospital] = useState(null)
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeRequests, setActiveRequests] = useState([])
  const [donorLocations, setDonorLocations] = useState({})

  useEffect(() => {
    if (!id) return
    Promise.all([
      getHospitalById(id),
      getBloodInventory(id).catch(() => []),
    ]).then(([h, inv]) => {
      setHospital(h)
      setInventory(inv)
      // Fetch active blood requests for this hospital
      if (h?.name) {
        supabase
          .from('blood_requests')
          .select(`
            *,
            donor_responses (
              id, response, accepted_at,
              profiles ( id, full_name, blood_group, location )
            )
          `)
          .eq('hospital_name', h.name)
          .in('status', ['matched', 'fulfilled', 'on_the_way'])
          .order('created_at', { ascending: false })
          .then(({ data }) => {
            if (data) {
              setActiveRequests(data.filter(r => r.donor_responses?.length > 0))
            }
          })
          .catch(() => {})
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  // Subscribe to real-time donor location for each active request
  useEffect(() => {
    if (activeRequests.length === 0) return
    const channels = []
    activeRequests.forEach((req) => {
      const donor = req.donor_responses?.[0]?.profiles
      if (!donor?.id) return
      const channel = supabase
        .channel(`hospital-donor-loc:${donor.id}`)
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${donor.id}` },
          (payload) => {
            const loc = payload.new?.location
            if (loc?.coordinates) {
              setDonorLocations((prev) => ({
                ...prev,
                [donor.id]: { lat: loc.coordinates[1], lng: loc.coordinates[0] },
              }))
            }
          }
        )
        .subscribe()
      channels.push(channel)

      // Load initial donor location
      if (donor.location?.coordinates) {
        setDonorLocations((prev) => ({
          ...prev,
          [donor.id]: { lat: donor.location.coordinates[1], lng: donor.location.coordinates[0] },
        }))
      }
    })

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch))
    }
  }, [activeRequests])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-neutral-mid">Loading...</div>
    )
  }

  if (!hospital) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 gap-4">
        <Droplet size={48} className="text-neutral-mid" />
        <h2 className="text-xl font-bold text-neutral-dark dark:text-white">Hospital Not Found</h2>
        <Button variant="secondary" onClick={() => navigate('/hospitals')}>Back to Hospitals</Button>
      </div>
    )
  }

  const hospitalLocation = hospital.location?.coordinates
    ? { lat: hospital.location.coordinates[1], lng: hospital.location.coordinates[0] }
    : null

  return (
    <div className="flex flex-col min-h-screen w-full bg-secondary dark:bg-dark-bg p-4 gap-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-neutral-light dark:border-gray-800 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h1 className="text-2xl font-heading font-bold text-neutral-dark dark:text-white">{hospital.name}</h1>
            <span className="text-sm font-medium text-neutral-mid mt-0.5">{hospital.type || 'Hospital'}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm text-neutral-mid">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="shrink-0" />
            <span>{hospital.address || 'Address not available'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="shrink-0" />
            <span>{hospital.hours || 'N/A'}</span>
          </div>
        </div>

        <div className="flex gap-3">
          {hospital.phone && (
            <a href={`tel:${hospital.phone}`} className="flex-1">
              <Button variant="secondary" size="sm" className="w-full flex gap-2 h-11">
                <Phone size={16} /> Call
              </Button>
            </a>
          )}
          {(() => {
            const coord = hospital.location?.coordinates
            const origin = latitude && longitude ? `&origin=${latitude},${longitude}` : ''
            let dest, mapUrl
            if (coord) {
              dest = `${coord[1]},${coord[0]}`
              mapUrl = `https://www.google.com/maps/dir/?api=1${origin}&destination=${dest}`
            } else {
              const q = [hospital.name, hospital.address].filter(Boolean).join(', ')
              if (q) mapUrl = `https://www.google.com/maps/dir/?api=1${origin}&destination=${encodeURIComponent(q)}`
            }
            return mapUrl ? (
              <Button size="sm" className="flex-1 flex gap-2 h-11 bg-success hover:bg-emerald-600 text-white" onClick={() => window.open(mapUrl, '_blank')}>
                <Navigation size={16} /> Navigate
              </Button>
            ) : null
          })()}
        </div>
      </div>

      {/* ── Live Donor Tracking ─────────────────────────────────── */}
      {activeRequests.length > 0 && (
        <Card className="flex flex-col p-5 gap-4">
          <h2 className="font-heading font-bold text-lg text-neutral-dark dark:text-white flex items-center gap-2">
            <Radio size={18} className="text-primary" />
            Live Donor Tracking
          </h2>
          {activeRequests.map((req) => {
            const donor = req.donor_responses?.[0]?.profiles
            const donorLoc = donor?.id ? donorLocations[donor.id] : null
            if (!donor) return null
            return (
              <div key={req.id} className="border border-neutral-light dark:border-gray-700 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {donor.full_name?.charAt(0)?.toUpperCase() || 'D'}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-neutral-dark dark:text-white">{donor.full_name || 'Donor'}</span>
                      <span className="text-xs text-neutral-mid">
                        {req.blood_group} | {req.patient_name ? `Patient: ${req.patient_name}` : req.urgency}
                      </span>
                    </div>
                  </div>
                  <Badge variant="status" status={req.status === 'fulfilled' ? 'completed' : 'in_progress'}>
                    {req.status}
                  </Badge>
                </div>

                {hospitalLocation && (
                  <div className="h-44 w-full rounded-xl overflow-hidden border border-neutral-light dark:border-gray-700">
                    <LiveMap
                      hospitalLocation={hospitalLocation}
                      donorLocation={donorLoc || null}
                    />
                  </div>
                )}

                {donorLoc && (
                  <div className="flex items-center gap-2 text-xs text-neutral-mid">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    Live: {donorLoc.lat.toFixed(4)}, {donorLoc.lng.toFixed(4)}
                  </div>
                )}

                {!donorLoc && (
                  <p className="text-xs text-neutral-mid">Waiting for donor location...</p>
                )}
              </div>
            )
          })}
        </Card>
      )}

      {/* ── Blood Inventory ─────────────────────────────────────── */}
      {inventory.length > 0 && (
        <Card className="flex flex-col p-5 gap-4">
          <h2 className="font-heading font-bold text-lg text-neutral-dark dark:text-white">Blood Inventory</h2>
          <div className="grid grid-cols-4 gap-3">
            {inventory.map((item) => (
              <div
                key={item.blood_group}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border ${
                  item.units === 0
                    ? 'bg-danger/5 border-danger/20 text-danger'
                    : item.units <= 3
                    ? 'bg-accent/5 border-accent/20 text-accent'
                    : 'bg-success/5 border-success/20 text-success'
                }`}
              >
                <span className="text-xs font-bold">{item.blood_group}</span>
                <span className="text-lg font-heading font-bold mt-0.5">{item.units}</span>
                <span className="text-[10px] font-medium opacity-70">Units</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {hospital.facilities && hospital.facilities.length > 0 && (
        <Card className="flex flex-col p-5 gap-3">
          <h2 className="font-heading font-bold text-lg text-neutral-dark dark:text-white">Facilities</h2>
          <div className="flex flex-wrap gap-2">
            {hospital.facilities.map((f, i) => (
              <Badge key={i} className="bg-primary/5 border-primary/20 text-primary">{f}</Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
