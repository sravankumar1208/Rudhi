import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const hospitalIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmZmZmZiIgc3Ryb2tlPSIjZWY0NDQ0IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIxIDEwYy0uMDAxLTctOS0xMy05LTEzczktNiA5LTEzYTkgOSAwIDAgMSAxOCAwem0tOSAzdi02bS0zIDNoNiIvPjwvc3ZnPg==',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
})

const donorIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2MwMTUyYSIgc3Ryb2tlPSIjYzAxNTJhIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIuNjlsNS42NiA1LjY2YTggOCAxMCAxIDEtMTEuMzEgMHptMCAwdjkiLz48L3N2Zz4=',
  iconSize: [28, 28],
  iconAnchor: [14, 28]
})

const receiverIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2YwOTkwMCIgc3Ryb2tlPSIjZjA5OTAwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTUuNSAyMC41aDEzbS03LTlhNSA1IDAgMCAwIDAtMTAgMCAwIDAgMCAwIDEweiIvPjwvc3ZnPg==',
  iconSize: [28, 28],
  iconAnchor: [14, 28]
})

const FitBounds = ({ points }) => {
  const map = useMap()
  useEffect(() => {
    if (points && points.length > 0) {
      const group = L.featureGroup(points.map(p => L.marker(p)))
      map.fitBounds(group.getBounds().pad(0.3))
    }
  }, [map, points])
  return null
}

export const LiveMap = ({ hospitalLocation, donorLocation, receiverLocation, routeCoordinates }) => {
  const center = donorLocation || hospitalLocation || { lat: 20.5937, lng: 78.9629 }

  const allPoints = [
    ...(donorLocation ? [[donorLocation.lat, donorLocation.lng]] : []),
    ...(hospitalLocation ? [[hospitalLocation.lat, hospitalLocation.lng]] : []),
    ...(receiverLocation ? [[receiverLocation.lat, receiverLocation.lng]] : []),
  ]

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {hospitalLocation && (
          <Marker position={hospitalLocation} icon={hospitalIcon} />
        )}
        
        {donorLocation && (
          <Marker position={donorLocation} icon={donorIcon} />
        )}

        {receiverLocation && (
          <Marker position={receiverLocation} icon={receiverIcon} />
        )}

        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline 
            positions={routeCoordinates} 
            color="#3B82F6" 
            weight={4}
            opacity={0.8}
            dashArray="10, 10"
          />
        )}

        <FitBounds points={allPoints} />
      </MapContainer>
    </div>
  )
}
