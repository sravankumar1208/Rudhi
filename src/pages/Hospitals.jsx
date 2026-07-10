import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Navigation, Phone, Map, List } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { getHospitals } from '../lib/api/hospitals'
import { useGeolocation } from '../hooks/useGeolocation'
import { cn } from '../lib/utils'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const hospitalIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmZmZmZiIgc3Ryb2tlPSIjZWY0NDQ0IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIxIDEwYy0uMDAxLTctOS0xMy05LTEzczktNiA5LTEzYTkgOSAwIDAgMSAxOCAwem0tOSAzdi02bS0zIDNoNiIvPjwvc3ZnPg==',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzNiODJmNiIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIuNjlsNS42NiA1LjY2YTggOCAxMCAxIDEtMTEuMzEgMHptMCAwdjkiLz48L3N2Zz4=',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
})

function mapsUrl(hospital, userLoc) {
  const coord = hospital.location?.coordinates
  if (coord) {
    const origin = userLoc ? `&origin=${userLoc.lat},${userLoc.lng}` : ''
    return `https://www.google.com/maps/dir/?api=1${origin}&destination=${coord[1]},${coord[0]}`
  }
  const q = [hospital.name, hospital.address].filter(Boolean).join(', ')
  if (!q) return null
  const origin = userLoc ? `&origin=${userLoc.lat},${userLoc.lng}` : ''
  return `https://www.google.com/maps/dir/?api=1${origin}&destination=${encodeURIComponent(q)}`
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
}

const MapBounds = ({ hospitals, userLoc }) => {
  const map = useMap()
  useEffect(() => {
    if (!userLoc) {
      if (hospitals.length > 0) {
        const group = L.featureGroup(hospitals.map(h => L.marker([h.location.coordinates[1], h.location.coordinates[0]])))
        map.fitBounds(group.getBounds().pad(0.2))
      }
    } else {
      const allPoints = hospitals
        .filter(h => h.location?.coordinates)
        .map(h => [h.location.coordinates[1], h.location.coordinates[0]])
      allPoints.push([userLoc.lat, userLoc.lng])
      if (allPoints.length > 0) {
        const group = L.featureGroup(allPoints.map(p => L.marker(p)))
        map.fitBounds(group.getBounds().pad(0.2))
      }
    }
  }, [map, hospitals, userLoc])
  return null
}

