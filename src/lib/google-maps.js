export const isGoogleMapsConfigured = () => {
  return !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY
}

export const loadGoogleMapsScript = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.warn('Google Maps API key not configured')
    return null
  }

  if (window.google?.maps) return Promise.resolve(window.google.maps)

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com/maps/api/js"]`
    )
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google.maps))
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google.maps)
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })
}

export const getPlaceDetails = async (placeId) => {
  try {
    const maps = await loadGoogleMapsScript()
    if (!maps) return null

    const service = new maps.places.PlacesService(document.createElement('div'))
    return new Promise((resolve, reject) => {
      service.getDetails({ placeId, fields: ['name', 'formatted_address', 'geometry', 'formatted_phone_number', 'photos', 'rating'] }, (result, status) => {
        if (status === maps.places.PlacesServiceStatus.OK) resolve(result)
        else reject(new Error(`Places API error: ${status}`))
      })
    })
  } catch (err) {
    console.error('getPlaceDetails error:', err)
    return null
  }
}

export const geocodeAddress = async (address) => {
  try {
    const maps = await loadGoogleMapsScript()
    if (!maps) return null

    const geocoder = new maps.Geocoder()
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === maps.GeocoderStatus.OK) {
          const { lat, lng } = results[0].geometry.location
          resolve({ lat: lat(), lng: lng(), formattedAddress: results[0].formatted_address })
        } else reject(new Error(`Geocode error: ${status}`))
      })
    })
  } catch (err) {
    console.error('geocodeAddress error:', err)
    return null
  }
}

export const getDistanceMatrix = async (origins, destinations) => {
  try {
    const maps = await loadGoogleMapsScript()
    if (!maps) return null

    const service = new maps.DistanceMatrixService()
    return new Promise((resolve, reject) => {
      service.getDistanceMatrix(
        { origins, destinations, travelMode: maps.TravelMode.DRIVING, unitSystem: maps.UnitSystem.METRIC },
        (response, status) => {
          if (status === maps.DistanceMatrixStatus.OK) resolve(response)
          else reject(new Error(`Distance Matrix error: ${status}`))
        }
      )
    })
  } catch (err) {
    console.error('getDistanceMatrix error:', err)
    return null
  }
}
