// File: client/src/services/pushService.js
import axiosInstance from '../config'

const MESSAGE_STORAGE_KEY = 'messageNotificationsEnabled'
const PANEL_STORAGE_KEY = 'panelNotificationsEnabled'
const LEGACY_PANEL_STORAGE_KEY = 'inAppNotificationsEnabled'
const MESSAGE_EVENT_NAME = 'message-notifications-updated'
const PANEL_EVENT_NAME = 'panel-notifications-updated'

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

const getMessageNotificationsEnabled = () => localStorage.getItem(MESSAGE_STORAGE_KEY) === 'true'

const setMessageNotificationsEnabled = (enabled) => {
  localStorage.setItem(MESSAGE_STORAGE_KEY, enabled ? 'true' : 'false')
  window.dispatchEvent(new Event(MESSAGE_EVENT_NAME))
}

const getPanelNotificationsEnabled = () => {
  const next = localStorage.getItem(PANEL_STORAGE_KEY)
  if (next === null) {
    const legacy = localStorage.getItem(LEGACY_PANEL_STORAGE_KEY)
    if (legacy !== null) return legacy === 'true'
    return true
  }
  return next === 'true'
}

const setPanelNotificationsEnabled = (enabled) => {
  const serialized = enabled ? 'true' : 'false'
  localStorage.setItem(PANEL_STORAGE_KEY, serialized)
  // Keep legacy key synchronized for backward compatibility.
  localStorage.setItem(LEGACY_PANEL_STORAGE_KEY, serialized)
  window.dispatchEvent(new Event(PANEL_EVENT_NAME))
  window.dispatchEvent(new Event('in-app-notifications-updated'))
}

const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return null

  const existing = await navigator.serviceWorker.getRegistration('/')
  if (existing) {
    existing.update().catch(() => {})
    await navigator.serviceWorker.ready
    return existing
  }

  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  registration.update().catch(() => {})
  await navigator.serviceWorker.ready
  return registration
}

const getPublicKey = async () => {
  try {
    const res = await axiosInstance.get('/push/public-key')
    return res?.data?.publicKey || null
  } catch {
    return null
  }
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

  let existing = await registration.pushManager.getSubscription()
  let subscription = existing

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  await axiosInstance.post('/push/subscribe', {
    subscription,
    userAgent: navigator.userAgent,
  })

  setMessageNotificationsEnabled(true)
  return { ok: true }
}

const syncEnabledSubscription = async () => {
  if (!isSupported()) return { ok: false, reason: 'unsupported' }
  if (!getMessageNotificationsEnabled()) return { ok: false, reason: 'disabled' }

  const permission = getPermission()
  if (permission !== 'granted') return { ok: false, reason: permission }

  const registration = await registerServiceWorker()
  if (!registration) return { ok: false, reason: 'no_sw' }

  const publicKey = await getPublicKey()
  if (!publicKey) return { ok: false, reason: 'no_key' }

  let subscription = await registration.pushManager.getSubscription()

  try {
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
    }
  } catch {
    // Recover from stale/incompatible browser subscriptions by recreating.
    const stale = await registration.pushManager.getSubscription()
    if (stale) {
      try {
        await stale.unsubscribe()
      } catch {}
    }
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  await axiosInstance.post('/push/subscribe', {
    subscription,
    userAgent: navigator.userAgent,
  })

  setMessageNotificationsEnabled(true)
  return { ok: true }
}

const unsubscribe = async () => {
  if (!isSupported()) {
    setMessageNotificationsEnabled(false)
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

  setMessageNotificationsEnabled(false)
  return { ok: true }
}

const getFailureMessage = (reason) => {
  switch (reason) {
    case 'denied':
      return 'Notifications are blocked in your browser settings.'
    case 'no_key':
      return 'Push public key is unavailable from server.'
    case 'no_sw':
      return 'Service worker is not available.'
    case 'unsupported':
      return 'This browser does not support push notifications.'
    case 'permission':
      return 'Notification permission is not granted yet.'
    case 'default':
      return 'Please allow notifications in the browser prompt.'
    default:
      return 'Could not enable notifications.'
  }
}

export const pushService = {
  isSupported,
  getPermission,
  ensureServiceWorker: registerServiceWorker,
  getMessageNotificationsEnabled,
  setMessageNotificationsEnabled,
  getPanelNotificationsEnabled,
  setPanelNotificationsEnabled,
  // Backward compatible aliases.
  getEnabled: getMessageNotificationsEnabled,
  setEnabled: setMessageNotificationsEnabled,
  subscribe,
  syncEnabledSubscription,
  unsubscribe,
  getFailureMessage,
  keys: {
    MESSAGE_STORAGE_KEY,
    PANEL_STORAGE_KEY,
    LEGACY_PANEL_STORAGE_KEY,
  },
  events: {
    MESSAGE_EVENT_NAME,
    PANEL_EVENT_NAME,
  },
}
