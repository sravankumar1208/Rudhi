import { useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '../ui/Button'
import { MapPin } from 'lucide-react'

// Fix Leaflet's default icon issue in React
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const LocationMarker = ({ position, setPosition, onLocationSelected }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng)
      if (onLocationSelected) onLocationSelected(e.latlng)
    },
  })

  return position === null ? null : (
    <Marker position={position} />
  )
}

export const MapPicker = ({ defaultLocation, onLocationChange }) => {
  const [position, setPosition] = useState(defaultLocation || { lat: 20.5937, lng: 78.9629 })
  const [isLocating, setIsLocating] = useState(false)
  const mapRef = useRef(null)

  const handleGetCurrentLocation = () => {
    setIsLocating(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          const newPos = { lat: latitude, lng: longitude }
          setPosition(newPos)
          if (onLocationChange) onLocationChange(newPos)
          setIsLocating(false)
          
          if (mapRef.current) {
            mapRef.current.flyTo(newPos, 14)
          }
        },
        () => {
          setIsLocating(false)
          alert('Could not get your location. Please check permissions.')
        }
      )
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="h-[240px] w-full rounded-xl overflow-hidden border border-neutral-light dark:border-gray-700 relative z-0">
        <MapContainer 
          center={position} 
          zoom={5} 
          scrollWheelZoom={true} 
          className="h-full w-full"
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker 
            position={position} 
            setPosition={(pos) => {
              setPosition(pos)
              if (onLocationChange) onLocationChange(pos)
            }} 
          />
        </MapContainer>
      </div>
      <Button 
        type="button" 
        variant="secondary" 
        onClick={handleGetCurrentLocation}
        isLoading={isLocating}
        className="w-full flex items-center justify-center gap-2"
      >
        <MapPin size={18} />
        Use My Current Location
      </Button>
    </div>
  )
}
