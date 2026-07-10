import { useState, useEffect, useRef } from 'react'

export const useGeolocation = ({ enableHighAccuracy = true, timeout = 10000, maximumAge = 300000 } = {}) => {
  const geolocationSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator
  const watchId = useRef(null)

  const [state, setState] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: geolocationSupported ? null : 'Geolocation not supported',
    loading: geolocationSupported,
  })

  useEffect(() => {
    if (!geolocationSupported) return

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
        })
      },
      (error) => {
        setState((s) => ({ ...s, error: error.message, loading: false }))
      },
      { enableHighAccuracy, timeout, maximumAge }
    )

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [geolocationSupported, enableHighAccuracy, timeout, maximumAge])

  return { ...state, refresh: () => window.location.reload() }
}