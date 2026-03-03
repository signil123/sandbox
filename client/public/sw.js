// File: client/public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  if (!event) return

  let data = {}
  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data = { title: 'New message', body: event.data.text() }
    }
  }

  const showPushNotification = async () => {
    const targetConversationId = data.conversationId || null
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })

    // Skip noisy notifications when the user is already focused on the same conversation.
    const focusedOnSameConversation = clientList.some((client) => {
      if (!client.focused || !targetConversationId) return false
      try {
        const url = new URL(client.url)
        return url.pathname.includes('/inbox') && url.searchParams.get('conversationId') === targetConversationId
      } catch {
        return false
      }
    })
    if (focusedOnSameConversation) return

    const title = data.title || 'New message'
    const options = {
      body: data.body || 'You have a new message.',
      icon: data.icon || '/logo.png',
      badge: '/logo.png',
      tag: data.tag || data.conversationId || 'message',
      renotify: true,
      data: {
        url: data.url || '/inbox',
      },
    }

    await self.registration.showNotification(title, options)
  }

  event.waitUntil(showPushNotification())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification?.data?.url || '/inbox'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const absoluteTargetUrl = new URL(targetUrl, self.location.origin).href
      for (const client of clientList) {
        if ((client.url === absoluteTargetUrl || client.url.includes(targetUrl)) && 'focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(absoluteTargetUrl)
    })
  )
})
