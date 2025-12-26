// File: server/models/Message.js
import mongoose from 'mongoose'

// Message Schema
const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: [
      {
        type: String, // URL or file path
        name: String,
        mimeType: String,
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
  },
  {
    timestamps: true,
  }
)

// Conversation Schema
const ConversationSchema = new mongoose.Schema(
  {
    participant1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participant2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageAt: Date,
    isArchived: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes for Message
MessageSchema.index({ conversation: 1, createdAt: -1 })
MessageSchema.index({ sender: 1 })
MessageSchema.index({ isRead: 1 })
MessageSchema.index({ createdAt: -1 })

// Indexes for Conversation
ConversationSchema.index({ participant1: 1, participant2: 1 }, { unique: true })
ConversationSchema.index({ participant1: 1 })
ConversationSchema.index({ participant2: 1 })
ConversationSchema.index({ lastMessageAt: -1 })

// Pre-save middleware for Conversation
ConversationSchema.pre('save', async function (next) {
  if (this.participant1.toString() === this.participant2.toString()) {
    throw new Error('Cannot create conversation with yourself')
  }
  next()
})

// Conversation Methods
ConversationSchema.methods.getOtherParticipant = function (userId) {
  if (userId.toString() === this.participant1.toString()) {
    return this.participant2
  }
  if (userId.toString() === this.participant2.toString()) {
    return this.participant1
  }
  throw new Error('User is not part of this conversation')
}

ConversationSchema.methods.archiveFor = function (userId) {
  if (!this.participant1.equals(userId) && !this.participant2.equals(userId)) {
    throw new Error('User is not part of this conversation')
  }
  this.isArchived = true
  return this.save()
}

ConversationSchema.methods.unreadMessageCount = function (userId) {
  return mongoose.models.Message.countDocuments({
    conversation: this._id,
    sender: { $ne: userId },
    isRead: false,
  })
}

ConversationSchema.methods.markAllMessagesAsRead = function (userId) {
  return mongoose.models.Message.updateMany(
    {
      conversation: this._id,
      sender: { $ne: userId },
      isRead: false,
    },
    {
      $set: { isRead: true, readAt: new Date() },
    }
  )
}

ConversationSchema.methods.blockUser = function (userId, blockedUserId) {
  if (!this.participant1.equals(userId) && !this.participant2.equals(userId)) {
    throw new Error('User is not part of this conversation')
  }
  this.isBlocked = true
  this.blockedBy = userId
  return this.save()
}

// Message Methods
MessageSchema.methods.markAsRead = async function () {
  this.isRead = true
  this.readAt = new Date()
  return await this.save()
}

MessageSchema.methods.edit = async function (newContent) {
  if (this.isDeleted) {
    throw new Error('Cannot edit deleted message')
  }
  this.content = newContent
  this.editedAt = new Date()
  return await this.save()
}

MessageSchema.methods.delete = async function () {
  this.isDeleted = true
  return await this.save()
}

// Virtuals
ConversationSchema.virtual('participants').get(function () {
  return [this.participant1, this.participant2]
})

export const Message = mongoose.model('Message', MessageSchema)
export const Conversation = mongoose.model('Conversation', ConversationSchema)
