import { useState, useEffect } from 'react'
import { useUIStore } from '../store'

export const useOnlineStatus = () => {
  const [online, setOnline] = useState(navigator.onLine)
  const setOffline = useUIStore((s) => s.setOffline)

  useEffect(() => {
    const handleOnline = () => { setOnline(true); setOffline(false) }
    const handleOffline = () => { setOnline(false); setOffline(true) }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOffline])

  return online
}
