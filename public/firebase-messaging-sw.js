/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyBNx62tJiEdbtmnsXf2NaXC3W2UIeoPvw0',
  authDomain: 'aura-chat-633d9.firebaseapp.com',
  projectId: 'aura-chat-633d9',
  storageBucket: 'aura-chat-633d9.firebasestorage.app',
  messagingSenderId: '872405129346',
  appId: '1:872405129346:web:b27390c38e8284a955fc9b',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'AuraChat'
  const options = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: payload.notification?.icon || '/favicon.ico',
    data: payload.data || {},
  }

  self.registration.showNotification(title, options)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const route = event.notification.data?.route || '/notifications'
  event.waitUntil(clients.openWindow(route))
})
