// File: server/socket.js
import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import User from './models/User.js'

let io

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin:
        process.env.NODE_ENV === 'production'
          ? process.env.FRONTEND_URL || 'https://signilai.com/'
          : ['http://localhost:5173', 'http://localhost:5174'],
      credentials: true,
    },
  })

  // Auth middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.token
      if (!token) return next(new Error('Authentication error'))

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id)
      if (!user) return next(new Error('User not found'))

      socket.user = user
      next()
    } catch (err) {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket) => {
    // Update user status
    socket.user.status = 'online'
    socket.user.lastSeen = new Date()
    socket.user.save().then(() => {
      io.emit('presence_update', {
        userId: socket.user._id,
        status: 'online',
      })
    })

    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId)
    })

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId)
    })

    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit('typing_update', {
        userId: socket.user._id,
        isTyping,
      })
    })

    socket.on('disconnect', async () => {
      if (socket.user) {
        socket.user.status = 'offline'
        socket.user.lastSeen = new Date()
        await socket.user.save()
        io.emit('presence_update', {
          userId: socket.user._id,
          status: 'offline',
          lastSeen: socket.user.lastSeen,
        })
      }
    })
  })

  return io
}

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized')
  }
  return io
}
