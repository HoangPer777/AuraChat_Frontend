import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

let stompClient = null

export function connectWebSocket(onConnected, onDisconnected) {
  stompClient = new Client({
    webSocketFactory: () => new SockJS('/ws'),
    onConnect: onConnected,
    onDisconnect: onDisconnected,
    reconnectDelay: 5000,
  })
  stompClient.activate()
  return stompClient
}

export function disconnectWebSocket() {
  stompClient?.deactivate()
}

export function getStompClient() {
  return stompClient
}
