// File: server/models/Relationship.js
import mongoose from 'mongoose'

// Connection Request Schema
const ConnectionRequestSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      maxlength: 150,
    },
    matchScore: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
    },
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

// Connection Schema
const ConnectionSchema = new mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'blocked', 'pending'],
      default: 'active',
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    blockedAt: Date,
  },
  {
    timestamps: true,
  }
)

// Indexes for ConnectionRequest
ConnectionRequestSchema.index({ from: 1, to: 1 }, { unique: true })
ConnectionRequestSchema.index({ to: 1, status: 1 })
ConnectionRequestSchema.index({ from: 1, status: 1 })
ConnectionRequestSchema.index({ createdAt: -1 })

// Indexes for Connection
ConnectionSchema.index({ user1: 1, user2: 1 }, { unique: true })
ConnectionSchema.index({ user1: 1, status: 1 })
ConnectionSchema.index({ user2: 1, status: 1 })
ConnectionSchema.index({ connectedAt: -1 })

// Pre-save middleware for ConnectionRequest to ensure from !== to
ConnectionRequestSchema.pre('save', async function (next) {
  if (this.from.toString() === this.to.toString()) {
    throw new Error('Cannot send connection request to yourself')
  }

  // Check if connection already exists
  const existingConnection = await mongoose.models.Connection.findOne({
    $or: [
      { user1: this.from, user2: this.to },
      { user1: this.to, user2: this.from },
    ],
  })

  if (existingConnection) {
    throw new Error('Connection already exists between these users')
  }

  next()
})

// Pre-save middleware for Connection to ensure user1 !== user2
ConnectionSchema.pre('save', async function (next) {
  if (this.user1.toString() === this.user2.toString()) {
    throw new Error('Cannot create connection with yourself')
  }
  next()
})

// Instance methods
ConnectionRequestSchema.methods.accept = async function () {
  if (this.status !== 'pending') {
    throw new Error('Only pending requests can be accepted')
  }

  const connection = await mongoose.models.Connection.create({
    user1: this.from,
    user2: this.to,
    status: 'active',
  })

  this.status = 'accepted'
  this.respondedAt = new Date()
  this.respondedBy = this.to
  await this.save()

  return connection
}

ConnectionRequestSchema.methods.reject = async function () {
  if (this.status !== 'pending') {
    throw new Error('Only pending requests can be rejected')
  }

  this.status = 'rejected'
  this.respondedAt = new Date()
  this.respondedBy = this.to
  await this.save()
}

// Static methods
ConnectionSchema.statics.areConnected = async function (userId1, userId2) {
  const connection = await this.findOne({
    $or: [
      { user1: userId1, user2: userId2, status: 'active' },
      { user1: userId2, user2: userId1, status: 'active' },
    ],
  })

  return !!connection
}

ConnectionSchema.statics.getConnectionStatus = async function (userId1, userId2) {
  const info = await this.getConnectionInfo(userId1, userId2)
  return info.status
}

ConnectionSchema.statics.getConnectionInfo = async function (userId1, userId2) {
  // 1. Check if they are already connected
  const connection = await this.findOne({
    $or: [
      { user1: userId1, user2: userId2, status: 'active' },
      { user1: userId2, user2: userId1, status: 'active' },
    ],
  })

  if (connection) return { status: 'connected' }

  // 2. Check if there's a pending request from userId1 to userId2
  const sentRequest = await mongoose.models.ConnectionRequest.findOne({
    from: userId1,
    to: userId2,
    status: 'pending',
  })

  if (sentRequest) return { status: 'pending', requestId: sentRequest._id }

  // 3. Check if there's a pending request from userId2 to userId1
  const receivedRequest = await mongoose.models.ConnectionRequest.findOne({
    from: userId2,
    to: userId1,
    status: 'pending',
  })

  if (receivedRequest) return { status: 'received', requestId: receivedRequest._id }

  return { status: 'not_connected' }
}

ConnectionSchema.statics.getConnections = function (userId) {
  return this.find({
    $or: [{ user1: userId }, { user2: userId }],
    status: 'active',
  }).populate('user1 user2')
}

ConnectionSchema.statics.blockUser = async function (userId, blockedUserId) {
  const connection = await this.findOne({
    $or: [
      { user1: userId, user2: blockedUserId },
      { user1: blockedUserId, user2: userId },
    ],
  })

  if (connection) {
    connection.status = 'blocked'
    connection.blockedBy = userId
    connection.blockedAt = new Date()
    return await connection.save()
  }

  throw new Error('Connection not found')
}

export const ConnectionRequest = mongoose.model('ConnectionRequest', ConnectionRequestSchema)
export const Connection = mongoose.model('Connection', ConnectionSchema)
