// File: server/socket.js
import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import User from './models/User.js'

let io
const userSocketCounts = new Map()

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
    // Join user-specific room for receiving personal notifications (e.g., event invitations)
    const userId = socket.user._id.toString()
    socket.join(userId)

    const nextCount = (userSocketCounts.get(userId) || 0) + 1
    userSocketCounts.set(userId, nextCount)

    if (nextCount === 1) {
      User.findByIdAndUpdate(
        userId,
        { status: 'online', lastSeen: new Date() },
        { new: true, select: 'status lastSeen settings' }
      ).then((user) => {
        if (!user) return
        io.emit('presence_update', {
          userId: user._id,
          status: 'online',
          lastSeen: user.settings?.showLastSeen ? user.lastSeen : null,
        })
      }).catch((error) => {
        console.warn('Socket online presence update failed:', error.message)
      })
    }

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
        const disconnectedUserId = socket.user._id.toString()
        const remainingCount = Math.max((userSocketCounts.get(disconnectedUserId) || 1) - 1, 0)

        if (remainingCount === 0) {
          userSocketCounts.delete(disconnectedUserId)
          // Mark offline only when user has no active sockets left (multi-tab safe).
          const updatedUser = await User.findByIdAndUpdate(
            disconnectedUserId,
            { status: 'offline', lastSeen: new Date() },
            { new: true, select: 'status lastSeen settings' }
          )

          if (updatedUser) {
            io.emit('presence_update', {
              userId: updatedUser._id,
              status: 'offline',
              lastSeen: updatedUser.settings?.showLastSeen ? updatedUser.lastSeen : null,
            })
          }
        } else {
          userSocketCounts.set(disconnectedUserId, remainingCount)
        }
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
