import { supabase } from './supabase'

let swRegistration = null

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('Notification API not supported')
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export const registerFCMToken = async () => {
  try {
    if (!('serviceWorker' in navigator)) return null

    swRegistration = await navigator.serviceWorker.ready

    if (!('PushManager' in window)) return null

    const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY
    if (!vapidKey) {
      console.warn('VITE_FCM_VAPID_KEY not set — push notifications disabled')
      return null
    }

    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })

    const token = subscription.toJSON()

    // Persist the subscription token to the user's profile
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ fcm_token: JSON.stringify(token) })
        .eq('id', user.id)
    }

    return token
  } catch (err) {
    console.error('FCM registration failed:', err)
    return null
  }
}

export const unregisterFCMToken = async () => {
  try {
    swRegistration = await navigator.serviceWorker.ready
    const subscription = await swRegistration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ fcm_token: null })
        .eq('id', user.id)
    }
  } catch (err) {
    console.error('FCM unregistration failed:', err)
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}
