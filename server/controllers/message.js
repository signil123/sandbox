import { createError } from '../error.js'
import { Conversation, Message } from '../models/Message.js'
import Notification from '../models/Notification.js'
import Profile from '../models/Profile.js'
import { Connection, ConnectionRequest } from '../models/Relationship.js'
import User from '../models/User.js'
import { getIO } from '../socket.js'

/**
 * Start a new conversation or get existing one
 */
export const startConversation = async (req, res, next) => {
  try {
    const { recipientId } = req.body
    const senderId = req.user.id

    if (senderId === recipientId) {
      return next(createError(400, 'Cannot start a conversation with yourself'))
    }

    // Check if they are connected
    const areConnected = await Connection.areConnected(senderId, recipientId)
    if (!areConnected) {
      // Check if there's a pending request
      const pendingRequest = await ConnectionRequest.findOne({
        $or: [
          { from: senderId, to: recipientId, status: 'pending' },
          { from: recipientId, to: senderId, status: 'pending' },
        ],
      })

      if (!pendingRequest) {
        return next(
          createError(403, 'You must be connected to start a conversation')
        )
      }
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      $or: [
        { participant1: senderId, participant2: recipientId },
        { participant1: recipientId, participant2: senderId },
      ],
    })

    if (!conversation) {
      conversation = await Conversation.create({
        participant1: senderId,
        participant2: recipientId,
      })
    }

    // Re-fetch with population to ensure UI has names and profile info immediately
    const populatedConv = await Conversation.findById(conversation._id)
      .populate('participant1', 'name email userType status lastSeen settings')
      .populate('participant2', 'name email userType status lastSeen settings')
      .populate('lastMessage')

    const otherUser = populatedConv.participant1._id.toString() === senderId ? populatedConv.participant2 : populatedConv.participant1
    const profile = await Profile.findOne({ user: otherUser._id }).select('profileImage title bannerImage themeId')

    const responseConv = {
      ...populatedConv.toObject(),
      otherUser: {
        ...otherUser.toObject(),
        profileImage: profile?.profileImage,
        title: profile?.title,
        bannerImage: profile?.bannerImage,
        themeId: profile?.themeId,
        status: otherUser.status,
        lastSeen: otherUser.settings?.showLastSeen ? otherUser.lastSeen : null,
      }
    }

    res.status(200).json({
      status: 'success',
      data: { conversation: responseConv },
    })
  } catch (error) {
    console.error('Error in startConversation:', error)
    next(error)
  }
}

/**
 * Send a message
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params
    const { content, attachments } = req.body
    const senderId = req.user.id

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return next(createError(404, 'Conversation not found'))
    }

    // Verify sender is a participant
    if (
      conversation.participant1.toString() !== senderId &&
      conversation.participant2.toString() !== senderId
    ) {
      return next(createError(403, 'You are not a participant in this conversation'))
    }

    const recipientId = conversation.getOtherParticipant(senderId)

    // Check if they are still connected
    const areConnected = await Connection.areConnected(senderId, recipientId)
    if (!areConnected) {
      return next(
        createError(403, 'You can only message users in your network once your connection request is accepted')
      )
    }

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      content,
      type: req.body.type || 'text',
      attachments: attachments || [],
      eventInfo: req.body.eventInfo,
    })

    // Update conversation
    conversation.lastMessage = message._id
    conversation.lastMessageAt = new Date()
    conversation.messageCount += 1
    await conversation.save()

    // Emit socket event
    const io = getIO()
    io.to(conversationId).emit('new_message', {
      message,
      conversationId,
    })

    // Create notification for recipient
    const sender = await User.findById(senderId)
    const notificationContent = content 
      ? (content.length > 50 ? `${content.substring(0, 47)}...` : content)
      : (attachments && attachments.length > 0 ? `Sent a ${req.body.type || 'file'}` : 'New message')

    await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type: 'message',
      priority: 'medium',
      title: `New message from ${sender.name}`,
      description: notificationContent,
      relatedEntity: {
        entityType: 'message',
        entityId: message._id
      },
      actionUrl: `/messages/conversations/${conversationId}`,
      isRead: false,
    })

    res.status(201).json({
      status: 'success',
      data: { message },
    })
  } catch (error) {
    console.error('Error in sendMessage:', error)
    next(error)
  }
}

/**
 * Get user's conversations
 */
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id
    
    const conversations = await Conversation.find({
      $or: [{ participant1: userId }, { participant2: userId }],
      isArchived: false,
    })
      .populate('participant1', 'name email userType status lastSeen settings')
      .populate('participant2', 'name email userType status lastSeen settings')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 })

    // Get all other participant IDs to fetch profiles in bulk
    const otherUserIds = conversations.map(conv => 
      conv.participant1._id.toString() === userId ? conv.participant2._id : conv.participant1._id
    )

    // Fetch all profiles in one query
    const profiles = await Profile.find({ user: { $in: otherUserIds } })
      .select('user profileImage title bannerImage themeId')

    const profileMap = profiles.reduce((acc, profile) => {
      acc[profile.user.toString()] = profile
      return acc
    }, {})

    // Enrich with other participant's profile info
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = conv.participant1._id.toString() === userId ? conv.participant2 : conv.participant1
        const profile = profileMap[otherUser._id.toString()]
        
        const unreadCount = await conv.unreadMessageCount(userId)
        
        // Get connection status for the participants
        const connectionInfo = await Connection.getConnectionInfo(userId, otherUser._id)

        // Snippet: first 40 characters or attachment type
        let lastMessageSnippet = ''
        if (conv.lastMessage?.content) {
          lastMessageSnippet = conv.lastMessage.content.substring(0, 40) + (conv.lastMessage.content.length > 40 ? '...' : '')
        } else if (conv.lastMessage?.attachments && conv.lastMessage.attachments.length > 0) {
          const type = conv.lastMessage.type === 'image' ? 'image' : 'file'
          lastMessageSnippet = `Sent a ${type}`
        }

        return {
          ...conv.toObject(),
          otherUser: {
            ...otherUser.toObject(),
            profileImage: profile?.profileImage,
            title: profile?.title,
            bannerImage: profile?.bannerImage,
            themeId: profile?.themeId,
            status: otherUser.status,
            lastSeen: otherUser.settings?.showLastSeen ? otherUser.lastSeen : null,
          },
          unreadCount,
          lastMessageSnippet,
          connectionStatus: connectionInfo.status,
          connectionRequestId: connectionInfo.requestId,
          showUnreadDot: unreadCount > 0 && conv.lastMessage?.sender.toString() !== userId.toString(),
        }
      })
    )

    res.status(200).json({
      status: 'success',
      results: enrichedConversations.length,
      data: { conversations: enrichedConversations },
    })
  } catch (error) {
    console.error('Error in getConversations:', error)
    next(error)
  }
}

