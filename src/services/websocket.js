import { Client } from '@stomp/stompjs'

/**
 * WebSocket Service with STOMP client
 * Manages WebSocket connection lifecycle, reconnection with exponential backoff,
 * and event subscription mechanism
 *
 * Dùng native WebSocket thay SockJS để tương thích với wss:// khi deploy HTTPS.
 * BE phải có native endpoint (không withSockJS()) để accept kết nối này.
 */

let stompClient = null
let subscriptions = new Map()
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5
const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 16000, 32000] // 1s, 2s, 4s, 8s, 16s, 32s
let connectionState = 'disconnected' // 'disconnected', 'connecting', 'connected'
let onConnectionStateChange = null

/**
 * Initialize and connect to WebSocket server
 * @param {Function} onConnected - Callback when connection is established
 * @param {Function} onDisconnected - Callback when connection is closed
 * @param {Function} onError - Callback when connection error occurs
 * @returns {Promise<Client>} STOMP client instance
 */
export async function connect(onConnected, onDisconnected, onError) {
  return new Promise((resolve, reject) => {
    if (stompClient && stompClient.active) {
      resolve(stompClient)
      return
    }

    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      const error = new Error('No access token available')
      onError?.(error)
      reject(error)
      return
    }

    setConnectionState('connecting')

    stompClient = new Client({
      // Tự động dùng wss:// khi trang chạy HTTPS, ws:// khi HTTP
      brokerURL: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      onConnect: (frame) => {
        setConnectionState('connected')
        reconnectAttempts = 0
        onConnected?.(frame)
        resolve(stompClient)
      },
      onDisconnect: (frame) => {
        setConnectionState('disconnected')
        onDisconnected?.(frame)
      },
      onStompError: (frame) => {
        const error = new Error(`STOMP error: ${frame.body}`)
        setConnectionState('disconnected')
        onError?.(error)
        reject(error)
      },
      onWebSocketError: (error) => {
        setConnectionState('disconnected')
        onError?.(error)
        reject(error)
      },
      // Disable automatic reconnection - we'll handle it manually with exponential backoff
      reconnectDelay: 0,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    })

    stompClient.activate()
  })
}

/**
 * Disconnect from WebSocket server
 * @returns {Promise<void>}
 */
export async function disconnect() {
  return new Promise((resolve) => {
    if (!stompClient || !stompClient.active) {
      setConnectionState('disconnected')
      resolve()
      return
    }

    stompClient.deactivate({
      onDisconnect: () => {
        setConnectionState('disconnected')
        subscriptions.clear()
        resolve()
      },
    })
  })
}

/**
 * Reconnect to WebSocket server with exponential backoff
 * @param {Function} onConnected - Callback when connection is established
 * @param {Function} onDisconnected - Callback when connection is closed
 * @param {Function} onError - Callback when connection error occurs
 * @returns {Promise<Client|null>} STOMP client instance or null if max attempts reached
 */
export async function reconnect(onConnected, onDisconnected, onError) {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    const error = new Error(
      `Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`
    )
    onError?.(error)
    return null
  }

  const delay = BACKOFF_DELAYS[reconnectAttempts]
  reconnectAttempts++

  console.log(
    `Reconnecting... Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} (delay: ${delay}ms)`
  )

  await new Promise((resolve) => setTimeout(resolve, delay))

  try {
    const client = await connect(onConnected, onDisconnected, onError)
    return client
  } catch (error) {
    console.error('Reconnection failed:', error)
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      return reconnect(onConnected, onDisconnected, onError)
    }
    return null
  }
}

/**
 * Subscribe to a destination (topic or queue)
 * @param {string} destination - STOMP destination (e.g., '/topic/messages', '/queue/notifications')
 * @param {Function} callback - Callback function to handle received messages
 * @returns {Object} Subscription object with unsubscribe method
 */
export function subscribe(destination, callback) {
  if (!stompClient || !stompClient.active) {
    console.warn('WebSocket not connected. Cannot subscribe to', destination)
    return null
  }

  // Check if already subscribed to this destination
  if (subscriptions.has(destination)) {
    console.warn(`Already subscribed to ${destination}`)
    return subscriptions.get(destination)
  }

  const subscription = stompClient.subscribe(destination, (message) => {
    try {
      const body = JSON.parse(message.body)
      callback(body)
    } catch (error) {
      // If body is not JSON, pass raw body
      callback(message.body)
    }
  })

  subscriptions.set(destination, subscription)
  console.log(`Subscribed to ${destination}`)

  return subscription
}

/**
 * Unsubscribe from a destination
 * @param {string} destination - STOMP destination to unsubscribe from
 * @returns {boolean} True if unsubscribed, false if not subscribed
 */
export function unsubscribe(destination) {
  const subscription = subscriptions.get(destination)
  if (!subscription) {
    console.warn(`Not subscribed to ${destination}`)
    return false
  }

  subscription.unsubscribe()
  subscriptions.delete(destination)
  console.log(`Unsubscribed from ${destination}`)

  return true
}

/**
 * Unsubscribe from all destinations
 */
export function unsubscribeAll() {
  subscriptions.forEach((subscription, destination) => {
    subscription.unsubscribe()
    console.log(`Unsubscribed from ${destination}`)
  })
  subscriptions.clear()
}

/**
 * Send a message to a destination
 * @param {string} destination - STOMP destination (e.g., '/app/chat.send')
 * @param {Object} body - Message body (will be JSON stringified)
 * @param {Object} headers - Optional STOMP headers
 */
export function send(destination, body, headers = {}) {
  if (!stompClient || !stompClient.active) {
    console.error('WebSocket not connected. Cannot send message to', destination)
    return false
  }

  try {
    stompClient.publish({
      destination,
      body: JSON.stringify(body),
      headers,
    })
    return true
  } catch (error) {
    console.error('Failed to send message:', error)
    return false
  }
}

/**
 * Get current connection state
 * @returns {string} Connection state: 'disconnected', 'connecting', or 'connected'
 */
export function getConnectionState() {
  return connectionState
}

/**
 * Check if WebSocket is connected
 * @returns {boolean} True if connected, false otherwise
 */
export function isConnected() {
  return connectionState === 'connected' && stompClient?.active
}

/**
 * Get STOMP client instance
 * @returns {Client|null} STOMP client or null if not initialized
 */
export function getStompClient() {
  return stompClient
}

/**
 * Get number of active subscriptions
 * @returns {number} Number of subscriptions
 */
export function getSubscriptionCount() {
  return subscriptions.size
}

/**
 * Get list of subscribed destinations
 * @returns {Array<string>} Array of destination strings
 */
export function getSubscribedDestinations() {
  return Array.from(subscriptions.keys())
}

/**
 * Set connection state change callback
 * @param {Function} callback - Callback function that receives new state
 */
export function onConnectionStateChanged(callback) {
  onConnectionStateChange = callback
}

/**
 * Internal function to update connection state and notify listeners
 * @private
 */
function setConnectionState(newState) {
  if (connectionState !== newState) {
    connectionState = newState
    onConnectionStateChange?.(newState)
  }
}
