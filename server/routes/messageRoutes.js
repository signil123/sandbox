// File: server/routes/messageRoutes.js
import express from 'express'
import {
    archiveConversation,
    blockUser,
    deleteMessage,
    getConversations,
    getMessages,
    markConversationRead,
    searchMessages,
    sendMessage,
    startConversation,
    unblockUser,
    updateSettings,
    updateStatus
} from '../controllers/message.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// All message routes require authentication
router.use(verifyToken)

// Start or get conversation
router.post('/conversations', startConversation)

// Search messages
router.get('/search', searchMessages)

// Get all conversations for current user
router.get('/conversations', getConversations)

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', getMessages)

// Mark conversation as read
router.post('/conversations/:conversationId/read', markConversationRead)

// Send a message
router.post('/conversations/:conversationId/messages', sendMessage)

// Delete a message
router.delete('/messages/:messageId', deleteMessage)

// Update user settings (privacy, etc)
router.put('/settings', updateSettings)

// Update user status (online, idle, etc)
router.put('/status', updateStatus)

// Archive/Delete conversation
router.delete('/conversations/:conversationId', archiveConversation)

// Block user
router.post('/conversations/:conversationId/block', blockUser)

// Unblock user
router.post('/conversations/:conversationId/unblock', unblockUser)

export default router