/**
 * Get messages in a conversation
 */
export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params
    const userId = req.user.id
    const { page = 1, limit = 50 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return next(createError(404, 'Conversation not found'))
    }

    if (
      conversation.participant1.toString() !== userId &&
      conversation.participant2.toString() !== userId
    ) {
      return next(createError(403, 'You are not a participant in this conversation'))
    }

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Message.countDocuments({ conversation: conversationId })

    // Mark messages as read if they weren't sent by current user
    await conversation.markAllMessagesAsRead(userId)

    res.status(200).json({
      status: 'success',
      results: messages.length,
      totalResults: total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        messages: messages.reverse(), // Send in chronological order
      },
    })
  } catch (error) {
    console.error('Error in getMessages:', error)
    next(error)
  }
}
/**
 * Update user settings
 */
export const updateSettings = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { settings } = req.body

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { settings: { ...(req.user.settings || {}), ...settings } } },
      { new: true, runValidators: true }
    )

    if (!user) {
      return next(createError(404, 'User not found'))
    }

    // Emit presence update to reflect new privacy settings immediately
    try {
      const io = getIO()
      io.emit('presence_update', {
        userId: user._id,
        status: user.status,
        lastSeen: user.settings?.showLastSeen ? user.lastSeen : null,
      })
    } catch (socketErr) {
      console.warn('Socket emit failed in updateSettings:', socketErr.message)
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    })
  } catch (error) {
    console.error('Error in updateSettings:', error)
    next(error)
  }
}
/**
 * Update user status (online, away, idle, offline)
 */
export const updateStatus = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { status } = req.body

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { status, lastSeen: new Date() } },
      { new: true, runValidators: true }
    ).select('status lastSeen settings name email')

    if (!user) {
      return next(createError(404, 'User not found'))
    }

    // Emit presence update
    try {
      const io = getIO()
      io.emit('presence_update', {
        userId: user._id,
        status: user.status,
        lastSeen: user.settings?.showLastSeen ? user.lastSeen : null,
      })
    } catch (socketErr) {
      console.warn('Socket emit failed in updateStatus:', socketErr.message)
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    })
  } catch (error) {
    console.error('Error in updateStatus:', error)
    next(error)
  }
}
/**
 * Delete a conversation and all its messages permanently
 */
