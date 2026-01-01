import { createError } from '../error.js'
import { Conversation, Message } from '../models/Message.js'
import Notification from '../models/Notification.js'
import Profile from '../models/Profile.js'
import { Connection } from '../models/Relationship.js'
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
      return next(
        createError(403, 'You must be connected to start a conversation')
      )
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

    res.status(200).json({
      status: 'success',
      data: { conversation },
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
        createError(403, 'You can only message users in your network')
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
    await Notification.create({
      user: recipientId,
      type: 'new_message',
      priority: 'medium',
      recipient: recipientId,
      relatedUser: senderId,
      title: `New message from ${sender.name}`,
      message: content.length > 50 ? `${content.substring(0, 47)}...` : content,
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
      .populate('participant1', 'name email userType')
      .populate('participant2', 'name email userType')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 })

    // Enrich with other participant's profile info
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = conv.participant1._id.toString() === userId ? conv.participant2 : conv.participant1
        const profile = await Profile.findOne({ user: otherUser._id }).select('profileImage title')
        
        const unreadCount = await conv.unreadMessageCount(userId)
        
        // Snippet: first 40 characters
        const lastMessageSnippet = conv.lastMessage?.content
          ? conv.lastMessage.content.substring(0, 40) + (conv.lastMessage.content.length > 40 ? '...' : '')
          : ''

        return {
          ...conv.toObject(),
          otherUser: {
            ...otherUser.toObject(),
            profileImage: profile?.profileImage,
            title: profile?.title,
            status: otherUser.status,
            lastSeen: otherUser.lastSeen,
          },
          unreadCount,
          lastMessageSnippet,
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
