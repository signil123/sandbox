// File: client/src/services/socketService.js
import { io } from 'socket.io-client'

let socket

export const socketService = {
  connect: (token) => {
    if (socket) return socket

    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '/'
    socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      console.log('Connected to socket server with ID:', socket.id)
    })

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message)
    })

    return socket
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  },

  getSocket: () => socket,

  // Handlers
  joinConversation: (conversationId) => {
    if (socket) {
      console.log('SocketService: Joining room', conversationId)
      socket.emit('join_conversation', conversationId)
    } else {
      console.warn('SocketService: joinConversation called but socket is null')
    }
  },

  leaveConversation: (conversationId) => {
    if (socket) {
      console.log('SocketService: Leaving room', conversationId)
      socket.emit('leave_conversation', conversationId)
    }
  },

  sendTyping: (conversationId, isTyping) => {
    if (socket) socket.emit('typing', { conversationId, isTyping })
  },
}