export const archiveConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params
    const userId = req.user.id

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return next(createError(404, 'Conversation not found'))
    }

    if (conversation.participant1.toString() !== userId && conversation.participant2.toString() !== userId) {
      return next(createError(403, 'You are not a participant in this conversation'))
    }

    // Emit socket event to notify participants
    try {
      const io = getIO()
      io.to(conversationId).emit('conversation_deleted', { conversationId })
    } catch (socketErr) {
      console.warn('Socket emit failed in archiveConversation:', socketErr.message)
    }

    // Permanently delete all messages in this conversation
    await Message.deleteMany({ conversation: conversationId })

    // Permanently delete the conversation document
    await Conversation.findByIdAndDelete(conversationId)

    // Also cleanup notifications related to this conversation
    await Notification.deleteMany({ 
      actionUrl: { $regex: conversationId } 
    })

    res.status(200).json({
      status: 'success',
      message: 'Conversation and all messages deleted successfully',
    })
  } catch (error) {
    console.error('Error in archiveConversation:', error)
    next(error)
  }
}

/**
 * Block a user from messaging
 */
export const blockUser = async (req, res, next) => {
  try {
    const { conversationId } = req.params
    const userId = req.user.id

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return next(createError(404, 'Conversation not found'))
    }

    if (conversation.participant1.toString() !== userId && conversation.participant2.toString() !== userId) {
      return next(createError(403, 'You are not a participant in this conversation'))
    }

    const otherUserId = conversation.getOtherParticipant(userId)

    conversation.isBlocked = true
    conversation.blockedBy = userId
    await conversation.save()

    res.status(200).json({
      status: 'success',
      message: 'User blocked successfully',
    })
  } catch (error) {
    console.error('Error in blockUser:', error)
    next(error)
  }
}

/**
 * Search messages across all conversations
 */
export const searchMessages = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { q } = req.query

    if (!q) {
      return res.status(200).json({
        status: 'success',
        data: { messages: [] }
      })
    }

    // Find conversations user is part of
    const conversations = await Conversation.find({
      $or: [{ participant1: userId }, { participant2: userId }]
    })

    const conversationIds = conversations.map(c => c._id)

    // Search messages in these conversations
    const messages = await Message.find({
      conversation: { $in: conversationIds },
      content: { $regex: q, $options: 'i' },
      isDeleted: false
    })
    .populate('sender', 'name')
    .sort({ createdAt: -1 })
    .limit(20)

    // Enrich messages with conversation details to help UI
    const enrichedResults = await Promise.all(messages.map(async (msg) => {
      const conv = conversations.find(c => c._id.toString() === msg.conversation.toString())
      const otherUserId = conv.participant1.toString() === userId ? conv.participant2 : conv.participant1
      const otherUser = await User.findById(otherUserId).select('name')
      const profile = await Profile.findOne({ user: otherUserId }).select('profileImage')
      
      return {
        ...msg.toObject(),
        conversationInfo: {
          _id: conv._id,
          otherUser: {
            _id: otherUserId,
            name: otherUser?.name,
            profileImage: profile?.profileImage
          }
        }
      }
    }))

    res.status(200).json({
      status: 'success',
      data: { messages: enrichedResults },
    })
  } catch (error) {
    console.error('Error in searchMessages:', error)
    next(error)
  }
}

/**
 * Unblock a user
 */
export const unblockUser = async (req, res, next) => {
  try {
    const { conversationId } = req.params
    const userId = req.user.id

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return next(createError(404, 'Conversation not found'))
    }

    if (conversation.participant1.toString() !== userId && conversation.participant2.toString() !== userId) {
      return next(createError(403, 'You are not a participant in this conversation'))
    }

    // Only the blocker can unblock
    if (conversation.blockedBy && conversation.blockedBy.toString() !== userId) {
       return next(createError(403, 'You cannot unblock this conversation'))
    }

    conversation.isBlocked = false
    conversation.blockedBy = null
    await conversation.save()

    res.status(200).json({
      status: 'success',
      message: 'User unblocked successfully',
    })
  } catch (error) {
    console.error('Error in unblockUser:', error)
    next(error)
  }
}

/**
 * Delete a message (soft delete)
 */
export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params
    const userId = req.user.id

    const message = await Message.findById(messageId)
    if (!message) {
      return next(createError(404, 'Message not found'))
    }

    // Verify the user is the sender
    if (message.sender.toString() !== userId) {
      return next(createError(403, 'You can only delete your own messages'))
    }

    // Soft delete the message
    message.isDeleted = true
    await message.save()

    // Emit socket event to both users
    const io = getIO()
    io.to(message.conversation.toString()).emit('message_deleted', {
      messageId: message._id,
      conversationId: message.conversation,
    })

    res.status(200).json({
      status: 'success',
      message: 'Message deleted successfully',
    })
  } catch (error) {
    console.error('Error in deleteMessage:', error)
    next(error)
  }
}