export const Hospitals = () => {
  const navigate = useNavigate()
  const { latitude, longitude } = useGeolocation()
  const [search, setSearch] = useState('')
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    getHospitals()
      .then(setHospitals)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const userLoc = latitude && longitude ? { lat: latitude, lng: longitude } : null

  const withDistance = useMemo(() => {
    return hospitals.map(h => {
      const d = h.location?.coordinates && userLoc
        ? distanceKm(userLoc.lat, userLoc.lng, h.location.coordinates[1], h.location.coordinates[0])
        : null
      return { ...h, distance: d }
    })
  }, [hospitals, userLoc])

  const sorted = useMemo(() => {
    return [...withDistance].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
  }, [withDistance])

  const filtered = sorted.filter(h =>
    !search || h.name?.toLowerCase().includes(search.toLowerCase()) || h.address?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-screen w-full bg-secondary dark:bg-dark-bg">
      {/* Top Bar */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-mid" size={18} />
          <input
            type="text"
            placeholder="Search hospitals..."
            className="w-full bg-white dark:bg-gray-900 border border-neutral-light dark:border-gray-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary text-neutral-dark dark:text-white text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowMap(!showMap)}
          className={cn(
            "w-12 h-12 rounded-xl border flex items-center justify-center transition-colors shrink-0",
            showMap
              ? "bg-primary border-primary text-white"
              : "bg-white dark:bg-gray-900 border-neutral-light dark:border-gray-800 text-neutral-mid"
          )}
        >
          {showMap ? <List size={20} /> : <Map size={20} />}
        </button>
      </div>

      {userLoc && (
        <div className="px-4 pb-3 flex items-center gap-2 text-xs text-neutral-mid">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
          <span>
            {userLoc.lat.toFixed(4)}, {userLoc.lng.toFixed(4)}
            {filtered.length > 0 && filtered[0].distance != null && ` — Nearest: ${filtered[0].distance} km`}
          </span>
        </div>
      )}

      {!userLoc && (
        <div className="px-4 pb-3 flex items-center gap-2 text-xs text-accent">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
          <span>Acquiring GPS location...</span>
        </div>
      )}

      {/* Map View */}
      {showMap && (
        <div className="h-[50vh] w-full border-b border-neutral-light dark:border-gray-800 relative z-0">
          {loading ? (
            <div className="flex items-center justify-center h-full text-neutral-mid">Loading...</div>
          ) : (
            <MapContainer
              center={userLoc || (filtered[0]?.location?.coordinates ? [filtered[0].location.coordinates[1], filtered[0].location.coordinates[0]] : [13.0827, 80.2707])}
              zoom={12}
              scrollWheelZoom={true}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {userLoc && <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
                <Popup>You are here</Popup>
              </Marker>}
              {filtered.map(h => h.location?.coordinates && (
                <Marker
                  key={h.id}
                  position={[h.location.coordinates[1], h.location.coordinates[0]]}
                  icon={hospitalIcon}
                >
                  <Popup>
                    <div className="flex flex-col gap-1 min-w-[160px]">
                      <strong className="text-sm">{h.name}</strong>
                      <span className="text-xs text-neutral-mid">{h.address}</span>
                      {h.distance != null && <span className="text-xs font-semibold text-primary">{h.distance} km away</span>}
                      <button
                        className="mt-1 text-xs font-semibold text-primary hover:underline text-left"
                        onClick={() => navigate(`/hospital/${h.id}`)}
                      >
                        View Details →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {userLoc && filtered.map(h => h.location?.coordinates && (
                <Polyline
                  key={`route-${h.id}`}
                  positions={[[userLoc.lat, userLoc.lng], [h.location.coordinates[1], h.location.coordinates[0]]]}
                  color="#3B82F6"
                  weight={2}
                  opacity={0.3}
                  dashArray="6, 8"
                />
              ))}
              <MapBounds hospitals={filtered} userLoc={userLoc} />
            </MapContainer>
          )}
        </div>
      )}

      {/* List View */}
      <div className="flex flex-col gap-4 p-4 pt-3">
        {loading ? (
          <div className="text-center py-8 text-neutral-mid">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-neutral-mid font-medium">No hospitals found</div>
        ) : filtered.map(hospital => (
          <Card key={hospital.id} className="flex flex-col p-4 gap-3 interactive cursor-pointer" onClick={() => navigate(`/hospital/${hospital.id}`)}>
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <h3 className="font-bold text-lg text-neutral-dark dark:text-white leading-tight">{hospital.name}</h3>
                <span className="text-xs font-medium text-neutral-mid mt-0.5">{hospital.type || 'Hospital'}</span>
              </div>
              <Badge variant="status" status={hospital.distance != null && hospital.distance <= 5 ? 'completed' : hospital.distance != null && hospital.distance <= 15 ? 'in_progress' : 'searching'}>
                {hospital.distance != null ? `${hospital.distance} km` : 'N/A'}
              </Badge>
            </div>

            <div className="flex items-start gap-1 text-sm text-neutral-mid">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              <span>{hospital.address || 'Address not available'}</span>
            </div>

            <div className="flex gap-3 mt-2">
              {hospital.phone && (
                <a href={`tel:${hospital.phone}`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full flex gap-2 h-10">
                    <Phone size={16} /> Call
                  </Button>
                </a>
              )}
              {(() => {
                const url = mapsUrl(hospital, userLoc)
                return url ? (
                  <Button size="sm" className="flex-1 flex gap-2 h-10 bg-success hover:bg-emerald-600 text-white" onClick={(e) => { e.stopPropagation(); window.open(url, '_blank') }}>
                    <Navigation size={16} /> Navigate
                  </Button>
                ) : null
              })()}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
