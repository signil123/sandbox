// File: client/src/services/pushService.js
import axiosInstance from '../config'

const STORAGE_KEY = 'messageNotificationsEnabled'
const EVENT_NAME = 'message-notifications-updated'

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const isSupported = () =>
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window

const getPermission = () => (typeof Notification !== 'undefined' ? Notification.permission : 'default')

const getEnabled = () => localStorage.getItem(STORAGE_KEY) === 'true'

const setEnabled = (enabled) => {
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false')
  window.dispatchEvent(new Event(EVENT_NAME))
}

const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return null
  const existing = await navigator.serviceWorker.getRegistration()
  if (existing) return existing
  return navigator.serviceWorker.register('/sw.js')
}

const getPublicKey = async () => {
  const res = await axiosInstance.get('/push/public-key')
  return res?.data?.publicKey
}

const subscribe = async () => {
  if (!isSupported()) return { ok: false, reason: 'unsupported' }

  let permission = getPermission()
  if (permission === 'denied') return { ok: false, reason: 'denied' }
  if (permission === 'default') {
    permission = await Notification.requestPermission()
  }
  if (permission !== 'granted') return { ok: false, reason: permission }

  const registration = await registerServiceWorker()
  if (!registration) return { ok: false, reason: 'no_sw' }

  const publicKey = await getPublicKey()
  if (!publicKey) return { ok: false, reason: 'no_key' }

  const existing = await registration.pushManager.getSubscription()
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }))

  await axiosInstance.post('/push/subscribe', {
    subscription,
    userAgent: navigator.userAgent,
  })

  setEnabled(true)
  return { ok: true }
}

const unsubscribe = async () => {
  if (!isSupported()) {
    setEnabled(false)
    return { ok: true }
  }

  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager?.getSubscription()
  if (subscription) {
    await axiosInstance.post('/push/unsubscribe', {
      endpoint: subscription.endpoint,
    })
    await subscription.unsubscribe()
  }

  setEnabled(false)
  return { ok: true }
}

export const pushService = {
  isSupported,
  getPermission,
  getEnabled,
  setEnabled,
  subscribe,
  unsubscribe,
}
