// BarberOS Production Service Worker for Web Push & Notifications
/* eslint-disable no-restricted-globals */

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload = {}
  try {
    payload = event.data.json()
  } catch (e) {
    payload = {
      title: 'BarberOS',
      body: event.data.text() || 'Tienes una nueva notificación.',
    }
  }

  const title = payload.title || 'BarberOS'
  const options = {
    body: payload.body || 'Nueva actualización en tu barbería.',
    icon: payload.icon || '/icon.png',
    badge: payload.badge || '/favicon.png',
    tag: payload.tag || `barberos-${Date.now()}`,
    data: payload.data || { url: '/appointments' },
    vibrate: [200, 100, 200],
    renotify: true,
    requireInteraction: false,
    actions: payload.actions || [
      { action: 'open', title: 'Ver Detalles' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/appointments'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open with the application, focus and navigate it
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus()
          if ('navigate' in client && targetUrl) {
            return client.navigate(targetUrl)
          }
          return client
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
