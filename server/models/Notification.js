// File: server/models/Notification.js
import mongoose from 'mongoose'

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: [
        'connection_request',
        'connection_accepted',
        'message',
        'event_invitation',
        'event_reminder',
        'profile_verified',
        'nil_opportunity',
        'mention',
        'comment',
        'system',
        'profile_view',
        'security_update',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: [
          'connection_request',
          'message',
          'event',
          'opportunity',
          'user',
          'profile',
        ],
      },
      entityId: mongoose.Schema.Types.ObjectId,
    },
    actionUrl: String,
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
NotificationSchema.index({ recipient: 1, isRead: 1 })
NotificationSchema.index({ recipient: 1, createdAt: -1 })
NotificationSchema.index({ type: 1 })
NotificationSchema.index({ priority: 1 })
NotificationSchema.index({ createdAt: -1 })

// Query middleware to exclude deleted notifications
NotificationSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } })
  next()
})

// Instance Methods
NotificationSchema.methods.markAsRead = async function () {
  this.isRead = true
  this.readAt = new Date()
  return await this.save()
}

NotificationSchema.methods.delete = async function () {
  this.isDeleted = true
  return await this.save()
}

// Static Methods
NotificationSchema.statics.createNotification = async function (data) {
  try {
    const notification = await this.create({
      recipient: data.recipient,
      sender: data.sender || null,
      type: data.type,
      title: data.title,
      description: data.description,
      relatedEntity: data.relatedEntity || null,
      actionUrl: data.actionUrl,
      priority: data.priority || 'medium',
    })
    return notification
  } catch (error) {
    throw error
  }
}

NotificationSchema.statics.getUserNotifications = function (userId, limit = 20, skip = 0) {
  return this.find({ recipient: userId })
    .populate('sender', 'name profileImage')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
}

NotificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
  })
}

NotificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  )
}

// Virtuals
NotificationSchema.virtual('timeAgo').get(function () {
  const now = new Date()
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000)

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
})

export default mongoose.model('Notification', NotificationSchema)
